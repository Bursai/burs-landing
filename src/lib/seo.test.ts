// src/lib/seo.test.ts
import { describe, it, expect } from 'vitest';
import { buildSeo } from './seo';

describe('buildSeo', () => {
  it('builds canonical and og from a path', () => {
    const r = buildSeo({ title: 'X', description: 'Y', path: '/manifesto' });
    expect(r.canonical).toBe('https://burs.me/manifesto');
    expect(r.ogImage).toBe('https://burs.me/og-image.png');
    expect(r.type).toBe('website');
  });

  it('uses provided og when given', () => {
    const r = buildSeo({ title: 'X', description: 'Y', path: '/x', ogImage: '/og/x.png' });
    expect(r.ogImage).toBe('https://burs.me/og/x.png');
  });
});
