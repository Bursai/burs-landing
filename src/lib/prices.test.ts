// src/lib/prices.test.ts
import { describe, it, expect } from 'vitest';
import { PRICES, format, annualSavingsPct } from './prices';

describe('prices', () => {
  it('SE prices', () => {
    expect(PRICES.SE[0].amount).toBe(119);
    expect(PRICES.SE[1].amount).toBe(899);
  });

  it('EU prices', () => {
    expect(PRICES.EU[0].amount).toBe(10.99);
    expect(PRICES.EU[1].amount).toBe(89.99);
  });

  it('format uses correct symbol position', () => {
    expect(format(PRICES.SE[0])).toBe('119 kr');
    expect(format(PRICES.EU[0])).toBe('€10.99');
  });

  it('annual savings ~37% (SE) and ~32% (EU)', () => {
    expect(annualSavingsPct('SE')).toBe(37);
    expect(annualSavingsPct('EU')).toBe(32);
  });
});
