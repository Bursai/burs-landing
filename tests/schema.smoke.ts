// tests/schema.smoke.ts
// Asserts against the BUILT output — see tests/dist.ts. The walk lives in
// beforeAll, not in the describe body (which runs at DISCOVERY time), so a
// clean checkout without dist/ fails these suites with an explicit message
// instead of aborting the entire Vitest run before any file executes.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { walkDist } from './dist';

describe('schema.org JSON-LD', () => {
  let htmls: string[] = [];
  beforeAll(() => {
    htmls = walkDist();
  });

  it('every page has at least one ld+json block', () => {
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      expect(s, p).toMatch(/<script[^>]+application\/ld\+json/);
    }
  });

  it('every ld+json parses as JSON', () => {
    const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g;
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = re.exec(s)) !== null) {
        expect(() => JSON.parse(m![1]), `${p}: ${m![1].slice(0, 80)}…`).not.toThrow();
      }
    }
  });

  it('every page has Organization schema (from Base layout)', () => {
    for (const p of htmls) {
      const s = readFileSync(p, 'utf8');
      expect(s, p).toMatch(/"@type":"Organization"/);
    }
  });
});
