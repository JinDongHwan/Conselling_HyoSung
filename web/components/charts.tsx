"use client";

import { useId, useState } from "react";

type Point = { label: string; value: number };

// 단일 시계열 라인 차트: 2px 선, 크로스헤어 + 툴팁, 가로 그리드만
export function LineChart({
  data,
  min = 0,
  max,
  height = 200,
  unit = "",
  title,
  bands,
}: {
  data: Point[];
  min?: number;
  max: number;
  height?: number;
  unit?: string;
  title: string;
  bands?: { from: number; to: number; label: string }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();
  const W = 600;
  const H = height;
  const pad = { l: 32, r: 16, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const ticks = [min, Math.round((min + max) / 2), max];
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  if (!data.length) {
    return <p className="rounded-xl bg-surface-2 px-4 py-10 text-center text-sm text-muted">아직 기록이 없어요.</p>;
  }

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * iw;
    const i = data.length <= 1 ? 0 : Math.round((px / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const h = hover !== null ? data[hover] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        <defs>
          <clipPath id={clipId}>
            <rect x={pad.l} y={pad.t} width={iw} height={ih} />
          </clipPath>
        </defs>
        {bands?.map((b) => (
          <g key={b.label} clipPath={`url(#${clipId})`}>
            <rect x={pad.l} width={iw} y={y(b.to)} height={y(b.from) - y(b.to)} fill="var(--surface-2)" />
            <text x={W - pad.r - 4} y={y(b.to) + 12} textAnchor="end" fontSize="10" fill="var(--muted)">
              {b.label}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i === data.length - 1 || (i % labelEvery === 0 && data.length - 1 - i >= labelEvery) ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {d.label}
            </text>
          ) : null,
        )}
        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.length <= 1 && <circle cx={x(0)} cy={y(data[0].value)} r="4" fill="var(--brand)" />}
        {/* 마지막 값 강조 */}
        <circle cx={x(data.length - 1)} cy={y(data.at(-1)!.value)} r="4.5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.value)} r="5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
        <rect
          x={pad.l}
          y={pad.t}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <span className="text-muted">{h.label}</span>{" "}
          <b className="text-ink">
            {h.value}
            {unit}
          </b>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.label}</th>
              <td>{d.value}{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// 가로 막대 (순위형 데이터)
export function BarList({ data, unit = "건" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) {
    return <p className="rounded-xl bg-surface-2 px-4 py-10 text-center text-sm text-muted">아직 기록이 없어요.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm" title={`${d.label} ${d.value}${unit}`}>
          <span className="truncate text-muted">{d.label}</span>
          <span className="h-3 rounded-r bg-surface-2">
            <span
              className="block h-full rounded-r bg-brand"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-right tabular-nums">
            {d.value}
            <span className="text-xs text-muted">{unit}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
