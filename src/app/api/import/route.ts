import { NextResponse } from "next/server";
import { validate } from "@/lib/deal";
import { aiAvailable, askAi, readJson } from "@/lib/ai";
import { IMPORT_PROMPT, ReadDeal, toDeal } from "@/lib/import";
import { fail, tooMany } from "@/lib/limit";

// AI reads pasted deal text into a structured deal for a person to check. The text is never stored or logged.
export async function POST(req: Request) {
  const limited = tooMany(req);
  if (limited) return limited;
  const { text = "" } = ((await req.json().catch(() => null)) ?? {}) as { text?: string };
  if (!text.trim() || text.length > 6000) return fail("Paste deal terms of up to 6,000 characters.", 400);
  if (!aiAvailable()) return fail("Importing deal text needs an API key on the server. Try a sample deal instead.", 503);

  const reply = await askAi(IMPORT_PROMPT, text);
  const read = reply ? (readJson(reply) as ReadDeal | null) : null;
  if (!read || typeof read !== "object") return fail("The AI could not read those terms. Try rewording them.", 502);
  const { deal, unclear } = toDeal(read);
  return NextResponse.json({ deal, unclear, errors: validate(deal) });
}
