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

export function format(t: PriceTier): string {
  const a = Number.isInteger(t.amount) ? t.amount.toString() : t.amount.toFixed(2);
  return t.symbol === "€" ? `€${a}` : `${a} ${t.symbol}`;
}

export function annualSavingsPct(): number {
  const m = PRICES.find(p => p.period === "month")!;
  const y = PRICES.find(p => p.period === "year")!;
  return Math.round(100 * (1 - y.amount / (m.amount * 12)));
}
