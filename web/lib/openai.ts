import "server-only";
import OpenAI from "openai";
import { AI_API_KEY, AI_BASE_URL, AI_PROVIDER, EMBEDDING_MODEL } from "./config";

// OpenAI 호환 클라이언트 (OpenAI 또는 open.hasa.re.kr)
let client: OpenAI | null = null;
export function openai() {
  client ??= new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_BASE_URL });
  return client;
}

// OpenAI 전용 파라미터 — 다른 제공자의 모델에는 보내지 않는다
export const openaiOnly = <T extends object>(params: T): T | Record<string, never> =>
  AI_PROVIDER === "openai" ? params : {};

export async function embed(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}
