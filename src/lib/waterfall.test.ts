import { describe, expect, it } from "vitest";
import { Deal, validate, gbp } from "./deal";
import { payout, splitExact } from "./waterfall";

const deal: Deal = {
  title: "Test",
  fee: { to: "Distributor", bps: 2000 },
  recoup: [{ to: "Investors", amount: 50_000_000 }],
  split: [
    { to: "Producer", bps: 5000 },
    { to: "Investors", bps: 3000 },
    { to: "Crew", bps: 2000 },
  ],
};

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

describe("payout", () => {
  it("pays the fee, then the payback, then the split", () => {
    const p = payout(deal, 100_000_000);
    expect(p.totals).toEqual({ Distributor: 20_000_000, Investors: 59_000_000, Producer: 15_000_000, Crew: 6_000_000 });
  });

  it("pays nobody in the split before the payback is complete", () => {
    const p = payout(deal, 40_000_000);
    expect(p.totals.Crew).toBe(0);
    expect(p.totals.Investors).toBe(32_000_000);
  });

  it("always accounts for every penny", () => {
    for (const r of [0, 1, 7, 99, 62_500_001, 123_456_789]) expect(sum(payout(deal, r).totals)).toBe(r);
  });
});

describe("splitExact", () => {
  it("gives leftover pennies to the biggest remainders", () => {
    expect(splitExact(100, [{ to: "A", bps: 3333 }, { to: "B", bps: 3333 }, { to: "C", bps: 3334 }])).toEqual([33, 33, 34]);
  });
});

describe("validate", () => {
  it("accepts a sound deal", () => expect(validate(deal)).toEqual([]));
  it("refuses a split that is not 100%", () =>
    expect(validate({ ...deal, split: [{ to: "A", bps: 9000 }] })[0]).toMatch(/90%/));
  it("refuses a negative payback", () =>
    expect(validate({ ...deal, recoup: [{ to: "A", amount: -5 }] }).length).toBeGreaterThan(0));
});

describe("gbp", () => {
  it("formats pounds and pence", () => {
    expect(gbp(62_500_000)).toBe("£625,000");
    expect(gbp(123)).toBe("£1.23");
  });
});
