"use client";
import { useState } from "react";
import { Deal } from "@/lib/deal";
import { Range } from "@/lib/stress";

type Fix = { reason: string; deal: Deal; changes: string[]; impact: string[] };

// Asks AI for the smallest change that fixes one surprise. A person must choose to use it.
export default function FixSuggestion({ deal, range, findingId, onUse }: { deal: Deal; range: Range; findingId: string; onUse: (d: Deal) => void }) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true); setError("");
    const res = await fetch("/api/suggest", { method: "POST", body: JSON.stringify({ deal, range, findingId }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    setFix(data);
  }

  if (!fix)
    return (
      <div>
        <button onClick={ask} disabled={busy}>{busy ? "Asking AI..." : "Ask AI for a fix"}</button>
        {error && <p className="error">{error}</p>}
      </div>
    );

  return (
    <div className="suggestion">
      <p><b>AI suggests:</b> {fix.reason}</p>
      <p className="muted">What would change (checked by code):</p>
      <ul>{fix.changes.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="muted">Effect on the people affected (calculated, not AI):</p>
      <ul>{fix.impact.map((c) => <li key={c}>{c}</li>)}</ul>
      <div className="row">
        <button className="primary" onClick={() => onUse(fix.deal)}>Use this change</button>
        <button onClick={() => setFix(null)}>Ignore</button>
      </div>
    </div>
  );
}
