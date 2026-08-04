import type { ModelFamily } from '../models/model-catalog.js';

export interface ModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
  cacheReadPerMillionTokens: number;
  cacheWritePerMillionTokens: number;
}

/**
 * Static, offline pricing table (USD per million tokens). Claude Code's local session
 * files never include a cost figure and this machine's own model-cost cache
 * (~/.claude.json → additionalModelCostsCache) was empty, so there is no local source
 * of truth to read cost from — it has to be computed from a hardcoded table instead.
 * These are approximate public list prices; update this file if pricing changes.
 */
export const PRICING_TABLE: Record<ModelFamily, ModelPricing> = {
  haiku: {
    inputPerMillionTokens: 0.25,
    outputPerMillionTokens: 1.25,
    cacheReadPerMillionTokens: 0.03,
    cacheWritePerMillionTokens: 0.3,
  },
  sonnet: {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  opus: {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },
  // Unrecognized/future model ids: priced at 0 rather than guessed, so an unmapped
  // model silently shows as $0 cost instead of skewing totals with a wrong tier's rate.
  unknown: {
    inputPerMillionTokens: 0,
    outputPerMillionTokens: 0,
    cacheReadPerMillionTokens: 0,
    cacheWritePerMillionTokens: 0,
  },
};
