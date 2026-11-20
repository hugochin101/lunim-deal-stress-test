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
      <p className="mine">{part.startLine}</p>
      <div className="tiles">
        {part.examples.map((e) => (
          <div className="tile" key={e.earns}>
            <small>If the film earns {gbp(e.earns)}</small>
            <strong>{gbp(e.gets)}</strong>
          </div>
        ))}
      </div>
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
