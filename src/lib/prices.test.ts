// src/lib/prices.test.ts
import { describe, it, expect } from 'vitest';
import { PRICES, format, annualSavingsPct } from './prices';

describe('prices', () => {
  it('single EUR price list (monthly + yearly)', () => {
    expect(PRICES).toHaveLength(2);
    expect(PRICES[0]).toMatchObject({ period: 'month', amount: 9.99, currency: 'EUR' });
    expect(PRICES[1]).toMatchObject({ period: 'year', amount: 79.99, currency: 'EUR' });
  });

  it('format places the euro symbol before the amount', () => {
    expect(format(PRICES[0])).toBe('€9.99');
    expect(format(PRICES[1])).toBe('€79.99');
  });

  it('annual savings ~33%', () => {
    expect(annualSavingsPct()).toBe(33);
  });
});
