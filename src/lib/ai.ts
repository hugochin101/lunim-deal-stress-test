// The only place the app talks to the AI model (Anthropic Messages API).
// Every function fails safely: with no key or any error, callers fall back to the app's own wording.

export const aiAvailable = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function askAi(system: string, user: string): Promise<string | null> {
  if (!aiAvailable()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      // Logs only the status and the API's reason (e.g. invalid key, no credit), never the deal text.
      const reason = await res.json().then((e) => e?.error?.message).catch(() => "");
      console.error(`AI request failed (${res.status}): ${reason}`);
      return null;
    }
    const data = await res.json();
    return data.content?.find((c: { type: string }) => c.type === "text")?.text ?? null;
  } catch (e) {
    console.error(`AI request could not be sent: ${(e as Error).message}`);
    return null;
  }
}

// Pulls the JSON out of a model reply, even if it is wrapped in a code block.
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
