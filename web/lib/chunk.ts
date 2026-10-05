// 지식 문서를 검색용 조각으로 자르는 규칙 (서버 동기화와 ingest 스크립트가 함께 사용)
export const MAX_CHARS = 1200; // 한국어 기준 대략 500~700 토큰
export const OVERLAP = 200;

// "## 소제목" 단위로 자르고, 긴 섹션은 겹치게 다시 자른다. 각 조각 앞에 문서 제목을 붙여 문맥을 유지한다.
export function chunkMarkdown(body: string, title: string): string[] {
  const sections = body
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
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
