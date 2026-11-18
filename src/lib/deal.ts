// A film deal in structured form. All money is in whole pence; all shares are basis points (10000 = 100%).
export interface Deal {
  title: string;
  fee?: { to: string; bps: number }; // taken first, as a share of everything the film earns
  recoup: Payback[]; // paid back in this order, before any split
  split: { to: string; bps: number }[]; // what is left, shared out; must total 10000
}

// `percentBack` lets a payback return more than was put in, e.g. 12000 = 120%. Defaults to 100%.
export interface Payback {
  to: string;
  amount: number;
  percentBack?: number;
}

export const owed = (r: Payback) => Math.floor((r.amount * (r.percentBack ?? 10000)) / 10000);

export const MAX_REVENUE = 100_000_000_000; // £1bn in pence, keeps all maths inside safe integers

export function validate(deal: Deal): string[] {
  const errors: string[] = [];
  const named = (s: string) => s.trim().length > 0;
  if (deal.fee) {
    if (!named(deal.fee.to)) errors.push("The fee needs a name.");
    if (!Number.isInteger(deal.fee.bps) || deal.fee.bps < 0 || deal.fee.bps >= 10000)
      errors.push("The fee must be between 0% and 99.99%.");
  }
  let recoupTotal = 0;
  for (const r of deal.recoup) {
    if (!named(r.to)) errors.push("Every payback line needs a name.");
    if (!Number.isInteger(r.amount) || r.amount <= 0) errors.push(`Payback to ${r.to || "?"} must be more than £0.`);
    const back = r.percentBack ?? 10000;
    if (!Number.isInteger(back) || back < 10000 || back > 30000)
      errors.push(`Payback to ${r.to || "?"} must return between 100% and 300% of the amount.`);
    recoupTotal += owed(r);
  }
  if (recoupTotal >= MAX_REVENUE) errors.push("Paybacks must total less than £1bn.");
  if (deal.split.length === 0) errors.push("The deal needs at least one person in the split.");
  let splitTotal = 0;
  for (const s of deal.split) {
    if (!named(s.to)) errors.push("Every split line needs a name.");
    if (!Number.isInteger(s.bps) || s.bps <= 0) errors.push(`${s.to || "?"} must have a share above 0%.`);
    splitTotal += s.bps;
  }
  if (deal.split.length && splitTotal !== 10000)
    errors.push(`The split adds up to ${pct(splitTotal)}, not 100%.`);
  return errors;
}

export function gbp(pence: number): string {
  const whole = pence % 100 === 0;
  return "£" + (pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

export function pct(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}
