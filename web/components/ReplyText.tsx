import { Fragment } from "react";

// AI 답변을 읽기 쉽게 정리한다.
// - 문장이 . ? ! 로 끝나면 줄을 바꾼다 (바로 앞이 숫자인 목록 "1." 이나 소수 "2.5"는 그대로)
// - 빈 줄은 문단 간격으로, "- " / "1. " 로 시작하는 줄은 목록처럼 들여 쓴다
// - **굵게** 표시를 실제 굵은 글씨로 보여 준다
const SENTENCE_END = /([^\d\s])([.?!…。])(["'”’)]*)\s+(?=\S)/g;

export function splitSentences(text: string): string[][] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((para) =>
      para
        .split("\n")
        .flatMap((line) => line.replace(SENTENCE_END, "$1$2$3\n").split("\n"))
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((p) => p.length);
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function ReplyText({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = splitSentences(text);
  return (
    <div className={`space-y-3 leading-7 ${className}`}>
      {paragraphs.map((lines, pi) => (
        <div key={pi} className="space-y-1">
          {lines.map((line, li) => {
            const bullet = /^([-•*]|\d+[.)])\s+/.exec(line);
            return bullet ? (
              <p key={li} className="flex gap-2 pl-1">
                <span className="shrink-0 text-muted">{/^\d/.test(bullet[1]) ? bullet[1] : "•"}</span>
                <span><Inline text={line.slice(bullet[0].length)} /></span>
              </p>
            ) : (
              <p key={li}><Inline text={line} /></p>
            );
          })}
        </div>
      ))}
    </div>
  );
}
