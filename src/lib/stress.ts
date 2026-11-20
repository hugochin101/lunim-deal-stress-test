// Stress test: finds the outcomes of a deal that people are unlikely to have checked.
// All maths is exact (whole pence) and done here, never by the AI.
import { Deal, MAX_REVENUE, gbp, owed, pct } from "./deal";
import { payout, parties } from "./waterfall";

export interface Range {
  low: number; // expected earnings, in pence
  high: number;
}

export function rangeError(range: Range): string | null {
  const ok = Number.isInteger(range.low) && Number.isInteger(range.high) && 0 <= range.low && range.low < range.high && range.high <= MAX_REVENUE;
  return ok ? null : "The lowest expected amount must be below the highest, and at most £1bn.";
}

export interface Finding {
  id: string;
  severity: "high" | "medium" | "info";
  who: string[];
  text: string; // plain sentence built from computed numbers
  figures: string[]; // every amount the sentence may mention
}

const listNames = (n: string[]) => (n.length < 2 ? n[0] : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);

// What is left after the fee, for a given amount earned.
const afterFee = (deal: Deal, revenue: number) =>
  revenue - (deal.fee ? Math.floor((revenue * deal.fee.bps) / 10000) : 0);

// The most the film can earn while everything after the fee is still used up paying back `amount` pence.
// Found by binary search, so it is exact to the penny.
function lastEarningAtOrBelow(deal: Deal, amount: number): number {
  let lo = 0;
  let hi = MAX_REVENUE;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (afterFee(deal, mid) <= amount) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// The amount earned at which each person's money starts to arrive.
export function startsAt(deal: Deal): Record<string, number> {
  const starts: Record<string, number> = {};
  const note = (to: string, at: number) => (starts[to] = Math.min(starts[to] ?? Infinity, at));
  if (deal.fee?.bps) note(deal.fee.to, 0);
  let paidSoFar = 0;
  for (const r of deal.recoup) {
    note(r.to, lastEarningAtOrBelow(deal, paidSoFar));
    paidSoFar += owed(r);
  }
  const splitStart = lastEarningAtOrBelow(deal, paidSoFar);
  for (const s of deal.split) note(s.to, splitStart);
  return starts;
}

export function stressTest(deal: Deal, range: Range): Finding[] {
  const found: Finding[] = [];
  const starts = startsAt(deal);
  const feeWord = deal.fee?.bps ? "everything after the fee" : "everything";

  if (deal.fee?.bps) {
    const f = pct(deal.fee.bps);
    found.push({
      id: "fee-first",
      severity: "medium",
      who: [deal.fee.to],
      text: `${deal.fee.to} takes ${f} of every pound the film earns, before anyone is paid back, even if the film loses money.`,
      figures: [f],
    });
  }

  // People whose money starts at the same point are grouped into one finding.
  const byStart = new Map<number, string[]>();
  for (const who of parties(deal)) byStart.set(starts[who], [...(byStart.get(starts[who]) ?? []), who]);
  for (const [at, who] of byStart) {
    const names = listNames(who);
    if (at >= range.high) {
      const h = gbp(range.high);
      found.push({
        id: `never-${who.join("+")}`,
        severity: "high",
        who,
        text: `Within your expected range (up to ${h}), nothing at all is paid to ${names}.`,
        figures: [h],
      });
    } else if (at >= 100_000) {
      const a = gbp(at);
      found.push({
        id: `until-${who.join("+")}`,
        severity: at > range.low ? "high" : "medium",
        who,
        text: `Nothing is paid to ${names} until the film earns more than ${a}.`,
        figures: [a],
      });
    }
  }

  // Each payback has a band of earnings where all the money goes to that one party.
  let paidSoFar = 0;
  for (const r of deal.recoup) {
    const from = gbp(lastEarningAtOrBelow(deal, paidSoFar));
    paidSoFar += owed(r);
    const to = gbp(lastEarningAtOrBelow(deal, paidSoFar));
    found.push({
      id: `band-${r.to}-${paidSoFar}`,
      severity: "medium",
      who: [r.to],
      text: `If the film earns between ${from} and ${to}, ${feeWord} goes to ${r.to}.`,
      figures: [from, to],
    });

    if ((r.percentBack ?? 10000) === 10000) continue;
    const [back, put, total] = [pct(r.percentBack!), gbp(r.amount), gbp(owed(r))];
    found.push({
      id: `premium-${r.to}`,
      severity: "medium",
      who: [r.to],
      text: `The payback to ${r.to} is ${back} of the ${put} put in, so ${total} goes to them before anyone shares in the rest.`,
      figures: [back, put, total],
    });
  }

  // A headline share can be worth far less once fees and paybacks come first.
  const split = payout(deal, range.high);
  for (const s of deal.split) {
    const onlyInSplit = !deal.recoup.some((r) => r.to === s.to) && deal.fee?.to !== s.to;
    const real = Math.round(((split.totals[s.to] ?? 0) * 10000) / range.high);
    if (onlyInSplit && real < s.bps * 0.75) {
      const [h, headline, actual] = [gbp(range.high), pct(s.bps), pct(real)];
      found.push({
        id: `share-${s.to}`,
        severity: "medium",
        who: [s.to],
        text: `If the film earns ${h}, ${s.to}'s ${headline} share works out to only ${actual} of everything the film earned.`,
        figures: [h, headline, actual],
      });
    }
  }

  if (deal.split.length > 1) {
    const most = `${deal.split.length - 1}p`;
    found.push({
      id: "pennies",
      severity: "info",
      who: deal.split.map((s) => s.to),
      text: `When the split cannot be shared exactly, up to ${most} of leftover pennies go to whoever is owed the biggest fraction of a penny.`,
      figures: [most],
    });
  }

  const rank = { high: 0, medium: 1, info: 2 };
  return found.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// Points for a chart of what each person receives as earnings grow.
export function curve(deal: Deal, high: number, points = 40) {
  const top = Math.round(high * 1.25);
  return Array.from({ length: points + 1 }, (_, i) => {
    const revenue = Math.round((top * i) / points);
    return { revenue, totals: payout(deal, revenue).totals };
  });
}
