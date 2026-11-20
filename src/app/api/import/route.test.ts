import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { fakeAi, post } from "@/test/fakeAi";

describe("POST /api/import", () => {
  it("explains that import needs a key when there is none", async () => {
    expect((await post(POST, { text: "The distributor takes 20%." }, "i1")).status).toBe(503);
  });

  it("returns the reading and anything the AI was unsure about", async () => {
    fakeAi({
      title: "Imported",
      fee: { to: "Distributor", percent: 20 },
      recoup: [{ to: "Investors", pounds: 500000 }],
      split: [{ to: "Producer", percent: 60 }, { to: "Crew", percent: 40 }],
      unclear: ["'Net receipts' is not defined."],
    });
    const res = await (await post(POST, { text: "Some deal terms" }, "i2")).json();
    expect(res.deal.recoup[0].amount).toBe(50_000_000);
    expect(res.unclear).toEqual(["'Net receipts' is not defined."]);
    expect(res.errors).toEqual([]);
  });

  it("refuses empty text", async () => {
    expect((await post(POST, { text: "" }, "i3")).status).toBe(400);
  });
});
