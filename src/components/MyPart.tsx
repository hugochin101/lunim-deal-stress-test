"use client";
import { useState } from "react";
import { Deal, gbp } from "@/lib/deal";
import { Range } from "@/lib/stress";
import { parties } from "@/lib/waterfall";
import { myPart } from "@/lib/mypart";

// Lets each person see only their own part of the deal, and copy a plain message for them.
export default function MyPart({ deal, range, notes }: { deal: Deal; range: Range; notes: { who: string[]; plain: string }[] }) {
  const names = parties(deal);
  const [chosen, setName] = useState(names[names.length - 1]);
  const [copied, setCopied] = useState(false);
  const name = names.includes(chosen) ? chosen : names[names.length - 1];
  const part = myPart(deal, range, name);
  const mine = notes.filter((n) => n.who.includes(name));

  return (
    <div>
      <div className="row">
        <label htmlFor="who">I am:</label>
        <select id="who" value={name} onChange={(e) => { setName(e.target.value); setCopied(false); }}>
          {names.map((n) => <option key={n}>{n}</option>)}
        </select>
      </div>
      <p><b>{part.startLine}</b></p>
      <table>
        <thead><tr><th>If the film earns</th><th>{name} would get</th></tr></thead>
        <tbody>
          {part.examples.map((e) => <tr key={e.earns}><td>{gbp(e.earns)}</td><td>{gbp(e.gets)}</td></tr>)}
        </tbody>
      </table>
      {mine.length > 0 && (
        <>
          <p className="muted">Surprises that affect {name}:</p>
          <ul>{mine.map((n) => <li key={n.plain}>{n.plain}</li>)}</ul>
        </>
      )}
      <button onClick={() => { navigator.clipboard.writeText(part.message); setCopied(true); }}>
        {copied ? "Copied" : `Copy a plain message for ${name}`}
      </button>
    </div>
  );
}
