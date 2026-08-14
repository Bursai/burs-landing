// src/lib/prices.ts
// Single international price list, in euros. The App Store bills each
// user in their storefront's local currency (e.g. kronor in Sweden,
// pounds in the UK) at Apple's equivalent tier; the euro amounts below
// are the reference prices we advertise everywhere.
export interface PriceTier { period: "month" | "year"; amount: number; currency: string; symbol: string; }

export const PRICES: PriceTier[] = [
  { period: "month", amount: 9.99, currency: "EUR", symbol: "€" },
  { period: "year",  amount: 79.99, currency: "EUR", symbol: "€" }
];

/**
 * Founding membership — the launch offer. Anyone who subscribes during the
 * launch year pays this for their first twelve months, then renews at the
 * standard annual price. Uncapped: no member limit is advertised, so no copy
 * anywhere may imply scarcity ("only N left", "almost gone").
 */
export const FOUNDING = {
  period: "year" as const,
  amount: 29.99,
  currency: "EUR",
  symbol: "€",
  /** What it renews at after the founding year. */
  renewsAt: 79.99
};

/**
 * Free trial of Premium, in days — for everybody, on either plan. Payment
 * details are taken at sign-up and the chosen plan begins when the trial
 * ends.
 */
export const TRIAL_DAYS = 30;

/**
 * The free/paid boundary, read from the app rather than from marketing
 * intent (bursai #1305 moved the paywall off the shell and onto the
 * features; shipped in iOS 1.1.6):
 *
 *   FREE, forever — scanning garments with the camera and the digital
 *     wardrobe built from them. Fair-use limits apply to AI scanning, and
 *     copy must say so rather than implying "unlimited".
 *   PAID (Premium) — the stylist: outfit of the day, stylist chat, week
 *     planner, travel capsule, wardrobe insights.
 *
 * The site must NOT claim "no free tier" anywhere: there is a free tier, it
 * is the wardrobe. The trial above is a trial OF PREMIUM, which is a
 * different thing again — keep all three distinct.
 */
export const FREE_FEATURES = [
  "Camera garment scanning (fair-use limits apply)",
  "Your digital wardrobe, kept forever"
];

export const PREMIUM_FEATURES = [
  "Context-aware outfit of the day",
  "AI Stylist chat",
  "Week planner",
  "Travel capsule builder",
  "Wardrobe insights · Priority support"
];

export function format(t: { amount: number; symbol: string }): string {
  const a = Number.isInteger(t.amount) ? t.amount.toString() : t.amount.toFixed(2);
  return t.symbol === "€" ? `€${a}` : `${a} ${t.symbol}`;
}

export function annualSavingsPct(): number {
  const m = PRICES.find(p => p.period === "month")!;
  const y = PRICES.find(p => p.period === "year")!;
  return Math.round(100 * (1 - y.amount / (m.amount * 12)));
}

/**
 * What the founding year saves against the standard annual price — the
 * like-for-like comparison (same twelve months, same plan). Deliberately not
 * measured against twelve monthly payments, which would quote a bigger number
 * for a thing nobody was going to buy.
 */
export function foundingSavingsPct(): number {
  return Math.round(100 * (1 - FOUNDING.amount / FOUNDING.renewsAt));
}
