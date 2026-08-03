// tests/html.smoke.ts
// Invariants that only exist in the BUILT output, so they cannot be asserted
// against source. Run `npm run build` first — this walks dist/.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, files: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.html')) files.push(p);
  }
  return files;
}

const htmls = walk('dist');

describe('robots directives in the shipped HTML', () => {
  it('only the /labs pages mention robots at all', () => {
    // Astro emits HTML comments verbatim, so prose in a layout comment lands
    // in all 31 pages that use it. A comment in Base.astro that spelled out a
    // literal `<meta name="robots" content="noindex,nofollow">` while
    // explaining why it gets relocated made the homepage — and every blog
    // post — look noindexed to anything that greps the built HTML, which is
    // how deploys are spot-checked in this repo. Real crawlers parse and
    // ignore comments; grep does not. Keep robots markup out of prose.
    const mentioning = htmls.filter((p) => readFileSync(p, 'utf8').includes('name="robots"'));
    expect(mentioning.every((p) => p.includes('/labs/'))).toBe(true);
  });

  it('the /labs pages really are noindexed, in <head>', () => {
    // The flip side: the comment above is about the placement of <Analytics />
    // pushing slot="head" content into the body. If that ever regresses, the
    // private lab pages become indexable.
    const labs = htmls.filter((p) => p.includes('/labs/'));
    expect(labs.length).toBeGreaterThan(0);
    for (const p of labs) {
      const html = readFileSync(p, 'utf8');
      const head = html.slice(0, html.indexOf('</head>'));
      expect(head, p).toContain('name="robots"');
    }
  });
});

describe('Vercel Web Analytics wiring', () => {
  it('every page ships the beacon', () => {
    // /go declares its own <html> and never reaches Base.astro, so the two
    // placements are separate; this is what catches one of them being dropped.
    for (const p of htmls) {
      expect(readFileSync(p, 'utf8'), p).toContain('<vercel-analytics');
    }
  });

  it('every page defines the query-param allowlist before the beacon', () => {
    // Without this the beacon reports location.href verbatim, which on a paid
    // landing is /go?…&fbclid=… — a unique per-click identifier. The hook has
    // to be defined ahead of the <vercel-analytics> element, because the
    // component reads window.webAnalyticsBeforeSend in its constructor.
    for (const p of htmls) {
      const html = readFileSync(p, 'utf8');
      const hook = html.indexOf('window.webAnalyticsBeforeSend');
      const element = html.indexOf('<vercel-analytics');
      expect(hook, `${p}: no beforeSend hook`).toBeGreaterThan(-1);
      expect(hook, `${p}: hook must precede the element`).toBeLessThan(element);
      // fbclid must not be on the allowlist, however it grows.
      expect(html.slice(hook, element), p).not.toContain('fbclid');
    }
  });
});
