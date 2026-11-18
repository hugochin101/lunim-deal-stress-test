import { describe, expect, it } from "vitest";
import { myPart } from "./mypart";
import { samples } from "./samples";

const { deal, range } = samples[0]; // Moonlit Harbour: crew start after £625,000

describe("myPart", () => {
  it("shows when a person's money starts and what they would get", () => {
    const p = myPart(deal, range, "Crew pool");
    expect(p.startLine).toBe("Your money only starts once the film earns more than £625,000.");
    expect(p.examples.map((e) => e.gets)).toEqual([0, 3_600_000, 14_000_000]);
  });

  it("says when someone is paid from the first pound", () => {
    expect(myPart(deal, range, "Distributor").startLine).toBe("You are paid from the first pound the film earns.");
  });

  it("says when someone is never paid in the expected range", () => {
    expect(myPart(deal, { low: 10_000_000, high: 50_000_000 }, "Producer").startLine).toContain("you are not paid at all");
  });

  it("writes a message that never promises", () => {
    const m = myPart(deal, range, "Crew pool").message;
    expect(m).toContain("These are examples, not promises.");
    expect(m).not.toMatch(/will (earn|receive|get)/);
  });
});
