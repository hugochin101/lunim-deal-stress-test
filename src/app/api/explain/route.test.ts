import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { samples } from "@/lib/samples";

const { deal, range } = samples[0];
const call = (body: unknown, ip: string) =>
  POST(new Request("http://x/api/explain", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": ip } }));

// Fakes the Anthropic API, replying with the given explanations.
const fakeAi = (items: { id: string; text: string }[]) => {
  process.env.ANTHROPIC_API_KEY = "test";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(items) }] }))));
};

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.unstubAllGlobals();
});

describe("POST /api/explain", () => {
  it("works without a key, using the engine's own wording", async () => {
    const res = await (await call({ deal, range }, "1")).json();
    expect(res.aiUsed).toBe(false);
    expect(res.explanations.every((e: { byAi: boolean }) => !e.byAi)).toBe(true);
    expect(res.explanations.length).toBe(res.findings.length);
  });

  it("uses AI wording when it only repeats computed figures", async () => {
    fakeAi([{ id: "until-Producer+Crew pool", text: "The crew pool sees no money until takings pass £625,000." }]);
    const res = await (await call({ deal, range }, "2")).json();
    expect(res.explanations.find((e: { id: string }) => e.id === "until-Producer+Crew pool")).toMatchObject({ byAi: true });
  });

  it("throws away AI wording with a made up number", async () => {
    fakeAi([{ id: "until-Producer+Crew pool", text: "The crew pool sees no money until takings pass £600,000." }]);
    const res = await (await call({ deal, range }, "3")).json();
    const e = res.explanations.find((x: { id: string }) => x.id === "until-Producer+Crew pool");
    expect(e.byAi).toBe(false);
    expect(e.text).toBe("Nothing is paid to Producer and Crew pool until the film earns more than £625,000.");
  });

  it("refuses a deal that does not add up", async () => {
    const res = await call({ deal: { ...deal, split: [{ to: "A", bps: 5000 }] }, range }, "4");
    expect(res.status).toBe(422);
  });
});
