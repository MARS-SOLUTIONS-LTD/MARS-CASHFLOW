import { describe, it, expect } from 'vitest';
import { splitIncome, DEFAULT_ALLOCATION } from './allocation';

describe('splitIncome', () => {
  it('TEST 1: 100,000 → 30,000 investment / 70,000 personal', () => {
    const r = splitIncome(100_000, DEFAULT_ALLOCATION);
    expect(r.investment).toBe(30_000);
    expect(r.personalTotal).toBe(70_000);
  });

  it('TEST 2: personal buckets sum exactly to personal total', () => {
    const r = splitIncome(100_000, DEFAULT_ALLOCATION);
    const sum = Object.values(r.personal).reduce((a, b) => a + b, 0);
    expect(sum).toBe(r.personalTotal);
  });

  it('handles odd amounts without rounding drift', () => {
    for (const amount of [1, 7, 999, 10_001, 333_333, 1_000_007]) {
      const r = splitIncome(amount, DEFAULT_ALLOCATION);
      expect(r.reconciledTotal).toBe(amount);
    }
  });
});
