// src/lib/prices.test.ts
import { describe, it, expect } from 'vitest';
import { PRICES, format, annualSavingsPct } from './prices';

describe('prices', () => {
  it('SE prices', () => {
    expect(PRICES.SE[0].amount).toBe(109);
    expect(PRICES.SE[1].amount).toBe(799);
  });

  it('EU prices', () => {
    expect(PRICES.EU[0].amount).toBe(9.99);
    expect(PRICES.EU[1].amount).toBe(79.99);
  });

  it('format uses correct symbol position', () => {
    expect(format(PRICES.SE[0])).toBe('109 kr');
    expect(format(PRICES.EU[0])).toBe('€9.99');
  });

  it('annual savings ~39% (SE) and ~33% (EU)', () => {
    expect(annualSavingsPct('SE')).toBe(39);
    expect(annualSavingsPct('EU')).toBe(33);
  });
});
