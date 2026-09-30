// knowledge/**/*.md → 청크 → OpenAI 임베딩 → Supabase documents 테이블
// 실행: npm run ingest            (바뀐 파일만)
//       npm run ingest -- --all   (전체 다시)
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import matter from "gray-matter";
import OpenAI from "openai";

config({ path: ".env.local" });

const ROOT = path.resolve("..", "knowledge");
const MAX_CHARS = 1200; // 한국어 기준 대략 500~700 토큰
const OVERLAP = 200;
const force = process.argv.includes("--all");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !process.env.OPENAI_API_KEY) {
  console.error("web/.env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY 가 필요합니다.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
const openai = new OpenAI();

function chunk(body: string, title: string): string[] {
  // "## 소제목" 단위로 자르고, 긴 섹션은 겹치게 다시 자른다
  const sections = body.split(/\n(?=##\s)/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const section of sections) {
    const text = `# ${title}\n${section}`;
    if (text.length <= MAX_CHARS) {
      out.push(text);
      continue;
    }
    for (let i = 0; i < section.length; i += MAX_CHARS - OVERLAP) {
      out.push(`# ${title}\n${section.slice(i, i + MAX_CHARS)}`);
    }
  }
  return out;
}

async function main() {
  const files = fs
    .readdirSync(ROOT, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.split(path.sep).join("/"));

  const { data: existing } = await supabase.from("documents").select("metadata->>file, metadata->>hash");
  const known = new Map((existing ?? []).map((r: Record<string, string>) => [r.file, r.hash]));

  let updated = 0;
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
    const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
    if (!force && known.get(file) === hash) continue;

    const { data: fm, content } = matter(raw);
    const title = String(fm.title ?? path.basename(file, ".md"));
    if (fm.reviewed === false) console.warn(`  ! ${file}: reviewed=false (검수 전 문서)`);

    const pieces = chunk(content, title);
    if (!pieces.length) continue;
    const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: pieces });

    await supabase.from("documents").delete().eq("metadata->>file", file);
    const { error } = await supabase.from("documents").insert(
      pieces.map((p, i) => ({
        content: p,
        embedding: emb.data[i].embedding,
        metadata: {
          file,
          hash,
          title,
          category: String(fm.category ?? file.split("/")[0]),
          source_url: fm.source_url ?? null,
          chunk_index: i,
        },
      })),
    );
    if (error) throw new Error(`${file}: ${error.message}`);
    console.log(`  ✓ ${file} (${pieces.length}개 조각)`);
    updated++;
  }

  // 폴더에서 지운 파일은 DB에서도 삭제
  const removed = [...known.keys()].filter((f) => f && !files.includes(f));
  for (const file of removed) {
    await supabase.from("documents").delete().eq("metadata->>file", file);
    console.log(`  - ${file} (삭제됨)`);
  }

  console.log(`\n완료: ${files.length}개 파일 중 ${updated}개 갱신, ${removed.length}개 삭제`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
