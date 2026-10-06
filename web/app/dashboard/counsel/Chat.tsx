"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CrisisCard } from "@/components/CrisisCard";
import { Mascot } from "@/components/Mascot";
import { ReplyText } from "@/components/ReplyText";
import type { Risk, Source } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const STARTERS = ["요즘 잠을 잘 못 자요", "회사 일 때문에 너무 지쳐요", "사람 만나는 게 버거워요", "이유 없이 불안해요"];

export function Chat({ nickname, youth = false }: { nickname: string | null; youth?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [moodStart, setMoodStart] = useState<number | null>(null);
  const [risk, setRisk] = useState<Risk>("low");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState<{ title?: string; summary?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, risk]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setError(null);
    setInput("");
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content, history, mood: moodStart ?? undefined }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const newId = res.headers.get("X-Session-Id");
      if (newId) setSessionId(newId);
      const r = (res.headers.get("X-Risk") as Risk) ?? "low";
      setRisk((prev) => (prev === "high" || r === "high" ? "high" : r === "mid" || prev === "mid" ? "mid" : "low"));
      let sources: Source[] = [];
      try {
        const raw = res.headers.get("X-Sources");
        if (raw) sources = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))));
      } catch {}

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], sources };
        return copy;
      });
    } catch (e) {
      setMessages((m) => m.slice(0, -1));
      setError(e instanceof Error && e.message ? e.message : "메시지를 보내지 못했어요. 다시 시도해 주세요.");
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function endSession(moodEnd: number | null) {
    if (!sessionId) return;
    setEnding(false);
    setStreaming(true);
    const res = await fetch(`/api/sessions/${sessionId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: moodEnd ?? undefined }),
    });
    setStreaming(false);
    setEnded(res.ok ? await res.json() : {});
  }

  const started = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:h-screen">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">심리상담</h1>
          <p className="truncate text-xs text-muted">AI 상담은 전문 상담·의료를 대체하지 않아요</p>
        </div>
        {sessionId && !ended && (
          <button
            type="button"
            onClick={() => setEnding(true)}
            disabled={streaming}
            className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm hover:border-brand disabled:opacity-50"
          >
            상담 마치기
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
          {!started && (
            <div className="py-6 sm:py-12">
              <p className="text-3xl leading-snug font-bold">
                {nickname ? `${nickname}님, ` : ""}어떤 이야기든
                <br />
                편하게 시작해 보세요
              </p>
              <div className="mt-8">
                <p className="text-sm font-medium">지금 기분은 몇 점인가요? <span className="text-muted">(선택)</span></p>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="시작 기분 점수">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={moodStart === n}
                      onClick={() => setMoodStart(moodStart === n ? null : n)}
                      className={`size-10 rounded-full border text-sm ${
                        moodStart === n ? "border-brand bg-brand font-semibold text-white" : "border-line bg-surface hover:border-brand"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <p className="text-sm font-medium">이런 이야기로 시작할 수도 있어요</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-brand"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ml-auto max-w-[min(85%,36rem)] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 leading-7 whitespace-pre-wrap text-white">
                {m.content}
              </p>
            ) : (
              <div key={i} className="flex max-w-[min(94%,43rem)] items-start gap-2.5">
                <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft">
                  <Mascot pose="bubble" size={30} decorative />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-sm border border-line bg-surface px-5 py-4 text-[15.5px]">
                    {m.content ? <ReplyText text={m.content} /> : (
                      <span className="inline-flex items-center gap-2 text-sm text-muted">
                        <span className="inline-block size-2 rounded-full bg-accent" />
                        생각을 정리하고 있어요
                      </span>
                    )}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <li className="py-1 text-muted">참고한 자료</li>
                      {m.sources.map((s) => (
                        <li key={s.title}>
                          {s.source_url ? (
                            <a href={s.source_url} target="_blank" rel="noreferrer" className="block rounded-md bg-brand-soft px-2 py-1 hover:underline">
                              {s.title}
                            </a>
                          ) : (
                            <span className="block rounded-md bg-brand-soft px-2 py-1">{s.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ),
          )}

          {risk !== "low" && <CrisisCard compact={risk === "mid"} youth={youth} />}

          {ending && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-semibold">대화를 마치며, 지금 기분은 몇 점인가요?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => endSession(n)} className="size-10 rounded-full border border-line text-sm hover:border-brand hover:bg-brand-soft">
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-3 text-sm">
                <button type="button" onClick={() => endSession(null)} className="text-muted hover:text-ink">건너뛰고 마치기</button>
                <button type="button" onClick={() => setEnding(false)} className="text-muted hover:text-ink">계속 이야기하기</button>
              </div>
            </div>
          )}

          {ended && (
            <div className="rounded-2xl border border-brand bg-brand-soft p-5">
              <p className="font-semibold">오늘 이야기해 줘서 고마워요</p>
              {ended.summary && <p className="mt-2 text-sm leading-relaxed">{ended.summary}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href={sessionId ? `/dashboard/records/${sessionId}` : "/dashboard/records"} className="font-semibold text-brand-strong hover:underline">
                  기록 보기
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setSessionId(null);
                    setEnded(null);
                    setRisk("low");
                    setMoodStart(null);
                  }}
                  className="text-muted hover:text-ink"
                >
                  새 상담 시작
                </button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      {!ended && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-line bg-surface px-4 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">메시지</label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="마음에 있는 이야기를 적어 주세요"
              className="max-h-40 min-h-12 flex-1 resize-none rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="h-12 shrink-0 rounded-2xl bg-brand px-5 font-semibold text-white hover:bg-brand-strong disabled:opacity-40"
            >
              보내기
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
