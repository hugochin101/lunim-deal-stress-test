"use client";
import { useState } from "react";
import DealEditor from "@/components/DealEditor";
import Chart from "@/components/Chart";
import MyPart from "@/components/MyPart";
import FixSuggestion from "@/components/FixSuggestion";
import { Deal, validate } from "@/lib/deal";
import { Finding, Range, rangeError } from "@/lib/stress";
import { samples } from "@/lib/samples";

// The whole app on one page: choose a deal, run the stress test, review each surprise, then lock.

type Explained = Finding & { plain: string; byAi: boolean };
type Choice = "intended" | "change";
const LABEL = { high: "Serious", medium: "Worth checking", info: "Note" };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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

  const clean = tidy(deal);
  const errors = [...validate(clean), rangeError(range)].filter((e): e is string => Boolean(e));
  // Any change to the deal or range makes earlier results out of date.
  const reset = () => { setFindings(null); setChoices({}); setMessage(""); };
  const edit = (d: Deal) => { setDeal(d); reset(); };
  const setPounds = (end: keyof Range, value: string) => { setRange({ ...range, [end]: Math.round(Number(value) * 100) }); reset(); };

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
    const res = await fetch("/api/explain", { method: "POST", body: JSON.stringify({ deal: clean, range }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMessage(data.errors?.join(" ") ?? data.error);
    setFindings(data.findings.map((f: Finding, i: number) => ({ ...f, plain: data.explanations[i].text, byAi: data.explanations[i].byAi })));
    if (!data.aiConfigured) setMessage("No AI key is set, so findings use the engine's own wording.");
    else if (!data.aiUsed) setMessage("The AI service did not answer, so findings use the engine's own wording. Check the server logs for the reason.");
  }

  const allChecked = findings !== null && findings.every((f) => choices[f.id] === "intended");
  const toChange = findings?.filter((f) => choices[f.id] === "change").length ?? 0;
  const reviewed = findings?.filter((f) => choices[f.id]).length ?? 0;
  const count = (sev: Finding["severity"]) => findings?.filter((f) => f.severity === sev).length ?? 0;
  const spec = allChecked && findings
    ? JSON.stringify({ format: "lunim.stress.v1", deal: clean, expectedRange: range, acknowledged: findings.map((f) => f.id), checkedAt: new Date().toISOString() }, null, 2)
    : "";

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <h1>Deal Stress Test</h1>
          <p>Find the surprises in a film deal before it is locked into a smart contract and can no longer change.</p>
          <ol>
            <li>Choose a deal</li>
            <li>Check the terms</li>
            <li>Review each surprise</li>
            <li>Lock the checked deal</li>
          </ol>
        </div>
      </header>

      <main className="wrap">
        <section>
          <h2><span className="step">1</span>Choose a deal</h2>
          <div className="row samples">
            {samples.map((s) => (
              <button key={s.deal.title} onClick={() => { edit(s.deal); setRange(s.range); setUnclear([]); }}>{s.deal.title}</button>
            ))}
          </div>
          <p className="muted">Sample deals are invented. Or paste real deal terms and let AI fill in the form:</p>
          <textarea aria-label="Deal terms" placeholder="e.g. The distributor takes 20% of gross receipts. Investors recoup £500,000 first..." value={importText} onChange={(e) => setImportText(e.target.value)} />
          <div className="row"><button onClick={importDeal} disabled={busy || !importText.trim()}>Read deal with AI</button></div>
          {unclear.map((u) => <p key={u} className="warn">AI was unsure: {u}</p>)}
        </section>

        <section>
          <h2><span className="step">2</span>Check the terms</h2>
          <DealEditor deal={deal} onChange={edit} />
          <h3>What do you expect the film to earn?</h3>
          <div className="row">
            From £<input type="number" aria-label="Lowest expected" min={0} step={10000} value={range.low / 100} onChange={(e) => setPounds("low", e.target.value)} />
            to £<input type="number" aria-label="Highest expected" min={0} step={10000} value={range.high / 100} onChange={(e) => setPounds("high", e.target.value)} />
          </div>
          {errors.map((e) => <p key={e} className="error">{e}</p>)}
          <div className="row"><button className="primary" onClick={run} disabled={busy || errors.length > 0}>{busy ? "Testing every amount..." : "Run stress test"}</button></div>
          {message && <p className="muted">{message}</p>}
        </section>

        {findings && (
          <>
            <section>
              <h2><span className="step">3</span>Review each surprise</h2>
              <p className={`headline${count("high") ? "" : " calm"}`}>
                {count("high") ? plural(count("high"), "serious surprise") : "No serious surprises"}, {count("medium")} worth checking
              </p>
              <div className="tally"><span>Reviewed {reviewed} of {findings.length}</span></div>
              <div className="progress" aria-hidden><span style={{ width: `${(reviewed / findings.length) * 100}%` }} /></div>
              <p className="muted">Every number comes from exact calculations, never from the AI.</p>
              {findings.map((f) => (
                <div key={f.id} className={`finding ${f.severity}${choices[f.id] === "intended" ? " done" : ""}`}>
                  <p><span className="tag">{LABEL[f.severity]}</span>{f.plain}</p>
                  {f.byAi && <p className="muted">Reworded by AI; numbers checked against the calculation.</p>}
                  <div className="choice" role="group" aria-label="Your answer">
                    <button className={choices[f.id] === "intended" ? "on" : ""} onClick={() => setChoices((c) => ({ ...c, [f.id]: "intended" }))}>Yes, we meant this</button>
                    <button className={choices[f.id] === "change" ? "on" : ""} onClick={() => setChoices((c) => ({ ...c, [f.id]: "change" }))}>No, change the deal</button>
                  </div>
                  {choices[f.id] === "change" && (
                    <FixSuggestion deal={clean} range={range} findingId={f.id}
                      onUse={(d) => { edit(d); setMessage("Change applied. Run the stress test again to check the new deal."); }} />
                  )}
                </div>
              ))}
            </section>

            <section>
              <h2>Show me my part</h2>
              <MyPart deal={clean} range={range} notes={findings} />
            </section>

            <section>
              <h2>What each person receives as the film earns more</h2>
              <Chart deal={clean} high={range.high} />
            </section>

            <section>
              <h2><span className="step">4</span>Lock the checked deal</h2>
              {toChange > 0 && <p className="warn">{toChange} surprise(s) marked for change. Edit the deal above and run the test again.</p>}
              {!allChecked && toChange === 0 && <p className="muted">Answer every surprise with “Yes, we meant this” to unlock the checked deal.</p>}
              {allChecked && (
                <>
                  <p className="ok">Ready to lock. Everyone has seen and accepted all {findings.length} surprises in “{deal.title}”.</p>
                  <p className="muted">The checked deal below can be handed to a settlement smart contract.</p>
                  <details>
                    <summary>Show technical version (for developers)</summary>
                    <pre>{spec}</pre>
                  </details>
                  <button onClick={() => navigator.clipboard.writeText(spec)}>Copy checked deal</button>
                </>
              )}
            </section>
          </>
        )}
        <footer>A prototype for discussion. Not legal or financial advice.</footer>
      </main>
    </>
  );
}
