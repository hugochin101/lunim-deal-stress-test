// Minimal call to the Anthropic Messages API. Returns null if there is no key or anything fails,
// so the app always falls back to its own wording.
export async function askClaude(system: string, user: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.find((c: { type: string }) => c.type === "text")?.text ?? null;
  } catch {
    return null;
  }
}

// Pulls the first JSON value out of a model reply, even if it is wrapped in a code block.
export function readJson(text: string): unknown {
  const start = text.search(/[[{]/);
  if (start < 0) return null;
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
