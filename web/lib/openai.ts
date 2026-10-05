import "server-only";
import OpenAI from "openai";
import { AI_API_KEY, AI_BASE_URL, AI_PROVIDER, EMBEDDING_MODEL } from "./config";

// OpenAI 호환 클라이언트 (OpenAI 또는 open.hasa.re.kr)
let client: OpenAI | null = null;
export function openai() {
  client ??= new OpenAI({
    apiKey: AI_API_KEY,
    baseURL: AI_BASE_URL,
    maxRetries: AI_PROVIDER === "hasa" ? 0 : 2, // open.hasa 는 실패가 누적되면 키를 차단하므로 자동 재시도하지 않는다
    // 실패 응답 본문을 남긴다 (open.hasa 는 violation_code·message 에 실제 이유를 담는데 SDK 오류에는 빠진다)
    fetch: async (url, init) => {
      const res = await fetch(url, init);
      if (!res.ok) console.error(`[ai] ${res.status}`, (await res.clone().text()).slice(0, 600));
      return res;
    },
  });
  return client;
}

// OpenAI 전용 파라미터 — 다른 제공자의 모델에는 보내지 않는다
export const openaiOnly = <T extends object>(params: T): T | Record<string, never> =>
  AI_PROVIDER === "openai" ? params : {};

// 로그용 오류 요약 — open.hasa 는 403 security_policy_blocked 안에 violation_code·message 로 실제 이유를 준다
export function describeAIError(err: unknown) {
  if (err instanceof OpenAI.APIError) {
    const body = err.error as { violation_code?: string; message?: string } | undefined;
    return `${err.status} ${body?.violation_code ?? err.code ?? ""} ${body?.message ?? err.message}`.trim();
  }
  return err instanceof Error ? err.message : String(err);
}

export async function embed(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}
