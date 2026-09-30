import { getCurrentProfile } from "@/lib/auth";
import { CHAT_MODEL, DEMO_MODE, hasOpenAI, hasServiceRole } from "@/lib/config";
import { openai } from "@/lib/openai";
import { counselorSystemPrompt, CRISIS_REPLY, formatContext } from "@/lib/prompts";
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
  } else if (!hasOpenAI) {
    const demo =
      "지금은 데모 모드라서 실제 AI 대신 예시 답변을 보여 드리고 있어요. " +
      "web/.env.local 에 OPENAI_API_KEY 를 넣으면 지식베이스를 근거로 한 상담 답변이 이 자리에 실시간으로 표시됩니다.\n\n" +
      "그래도 방금 적어 준 이야기는 잘 읽었어요. 그 일이 있고 나서 몸에서는 어떤 느낌이 드나요?";
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
    const chunks = await retrieve(text);
    sources = toSources(chunks);
    const system = counselorSystemPrompt({ tone: profile.tone_pref, nickname: profile.nickname, risk });
    const context = formatContext(chunks);

    const completion = await openai().chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      max_completion_tokens: 2000,
      reasoning_effort: "low",
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
          for await (const part of completion) {
            const delta = part.choices[0]?.delta?.content;
            if (delta) {
              full += delta;
              c.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          console.error("[chat] stream failed", err);
          const msg = "\n\n답변을 만드는 중에 연결이 끊겼어요. 마지막 메시지를 다시 보내 주세요.";
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
