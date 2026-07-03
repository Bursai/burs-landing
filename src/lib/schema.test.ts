// src/lib/schema.test.ts
import { describe, it, expect } from 'vitest';
import { organization, faqPage, article, howTo, breadcrumbs, product } from './schema';

describe('schema', () => {
  it('organization has @context and @type', () => {
    const o = organization();
    expect(o['@context']).toBe('https://schema.org');
    expect(o['@type']).toBe('Organization');
  });

  it('faqPage builds mainEntity', () => {
    const f = faqPage([{ q: 'Q1', a: 'A1' }]);
    expect((f.mainEntity as any[])[0].name).toBe('Q1');
  });

  it('article includes datePublished and url as mainEntityOfPage', () => {
    const a = article({ headline: 'h', description: 'd', url: 'https://x.com/a', datePublished: '2026-01-01' });
    expect(a.datePublished).toBe('2026-01-01');
    expect(a.mainEntityOfPage).toBe('https://x.com/a');
  });

  it('howTo numbers steps', () => {
    const h = howTo({ name: 'n', description: 'd', steps: [{ name: 's1', text: 't1' }, { name: 's2', text: 't2' }] });
    expect((h.step as any[])[0].position).toBe(1);
    expect((h.step as any[])[1].position).toBe(2);
  });

  it('breadcrumbs orders items', () => {
    const b = breadcrumbs([{ name: 'A', url: 'https://x/a' }, { name: 'B', url: 'https://x/b' }]);
    expect((b.itemListElement as any[])[1].position).toBe(2);
  });

  it('product carries 2 EUR offers (monthly + yearly)', () => {
    const p = product();
    const offers = p.offers as any[];
    expect(offers.length).toBe(2);
    expect(offers.every(o => o.priceCurrency === 'EUR')).toBe(true);
    expect(offers.map(o => o.price)).toEqual([9.99, 79.99]);
  });
});
