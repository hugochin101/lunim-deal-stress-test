// In-memory limit: 10 requests a minute per visitor. Resets when the server restarts.
const hits = new Map<string, number[]>();

export function allow(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 10) return false;
  hits.set(key, [...recent, now]);
  return true;
}

export const visitor = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
