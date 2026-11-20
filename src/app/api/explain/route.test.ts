import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { samples } from "@/lib/samples";
import { fakeAi, post } from "@/test/fakeAi";

const { deal, range } = samples[0];
const id = "until-Producer+Crew pool";
const explanationFor = (res: { explanations: { id: string; text: string; byAi: boolean }[] }) =>
  res.explanations.find((e) => e.id === id)!;

describe("POST /api/explain", () => {
  it("works without a key, using the engine's own wording", async () => {
    const res = await (await post(POST, { deal, range }, "e1")).json();
    expect(res.aiUsed).toBe(false);
    expect(res.explanations.every((e: { byAi: boolean }) => !e.byAi)).toBe(true);
    expect(res.explanations.length).toBe(res.findings.length);
  });

  it("uses AI wording when it only repeats computed figures", async () => {
    fakeAi([{ id, text: "The producer and crew see no money until takings pass £625,000." }]);
    const res = await (await post(POST, { deal, range }, "e2")).json();
    expect(explanationFor(res).byAi).toBe(true);
  });

  it("throws away AI wording with a made up number", async () => {
    fakeAi([{ id, text: "The producer and crew see no money until takings pass £600,000." }]);
    const res = await (await post(POST, { deal, range }, "e3")).json();
    expect(explanationFor(res)).toMatchObject({
      byAi: false,
      text: "Nothing is paid to Producer and Crew pool until the film earns more than £625,000.",
    });
  });

  it("refuses a deal that does not add up", async () => {
    const res = await post(POST, { deal: { ...deal, split: [{ to: "A", bps: 5000 }] }, range }, "e4");
    expect(res.status).toBe(422);
  });
});
