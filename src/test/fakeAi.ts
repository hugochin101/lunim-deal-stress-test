import { afterEach, vi } from "vitest";

// Makes the AI "reply" with the given value, without calling the real API.
export function fakeAi(reply: unknown) {
  process.env.ANTHROPIC_API_KEY = "test";
  const body = { content: [{ type: "text", text: JSON.stringify(reply) }] };
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));
}

// Each test starts with no AI key and the real fetch.
afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.unstubAllGlobals();
});

// Calls an API route the way the browser would, from a given visitor.
export const post = (route: (req: Request) => Promise<Response>, body: unknown, visitor: string) =>
  route(new Request("http://test", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": visitor } }));
