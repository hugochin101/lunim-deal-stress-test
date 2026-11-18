# Process notes: AI use, iteration and decisions

## Honest timeline

- **18 November (evening, before my official start):** I explored ideas with Claude (an AI assistant). My first idea, a "Deal Waterfall Explainer", turned out to overlap with an existing Lunim intern project (a payout simulator), so I switched to the Deal Stress Test. Claude wrote most of the code under my direction; I chose the idea, set the rules (AI never does the maths, a person confirms everything) and reviewed each step. The commit history shows this work.
- **19 November (official start, 10:00 GMT):** I deployed the app, tested the AI features with a real key, took the screenshots below and finalised the summary.

## Screenshot guide (up to five)

Take each screenshot yourself and keep the caption under it.

1. **The pivot (iteration).** The chat where the first idea was compared with Lunim's existing payout simulator and replaced.
   *Caption: "My first idea repeated something Lunim already had, so I changed it to a stress test that finds outcomes nobody thought to check."*

2. **AI never does the maths (decision).** `src/lib/check.ts` next to the passing test that throws away an AI sentence containing a made up figure (`npm test`).
   *Caption: "AI only rewords findings. Any sentence with a number the engine did not calculate, or that sounds like a promise, is replaced with the engine's own wording."*

3. **A bug found and fixed (iteration).** On GitHub, the commit "Group people who start being paid at the same point" (before: three identical warnings; after: one).
   *Caption: "Testing in a browser showed repeated warnings, so I grouped people with the same turning point."*

4. **The live app.** The Vercel link with the "Northern Static" sample, showing the surprises and the chart.
   *Caption: "The stress test shows that Producer, Cast and Crew get nothing until the film earns more than £1,800,000."*

5. **AI with a real key.** Paste your own made up deal terms into "Read deal with AI", showing the reading and any "AI was unsure" warnings, then run the test showing "Reworded by AI; numbers checked".
   *Caption: "With a real key, AI reads the deal and flags unclear terms; a person corrects the reading before any numbers are calculated."*

## Decisions in one list

1. Exact maths in whole pence, leftover pennies shared by the largest remainder method.
2. AI rewords but never calculates; its figures are checked against the engine.
3. AI reading of deal text is optional, shows what it was unsure about, and is always confirmed by a person.
4. Deals that do not add up are refused before anything runs.
5. Nothing is stored or logged; 10 requests a minute per visitor.
6. The app works fully without an AI key.
