import { describe, expect, it } from "vitest";
import { Deal } from "./deal";
import { startsAt, stressTest, curve } from "./stress";
import { payout } from "./waterfall";

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

describe("startsAt", () => {
  it("finds the exact amount where the split begins", () => {
    const at = startsAt(deal).Crew;
    expect(at).toBe(62_500_000);
    expect(payout(deal, at).steps.filter((s) => s.label === "Split").every((s) => s.amount === 0)).toBe(true);
    expect(payout(deal, at + 1).steps.some((s) => s.label === "Split" && s.amount > 0)).toBe(true);
  });

  it("starts payback and fee from the first penny", () => {
    expect(startsAt(deal).Investors).toBe(0);
    expect(startsAt(deal).Distributor).toBe(0);
  });
});

describe("stressTest", () => {
  it("warns that producer and crew get nothing until £625,000", () => {
    const f = stressTest(deal, { low: 20_000_000, high: 150_000_000 });
    expect(f.find((x) => x.id === "until-Producer+Crew")?.text).toBe("Producer and Crew get nothing until the film earns more than £625,000.");
  });

  it("warns when someone is never paid in the expected range", () => {
    const f = stressTest(deal, { low: 10_000_000, high: 60_000_000 });
    expect(f[0].id).toBe("never-Producer+Crew");
    expect(f[0].text).toContain("Producer and Crew are never paid");
    expect(f[0].severity).toBe("high");
  });

  it("shows the band where all money goes to one party", () => {
    const f = stressTest(deal, { low: 20_000_000, high: 150_000_000 });
    expect(f.find((x) => x.id.startsWith("band-"))?.text).toBe(
      "If the film earns between £0 and £625,000, everything after the fee goes to Investors.",
    );
  });

  it("compares a headline share with what it is really worth", () => {
    const f = stressTest(deal, { low: 20_000_000, high: 100_000_000 });
    expect(f.find((x) => x.id === "share-Crew")?.text).toContain("20% share works out to only 6%");
  });

  it("puts the most serious findings first", () => {
    const f = stressTest(deal, { low: 70_000_000, high: 150_000_000 });
    expect(f.map((x) => x.severity)).toEqual([...f.map((x) => x.severity)].sort((a, b) =>
      ["high", "medium", "info"].indexOf(a) - ["high", "medium", "info"].indexOf(b)));
  });

  it("only uses figures it lists, so explanations can be checked", () => {
    for (const x of stressTest(deal, { low: 20_000_000, high: 150_000_000 }))
      for (const fig of x.figures) expect(x.text).toContain(fig);
  });
});

describe("paybacks above 100%", () => {
  const premium: Deal = { ...deal, recoup: [{ to: "Investors", amount: 50_000_000, percentBack: 12000 }] };

  it("pays back the full amount owed before the split", () => {
    expect(payout(premium, 75_000_000).totals.Investors).toBe(60_000_000);
    expect(startsAt(premium).Crew).toBe(75_000_000);
  });

  it("explains the extra in plain words", () => {
    expect(stressTest(premium, { low: 20_000_000, high: 150_000_000 }).find((x) => x.id === "premium-Investors")?.text).toBe(
      "The payback to Investors is 120% of the £500,000 put in, so £600,000 goes to them before anyone shares in the rest.",
    );
  });
});

describe("curve", () => {
  it("accounts for every penny at every point", () => {
    for (const p of curve(deal, 150_000_000))
      expect(Object.values(p.totals).reduce((a, b) => a + b, 0)).toBe(p.revenue);
  });
});
