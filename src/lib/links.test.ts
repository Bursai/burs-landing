// src/lib/links.test.ts
// Guards the paid-traffic install path.
//
// HISTORY — read this before "restoring" the redirect this suite now forbids.
// Until 2026-08-03 `vercel.json` held an edge 302 for /go?utm_campaign=<c>
// that sent paid ad clicks straight to the App Store, so an ad click cost
// zero extra taps. This suite existed to keep that redirect's destination
// byte-identical to what go.astro's CTA produced, because a mismatch would
// have split paid and organic installs across different ct tokens in App
// Store Connect — silently, with nothing failing.
//
// That redirect fired BEFORE Astro, the Meta pixel, or any analytics beacon
// ever ran, which made every paid click unmeasurable: 906 SEK of Meta spend
// from 2026-07-26 onward left no trace anywhere but Meta's own click count.
// It is now deleted. /go renders for everyone, fires its beacons, and hands
// off to the App Store from the client (see src/pages/go.astro). The
// invariant this suite protects is therefore inverted: there must be NO edge
// redirect for /go, and the client-side token logic must agree with
// `buildAppStoreUrl`, which is now the single source of truth for the URL
// shape and the campaign-token validation.
//
// 2026-08-02 (kept for context): the old rule originally hardcoded
// `meta-m1-se`, so the first ad shipped with a different utm_campaign (M3)
// silently fell through to the interstitial. Worse, an M3 ad pointed straight
// at apps.apple.com to dodge the interstitial entirely — and Meta hard-rejects
// an App Store URL under a Traffic objective ("App-url stöds enbart av
// målsättningen Appinstallationer"), so that ad never served one impression.
// Paid traffic must keep routing through burs.me/go.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  APP_STORE_URL,
  CAMPAIGN_FALLBACK,
  CAMPAIGN_PARAM_KEYS,
  CAMPAIGN_RE_SOURCE,
  buildAppStoreUrl,
  resolveCampaign,
} from './links';

const root = new URL('../../', import.meta.url);
const readRepoFile = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), 'utf8');

interface Redirect {
  source: string;
  destination: string;
  statusCode?: number;
  has?: { type: string; key: string; value?: string }[];
}

const vercelConfig: { redirects: Redirect[] } = JSON.parse(readRepoFile('vercel.json'));
const goAstro = readRepoFile('src/pages/go.astro');
const campaignToken = readRepoFile('src/components/CampaignToken.astro');
const metaPixel = readRepoFile('src/components/MetaPixel.astro');
const baseLayout = readRepoFile('src/layouts/Base.astro');

/**
 * Source with whole-line `//` comments removed. These files are heavily
 * commented, and the comments name the very identifiers asserted on below — so
 * without this a "must not contain" check could fail on prose that explains why
 * the thing is absent, and a "must contain" check could pass on a mention of
 * code that no longer exists.
 */
const codeOnly = (source: string) => source.replace(/^[ \t]*\/\/.*$/gm, '');

const goRedirects = vercelConfig.redirects.filter((r) => r.source.replace(/\/$/, '') === '/go');

describe('/go must render, not redirect at the edge', () => {
  it('has no vercel.json redirect for /go, in any form', () => {
    // THE regression guard for this whole task. An edge redirect here runs
    // before the page exists, so the Meta pixel and the analytics beacon
    // never fire and paid spend becomes unmeasurable again. If a future
    // change wants zero-tap paid clicks back, it has to solve measurement
    // some other way first — not by re-adding this.
    expect(goRedirects).toEqual([]);
  });

  it('leaves the /download redirects alone', () => {
    // /download is the bio-link shortcut and is NOT a measurement surface —
    // it stays a plain edge 302. Deleting it while removing /go would break
    // every printed/bio link.
    const downloads = vercelConfig.redirects.filter(
      (r) => r.source.replace(/\/$/, '') === '/download',
    );
    expect(downloads.map((r) => r.source).sort()).toEqual(['/download', '/download/']);
    for (const rule of downloads) expect(rule.statusCode).toBe(302);
  });

  it('is deliberately absent from public/_redirects', () => {
    // /download appears in BOTH vercel.json and public/_redirects (the
    // Cloudflare-compatible mirror), so the obvious "consistency fix" here is
    // to add /go to _redirects as well. Do not: that format is a flat
    // source→destination list with NO conditional matching, so the entry
    // would fire for every visitor at the edge — the exact failure this task
    // just removed from vercel.json.
    const lines = readRepoFile('public/_redirects')
      .split('\n')
      .map((l) => l.trim().split(/\s+/)[0]);
    expect(lines).not.toContain('/go');
    expect(lines).not.toContain('/go/');
  });
});

