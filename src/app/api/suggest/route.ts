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

  const question = JSON.stringify({ deal: toRead(deal), expectedRangePounds: [range.low / 100, range.high / 100], finding: finding.text });

  // Ask once; if the suggestion fails the checks, tell the AI exactly why and ask one more time.
  let problems: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const retry = problems.length ? `\nYour last suggestion was rejected: ${problems.join(" ")} Please fix this.` : "";
    const reply = await askAi(SUGGEST_PROMPT, question + retry);
    const read = reply ? (readJson(reply) as { reason?: string; deal?: ReadDeal } | null) : null;
    if (!read?.deal) return fail("The AI did not suggest a usable change. Try editing by hand.", 502);

    const proposal = toDeal(read.deal).deal;
    problems = validate(proposal);
    const changes = describeChanges(deal, proposal);
    if (!problems.length && !changes.length) problems = ["It made no change to the deal."];
    if (problems.length) continue;

    // The AI's reason may only mention figures that code has already worked out.
    const impact = describeImpact(deal, proposal, range, finding.who);
    const allowed = figuresIn([...changes, ...impact].join(" "));
    const reason = typeof read.reason === "string" && explanationIsSafe(read.reason, allowed) ? read.reason : "The AI suggested the changes below.";
    return NextResponse.json({ reason, deal: proposal, changes, impact });
  }
  return fail("The AI could not suggest a change that passes the checks. Try editing by hand.", 422, { errors: problems });
}
