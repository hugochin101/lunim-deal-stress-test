// Checks an AI explanation before anyone sees it: it may only use figures the engine computed,
// and it must never sound like a promise.
const FIGURE = /£[\d,]+(?:\.\d{2})?|\d+(?:\.\d+)?%|\b\d+p\b/g;
const PROMISE = /\b(guarantee\w*|will (earn|receive|get|make))\b/i;

export function explanationIsSafe(text: string, figures: string[]): boolean {
  if (!text || text.length > 400 || PROMISE.test(text)) return false;
  return (text.match(FIGURE) ?? []).every((f) => figures.includes(f));
}
