import { Deal, gbp } from "./deal";
import { Range, startsAt } from "./stress";
import { payout } from "./waterfall";

// What one person receives under the deal, in plain words they can be sent.
export function myPart(deal: Deal, range: Range, name: string) {
  const start = startsAt(deal)[name] ?? 0;
  const mid = Math.round((range.low + range.high) / 2);
  const examples = [range.low, mid, range.high].map((earns) => ({ earns, gets: payout(deal, earns).totals[name] ?? 0 }));

  const startLine =
    start >= range.high
      ? `Within the expected range (up to ${gbp(range.high)}), you are not paid at all.`
      : start > 0
        ? `Your money only starts once the film earns more than ${gbp(start)}.`
        : "You are paid from the first pound the film earns.";

  const message = [
    `Hi ${name}, here is what the "${deal.title}" deal means for you:`,
    `- ${startLine}`,
    ...examples.map((e) => `- If the film earns ${gbp(e.earns)}, you would get ${gbp(e.gets)}.`),
    "These are examples, not promises. Please check the full deal before it is locked.",
  ].join("\n");

  return { start, startLine, examples, message };
}
