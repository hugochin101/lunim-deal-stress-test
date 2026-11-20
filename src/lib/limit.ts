import { NextResponse } from "next/server";

// In-memory limit: 10 requests a minute per visitor. Resets when the server restarts.
const hits = new Map<string, number[]>();

export function allow(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 10) return false;
  hits.set(key, [...recent, now]);
  return true;
}

const visitor = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

// A JSON error reply, used by every API route.
export const fail = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

// Returns an error reply if this visitor has made too many requests, otherwise null.
export const tooMany = (req: Request) => (allow(visitor(req)) ? null : fail("Too many requests, try again in a minute.", 429));
