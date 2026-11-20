import { NextResponse } from "next/server";
import { Deal, validate } from "@/lib/deal";
import { Range, rangeError, stressTest } from "@/lib/stress";
import { aiAvailable, askAi, readJson } from "@/lib/ai";
import { explanationIsSafe } from "@/lib/check";
import { fail, tooMany } from "@/lib/limit";

const PROMPT = `You explain film deal findings to cast and crew with no finance background.
For each finding, write one or two short, plain sentences: what happens and who it affects.
Use only the £ and % figures already in the finding, written exactly the same way. Do not add any other numbers.
Never promise or predict earnings; describe what the deal says.
Return only JSON: [{"id": string, "text": string}]`;

// Runs the stress test. Code finds every surprise; AI only rewords them, and each sentence is checked before use.
export async function POST(req: Request) {
  const limited = tooMany(req);
  if (limited) return limited;
  const { deal, range } = ((await req.json().catch(() => null)) ?? {}) as { deal?: Deal; range?: Range };
  if (!deal || !range) return fail("Send a deal and a range.", 400);
  const errors = [...validate(deal), rangeError(range)].filter(Boolean);
  if (errors.length) return fail("This deal cannot be tested yet.", 422, { errors });

  const findings = stressTest(deal, range);
  const reply = await askAi(PROMPT, JSON.stringify(findings.map(({ id, who, text }) => ({ id, who, text }))));
  const reworded = reply ? readJson(reply) : null;
  const explanations = findings.map((f) => {
    const ai = Array.isArray(reworded) ? reworded.find((x) => x?.id === f.id) : null;
    const byAi = typeof ai?.text === "string" && explanationIsSafe(ai.text, f.figures);
    return { id: f.id, text: byAi ? ai.text : f.text, byAi };
  });
  return NextResponse.json({ findings, explanations, aiUsed: reply !== null, aiConfigured: aiAvailable() });
}
