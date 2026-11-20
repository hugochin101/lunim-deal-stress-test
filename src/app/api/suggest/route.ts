import { NextResponse } from "next/server";
import { Deal, validate } from "@/lib/deal";
import { Range, rangeError, stressTest } from "@/lib/stress";
import { aiAvailable, askAi, readJson } from "@/lib/ai";
import { explanationIsSafe, figuresIn } from "@/lib/check";
import { ReadDeal, toDeal } from "@/lib/import";
import { SUGGEST_PROMPT, describeChanges, describeImpact, toRead } from "@/lib/suggest";
import { fail, tooMany } from "@/lib/limit";

// AI proposes a fix for one surprise. Code checks it adds up, lists what changed and works out the effect.
// Nothing is applied: a person decides.
export async function POST(req: Request) {
  const limited = tooMany(req);
  if (limited) return limited;
  const { deal, range, findingId } = ((await req.json().catch(() => null)) ?? {}) as { deal?: Deal; range?: Range; findingId?: string };
  if (!deal || !range || validate(deal).length || rangeError(range)) return fail("Send a valid deal and range.", 400);
  const finding = stressTest(deal, range).find((f) => f.id === findingId);
  if (!finding) return fail("That surprise was not found. Run the test again.", 400);
  if (!aiAvailable()) return fail("Suggesting a fix needs an API key on the server. You can still edit the deal by hand.", 503);

  const question = { deal: toRead(deal), expectedRangePounds: [range.low / 100, range.high / 100], finding: finding.text };
  const reply = await askAi(SUGGEST_PROMPT, JSON.stringify(question));
  const read = reply ? (readJson(reply) as { reason?: string; deal?: ReadDeal } | null) : null;
  if (!read?.deal) return fail("The AI did not suggest a usable change. Try editing by hand.", 502);

  const proposal = toDeal(read.deal).deal;
  const errors = validate(proposal);
  if (errors.length) return fail("The AI suggested a deal that does not add up, so it was rejected.", 422, { errors });
  const changes = describeChanges(deal, proposal);
  if (!changes.length) return fail("The AI suggested no real change. Try editing by hand.", 422);

  // The AI's reason may only mention figures that code has already worked out.
  const impact = describeImpact(deal, proposal, range, finding.who);
  const allowed = figuresIn([...changes, ...impact].join(" "));
  const reason = typeof read.reason === "string" && explanationIsSafe(read.reason, allowed) ? read.reason : "The AI suggested the changes below.";
  return NextResponse.json({ reason, deal: proposal, changes, impact });
}
