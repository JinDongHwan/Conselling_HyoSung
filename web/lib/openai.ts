import "server-only";
import OpenAI from "openai";
import { EMBEDDING_MODEL } from "./config";

let client: OpenAI | null = null;
export function openai() {
  client ??= new OpenAI(); // OPENAI_API_KEY 환경변수 사용
  return client;
}

export async function embed(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}
