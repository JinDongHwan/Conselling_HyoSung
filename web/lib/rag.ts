import "server-only";
import { hasAI, hasServiceRole } from "./config";
import { embed } from "./openai";
import { createServiceClient } from "./supabase/server";
import type { Source } from "./types";

export type Chunk = { id: number; content: string; metadata: Source & { file?: string }; similarity: number };

const CRISIS_CATEGORY = "99_"; // 위기대응·기관안내 문서

type RetrieveOptions = {
  k?: number; // 답변 근거로 넘길 최대 조각 수
  minSimilarity?: number; // 이보다 덜 비슷한 조각은 버린다
  includeCrisis?: boolean; // 위기 대응 문서 포함 여부 (위험 신호가 있을 때만)
};

export async function retrieve(
  query: string,
  { k = 5, minSimilarity = 0.45, includeCrisis = true }: RetrieveOptions = {},
): Promise<Chunk[]> {
  if (!hasAI || !hasServiceRole) return [];
  try {
    const embedding = await embed(query);
    // 위기 문서를 걸러낼 수 있으니 넉넉히 받아 온 뒤 거른다
    const { data, error } = await createServiceClient().rpc("match_documents", {
      query_embedding: embedding,
      match_count: k * 2,
    });
    if (error) throw error;
    const all = (data ?? []) as Chunk[];
    // 튜닝용 기록: 문서 제목과 점수만 (상담 내용은 남기지 않음)
    console.log(
      "[rag] top:",
      all.slice(0, 5).map((c) => `${c.similarity.toFixed(2)} ${c.metadata.title.slice(0, 18)}`).join(" | "),
    );
    return all
      .filter((c) => c.similarity >= minSimilarity)
      .filter((c) => includeCrisis || !String(c.metadata.category ?? "").startsWith(CRISIS_CATEGORY))
      .slice(0, k);
  } catch (err) {
    console.error("[rag] retrieve failed", err);
    return [];
  }
}

// 화면의 "참고한 자료": 가장 관련 높은 문서와 점수 차이가 작은 것만, 같은 문서는 하나로, 최대 max개
export function toSources(chunks: Chunk[], { max = 3, minSimilarity = 0.5, margin = 0.07 } = {}): Source[] {
  if (!chunks.length) return [];
  const best = Math.max(...chunks.map((c) => c.similarity));
  const cutoff = Math.max(minSimilarity, best - margin);
  const seen = new Map<string, Source>();
  for (const c of [...chunks].sort((a, b) => b.similarity - a.similarity)) {
    if (c.similarity < cutoff || seen.size >= max) continue;
    const key = c.metadata.file ?? c.metadata.title;
    if (!seen.has(key))
      seen.set(key, { title: c.metadata.title, category: c.metadata.category, source_url: c.metadata.source_url });
  }
  return [...seen.values()];
}
