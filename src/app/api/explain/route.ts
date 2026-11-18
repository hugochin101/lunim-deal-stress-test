import { NextResponse } from "next/server";
import { Deal, MAX_REVENUE, validate } from "@/lib/deal";
import { Range, stressTest } from "@/lib/stress";
import { askClaude, readJson } from "@/lib/ai";
import { explanationIsSafe } from "@/lib/check";
import { allow, visitor } from "@/lib/limit";

const PROMPT = `You explain film deal findings to cast and crew with no finance background.
For each finding, write one or two short, plain sentences: what happens and who it affects.
Use only the £ and % figures already in the finding, written exactly the same way. Do not add any other numbers.
Never promise or predict earnings; describe what the deal says.
Return only JSON: [{"id": string, "text": string}]`;

export async function POST(req: Request) {
  if (!allow(visitor(req))) return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { deal?: Deal; range?: Range } | null;
  const { deal, range } = body ?? {};
  if (!deal || !range) return NextResponse.json({ error: "Send a deal and a range." }, { status: 400 });
  const errors = validate(deal);
  const rangeOk = Number.isInteger(range.low) && Number.isInteger(range.high) && 0 <= range.low && range.low < range.high && range.high <= MAX_REVENUE;
  if (!rangeOk) errors.push("The expected range must go from a lower to a higher amount, up to £1bn.");
  if (errors.length) return NextResponse.json({ errors }, { status: 422 });

  // The engine finds everything; the AI only rewords it, and its wording is checked before use.
  const findings = stressTest(deal, range);
  const reply = await askClaude(PROMPT, JSON.stringify(findings.map(({ id, who, text }) => ({ id, who, text }))));
  const ai = reply ? readJson(reply) : null;
  const explanations = findings.map((f) => {
    const a = Array.isArray(ai) ? ai.find((x) => x?.id === f.id) : null;
    const ok = typeof a?.text === "string" && explanationIsSafe(a.text, f.figures);
    return { id: f.id, text: ok ? a.text : f.text, byAi: ok };
  });
  return NextResponse.json({ findings, explanations, aiUsed: reply !== null });
}
