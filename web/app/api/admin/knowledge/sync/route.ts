import { getCurrentProfile } from "@/lib/auth";
import { DEMO_MODE, hasAI, hasServiceRole } from "@/lib/config";
import { syncKnowledge } from "@/lib/knowledge-sync";
import { describeAIError } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

// 임베딩 요청 사이에 쉬는 시간이 있어 문서가 많으면 오래 걸릴 수 있다
export const maxDuration = 300;

// 관리자 전용: knowledge 문서를 임베딩해서 Supabase documents 표에 반영
export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return Response.json({ error: "관리자만 실행할 수 있어요." }, { status: 403 });
  if (DEMO_MODE || !hasServiceRole) return Response.json({ error: "Supabase 서비스 키가 설정되지 않았어요." }, { status: 400 });
  if (!hasAI) return Response.json({ error: "AI 키(HASA_API_KEY 또는 OPENAI_API_KEY)가 설정되지 않았어요." }, { status: 400 });

  const { force } = (await req.json().catch(() => ({}))) as { force?: boolean };

  try {
    const result = await syncKnowledge({ force: Boolean(force) });
    const supabase = await createClient();
    await supabase.from("admin_audit_logs").insert({
      admin_id: profile.id,
      action: `knowledge_sync:${result.updated.length}updated:${result.removed.length}removed${force ? ":force" : ""}`,
    });
    return Response.json(result);
  } catch (err) {
    const message = describeAIError(err);
    console.error("[knowledge sync] failed:", message);
    return Response.json({ error: `갱신 중 문제가 생겼어요: ${message}` }, { status: 500 });
  }
}
