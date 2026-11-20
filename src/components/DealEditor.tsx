"use client";
import { Deal } from "@/lib/deal";

// Form for editing a deal. Shows pounds and percentages; stores pence and basis points.

const pounds = (pence: number) => pence / 100;
const percent = (bps: number) => bps / 100;
const toPence = (v: string) => Math.round(Number(v) * 100);
const toBps = (v: string) => Math.round(Number(v) * 100);

export default function DealEditor({ deal, onChange }: { deal: Deal; onChange: (d: Deal) => void }) {
  const set = (patch: Partial<Deal>) => onChange({ ...deal, ...patch });
  const splitTotal = deal.split.reduce((a, s) => a + s.bps, 0);

  return (
    <div>
      <div className="row">
        <input type="text" aria-label="Deal name" value={deal.title} onChange={(e) => set({ title: e.target.value })} />
      </div>

      <h3>1. Fee taken first (optional)</h3>
      <div className="row">
        <input type="text" aria-label="Fee taken by" placeholder="e.g. Distributor" value={deal.fee?.to ?? ""}
          onChange={(e) => set({ fee: { to: e.target.value, bps: deal.fee?.bps ?? 0 } })} />
        <input type="number" aria-label="Fee percent" min={0} max={99} step={0.5} value={percent(deal.fee?.bps ?? 0)}
          onChange={(e) => set({ fee: { to: deal.fee?.to ?? "", bps: toBps(e.target.value) } })} /> %
      </div>

      <h3>2. Paid back, in this order</h3>
      {deal.recoup.map((r, i) => (
        <div className="row" key={i}>
          <input type="text" aria-label="Paid back to" value={r.to}
            onChange={(e) => set({ recoup: deal.recoup.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} />
          £<input type="number" className="money" aria-label="Amount paid back" min={0} step={1000} value={pounds(r.amount)}
            onChange={(e) => set({ recoup: deal.recoup.map((x, j) => (j === i ? { ...x, amount: toPence(e.target.value) } : x)) })} />
          <input type="number" aria-label="Percent paid back" min={100} max={300} step={5} value={percent(r.percentBack ?? 10000)}
            onChange={(e) => set({ recoup: deal.recoup.map((x, j) => (j === i ? { ...x, percentBack: toBps(e.target.value) } : x)) })} /> % back
          <button className="remove" aria-label={`Remove ${r.to || "payback"}`} onClick={() => set({ recoup: deal.recoup.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button onClick={() => set({ recoup: [...deal.recoup, { to: "", amount: 0, percentBack: 10000 }] })}>Add payback</button>

      <h3>3. Then the rest is split (must total 100%, now {percent(splitTotal)}%)</h3>
      {deal.split.map((s, i) => (
        <div className="row" key={i}>
          <input type="text" aria-label="Split to" value={s.to}
            onChange={(e) => set({ split: deal.split.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} />
          <input type="number" aria-label="Split percent" min={0} max={100} step={0.5} value={percent(s.bps)}
            onChange={(e) => set({ split: deal.split.map((x, j) => (j === i ? { ...x, bps: toBps(e.target.value) } : x)) })} /> %
          <button className="remove" aria-label={`Remove ${s.to || "person"}`} onClick={() => set({ split: deal.split.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button onClick={() => set({ split: [...deal.split, { to: "", bps: 0 }] })}>Add person</button>
    </div>
  );
}
