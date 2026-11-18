# Process notes: AI use, iteration and decisions

## Honest timeline

- **18 November (evening, before my official start):** I explored ideas with Claude (an AI assistant). My first idea, a "Deal Waterfall Explainer", turned out to overlap with an existing Lunim intern project (a payout simulator), so I switched to the Deal Stress Test. I then scored my own prototype harshly against Lunim's evaluation criteria and added what scored lowest: an AI "suggest a fix" step, a "Show me my part" view, paybacks above 100%, and a plain lock summary. Claude wrote most of the code under my direction; I chose the idea, set the rules (AI never does the maths, a person decides everything) and reviewed each step. The commit history shows this work.
- **19 November (official start, 10:00 GMT):** I deployed the app, tested the AI features with a real key, took the screenshots below and finalised the summary.

## Screenshot guide (up to five)

Take each screenshot yourself and keep the caption under it.

1. **The pivot (iteration).** The chat where the first idea was compared with Lunim's existing payout simulator and replaced.
   *Caption: "My first idea repeated something Lunim already had, so I changed it to a stress test that finds the outcomes nobody thought to check."*

2. **Scoring my own work (iteration).** The chat where I scored the prototype against Lunim's seven criteria, and the list of improvements that followed.
   *Caption: "I scored my prototype harshly against your criteria; AI use and practicality scored lowest, so I added an AI fix step and support for paybacks above 100%."*

3. **AI suggesting a fix, checked by code (AI as leverage).** On the live site with a key: mark a surprise "No, change the deal", click "Ask AI for a fix", and capture the panel showing the AI's reason, the changes and the before and after.
   *Caption: "AI proposes the smallest change; code checks it adds up, lists exactly what changed and recalculates the effect. A person decides."*

4. **The live app (UX).** The Vercel link with a sample deal: the surprises, the review count and "Show me my part".
   *Caption: "Each person sees only their own part, and can be sent a plain message about it."*

5. **AI never does the maths (decision).** `src/lib/check.ts` next to the passing tests (`npm test`) that throw away an AI sentence with a made up figure.
   *Caption: "Any AI sentence with a number the engine did not calculate, or that sounds like a promise, is replaced with the engine's own wording."*

## Decisions in one list

1. Exact maths in whole pence, leftover pennies shared by the largest remainder method.
2. AI rewords and suggests, but never calculates; its figures are checked against the engine.
3. AI fixes are never applied automatically: code checks them, shows the effect, and a person chooses.
4. AI reading of deal text is optional, shows what it was unsure about, and is always confirmed by a person.
5. Deals that do not add up are refused before anything runs.
6. Nothing is stored or logged; 10 requests a minute per visitor; the core works without an AI key.
