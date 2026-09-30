export function CrisisCard({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger-soft p-4 text-sm text-ink"
    >
      <p className="font-semibold text-danger">지금 바로 사람과 이야기할 수 있어요</p>
      {!compact && <p className="mt-1 text-muted">혼자 견디지 않아도 됩니다. 아래 번호는 24시간 무료로 연결됩니다.</p>}
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        <li>
          <a href="tel:109" className="block rounded-lg bg-surface px-3 py-2 hover:ring-1 hover:ring-danger/40">
            <span className="block text-lg font-bold">109</span>
            <span className="text-xs text-muted">자살예방상담전화</span>
          </a>
        </li>
        <li>
          <a href="tel:15770199" className="block rounded-lg bg-surface px-3 py-2 hover:ring-1 hover:ring-danger/40">
            <span className="block text-lg font-bold">1577-0199</span>
            <span className="text-xs text-muted">정신건강위기상담</span>
          </a>
        </li>
        <li>
          <a href="tel:119" className="block rounded-lg bg-surface px-3 py-2 hover:ring-1 hover:ring-danger/40">
            <span className="block text-lg font-bold">119</span>
            <span className="text-xs text-muted">응급 상황</span>
          </a>
        </li>
      </ul>
    </aside>
  );
}
