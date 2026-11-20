import { describe, expect, it } from "vitest";
import { toDeal } from "./import";
import { readJson } from "./ai";
import { validate } from "./deal";

describe("toDeal", () => {
  it("converts pounds and percentages exactly", () => {
    const { deal, unclear } = toDeal({
      title: "X",
      fee: { to: "Distributor", percent: 17.5 },
      recoup: [{ to: "Investors", pounds: 250000.5, percent_back: 115 }],
      split: [{ to: "A", percent: 60 }, { to: "B", percent: 40 }],
      unclear: ["Net profits is not defined."],
    });
    expect(deal.fee).toEqual({ to: "Distributor", bps: 1750 });
    expect(deal.recoup[0].amount).toBe(25_000_050);
    expect(deal.recoup[0].percentBack).toBe(11500);
    expect(deal.split.map((s) => s.bps)).toEqual([6000, 4000]);
    expect(unclear).toEqual(["Net profits is not defined."]);
    expect(validate(deal)).toEqual([]);
  });

  it("reads numbers the AI wrote as text", () => {
    const { deal } = toDeal({
      fee: { to: "Agent", percent: "15%" as unknown as number },
      recoup: [{ to: "Investors", pounds: "£400,000" as unknown as number }],
      split: [{ to: "A", percent: "100%" as unknown as number }],
    });
    expect([deal.fee?.bps, deal.recoup[0].amount, deal.split[0].bps]).toEqual([1500, 40_000_000, 10000]);
  });

  it("still lets validation refuse a bad reading", () => {
    const { deal } = toDeal({ split: [{ to: "A", percent: 70 }] });
    expect(validate(deal).length).toBeGreaterThan(0);
  });
});

describe("readJson", () => {
  it("reads JSON wrapped in a code block", () => expect(readJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }));
  it("returns null for text with no JSON", () => expect(readJson("sorry")).toBeNull());
});
