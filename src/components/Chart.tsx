"use client";
import { Deal, gbp } from "@/lib/deal";
import { curve } from "@/lib/stress";
import { parties } from "@/lib/waterfall";

const COLOURS = ["#2b3a67", "#c62828", "#2e8b57", "#e0a800", "#8a4fbf", "#c0662b", "#4a6fa5", "#555"];
const W = 640, H = 260, PAD = 44;

// What each person receives (vertical) as the film earns more (horizontal).
export default function Chart({ deal, high }: { deal: Deal; high: number }) {
  const points = curve(deal, high);
  const names = parties(deal);
  const maxX = points[points.length - 1].revenue || 1;
  const maxY = Math.max(1, ...points.flatMap((p) => Object.values(p.totals)));
  const x = (v: number) => PAD + (v / maxX) * (W - PAD - 10);
  const y = (v: number) => H - PAD + 10 - (v / maxY) * (H - PAD - 10);

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="What each person receives as the film earns more">
        <line x1={PAD} y1={y(0)} x2={W - 10} y2={y(0)} stroke="#999" />
        <line x1={PAD} y1={y(0)} x2={PAD} y2={10} stroke="#999" />
        <text x={PAD} y={H - 8} fontSize="11">£0</text>
        <text x={(W + PAD) / 2} y={H - 8} fontSize="11" textAnchor="middle">What the film earns →</text>
        <text x={W - 10} y={H - 8} fontSize="11" textAnchor="end">{gbp(maxX)}</text>
        <text x={PAD + 4} y={16} fontSize="11">↑ What each person gets (top line: {gbp(maxY)})</text>
        {names.map((n, i) => (
          <polyline key={n} fill="none" strokeWidth={2.5} stroke={COLOURS[i % COLOURS.length]}
            points={points.map((p) => `${x(p.revenue)},${y(p.totals[n] ?? 0)}`).join(" ")} />
        ))}
      </svg>
      <figcaption className="legend">
        {names.map((n, i) => (
          <span key={n} style={{ ["--c" as string]: COLOURS[i % COLOURS.length] }}>{n}</span>
        ))}
      </figcaption>
    </figure>
  );
}
