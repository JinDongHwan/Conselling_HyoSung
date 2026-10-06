import "server-only";
import { hasAI, UTILITY_MODEL } from "./config";
import { describeAIError, openai } from "./openai";
import type { Risk } from "./types";

// 1차: 키워드 (모델 호출이 실패해도 항상 동작하는 하한선)
const HIGH_PATTERNS = [
  /죽고\s*싶/, /자살/, /목숨을?\s*끊/, /사라지고\s*싶/, /살고\s*싶지\s*않/, /끝내고\s*싶/,
  /자해/, /손목을?\s*긋/, /뛰어\s*내리/, /유서/, /죽어\s*버리/, /죽이고\s*싶/,
  // 학대·폭력 (특히 청소년)
  /(엄마|아빠|부모|어른|선생님|오빠|형|삼촌)\S*\s*(가|이)?\s*(때려|때린|폭행)/, /맞고\s*있/, /성추행/, /성폭행/, /몰래\s*만지/, /집에\s*가기\s*무서/,
];
const MID_PATTERNS = [/살\s*이유/, /희망이\s*없/, /아무\s*의미\s*없/, /버티기\s*힘들/, /다\s*포기/, /없어지면/];

function keywordRisk(text: string): Risk {
  if (HIGH_PATTERNS.some((p) => p.test(text))) return "high";
  if (MID_PATTERNS.some((p) => p.test(text))) return "mid";
  return "low";
}

const order: Record<Risk, number> = { low: 0, mid: 1, high: 2 };
const maxRisk = (a: Risk, b: Risk): Risk => (order[a] >= order[b] ? a : b);

// 2차: 모델 분류 — 맥락(농담, 과거 이야기, 제3자 이야기)을 반영
export async function assessRisk(message: string, recent: string[] = []): Promise<Risk> {
  const byKeyword = keywordRisk(message);
  if (!hasAI) return byKeyword;

  try {
    const res = await openai().chat.completions.create({
      model: UTILITY_MODEL,
      max_completion_tokens: 1000, // 추론형 모델(gpt-oss 등)은 생각 토큰도 포함
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "risk",
          strict: true,
          schema: {
            type: "object",
            properties: {
              risk: { type: "string", enum: ["low", "mid", "high"] },
              reason: { type: "string" },
            },
            required: ["risk", "reason"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "당신은 심리상담 챗봇의 안전 분류기입니다. 사용자의 마지막 메시지를 보고 자해·자살·타해·학대·폭력 위험도를 분류하세요.\n" +
            "high: 현재의 자살/자해/타해 생각·계획·수단 언급, 작별 인사, 즉각적 위험, 지금 겪고 있는 학대·가정폭력·성폭력·심각한 학교폭력\n" +
            "mid: 절망감, 무가치감, 수동적 죽음 사고('없어졌으면'), 위험 신호가 모호한 경우\n" +
            "low: 그 외 일반적인 고민\n" +
            "애매하면 더 높은 쪽으로 분류하세요.",
        },
        {
          role: "user",
          content: `최근 대화:\n${recent.slice(-4).join("\n") || "(없음)"}\n\n마지막 메시지:\n${message}`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { risk?: Risk };
    return maxRisk(byKeyword, parsed.risk ?? "low");
  } catch (err) {
    console.error("[safety] classifier failed, using keyword result:", describeAIError(err));
    return byKeyword;
  }
}
