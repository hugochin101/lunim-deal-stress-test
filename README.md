# Deal Stress Test

Find the surprises in a film deal before it is locked into a smart contract and can no longer change.

Built for the Risidio / Lunim Stage 2 case study (AI track) by Yun Ming (Hugo) Chin.

## The idea in one paragraph

On Lunim, a film's revenue split is locked into a smart contract once funding is reached, and after that it pays everyone automatically. People agreeing a deal usually picture one or two outcomes. This tool tests the deal at **every** amount the film could earn and shows the surprises nobody thought to check, such as "Nothing is paid to Producer and Crew until the film earns more than £625,000". The tool finds the facts; the people in the deal decide what is fair. Only when everyone accepts every surprise is a checked version of the deal produced, ready for a settlement contract.

## How it works

```
 Deal (typed in, a sample, or pasted text read by AI and checked by a person)
   │
   ▼
 Exact engine (code, whole pence) ──► surprises: when money starts, who takes everything, real vs headline share
   │                                        │
   │                                        ▼
   │                          AI rewords each one in plain English ──► code checks every £ and % and blocks promises
   ▼
 People review each surprise: "Yes, we meant this" or "No, change the deal"
   │                                        │
   │                                        ▼
   │                          AI suggests the smallest fix ──► code checks it adds up, lists the changes,
   │                                                           re-runs the test and shows before and after
   ▼
 Everyone accepts every surprise ──► checked deal (lunim.stress.v1), ready to lock
```

1. **Choose a deal**: pick one of three invented samples, edit it, or paste real deal terms and let AI read them in (it also lists anything it was unsure about).
2. **Set the expected earnings range**: for example £500,000 to £2,000,000.
3. **Run the stress test**: exact maths finds where each person's money starts, where all money goes to one party, paybacks above 100%, and where a headline share is worth far less than it sounds.
4. **Review each surprise**: "Yes, we meant this" or "No, change the deal". For a change, **Ask AI for a fix** proposes the smallest change; code shows exactly what would change and the effect, and a person chooses to use it or not.
5. **Show me my part**: pick a person to see when their money starts, what they would get at low, middle and high earnings, and copy a plain message to send them.
6. **Lock**: when every surprise is accepted, the app shows a plain summary and a checked deal (`lunim.stress.v1`) for a settlement smart contract.

## Key decisions

- **AI never does the maths.** A plain TypeScript engine (`src/lib/waterfall.ts`, `src/lib/stress.ts`) works in whole pence and shares leftover pennies by the largest remainder method, so totals always match exactly.
- **AI wording is checked.** `src/lib/check.ts` rejects any AI sentence that uses a £ or % figure code did not compute, or that sounds like a promise ("you will earn"). Rejected wording falls back to the engine's own sentence.
- **AI fixes are checked, never applied automatically.** `src/app/api/suggest` refuses suggestions that do not add up; `src/lib/suggest.ts` lists the changes and their effect in code; a person decides.
- **AI reading of deal text is optional and always confirmed by a person.** Unclear clauses are shown as warnings.
- **No storage.** Deal text is never stored or logged. Each visitor is limited to 10 requests a minute.
- **Works without a key.** The stress test, personal view and lock all run without AI; only rewording, import and fixes need `ANTHROPIC_API_KEY`.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # 49 tests
npm run typecheck
npm run build
```

Deploy on Vercel by importing the repo; add `ANTHROPIC_API_KEY` as an environment variable for the AI features.

## Honest limits

- The live AI features have only been tested with mocked responses; they need a real check with a key.
- Sample deals are invented. Covered: one fee, paybacks in order (including above 100%), then a split. Not yet covered: tiered splits, caps, separate fees per territory.
- It is a prototype for discussion, not legal or financial advice, and `lunim.stress.v1` is a proposal, not an audited format.
