import { getCurrentProfile, guardianPending, needsOnboarding } from "@/lib/auth";
import { CHAT_MODEL, DEMO_MODE, hasAI, hasServiceRole } from "@/lib/config";
import { describeAIError, openai, openaiOnly } from "@/lib/openai";
import { profileAgeBand } from "@/lib/age";
import { counselorSystemPrompt, crisisReply, formatContext } from "@/lib/prompts";
import { retrieve, toSources } from "@/lib/rag";
import { assessRisk } from "@/lib/safety";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Risk, Source } from "@/lib/types";

type Turn = { role: "user" | "assistant"; content: string };
type Body = { sessionId?: string; message: string; history?: Turn[]; mood?: number };

const order: Record<Risk, number> = { low: 0, mid: 1, high: 2 };

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return new Response("로그인이 필요합니다.", { status: 401 });
  if (profile.suspended) return new Response("이용이 정지된 계정이에요.", { status: 403 });
  // 시작 설정(나이·약관 동의) 전이거나, 만 14세 미만인데 보호자 동의가 확인되지 않았으면 상담 불가
  if (needsOnboarding(profile)) return new Response("시작 설정을 먼저 마쳐 주세요.", { status: 403 });
  if (await guardianPending(profile)) return new Response("보호자 동의가 확인된 뒤에 상담할 수 있어요.", { status: 403 });
  const band = profileAgeBand(profile);
  const CRISIS_REPLY = crisisReply(band);

  const { sessionId: incomingId, message, history = [], mood } = (await req.json()) as Body;
  const text = message?.trim();
  if (!text) return new Response("메시지를 입력해 주세요.", { status: 400 });
  if (text.length > 4000) return new Response("메시지는 4,000자 이내로 보내 주세요.", { status: 400 });

  const recent = history.slice(-12);
  const risk = await assessRisk(text, recent.map((t) => `${t.role}: ${t.content}`));

  // ── 저장: 세션 생성 + 사용자 메시지 ──
  const supabase = DEMO_MODE ? null : await createClient();
  let sessionId = incomingId ?? `demo-${Date.now()}`;
  if (supabase) {
    if (!incomingId) {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ user_id: profile.id, title: text.slice(0, 40), mood_start: mood ?? null, risk_level: risk })
        .select("id")
        .single();
      if (error || !data) return new Response("상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.", { status: 500 });
      sessionId = data.id;
    } else {
      const { data: s } = await supabase.from("sessions").select("risk_level").eq("id", sessionId).single();
      if (!s) return new Response("상담 기록을 찾을 수 없습니다.", { status: 404 });
      if (order[risk] > order[s.risk_level as Risk])
        await supabase.from("sessions").update({ risk_level: risk }).eq("id", sessionId);
    }
    await supabase.from("messages").insert({ session_id: sessionId, role: "user", content: text, risk_flag: risk });
    if (risk === "high" && hasServiceRole) {
      await createServiceClient()
        .from("admin_alerts")
        .insert({ session_id: sessionId, user_id: profile.id, risk_level: "high" });
    }
  }

  // ── 위기: 모델 답변 대신 고정 안내 ──
  let sources: Source[] = [];
  let stream: ReadableStream<Uint8Array>;
  const encoder = new TextEncoder();

  const saveAssistant = async (content: string) => {
    if (supabase && content)
      await supabase.from("messages").insert({ session_id: sessionId, role: "assistant", content, sources });
  };

  if (risk === "high") {
    await saveAssistant(CRISIS_REPLY);
    stream = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode(CRISIS_REPLY));
        c.close();
      },
    });
  } else if (!hasAI) {
    const demo =
      // AI 키(HASA_API_KEY 또는 OPENAI_API_KEY)가 없을 때의 체험용 답변
      "(지금은 체험용 예시 답변이에요. AI 상담 연결을 준비하고 있어요.)\n\n" +
      "방금 적어 준 이야기는 잘 읽었어요. 그 일이 있고 나서 몸에서는 어떤 느낌이 드나요?";
    stream = new ReadableStream({
      async start(c) {
        for (const piece of demo.match(/[\s\S]{1,6}/g) ?? []) {
          c.enqueue(encoder.encode(piece));
          await new Promise((r) => setTimeout(r, 25));
        }
        c.close();
      },
    });
  } else {
    // 짧은 후속 질문("그럼 어떻게 해?")도 대화 흐름에 맞는 자료를 찾도록 바로 앞 사용자 메시지를 함께 검색
    const prevUser = [...recent].reverse().find((t) => t.role === "user")?.content;
    const searchQuery = prevUser ? `${prevUser.slice(0, 300)}\n${text}` : text;
    // 위기 대응 문서는 위험 신호(주의·위기)가 있을 때만 참고
    const chunks = await retrieve(searchQuery, { includeCrisis: risk !== "low" });
    sources = toSources(chunks);
    const system = counselorSystemPrompt({ tone: profile.tone_pref, nickname: profile.nickname, risk, band });
    const context = formatContext(chunks);

    const request = openai().chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      max_completion_tokens: 2000,
      ...openaiOnly({ reasoning_effort: "low" as const }),
      messages: [
        { role: "system", content: system + (context ? `\n\n${context}` : "") },
        ...recent,
        { role: "user", content: text },
      ],
    });

    stream = new ReadableStream({
      async start(c) {
        let full = "";
        try {
          const completion = await request;
          for await (const part of completion) {
            const delta = part.choices[0]?.delta?.content;
            if (delta) {
              full += delta;
              c.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          console.error("[chat] AI request failed:", describeAIError(err));
          const msg = full
            ? "\n\n답변을 만드는 중에 연결이 끊겼어요. 마지막 메시지를 다시 보내 주세요."
            : "지금 AI 상담 연결이 원활하지 않아요. 잠시 후 다시 보내 주세요. 급하게 이야기 나눌 곳이 필요하면 자살예방상담전화 109(24시간)로 연락해 주세요.";
          full += msg;
          c.enqueue(encoder.encode(msg));
        }
        await saveAssistant(full);
        c.close();
      },
    });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Session-Id": sessionId,
      "X-Risk": risk,
      "X-Sources": Buffer.from(JSON.stringify(sources)).toString("base64"),
    },
  });
}
