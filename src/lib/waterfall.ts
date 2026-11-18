import { Deal } from "./deal";

export interface Step {
  label: string;
  to: string;
  amount: number;
}

export interface Payout {
  revenue: number;
  steps: Step[];
  totals: Record<string, number>;
}

// Shares an amount by basis points so the parts always add up exactly (largest remainder method).
export function splitExact(amount: number, parts: { to: string; bps: number }[]): number[] {
  const raw = parts.map((p) => amount * p.bps);
  const base = raw.map((r) => Math.floor(r / 10000));
  let left = amount - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, rem: r % 10000 }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) base[order[k % order.length].i] += 1;
  return base;
}

export function payout(deal: Deal, revenue: number): Payout {
  const steps: Step[] = [];
  let left = revenue;
  if (deal.fee && deal.fee.bps > 0) {
    const fee = Math.floor((revenue * deal.fee.bps) / 10000);
    steps.push({ label: "Fee", to: deal.fee.to, amount: fee });
    left -= fee;
  }
  for (const r of deal.recoup) {
    const paid = Math.min(left, r.amount);
    steps.push({ label: "Payback", to: r.to, amount: paid });
    left -= paid;
  }
  splitExact(left, deal.split).forEach((amount, i) =>
    steps.push({ label: "Split", to: deal.split[i].to, amount }),
  );
  const totals: Record<string, number> = {};
  for (const s of steps) totals[s.to] = (totals[s.to] ?? 0) + s.amount;
  return { revenue, steps, totals };
}

export function parties(deal: Deal): string[] {
  const names = [deal.fee?.bps ? deal.fee.to : "", ...deal.recoup.map((r) => r.to), ...deal.split.map((s) => s.to)];
  return [...new Set(names.filter(Boolean))];
}
