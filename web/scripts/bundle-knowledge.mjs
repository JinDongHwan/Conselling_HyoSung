// ../knowledge/**/*.md 를 읽어 web/generated/knowledge.json 하나로 묶는다.
// next build / next dev 전에 자동 실행되어(prebuild·predev), 서버(관리자 "지식베이스 갱신")가 문서를 읽을 수 있게 한다.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..", "knowledge");
const OUT = path.resolve(here, "..", "generated", "knowledge.json");

const docs = fs.existsSync(ROOT)
  ? fs
      .readdirSync(ROOT, { recursive: true, encoding: "utf8" })
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.split(path.sep).join("/"))
      .sort()
      .map((file) => {
        const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
        const { data: fm, content } = matter(raw);
        return {
          file,
          hash: createHash("sha256").update(raw).digest("hex").slice(0, 16),
          title: String(fm.title ?? path.basename(file, ".md")),
          category: String(fm.category ?? file.split("/")[0]),
          source_url: fm.source_url ? String(fm.source_url) : null,
          reviewed: fm.reviewed !== false,
          content,
        };
      })
  : [];

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), docs }, null, 1));
console.log(`[bundle-knowledge] ${docs.length}개 문서 → generated/knowledge.json`);
