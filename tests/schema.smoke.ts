// tests/schema.smoke.ts
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

describe('schema.org JSON-LD', () => {
  const htmls = walk('dist');

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
