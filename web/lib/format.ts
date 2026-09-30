const tz = "Asia/Seoul";

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "long", day: "numeric", weekday: "short" }).format(new Date(iso));

export const fmtShort = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "numeric", day: "numeric" }).format(new Date(iso)).replace(/\.\s?/g, "/").replace(/\/$/, "");

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// 오늘을 마지막으로 하는 n일치 날짜 라벨
export const lastDayLabels = (n: number) =>
  Array.from({ length: n }, (_, i) => fmtShort(new Date(Date.now() - (n - 1 - i) * 86_400_000).toISOString()));

export const withinDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * 86_400_000;

export const RISK_LABEL = { low: "안정", mid: "주의", high: "위기" } as const;

export function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()));
  if (h < 5) return "늦은 밤이에요";
  if (h < 11) return "좋은 아침이에요";
  if (h < 17) return "오후도 잘 보내고 있나요";
  return "오늘 하루 수고 많았어요";
}
