import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { samples } from "@/lib/samples";
import { toRead } from "@/lib/suggest";
import { fakeAi, post } from "@/test/fakeAi";

const { deal, range } = samples[0];
const findingId = "until-Producer+Crew pool";
const ask = (visitor: string, r = range) => post(POST, { deal, range: r, findingId }, visitor);

// A suggestion that lowers the investors' payback from £500,000 to £400,000.
const lowerPayback = () => ({ ...toRead(deal), recoup: [{ to: "Investors", pounds: 400000, percent_back: 100 }] });

describe("POST /api/suggest", () => {
  it("explains that it needs a key when there is none", async () => {
    expect((await ask("s1")).status).toBe(503);
  });

  it("returns a checked change with its effect worked out by code", async () => {
    fakeAi({ reason: "Lower the payback so the crew are paid sooner.", deal: lowerPayback() });
    const res = await (await ask("s2")).json();
    expect(res.changes).toEqual(["Paybacks: Investors £500,000 at 100% → Investors £400,000 at 100%"]);
    expect(res.impact[0]).toBe("Producer: money starts after £500,000 (was £625,000)");
    expect(res.reason).toBe("Lower the payback so the crew are paid sooner.");
  });

  it("rejects a suggested deal that does not add up", async () => {
    fakeAi({ reason: "x", deal: { ...toRead(deal), split: [{ to: "Producer", percent: 50 }, { to: "Crew pool", percent: 30 }] } });
    expect((await ask("s3")).status).toBe(422);
  });

  it("tells the AI why its first suggestion failed, and uses a good second one", async () => {
    process.env.ANTHROPIC_API_KEY = "test";
    const bad = { reason: "x", deal: { ...toRead(deal), split: [{ to: "Producer", percent: 90 }] } };
    const good = { reason: "Lower the payback so the crew are paid sooner.", deal: lowerPayback() };
    const replies = [bad, good].map((r) => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(r) }] })));
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const res = await ask("s6");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondAsk = JSON.parse((fetchMock.mock.calls[1] as unknown as [string, { body: string }])[1].body).messages[0].content;
    expect(secondAsk).toContain("Your last suggestion was rejected: The split adds up to 90%, not 100%.");
  });

  it("gives up after two failed suggestions and says why", async () => {
    fakeAi({ reason: "x", deal: toRead(deal) });
    const res = await ask("s7");
    expect(res.status).toBe(422);
    expect((await res.json()).errors).toEqual(["It made no change to the deal."]);
  });

  it("drops an AI reason that uses a made up figure", async () => {
    fakeAi({ reason: "Crew would now earn £90,000 more.", deal: lowerPayback() });
    expect((await (await ask("s4")).json()).reason).toBe("The AI suggested the changes below.");
  });

  it("refuses a range that goes backwards", async () => {
    expect((await ask("s5", { low: 200, high: 100 })).status).toBe(400);
  });
});
