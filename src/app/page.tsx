"use client";
import { useState } from "react";
import DealEditor from "@/components/DealEditor";
import Chart from "@/components/Chart";
import { Deal, validate } from "@/lib/deal";
import { Finding, Range } from "@/lib/stress";
import { samples } from "@/lib/samples";

type Explained = Finding & { plain: string; byAi: boolean };
type Choice = "intended" | "change";

// A fee of 0% is the same as no fee.
const tidy = (d: Deal): Deal => (d.fee && d.fee.bps > 0 ? d : { ...d, fee: undefined });

export default function Home() {
  const [deal, setDeal] = useState<Deal>(samples[0].deal);
  const [range, setRange] = useState<Range>(samples[0].range);
  const [findings, setFindings] = useState<Explained[] | null>(null);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [importText, setImportText] = useState("");
  const [unclear, setUnclear] = useState<string[]>([]);

  const errors = validate(tidy(deal));
  const reset = () => { setFindings(null); setChoices({}); setMessage(""); };
  const edit = (d: Deal) => { setDeal(d); reset(); };

  async function importDeal() {
    setBusy(true); reset(); setUnclear([]);
    const res = await fetch("/api/import", { method: "POST", body: JSON.stringify({ text: importText }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMessage(data.error);
    setDeal(data.deal);
    setUnclear(data.unclear);
    setMessage("Check the AI's reading below and correct anything wrong before running the test.");
  }

  async function run() {
    setBusy(true); reset();
    const res = await fetch("/api/explain", { method: "POST", body: JSON.stringify({ deal: tidy(deal), range }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMessage(data.error ?? data.errors?.join(" "));
    setFindings(data.findings.map((f: Finding, i: number) => ({ ...f, plain: data.explanations[i].text, byAi: data.explanations[i].byAi })));
    if (!data.aiUsed) setMessage("No AI key is set, so findings use the engine's own wording.");
  }

  const allChecked = findings !== null && findings.every((f) => choices[f.id] === "intended");
  const toChange = findings?.filter((f) => choices[f.id] === "change").length ?? 0;
  const spec = allChecked && findings
    ? JSON.stringify({ format: "lunim.stress.v1", deal: tidy(deal), expectedRange: range, acknowledged: findings.map((f) => f.id), checkedAt: new Date().toISOString() }, null, 2)
    : "";

  return (
    <main>
      <h1>Deal Stress Test</h1>
      <p className="lead">Find the surprises in a film deal before it is locked into a smart contract and can no longer change.</p>

      <section className="card">
        <h2>Choose a deal</h2>
        <div className="row">
          {samples.map((s) => (
            <button key={s.deal.title} onClick={() => { edit(s.deal); setRange(s.range); setUnclear([]); }}>{s.deal.title}</button>
          ))}
        </div>
        <p className="muted">Sample deals are invented. Or paste real deal terms and let AI read them in:</p>
        <textarea aria-label="Deal terms" placeholder="e.g. The distributor takes 20% of gross receipts. Investors recoup £500,000 first..." value={importText} onChange={(e) => setImportText(e.target.value)} />
        <div className="row"><button onClick={importDeal} disabled={busy || !importText.trim()}>Read deal with AI</button></div>
        {unclear.map((u) => <p key={u} className="warn">AI was unsure: {u}</p>)}
      </section>

      <section className="card">
        <h2>The deal</h2>
        <DealEditor deal={deal} onChange={edit} />
        <h3 className="muted">4. What do you expect the film to earn?</h3>
        <div className="row">
          From £<input type="number" aria-label="Lowest expected" min={0} step={10000} value={range.low / 100} onChange={(e) => { setRange({ ...range, low: Math.round(Number(e.target.value) * 100) }); reset(); }} />
          to £<input type="number" aria-label="Highest expected" min={0} step={10000} value={range.high / 100} onChange={(e) => { setRange({ ...range, high: Math.round(Number(e.target.value) * 100) }); reset(); }} />
        </div>
        {errors.map((e) => <p key={e} className="error">{e}</p>)}
        <div className="row"><button className="primary" onClick={run} disabled={busy || errors.length > 0}>{busy ? "Working..." : "Run stress test"}</button></div>
        {message && <p className="muted">{message}</p>}
      </section>

      {findings && (
        <>
          <section className="card">
            <h2>Surprises found ({findings.length})</h2>
            <p className="muted">Every number comes from exact calculations, never from the AI. Mark each one before locking.</p>
            {findings.map((f) => (
              <div key={f.id} className={`finding ${f.severity}`}>
                <div><span className="badge">{f.severity === "info" ? "note" : f.severity}</span>{f.plain}</div>
                <p className="muted">{f.byAi ? "Reworded by AI; numbers checked against the calculation." : "Engine wording."}</p>
                <div className="row">
                  <button className={choices[f.id] === "intended" ? "on" : ""} onClick={() => setChoices({ ...choices, [f.id]: "intended" })}>Yes, we meant this</button>
                  <button className={choices[f.id] === "change" ? "on" : ""} onClick={() => setChoices({ ...choices, [f.id]: "change" })}>No, change the deal</button>
                </div>
              </div>
            ))}
          </section>

          <section className="card">
            <h2>What each person receives as the film earns more</h2>
            <Chart deal={tidy(deal)} high={range.high} />
          </section>

          <section className="card">
            <h2>Ready to lock?</h2>
            {toChange > 0 && <p className="warn">{toChange} surprise(s) marked for change. Edit the deal above and run the test again.</p>}
            {!allChecked && toChange === 0 && <p className="muted">Mark every surprise as intended to unlock the checked deal.</p>}
            {allChecked && (
              <>
                <p>Everyone has seen every surprise. This checked deal could be handed to a settlement smart contract:</p>
                <pre>{spec}</pre>
                <button onClick={() => navigator.clipboard.writeText(spec)}>Copy checked deal</button>
              </>
            )}
          </section>
        </>
      )}
      <p className="muted">A prototype for discussion. Not legal or financial advice.</p>
    </main>
  );
}
