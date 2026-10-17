import type { Minor } from './money';

export interface AllocationConfig {
  /** Percentage of income suggested for investment. Default 30. */
  investmentPct: number;
  /** Relative weights for personal categories (these are relative and will be normalized).
   *  Typical defaults sum to 100 (40/25/20/15) and represent the split of the PERSONAL bucket.
   *  The personal weights do NOT need to sum to any particular value; they will be normalized
   *  internally. If investmentPct < 100, the personal bucket receives (100 - investmentPct)%
   *  of the income and the personal weights divide that bucket among categories.
   */
  personal: {
    needs: number;
    savings: number;
    wants: number;
    selfGrowth: number;
  };
}

export const DEFAULT_ALLOCATION: AllocationConfig = {
  investmentPct: 30,
  personal: { needs: 40, savings: 25, wants: 20, selfGrowth: 15 },
};

export interface AllocationBreakdown {
  income: Minor;
  investment: Minor;
  personalTotal: Minor;
  personal: { needs: Minor; savings: Minor; wants: Minor; selfGrowth: Minor };
  /** Sum of every bucket — MUST equal income exactly. */
  reconciledTotal: Minor;
}

type BucketKey = 'investment' | 'needs' | 'savings' | 'wants' | 'selfGrowth';

/**
 * Split income according to an allocation config.
 * Uses largest-remainder rounding so buckets always sum exactly to `income`.
 *
 * Personal fields in the config are treated as relative weights (they are normalized internally).
 */
export function splitIncome(income: Minor, config: AllocationConfig): AllocationBreakdown {
  assertValidConfig(config);

  // Compute sum of personal weights. If investmentPct < 100, we'll allocate the remaining
  // percentage among the personal categories according to these weights.
  const personalWeights = [
    { key: 'needs', v: config.personal.needs },
    { key: 'savings', v: config.personal.savings },
    { key: 'wants', v: config.personal.wants },
    { key: 'selfGrowth', v: config.personal.selfGrowth },
  ] as const;

  const sumPersonalWeights = personalWeights.reduce((s, p) => s + p.v, 0);

  // Build the final percentage buckets (as percentages of the original income).
  const buckets: Array<{ key: BucketKey; pct: number }> = [];
  buckets.push({ key: 'investment', pct: config.investmentPct });

  const personalBucketPct = Math.max(0, 100 - config.investmentPct);

  if (personalBucketPct > 0) {
    if (sumPersonalWeights <= 0) {
      throw new Error('Personal allocation weights must sum to a positive value when investmentPct < 100.');
    }
    for (const p of personalWeights) {
      const pct = (personalBucketPct * p.v) / sumPersonalWeights;
      buckets.push({ key: p.key as BucketKey, pct });
    }
  } else {
    // No personal allocation (investmentPct is 100) — set personal pct to 0
    for (const p of personalWeights) buckets.push({ key: p.key as BucketKey, pct: 0 });
  }

  // Largest-remainder method across all final buckets
  const raw = buckets.map(b => ({ ...b, exact: (income * b.pct) / 100 }));
  const floored = raw.map(b => ({ ...b, floor: Math.floor(b.exact), rem: b.exact - Math.floor(b.exact) }));
  let remaining = income - floored.reduce((s, b) => s + b.floor, 0);

  // Distribute remaining minor units to largest fractional parts (stable by original order for ties)
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  const bump = new Map<BucketKey, number>();
  for (let i = 0; i < remaining; i++) {
    const k = order[i % order.length].key as BucketKey;
    bump.set(k, (bump.get(k) ?? 0) + 1);
  }

  const get = (k: BucketKey) => {
    const b = floored.find(x => x.key === k)!;
    return (b.floor as number) + (bump.get(k) ?? 0);
  };

  const investment = get('investment');
  const personal = {
    needs: get('needs'),
    savings: get('savings'),
    wants: get('wants'),
    selfGrowth: get('selfGrowth'),
  };
  const personalTotal = personal.needs + personal.savings + personal.wants + personal.selfGrowth;

  const result: AllocationBreakdown = {
    income,
    investment,
    personalTotal,
    personal,
    reconciledTotal: investment + personalTotal,
  };

  // Hard invariant — never ship a plan that doesn't reconcile.
  if (result.reconciledTotal !== income) {
    throw new Error(`Allocation reconciliation failed: ${result.reconciledTotal} != ${income}`);
  }
  return result;
}

export function assertValidConfig(c: AllocationConfig): void {
  if (typeof c.investmentPct !== 'number' || Number.isNaN(c.investmentPct)) {
    throw new Error('investmentPct must be a number');
  }
  if (c.investmentPct < 0 || c.investmentPct > 100) {
    throw new Error('Investment percentage must be between 0 and 100.');
  }
  for (const [k, v] of Object.entries(c.personal)) {
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0) {
      throw new Error(`Personal allocation "${k}" must be a non-negative number.`);
    }
  }
  // If there's any personal bucket to allocate, weights must sum to > 0
  const sum =
    c.personal.needs + c.personal.savings + c.personal.wants + c.personal.selfGrowth;
  if (c.investmentPct < 100 && sum <= 0) {
    throw new Error('Personal allocation weights must sum to a positive value when investmentPct < 100.');
  }
}
