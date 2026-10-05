import "server-only";
import bundle from "@/generated/knowledge.json";
import { chunkMarkdown } from "./chunk";
import { AI_PROVIDER, EMBEDDING_MODEL } from "./config";
import { openai } from "./openai";
import { createServiceClient } from "./supabase/server";

export type BundledDoc = (typeof bundle.docs)[number];
export const bundledDocs: BundledDoc[] = bundle.docs;
export const bundledAt: string = bundle.generatedAt;

// open.hasa 개발키는 분당 10회 제한 → 임베딩 요청을 묶어서 보내고 사이에 쉰다
const BATCH = 32;
const PAUSE_MS = AI_PROVIDER === "hasa" ? 7000 : 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function embedAll(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    if (i > 0 && PAUSE_MS) await sleep(PAUSE_MS);
    const res = await openai().embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.slice(i, i + BATCH),
      encoding_format: "float",
    });
    out.push(...res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return out;
}

// DB에 저장된 문서별 hash (바뀐 문서 판단용)
export async function storedHashes(): Promise<Map<string, string>> {
  const { data, error } = await createServiceClient().from("documents").select("metadata->>file, metadata->>hash");
  if (error) throw new Error(`저장된 문서를 읽지 못했어요: ${error.message}`);
  return new Map((data ?? []).map((r) => [(r as Record<string, string>).file, (r as Record<string, string>).hash]));
}

export type SyncResult = {
  total: number;
  updated: { file: string; title: string; chunks: number }[];
  removed: string[];
  unchanged: number;
  unreviewed: number;
};

// knowledge 문서를 Supabase documents 표와 맞춘다: 바뀐 문서만 다시 임베딩, 사라진 문서는 삭제
export async function syncKnowledge({ force = false } = {}): Promise<SyncResult> {
  const db = createServiceClient();
  const known = await storedHashes();
  const changed = bundledDocs.filter((d) => force || known.get(d.file) !== d.hash);

  // 1) 바뀐 문서의 조각을 모아 한꺼번에 임베딩 (먼저 임베딩해서, 실패하면 기존 데이터는 그대로 둔다)
  const pieces = changed.flatMap((d) => chunkMarkdown(d.content, d.title).map((text, i) => ({ doc: d, i, text })));
  const vectors = pieces.length ? await embedAll(pieces.map((p) => p.text)) : [];

  // 2) 문서별로 기존 조각을 지우고 새 조각을 넣는다
  const updated: SyncResult["updated"] = [];
  for (const d of changed) {
    const rows = pieces
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.doc.file === d.file)
      .map(({ p, idx }) => ({
        content: p.text,
        embedding: vectors[idx],
        metadata: { file: d.file, hash: d.hash, title: d.title, category: d.category, source_url: d.source_url, chunk_index: p.i },
      }));
    const del = await db.from("documents").delete().eq("metadata->>file", d.file);
    if (del.error) throw new Error(`${d.file}: ${del.error.message}`);
    if (rows.length) {
      const ins = await db.from("documents").insert(rows);
      if (ins.error) throw new Error(`${d.file}: ${ins.error.message}`);
    }
    updated.push({ file: d.file, title: d.title, chunks: rows.length });
  }

  // 3) knowledge 폴더에서 지운 문서는 DB에서도 삭제
  const files = new Set(bundledDocs.map((d) => d.file));
  const removed = [...known.keys()].filter((f) => f && !files.has(f));
  for (const file of removed) {
    const del = await db.from("documents").delete().eq("metadata->>file", file);
    if (del.error) throw new Error(`${file}: ${del.error.message}`);
  }

  return {
    total: bundledDocs.length,
    updated,
    removed,
    unchanged: bundledDocs.length - changed.length,
    unreviewed: bundledDocs.filter((d) => !d.reviewed).length,
  };
}