describe('one browser-side campaign resolver', () => {
  // The browser can't import from src/lib at runtime (the scripts are
  // `is:inline`, and the query string only exists in the browser because this
  // is a static build). CampaignToken.astro closes that gap with `define:vars`
  // instead of a hand-written copy, so the key order, the charset and the
  // fallback exist exactly once. These assertions exist because the DUPLICATE
  // is what broke: /go resolved all three keys while MetaPixel's click
  // listener read `src` alone, so a Meta visitor who tapped the CTA before the
  // handoff — or any Android visitor, who never gets a handoff — filed a paid
  // conversion as organic.
  it('reads every campaign param an ad platform might send, in the same order', () => {
    // `src` = TikTok/IG bio links. `utm_campaign` = the Meta campaign token
    // (it carries the campaign-scoped value). `utm_source` = last resort.
    // Dropping utm_campaign is the 2026-07-26 bug that silently discarded
    // every paid click's token.
    expect(CAMPAIGN_PARAM_KEYS).toEqual(['src', 'utm_campaign', 'utm_source']);
    expect(CAMPAIGN_RE_SOURCE).toBe('^[a-zA-Z0-9_-]{1,32}$');
    expect(CAMPAIGN_FALLBACK).toBe('direct');
  });

  it('feeds the inline resolver from links.ts rather than restating it', () => {
    expect(campaignToken).toMatch(
      /import \{[\s\S]*?CAMPAIGN_PARAM_KEYS[\s\S]*?CAMPAIGN_RE_SOURCE[\s\S]*?CAMPAIGN_FALLBACK[\s\S]*?\} from "\.\.\/lib\/links"/,
    );
    expect(campaignToken).toContain('define:vars=');
    // No second copy of the charset or the key names anywhere in the resolver:
    // if either is spelled out here, links.ts has stopped being the source.
    const code = codeOnly(campaignToken);
    expect(code).not.toContain('a-zA-Z0-9_-');
    for (const key of CAMPAIGN_PARAM_KEYS) expect(code, key).not.toContain(`"${key}"`);
  });

  it('takes the first VALID param, not merely the first present', () => {
    // resolveCampaign's fall-through loop, in the browser. Returning only on a
    // passing candidate is what stops one malformed value (Meta's
    // {{campaign.name}} macro with a space in it) from burying a good token in
    // a later param and reporting the click as organic.
    expect(codeOnly(campaignToken)).toMatch(
      /for \(var i = 0; i < CAMPAIGN_KEYS\.length; i\+\+\) \{[\s\S]*?re\.test\(candidate\)[\s\S]*?return candidate;/,
    );
    expect(campaignToken).toContain('return CAMPAIGN_FALLBACK;');
  });

  it('publishes the token once, ahead of every consumer', () => {
    expect(campaignToken).toContain('window.__bursCampaign =');
    // <head>, before MetaPixel, on BOTH placements — /go declares its own
    // <html> and never reaches Base.astro, so neither can cover the other.
    for (const [name, source] of [
      ['go.astro', goAstro],
      ['Base.astro', baseLayout],
    ] as const) {
      expect(source, name).toContain('<CampaignToken />');
      expect(source.indexOf('<CampaignToken />'), `${name}: must precede MetaPixel`).toBeLessThan(
        source.indexOf('<MetaPixel'),
      );
    }
  });

  it('is the only thing the consumers read — no second resolution', () => {
    // THE regression guard for the mislabelled-conversion bug. Both consumers
    // must read the shared token; neither may re-derive one from the URL.
    expect(codeOnly(metaPixel)).toContain('window.__bursCampaign || "direct"');
    expect(codeOnly(goAstro)).toContain("var ct = window.__bursCampaign || 'direct';");
    expect(codeOnly(metaPixel)).not.toContain('location.search');
    expect(codeOnly(goAstro)).not.toContain('location.search');
    // ...and nobody may strip characters out of a token. Reject-whole-value is
    // the rule: stripping turns a hostile value into a plausible partial one.
    expect(codeOnly(metaPixel)).not.toMatch(/replace\(\/\[\^a-zA-Z0-9/);
  });

  it('builds the same URL shape buildAppStoreUrl produces', () => {
    // buildAppStoreUrl(null) is what the server rendered into `target`; the
    // script rebuilds from its origin+path, so the query shape must match.
    expect(buildAppStoreUrl(null)).toContain('?l=en-GB&ct=direct&mt=8');
    expect(goAstro).toContain("'?l=en-GB&ct=' + encodeURIComponent(ct) + '&mt=8'");
  });

  it('delays the App Store handoff so the beacons get a chance to fire', () => {
    // A synchronous location.replace would reproduce the edge-redirect bug in
    // JavaScript: the page would render but leave before anything reported.
    expect(goAstro).toContain('window.location.replace(dest)');
    expect(goAstro).toContain('var HANDOFF_MS = 700;');
    expect(goAstro).toContain('setTimeout(tick, HANDOFF_MS)');
  });

  it('waits for the beacon past 700ms, but never past a hard cap', () => {
    // 700ms is the EARLIEST departure, not a fixed deadline. On a cold mobile
    // connection the hoisted module and /_vercel/insights/script.js can still
    // be in flight at 700ms and location.replace() cancels them — which would
    // silently reproduce the exact unmeasurability this PR exists to fix.
    // The cap is what stops a blocked or disabled beacon stranding a visitor.
    expect(goAstro).toContain("indexOf('/_vercel/insights/view')");
    expect(goAstro).toContain('var MAX_WAIT_MS = 2000;');
    expect(goAstro).toMatch(/Date\.now\(\) - startedAt < MAX_WAIT_MS && !measurementFlushed\(\)/);
    // Unmeasurable must fail OPEN — never hold the visitor on an exception.
    expect(goAstro).toMatch(/catch \(e\) \{\s*\n\s*return true;/);
  });

  it('waits for the consented pixel too, because a stub-queued event is lost', () => {
    // The beacon's "issued is enough" argument does NOT transfer to Meta.
    // MetaPixel's snippet installs a stub that pushes init/PageView/
    // ViewContent into an in-memory array; nothing is on the wire until
    // fbevents.js executes, and unloading cancels that pending script, so a
    // visitor who left on the beacon alone lost all three events plus the
    // InitiateAppStore the handoff fires. fbevents.js assigns `callMethod`
    // when it takes over and replays the queue — that is the only signal the
    // events became requests, and it is the one asserted here.
    const code = codeOnly(goAstro);
    expect(code).toContain("typeof f.callMethod === 'function'");
    // `fbq.loaded` and "fbq exists" are traps: the STUB sets loaded = true and
    // IS a function, so gating on either would gate nothing at all.
    expect(code).not.toMatch(/fbq\.loaded|f\.loaded/);
    // Same budget, no new one. A slow or blocked pixel delays the handoff; it
    // can never prevent it, and it never gets its own timer.
    expect(code).toMatch(
      /function measurementFlushed\(\)\s*\{\s*\n\s*return beaconFlushed\(\) && pixelFlushed\(\);/,
    );
    // The pixel did NOT get a budget of its own: these three constants are
    // still the only clocks on the page, and every wait below is bounded by
    // MAX_WAIT_MS. A fourth one appearing here is the regression.
    expect((code.match(/var [A-Z_]+_MS = \d+;/g) || []).sort()).toEqual([
      'var CLICK_GRACE_MS = 300;',
      'var HANDOFF_MS = 700;',
      'var MAX_WAIT_MS = 2000;',
    ]);
  });

  it('only waits for the pixel when consent was actually granted', () => {
    // A visitor who declined, ignored the banner, or has storage blocked never
    // loads fbevents.js at all — holding them would be pure added latency on a
    // paid click for a request that will never exist. The gate must mirror
    // MetaPixel's exactly, so read the key out of the pixel and require the
    // handoff to use the same one: drift here either stalls every
    // non-consenting visitor to the cap or stops waiting for a real pixel.
    const key = /var KEY = "([^"]+)"/.exec(codeOnly(metaPixel))?.[1];
    expect(key).toBe('burs-consent-v1');
    const code = codeOnly(goAstro);
    expect(code).toContain(`var CONSENT_KEY = '${key}';`);
    expect(code).toContain("localStorage.getItem(CONSENT_KEY) === 'granted'");
    // Storage blocked → MetaPixel stays off → this must NOT wait (fail open,
    // same as beaconFlushed's catch).
    expect(code).toMatch(/catch \(e\) \{\s*\n\s*consented = false;/);
    // Stored consent means MetaPixel (in <head>) already installed its stub by
    // the time this runs. No stub → its inline script never ran → not coming.
    expect(code).toContain("var pixelExpected = consented && typeof window.fbq === 'function';");
    // Consent given live must still arm the wait — Android gets no timed
    // handoff, so the click grace is the only wait that visitor ever hits.
    expect(code).toContain("if (e && e.detail === 'granted') pixelExpected = true;");
  });

  it('does not hold a visitor for a pixel that was blocked outright', () => {
    // connect.facebook.net is on every ad-blocker list, so this is a large
    // slice of any paid audience, not an edge case: a blocked script errors
    // within milliseconds and is never coming back. The flag has to be set at
    // element CREATION — a listener added by /go's end-of-body script misses
    // the error entirely (measured: the visitor then burned the full 2s cap).
    const pixel = codeOnly(metaPixel);
    expect(pixel).toMatch(/t\.onerror = function \(\) \{\s*\n\s*window\.__bursPixelDead = true;/);
    expect(pixel.indexOf('t.onerror'), 'must be attached before insertion').toBeLessThan(
      pixel.indexOf('insertBefore'),
    );
    // Same global on both sides, or /go waits for a pixel that already failed.
    expect(codeOnly(goAstro)).toContain(
      'if (!pixelExpected || window.__bursPixelDead) return true;',
    );
  });

  it('does not auto-navigate Android visitors to an iOS-only store', () => {
    // `dest` is apps.apple.com and there is no Play listing to send them to,
    // so an automatic handoff drops an Android visitor in a store where they
    // cannot install anything — with the page they came for already unloaded.
    // They keep the rendered page and the CTA instead.
    expect(goAstro).toContain('var isAndroid = /Android/i.test(navigator.userAgent');
    expect(goAstro).toContain('if (!isAndroid) handoff = setTimeout(tick, HANDOFF_MS);');
  });

  it('fires InitiateAppStore in the handoff, since it pre-empts the click', () => {
    // MetaPixel.astro emits this custom event ONLY from a delegated click
    // listener on apps.apple.com links. The timed handoff is a
    // location.replace, which produces no click — so on /go the signal would
    // silently drop to zero unless the handoff fires it itself.
    expect(goAstro).toContain("window.fbq('trackCustom', 'InitiateAppStore'");
    // Must stay inside the consent gate: fbq only exists after consent.
    expect(goAstro).toContain("typeof window.fbq === 'function'");
  });

  it('cancels the handoff when the visitor navigates first', () => {
    // Otherwise the timer overrides the link the visitor actually tapped, and
    // InitiateAppStore fires twice (once from MetaPixel's click listener).
    expect(goAstro).toContain('clearTimeout(handoff)');
  });

  it('gives an early tap the same measurement grace, bounded so it cannot be felt', () => {
    // Cancelling the timer used to be the ENTIRE click handler, which opted a
    // fast tap out of the readiness wait: tap inside the first ~700ms, or tap
    // at all on Android (no timer there), and the page unloaded with the
    // insights script still downloading, so no beacon was ever issued. Same
    // unmeasurable paid click, different route. A tap is also the only path
    // that can lose MetaPixel's own click-fired InitiateAppStore, which lands
    // in the stub's queue when fbevents.js is still in flight.
    const code = codeOnly(goAstro);
    expect(code).toContain('var CLICK_GRACE_MS = 300;');
    // Skipped outright once both signals are out — so the common case costs a
    // real tap exactly nothing.
    expect(code).toMatch(/if \(measurementFlushed\(\)\) return;/);
    // Bounded twice: by the grace period AND by the page-wide budget, so a
    // late tap waits less and a tap past the budget waits not at all.
    expect(code).toContain(
      'var deadline = Math.min(Date.now() + CLICK_GRACE_MS, startedAt + MAX_WAIT_MS);',
    );
    expect(code).toContain('if (deadline <= Date.now()) return;');
    // Every branch still ends in a navigation — nothing can strand a visitor.
    expect(code).toContain('window.location.href = href;');
  });

  it('never hijacks a click that leaves this document alive', () => {
    // A modified click opens a new tab/window, so the beacon is in no danger
    // and preventDefault would break the gesture the visitor made.
    const code = codeOnly(goAstro);
    expect(code).toContain('if (e.defaultPrevented || e.button !== 0) return;');
    expect(code).toContain('if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;');
    expect(code).toContain("if (a.target && a.target !== '_self') return;");
  });

  it('keeps a visible CTA and a no-JS fallback', () => {
    // If the timed handoff is blocked (no JS, a popup blocker, a slow device)
    // the visitor must still be able to reach the App Store.
    expect(goAstro).toContain('id="go-cta"');
    expect(goAstro).toContain('<noscript>');
  });
});

describe('resolveCampaign', () => {
  it('reads the bio-link param', () => {
    expect(resolveCampaign('?src=tt')).toBe('tt');
  });

  it('reads the Meta campaign token', () => {
    expect(resolveCampaign('?utm_source=meta&utm_medium=paid-social&utm_campaign=meta-m3-se')).toBe(
      'meta-m3-se',
    );
  });

  it('falls through a malformed value to the next VALID param', () => {
    // Meta's {{campaign.name}} macro on a campaign called "BURS M4 SE".
    // First-present would return null here and bucket a paid click as
    // ct=direct — the same App Store Connect bucket as organic traffic.
    expect(resolveCampaign('?utm_source=meta&utm_campaign=BURS%20M4%20SE')).toBe('meta');
    expect(resolveCampaign('?src=ig%20story&utm_campaign=meta-m4-se')).toBe('meta-m4-se');
  });

  it('returns null when nothing valid is present', () => {
    expect(resolveCampaign('')).toBeNull();
    expect(resolveCampaign('?utm_campaign=')).toBeNull();
    expect(resolveCampaign('?utm_campaign=BURS%20M4%20SE')).toBeNull();
  });

  it('never yields a partial token from a hostile value', () => {
    for (const hostile of ['evil&ct=stolen', 'evil#frag', 'a'.repeat(33), '../../etc']) {
      const params = new URLSearchParams();
      params.set('utm_campaign', hostile);
      expect(resolveCampaign(`?${params.toString()}`), hostile).toBeNull();
    }
  });

  it('composes with buildAppStoreUrl into a clean App Store URL', () => {
    expect(buildAppStoreUrl(resolveCampaign('?utm_campaign=meta-m4-se'))).toBe(
      'https://apps.apple.com/se/app/burs-ai/id6772630210?l=en-GB&ct=meta-m4-se&mt=8',
    );
    expect(buildAppStoreUrl(resolveCampaign('?utm_campaign=BURS%20M4%20SE'))).toContain(
      'ct=direct',
    );
  });
});

describe('buildAppStoreUrl', () => {
  it('stays on the same App Store listing as every other CTA on the site', () => {
    // links.ts holds both APP_STORE_URL (used by Nav, PriceCard, WeekReel,
    // MarkSeal, PricingTeaser) and the base buildAppStoreUrl composes from.
    // They must not drift onto different app IDs or storefronts.
    expect(buildAppStoreUrl(null).startsWith(`${APP_STORE_URL}&ct=`)).toBe(true);
  });

  it('embeds a valid campaign as the ct token', () => {
    expect(buildAppStoreUrl('meta-m4-se')).toBe(
      'https://apps.apple.com/se/app/burs-ai/id6772630210?l=en-GB&ct=meta-m4-se&mt=8',
    );
  });

  it('falls back to ct=direct when campaign is null', () => {
    expect(buildAppStoreUrl(null)).toContain('ct=direct');
  });

  it.each(['evil&ct=stolen', 'evil#frag', 'a'.repeat(33), '../../etc'])(
    'rejects hostile value %s and falls back',
    (bad) => {
      expect(buildAppStoreUrl(bad)).toContain('ct=direct');
      // Nothing from the hostile value may survive into Apple's URL.
      expect(buildAppStoreUrl(bad)).toMatch(
        /^https:\/\/apps\.apple\.com\/se\/app\/burs-ai\/id6772630210\?l=en-GB&ct=direct&mt=8$/,
      );
    },
  );
});
