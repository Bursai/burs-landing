// src/lib/prices.test.ts
import { describe, it, expect } from 'vitest';
import { PRICES, FOUNDING, TRIAL_DAYS, format, annualSavingsPct, foundingSavingsPct } from './prices';

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

describe('founding membership', () => {
  it('is €29.99 for the first year', () => {
    expect(FOUNDING.amount).toBe(29.99);
    expect(FOUNDING.currency).toBe('EUR');
    expect(FOUNDING.period).toBe('year');
    expect(format(FOUNDING)).toBe('€29.99');
  });

  it('renews at the standard annual price', () => {
    const year = PRICES.find(p => p.period === 'year')!;
    expect(FOUNDING.renewsAt).toBe(year.amount);
  });

  it('saves ~63% against the standard annual price', () => {
    expect(foundingSavingsPct()).toBe(63);
  });

  it('is cheaper than the standard year it replaces', () => {
    expect(FOUNDING.amount).toBeLessThan(FOUNDING.renewsAt);
  });
});

describe('free trial', () => {
  it('is 30 days', () => {
    expect(TRIAL_DAYS).toBe(30);
  });
});
