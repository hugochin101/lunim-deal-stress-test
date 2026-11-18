import { NextResponse } from "next/server";
import { Deal, validate } from "@/lib/deal";
import { Range, stressTest } from "@/lib/stress";
import { askClaude, readJson } from "@/lib/ai";
import { explanationIsSafe } from "@/lib/check";
import { ReadDeal, toDeal } from "@/lib/import";
import { SUGGEST_PROMPT, describeChanges, describeImpact, toRead } from "@/lib/suggest";
import { allow, visitor } from "@/lib/limit";

// AI proposes a change; code checks it adds up, lists what changed and shows the effect. A person decides.
export async function POST(req: Request) {
  if (!allow(visitor(req))) return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { deal?: Deal; range?: Range; findingId?: string } | null;
  const { deal, range, findingId } = body ?? {};
  if (!deal || !range || validate(deal).length) return NextResponse.json({ error: "Send a valid deal and range." }, { status: 400 });
  const finding = stressTest(deal, range).find((f) => f.id === findingId);
  if (!finding) return NextResponse.json({ error: "That surprise was not found. Run the test again." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "Suggesting a fix needs an API key on the server. You can still edit the deal by hand." }, { status: 503 });

  const ask = JSON.stringify({ deal: toRead(deal), expectedRangePounds: [range.low / 100, range.high / 100], finding: finding.text });
  const reply = await askClaude(SUGGEST_PROMPT, ask);
  const read = reply ? (readJson(reply) as { reason?: string; deal?: ReadDeal } | null) : null;
  if (!read?.deal) return NextResponse.json({ error: "The AI did not suggest a usable change. Try editing by hand." }, { status: 502 });

  const proposal = toDeal(read.deal).deal;
  const errors = validate(proposal);
  if (errors.length) return NextResponse.json({ error: "The AI suggested a deal that does not add up, so it was rejected.", errors }, { status: 422 });
  const changes = describeChanges(deal, proposal);
  if (!changes.length) return NextResponse.json({ error: "The AI suggested no real change. Try editing by hand." }, { status: 422 });

  const impact = describeImpact(deal, proposal, range, finding.who);
  // The AI's reason may only mention figures that code has already worked out.
  const figures = [...changes, ...impact].join(" ").match(/£[\d,]+(?:\.\d{2})?|\d+(?:\.\d+)?%|\b\d+p\b/g) ?? [];
  const reason = typeof read.reason === "string" && explanationIsSafe(read.reason, figures) ? read.reason : "The AI suggested the changes below.";
  return NextResponse.json({ reason, deal: proposal, changes, impact });
}
