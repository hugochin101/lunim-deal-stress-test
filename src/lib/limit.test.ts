import { expect, it } from "vitest";
import { allow } from "./limit";

it("allows 10 requests a minute, then blocks until the minute passes", () => {
  for (let i = 0; i < 10; i++) expect(allow("a", 1000)).toBe(true);
  expect(allow("a", 1000)).toBe(false);
  expect(allow("a", 61_001)).toBe(true);
});
