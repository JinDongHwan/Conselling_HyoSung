// 키가 없을 때는 데모 모드로 동작해서 화면을 먼저 확인할 수 있게 한다.
export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
export const hasServiceRole = hasSupabase && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

export const DEMO_MODE = !hasSupabase;

// 모델은 .env.local 에서 바꿀 수 있다
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.5"; // 상담 답변
export const UTILITY_MODEL = process.env.OPENAI_UTILITY_MODEL ?? "gpt-5.4-mini"; // 위기 분류·요약
export const EMBEDDING_MODEL = "text-embedding-3-small";
