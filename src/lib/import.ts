import { Deal } from "./deal";

// What the AI is asked to return when it reads deal text. Pounds and percentages, as written.
export interface ReadDeal {
  title?: string;
  fee?: { to: string; percent: number } | null;
  recoup?: { to: string; pounds: number; percent_back?: number }[];
  split?: { to: string; percent: number }[];
  unclear?: string[];
}

export const IMPORT_PROMPT = `You read film deal revenue terms. Return only JSON in this shape:
{"title": string, "fee": {"to": string, "percent": number} | null, "recoup": [{"to": string, "pounds": number, "percent_back": number}], "split": [{"to": string, "percent": number}], "unclear": [string]}
Rules: copy names and numbers exactly as written; never calculate or invent anything; list paybacks in the order they are paid; "percent_back" is 100 unless the terms say more is paid back (e.g. 120);
put any clause you are unsure about, or any term that is not defined, into "unclear" as a short plain sentence.`;

// Turns the AI reading into the app's exact format (pence and basis points). No maths beyond unit conversion.
export function toDeal(read: ReadDeal): { deal: Deal; unclear: string[] } {
  const deal: Deal = {
    title: String(read.title ?? "Imported deal"),
    recoup: (read.recoup ?? []).map((r) => ({
      to: String(r.to),
      amount: Math.round(Number(r.pounds) * 100),
      percentBack: Math.round(Number(r.percent_back ?? 100) * 100),
    })),
    split: (read.split ?? []).map((s) => ({ to: String(s.to), bps: Math.round(Number(s.percent) * 100) })),
  };
  if (read.fee) deal.fee = { to: String(read.fee.to), bps: Math.round(Number(read.fee.percent) * 100) };
  return { deal, unclear: (read.unclear ?? []).map(String) };
}
