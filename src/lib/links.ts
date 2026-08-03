// src/lib/links.ts
// Single source of truth for outbound app links. Every "Get the app" /
// download CTA across the site points here, so the destination can never
// drift between components.
export const APP_STORE_URL =
  "https://apps.apple.com/se/app/burs-ai/id6772630210?l=en-GB";

// Now that /go renders (see vercel.json / go.astro history), this is the
// single source of truth for the App Store URL + campaign token for BOTH
// paid and organic traffic — the vercel.json edge redirect that used to
// duplicate this logic is gone.
const APP_STORE_BASE = "https://apps.apple.com/se/app/burs-ai/id6772630210";
const CAMPAIGN_RE = /^[a-zA-Z0-9_-]{1,32}$/;

export function buildAppStoreUrl(campaign: string | null): string {
  const ct = campaign && CAMPAIGN_RE.test(campaign) ? campaign : "direct";
  return `${APP_STORE_BASE}?l=en-GB&ct=${ct}&mt=8`;
}
