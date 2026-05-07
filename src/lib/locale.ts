// src/lib/locale.ts
// Map ISO country codes → BURS pricing locale.
// Currently only SE has its own SEK pricing; everywhere else gets EU/EUR.
// Add new locales here as the catalogue grows.

import type { Locale } from "./prices";

export function localeFromCountry(cc: string | null | undefined): Locale {
  if (!cc) return "EU";
  const c = cc.toUpperCase();
  if (c === "SE") return "SE";
  return "EU";
}

// Timezone heuristic — used for an instant first-paint approximation
// before the IP lookup returns. Maps a small set of obvious tz strings.
export function localeFromTimezone(tz: string | null | undefined): Locale | null {
  if (!tz) return null;
  if (/Stockholm/i.test(tz)) return "SE";
  // Future: add /Helsinki|Oslo|Copenhagen/ when those locales exist.
  return null;
}
