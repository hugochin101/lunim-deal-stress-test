import { describe, expect, it } from "vitest";
import { describeChanges, describeImpact, toRead } from "./suggest";
import { toDeal } from "./import";
import { samples } from "./samples";

const { deal, range } = samples[0];
const changed = {
  ...deal,
  split: [
    { to: "Producer", bps: 4500 },
    { to: "Investors", bps: 3000 },
    { to: "Crew pool", bps: 2500 },
  ],
};

describe("describeChanges", () => {
  it("lists only what changed", () =>
    expect(describeChanges(deal, changed)).toEqual([
      "Producer's share of the split: 50% → 45%",
      "Crew pool's share of the split: 20% → 25%",
    ]));
  it("finds no changes in an identical deal", () => expect(describeChanges(deal, deal)).toEqual([]));
});

describe("describeImpact", () => {
  it("shows before and after for the people affected", () =>
    expect(describeImpact(deal, changed, range, ["Crew pool"])).toEqual([
      "Crew pool: money starts after £625,000 (was £625,000)",
      "Crew pool at £1,500,000: £175,000 (was £140,000)",
    ]));
});

describe("toRead", () => {
  it("round trips through the AI format without changing the deal", () =>
    expect(toDeal(toRead(deal)).deal).toEqual({ ...deal, recoup: deal.recoup.map((r) => ({ ...r, percentBack: 10000 })) }));
});
