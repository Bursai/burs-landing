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

/**
 * The campaign-token charset, as a STRING rather than a literal, so the inline
 * browser script can rebuild the identical RegExp from it via `define:vars`
 * (see src/components/CampaignToken.astro). A second hand-written copy of this
 * pattern in an inline script is exactly how the two paths drift apart.
 */
export const CAMPAIGN_RE_SOURCE = "^[a-zA-Z0-9_-]{1,32}$";

/** App Store Connect's bucket for "no usable campaign token" — i.e. organic. */
export const CAMPAIGN_FALLBACK = "direct";

const CAMPAIGN_RE = new RegExp(CAMPAIGN_RE_SOURCE);

/**
 * Query params that can carry a campaign token, in precedence order.
 *
 *   src          — TikTok / Instagram bio links (/go?src=tt).
 *   utm_campaign — the campaign-scoped token Meta sends (meta-m3-se); it is
 *                  the value /download hardcodes, so both entry points report
 *                  the SAME token to App Store Connect.
 *   utm_source   — last resort ("meta"), so a paid click is at least
 *                  distinguishable from organic.
 *
 * src/components/CampaignToken.astro is the ONE browser-side resolver, and it
 * is fed this array (plus CAMPAIGN_RE_SOURCE and CAMPAIGN_FALLBACK) through
 * `define:vars` at build time. It is not a hand-written mirror: every consumer
 * — the /go handoff and MetaPixel's delegated click listener — reads the token
 * that component resolves, so there is one key list, one regex and one
 * fallback across the whole site.
 */
export const CAMPAIGN_PARAM_KEYS = ["src", "utm_campaign", "utm_source"] as const;

/**
 * Resolve the campaign token from a location.search string, taking the first
 * param whose WHOLE value is token-safe — first VALID, not first present.
 *
 * The distinction is load-bearing. Meta's standard `{{campaign.name}}` URL
 * macro expands to the human campaign name, so any campaign with a space in it
 * arrives as `utm_campaign=BURS M4 SE`. First-present would let that malformed
 * value swallow the lookup and bucket the click as `ct=direct` — the same App
 * Store Connect bucket as organic traffic — even when a later param carried a
 * perfectly good token. Falling through means the worst case degrades to a
 * coarser but still-paid token instead of silently looking organic.
 *
 * Returns null when nothing valid is present; callers fall back to "direct".
 */
export function resolveCampaign(search: string): string | null {
  const params = new URLSearchParams(search);
  for (const key of CAMPAIGN_PARAM_KEYS) {
    const value = params.get(key);
    if (value && CAMPAIGN_RE.test(value)) return value;
  }
  return null;
}

export function buildAppStoreUrl(campaign: string | null): string {
  const ct = campaign && CAMPAIGN_RE.test(campaign) ? campaign : CAMPAIGN_FALLBACK;
  return `${APP_STORE_BASE}?l=en-GB&ct=${ct}&mt=8`;
}
