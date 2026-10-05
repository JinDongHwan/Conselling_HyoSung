import "server-only";
import { hasAI, hasServiceRole } from "./config";
import { embed } from "./openai";
import { createServiceClient } from "./supabase/server";
import type { Source } from "./types";

export type Chunk = { id: number; content: string; metadata: Source & { file?: string }; similarity: number };

export async function retrieve(query: string, k = 5, minSimilarity = 0.3): Promise<Chunk[]> {
  if (!hasAI || !hasServiceRole) return [];
  try {
    const embedding = await embed(query);
    const { data, error } = await createServiceClient().rpc("match_documents", {
      query_embedding: embedding,
      match_count: k,
    });
    if (error) throw error;
    return ((data ?? []) as Chunk[]).filter((c) => c.similarity >= minSimilarity);
  } catch (err) {
    console.error("[rag] retrieve failed", err);
    return [];
  }
}

// 같은 문서의 여러 청크는 출처 하나로 합친다
export function toSources(chunks: Chunk[]): Source[] {
  const seen = new Map<string, Source>();
  for (const c of chunks) {
    const key = c.metadata.file ?? c.metadata.title;
    if (!seen.has(key))
      seen.set(key, { title: c.metadata.title, category: c.metadata.category, source_url: c.metadata.source_url });
  }
  return [...seen.values()];
}
