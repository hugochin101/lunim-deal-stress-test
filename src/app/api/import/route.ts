import { NextResponse } from "next/server";
import { validate } from "@/lib/deal";
import { askClaude, readJson } from "@/lib/ai";
import { IMPORT_PROMPT, ReadDeal, toDeal } from "@/lib/import";
import { allow, visitor } from "@/lib/limit";

// Deal text is sent to the AI and returned; it is never stored or logged.
export async function POST(req: Request) {
  if (!allow(visitor(req))) return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim() ?? "";
  if (!text || text.length > 6000) return NextResponse.json({ error: "Paste deal terms of up to 6,000 characters." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "Importing deal text needs an API key on the server. Try a sample deal instead." }, { status: 503 });

  const reply = await askClaude(IMPORT_PROMPT, text);
  const read = reply ? (readJson(reply) as ReadDeal | null) : null;
  if (!read || typeof read !== "object") return NextResponse.json({ error: "The AI could not read those terms. Try rewording them." }, { status: 502 });
  const { deal, unclear } = toDeal(read);
  return NextResponse.json({ deal, unclear, errors: validate(deal) });
}
