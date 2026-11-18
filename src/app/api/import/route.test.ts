import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const call = (text: string, ip: string) =>
  POST(new Request("http://x/api/import", { method: "POST", body: JSON.stringify({ text }), headers: { "x-forwarded-for": ip } }));

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.unstubAllGlobals();
});

describe("POST /api/import", () => {
  it("explains that import needs a key when there is none", async () => {
    expect((await call("The distributor takes 20%.", "i1")).status).toBe(503);
  });

  it("returns the reading and anything the AI was unsure about", async () => {
    process.env.ANTHROPIC_API_KEY = "test";
    const reading = {
      title: "Imported",
      fee: { to: "Distributor", percent: 20 },
      recoup: [{ to: "Investors", pounds: 500000 }],
      split: [{ to: "Producer", percent: 60 }, { to: "Crew", percent: 40 }],
      unclear: ["'Net receipts' is not defined."],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(reading) }] }))));
    const res = await (await call("Some deal terms", "i2")).json();
    expect(res.deal.recoup[0].amount).toBe(50_000_000);
    expect(res.unclear).toEqual(["'Net receipts' is not defined."]);
    expect(res.errors).toEqual([]);
  });

  it("refuses empty text", async () => {
    expect((await call("", "i3")).status).toBe(400);
  });
});
