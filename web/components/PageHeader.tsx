export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "", action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`min-w-0 rounded-[20px] border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, [string, string]> = {
    low: ["안정", "bg-brand-soft text-brand-strong"],
    mid: ["주의", "bg-accent-soft text-ink"],
    high: ["위기", "bg-danger-soft text-danger"],
  };
  const [label, cls] = map[risk] ?? ["-", "bg-surface-2 text-muted"];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
