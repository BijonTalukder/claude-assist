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
 *
 * Pricing is resolved per exact model id (see `MODEL_PRICING_ENTRIES`), so a dated
 * variant like `claude-sonnet-4-5-20250929` maps to the right tier. Unmapped ids fall
 * back to the family tier below. These are approximate public list prices; update this
 * file if pricing changes.
 */
export const PRICING_TABLE: Record<ModelFamily, ModelPricing> = {
  haiku: {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
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

/**
 * Explicit per-model pricing keyed by the exact model id Claude Code stores in a
 * session's usage block. This is the "model-wise pricing map":
 *
 *   { "model": "claude-sonnet-4", input_tokens, output_tokens,
 *     cache_creation_input_tokens, cache_read_input_tokens }
 *
 * Tokens are multiplied by these rates to compute real, per-model cost. Any model id
 * not listed here falls back to its family tier in `PRICING_TABLE`.
 */
export const MODEL_PRICING_ENTRIES: Record<string, ModelPricing> = {
  // Sonnet 4 family: claude-sonnet-4, claude-sonnet-4-5, claude-3-5-sonnet
  'claude-sonnet-4': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  'claude-sonnet-4-5': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  'claude-sonnet-4-5-20250929': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  'claude-3-5-sonnet': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  'claude-3-5-sonnet-20241022': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },
  'claude-3-5-sonnet-20240620': {
    inputPerMillionTokens: 3,
    outputPerMillionTokens: 15,
    cacheReadPerMillionTokens: 0.3,
    cacheWritePerMillionTokens: 3.75,
  },

  // Opus 4 family: claude-opus-4, claude-opus-4-1, claude-3-opus
  'claude-opus-4': {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },
  'claude-opus-4-1': {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },
  'claude-opus-4-1-20250805': {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },
  'claude-3-opus': {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },
  'claude-3-opus-20240229': {
    inputPerMillionTokens: 15,
    outputPerMillionTokens: 75,
    cacheReadPerMillionTokens: 1.5,
    cacheWritePerMillionTokens: 18.75,
  },

  // Haiku family: claude-haiku-4, claude-haiku-4-5, claude-3-5-haiku
  'claude-haiku-4': {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
  },
  'claude-haiku-4-5': {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
  },
  'claude-haiku-4-5-20251001': {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
  },
  'claude-3-5-haiku': {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
  },
  'claude-3-5-haiku-20241022': {
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 5,
    cacheReadPerMillionTokens: 0.1,
    cacheWritePerMillionTokens: 1.25,
  },
  // Legacy first-gen Haiku — a cheaper tier than 3.5/4/4.5.
  'claude-3-haiku-20240307': {
    inputPerMillionTokens: 0.25,
    outputPerMillionTokens: 1.25,
    cacheReadPerMillionTokens: 0.03,
    cacheWritePerMillionTokens: 0.3,
  },
};

/**
 * Returns the most specific pricing for `modelId`: an exact-model entry wins,
 * otherwise the id's family tier (or the `unknown` zero-price tier).
 */
export function resolvePricing(modelId: string, family: ModelFamily): ModelPricing {
  return MODEL_PRICING_ENTRIES[modelId] ?? PRICING_TABLE[family];
}