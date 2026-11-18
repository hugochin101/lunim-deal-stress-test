import { describe, expect, it } from "vitest";
import { explanationIsSafe } from "./check";

const figures = ["£625,000", "20%"];

describe("explanationIsSafe", () => {
  it("accepts text that only uses computed figures", () =>
    expect(explanationIsSafe("The crew see no money until takings pass £625,000.", figures)).toBe(true));
  it("rejects a figure the engine did not compute", () =>
    expect(explanationIsSafe("The crew see no money until takings pass £600,000.", figures)).toBe(false));
  it("rejects a changed percentage", () =>
    expect(explanationIsSafe("The distributor keeps 25% first.", figures)).toBe(false));
  it("rejects promises", () =>
    expect(explanationIsSafe("You will earn 20% of profits.", figures)).toBe(false));
  it("rejects empty text", () => expect(explanationIsSafe("", figures)).toBe(false));
});
