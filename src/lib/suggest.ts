import { Deal, gbp, pct } from "./deal";
import { ReadDeal } from "./import";
import { Range, startsAt } from "./stress";
import { payout } from "./waterfall";

// Helpers for AI suggested fixes. The AI proposes a deal; everything shown about it is worked out here by code.

export const SUGGEST_PROMPT = `You help fix a film deal. You get the deal, the expected earnings range, and one finding the people want changed.
Propose the smallest change that makes that finding less harsh, keeping everyone else's terms as close as possible.
The deal can only change in these ways:
- the fee: change its percent, or remove it by setting "fee" to null;
- paybacks: change "pounds" or "percent_back" (100 to 300), reorder them, or remove one;
- the split: change the percentages, add or remove a person. The split must total exactly 100.
You must change at least one number. Use plain numbers only (400000, not "£400,000"). Do not calculate payouts.
Return only JSON: {"reason": "one plain sentence, with no numbers", "deal": {"title": string, "fee": {"to": string, "percent": number} | null,
"recoup": [{"to": string, "pounds": number, "percent_back": number}], "split": [{"to": string, "percent": number}]}}`;

// The deal in the same pounds and percentages shape the AI reads and writes.
export function toRead(deal: Deal): ReadDeal {
  return {
    title: deal.title,
    fee: deal.fee ? { to: deal.fee.to, percent: deal.fee.bps / 100 } : null,
    recoup: deal.recoup.map((r) => ({ to: r.to, pounds: r.amount / 100, percent_back: (r.percentBack ?? 10000) / 100 })),
    split: deal.split.map((s) => ({ to: s.to, percent: s.bps / 100 })),
  };
}

// Lists exactly what changed between two deals, worked out by code, not by the AI.
export function describeChanges(before: Deal, after: Deal): string[] {
  const out: string[] = [];
  const fee = (d: Deal) => (d.fee?.bps ? `${d.fee.to} ${pct(d.fee.bps)}` : "none");
  if (fee(before) !== fee(after)) out.push(`Fee: ${fee(before)} → ${fee(after)}`);
  const pay = (d: Deal) => d.recoup.map((r) => `${r.to} ${gbp(r.amount)} at ${pct(r.percentBack ?? 10000)}`).join(", ") || "none";
  if (pay(before) !== pay(after)) out.push(`Paybacks: ${pay(before)} → ${pay(after)}`);
  const names = [...new Set([...before.split, ...after.split].map((s) => s.to))];
  for (const n of names) {
    const b = before.split.find((s) => s.to === n)?.bps ?? 0;
    const a = after.split.find((s) => s.to === n)?.bps ?? 0;
    if (a !== b) out.push(`${n}'s share of the split: ${pct(b)} → ${pct(a)}`);
  }
  return out;
}

// What the change means for the people named in the finding, worked out by code.
export function describeImpact(before: Deal, after: Deal, range: Range, who: string[]): string[] {
  const [sb, sa] = [startsAt(before), startsAt(after)];
  const [pb, pa] = [payout(before, range.high).totals, payout(after, range.high).totals];
  return who.flatMap((n) => [
    `${n}: money starts after ${gbp(sa[n] ?? 0)} (was ${gbp(sb[n] ?? 0)})`,
    `${n} at ${gbp(range.high)}: ${gbp(pa[n] ?? 0)} (was ${gbp(pb[n] ?? 0)})`,
  ]);
}
