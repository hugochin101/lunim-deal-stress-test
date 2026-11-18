import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { samples } from "@/lib/samples";
import { toRead } from "@/lib/suggest";

const { deal, range } = samples[0];
const findingId = "until-Producer+Crew pool";
const call = (ip: string) =>
  POST(new Request("http://x/api/suggest", { method: "POST", body: JSON.stringify({ deal, range, findingId }), headers: { "x-forwarded-for": ip } }));

const fakeAi = (reply: unknown) => {
  process.env.ANTHROPIC_API_KEY = "test";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(reply) }] }))));
};

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.unstubAllGlobals();
});

describe("POST /api/suggest", () => {
  it("explains that it needs a key when there is none", async () => {
    expect((await call("s1")).status).toBe(503);
  });

  it("returns a checked change with its effect worked out by code", async () => {
    const read = toRead(deal);
    read.recoup = [{ to: "Investors", pounds: 400000, percent_back: 100 }];
    fakeAi({ reason: "Lower the payback so the crew are paid sooner.", deal: read });
    const res = await (await call("s2")).json();
    expect(res.changes).toEqual(["Paybacks: Investors £500,000 at 100% → Investors £400,000 at 100%"]);
    expect(res.impact[0]).toBe("Producer: money starts after £500,000 (was £625,000)");
    expect(res.reason).toBe("Lower the payback so the crew are paid sooner.");
  });

  it("rejects a suggested deal that does not add up", async () => {
    const read = toRead(deal);
    read.split = [{ to: "Producer", percent: 50 }, { to: "Crew pool", percent: 30 }];
    fakeAi({ reason: "x", deal: read });
    const res = await call("s3");
    expect(res.status).toBe(422);
  });

  it("drops an AI reason that uses a made up figure", async () => {
    const read = toRead(deal);
    read.recoup = [{ to: "Investors", pounds: 400000, percent_back: 100 }];
    fakeAi({ reason: "Crew would now earn £90,000 more.", deal: read });
    expect((await (await call("s4")).json()).reason).toBe("The AI suggested the changes below.");
  });
});
