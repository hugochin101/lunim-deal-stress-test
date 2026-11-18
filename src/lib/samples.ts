import { Deal } from "./deal";
import { Range } from "./stress";

// Invented deals for demonstration only. Not real films or real terms.
export const samples: { deal: Deal; range: Range }[] = [
  {
    deal: {
      title: "Moonlit Harbour (indie feature)",
      fee: { to: "Distributor", bps: 2000 },
      recoup: [{ to: "Investors", amount: 50_000_000 }],
      split: [
        { to: "Producer", bps: 5000 },
        { to: "Investors", bps: 3000 },
        { to: "Crew pool", bps: 2000 },
      ],
    },
    range: { low: 20_000_000, high: 150_000_000 },
  },
  {
    deal: {
      title: "Northern Static (horror)",
      fee: { to: "Sales agent", bps: 2500 },
      recoup: [
        { to: "Investors", amount: 120_000_000 },
        { to: "Cast deferrals", amount: 15_000_000 },
      ],
      split: [
        { to: "Producer", bps: 4000 },
        { to: "Investors", bps: 4000 },
        { to: "Cast", bps: 1000 },
        { to: "Crew", bps: 1000 },
      ],
    },
    range: { low: 50_000_000, high: 200_000_000 },
  },
  {
    deal: {
      title: "Paper Lanterns (short documentary)",
      recoup: [
        { to: "Executive producer", amount: 4_000_000, percentBack: 12000 },
        { to: "Crowd backers", amount: 2_000_000 },
      ],
      split: [
        { to: "Director", bps: 4000 },
        { to: "Crowd backers", bps: 3000 },
        { to: "Editor", bps: 1500 },
        { to: "Composer", bps: 1500 },
      ],
    },
    range: { low: 3_000_000, high: 15_000_000 },
  },
];
