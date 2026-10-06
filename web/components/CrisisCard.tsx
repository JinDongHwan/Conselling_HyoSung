// 위기 상담 번호 카드. 청소년에게는 청소년상담·학교폭력·신고 번호를 보여 준다.
const ADULT = [
  { tel: "109", num: "109", label: "자살예방상담전화" },
  { tel: "15770199", num: "1577-0199", label: "정신건강위기상담" },
  { tel: "119", num: "119", label: "응급 상황" },
];
const YOUTH = [
  { tel: "1388", num: "1388", label: "청소년상담 (문자·카톡도 돼요)" },
  { tel: "109", num: "109", label: "자살예방상담전화" },
  { tel: "112", num: "112", label: "학대·폭력 신고" },
  { tel: "117", num: "117", label: "학교폭력 신고" },
];

export function CrisisCard({ compact = false, youth = false }: { compact?: boolean; youth?: boolean }) {
  const lines = youth ? YOUTH : ADULT;
  return (
    <aside role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm text-ink">
      <p className="font-semibold text-danger">지금 바로 사람과 이야기할 수 있어요</p>
      {!compact && <p className="mt-1 text-muted">혼자 견디지 않아도 됩니다. 아래 번호는 24시간 무료로 연결됩니다.</p>}
      <ul className={`mt-3 grid gap-2 ${youth ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {lines.map((l) => (
          <li key={l.tel}>
            <a href={`tel:${l.tel}`} className="block rounded-lg bg-surface px-3 py-2 hover:ring-1 hover:ring-danger/40">
              <span className="block text-lg font-bold">{l.num}</span>
              <span className="text-xs text-muted">{l.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
