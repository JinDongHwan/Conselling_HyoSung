import { getCurrentProfile } from "@/lib/auth";
import { DEMO_MODE, hasAI, UTILITY_MODEL } from "@/lib/config";
import { describeAIError, openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

const TOPICS = ["우울", "불안", "스트레스", "수면", "직장", "가족", "대인관계", "연애", "자존감", "무기력", "트라우마", "기타"];

// 상담 종료: AI가 제목·요약·주제를 만들어 과거기록/데이터 페이지에 쓴다
export async function POST(req: Request, ctx: RouteContext<"/api/sessions/[id]/end">) {
  const { id } = await ctx.params;
  const profile = await getCurrentProfile();
  if (!profile) return new Response("로그인이 필요합니다.", { status: 401 });
  const { mood } = (await req.json().catch(() => ({}))) as { mood?: number };
  if (DEMO_MODE) return Response.json({ ok: true });

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("role,content")
    .eq("session_id", id)
    .order("created_at");
  if (!messages?.length) return new Response("상담 기록을 찾을 수 없습니다.", { status: 404 });

  let meta: { title?: string; summary?: string; topics?: string[] } = {};
  if (hasAI) {
    try {
      const res = await openai().chat.completions.create({
        model: UTILITY_MODEL,
        max_completion_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "session_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "20자 이내 제목, 사용자 관점" },
                summary: { type: "string", description: "2문장 요약: 주된 고민과 함께 정리한 대처" },
                topics: { type: "array", items: { type: "string", enum: TOPICS }, description: "1~3개" },
              },
              required: ["title", "summary", "topics"],
              additionalProperties: false,
            },
          },
        },
        messages: [
          { role: "system", content: "심리상담 대화를 기록용으로 요약합니다. 개인 식별 정보(이름, 회사명, 연락처)는 빼고 씁니다." },
          { role: "user", content: messages.map((m) => `${m.role === "user" ? "사용자" : "상담AI"}: ${m.content}`).join("\n") },
        ],
      });
      meta = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    } catch (err) {
      console.error("[session end] summary failed:", describeAIError(err));
    }
  }

  await supabase
    .from("sessions")
    .update({
      ...(meta.title && { title: meta.title }),
      ...(meta.summary && { summary: meta.summary }),
      ...(meta.topics && { topics: meta.topics.slice(0, 3) }),
      mood_end: mood ?? null,
      ended_at: new Date().toISOString(),
    })
    .eq("id", id);

  return Response.json({ ok: true, ...meta });
}
