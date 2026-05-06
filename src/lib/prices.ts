// src/lib/prices.ts
export type Locale = "SE" | "EU";

export interface PriceTier { period: "month" | "year"; amount: number; currency: string; symbol: string; }

export const PRICES: Record<Locale, PriceTier[]> = {
  SE: [
    { period: "month", amount: 119, currency: "SEK", symbol: "kr" },
    { period: "year",  amount: 899, currency: "SEK", symbol: "kr" }
  ],
  EU: [
    { period: "month", amount: 10.99, currency: "EUR", symbol: "€" },
    { period: "year",  amount: 89.99, currency: "EUR", symbol: "€" }
  ]
};

export function format(t: PriceTier): string {
  const a = Number.isInteger(t.amount) ? t.amount.toString() : t.amount.toFixed(2);
  return t.symbol === "€" ? `€${a}` : `${a} ${t.symbol}`;
}

export function annualSavingsPct(loc: Locale): number {
  const m = PRICES[loc].find(p => p.period === "month")!;
  const y = PRICES[loc].find(p => p.period === "year")!;
  return Math.round(100 * (1 - y.amount / (m.amount * 12)));
}
