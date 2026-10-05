// 키가 없을 때는 데모 모드로 동작해서 화면을 먼저 확인할 수 있게 한다.
export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
export const hasServiceRole = hasSupabase && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const DEMO_MODE = !hasSupabase;

// AI 제공자: HASA_API_KEY 가 있으면 Open AI Service Hub(open.hasa.re.kr), 없으면 OpenAI
// 둘 다 OpenAI 호환 API라서 같은 SDK로 호출한다.
// Vercel에 Hasa_API_KEY 처럼 대소문자가 다르게 저장된 경우도 받아 준다
const HASA_KEY = process.env.HASA_API_KEY ?? process.env.Hasa_API_KEY ?? process.env.hasa_api_key;
export const AI_PROVIDER: "hasa" | "openai" | null = HASA_KEY
  ? "hasa"
  : process.env.OPENAI_API_KEY
    ? "openai"
    : null;
export const hasAI = AI_PROVIDER !== null;

// 복사·붙여넣기로 섞인 공백·줄바꿈·"Bearer " 접두어 제거
export const AI_API_KEY = (HASA_KEY ?? process.env.OPENAI_API_KEY)?.trim().replace(/^Bearer\s+/i, "");
export const AI_BASE_URL =
  AI_PROVIDER === "hasa"
    ? (process.env.HASA_BASE_URL ?? "https://open.hasa.re.kr/v1")
    : process.env.OPENAI_BASE_URL; // undefined → SDK 기본값(api.openai.com)

const DEFAULTS = {
  hasa: { chat: "exaone-4.0-32b", utility: "gpt-oss-20b", embedding: "bge-m3", dim: 1024 },
  openai: { chat: "gpt-5.5", utility: "gpt-5.4-mini", embedding: "text-embedding-3-small", dim: 1536 },
} as const;
const d = DEFAULTS[AI_PROVIDER ?? "openai"];

// 모델은 환경변수로 바꿀 수 있다
export const CHAT_MODEL = process.env.AI_CHAT_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? d.chat; // 상담 답변
export const UTILITY_MODEL = process.env.AI_UTILITY_MODEL ?? process.env.OPENAI_UTILITY_MODEL ?? d.utility; // 위기 분류·요약
export const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL ?? d.embedding;
export const EMBEDDING_DIM = Number(process.env.AI_EMBEDDING_DIM ?? d.dim); // supabase documents.embedding 크기와 같아야 함
