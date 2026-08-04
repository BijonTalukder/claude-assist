import type { UsageTokens } from '../types/index.js';
import { resolveModel, type ModelFamily } from '../models/model-catalog.js';
import { PRICING_TABLE, type ModelPricing } from './pricing-table.js';

const TOKENS_PER_MILLION = 1_000_000;

export function calculateCostUsd(tokens: UsageTokens, pricing: ModelPricing): number {
  return (
    (tokens.input / TOKENS_PER_MILLION) * pricing.inputPerMillionTokens +
    (tokens.output / TOKENS_PER_MILLION) * pricing.outputPerMillionTokens +
    (tokens.cacheRead / TOKENS_PER_MILLION) * pricing.cacheReadPerMillionTokens +
    (tokens.cacheCreation / TOKENS_PER_MILLION) * pricing.cacheWritePerMillionTokens
  );
}

export function calculateCostForModel(modelId: string, tokens: UsageTokens): number {
  const { family } = resolveModel(modelId);
  return calculateCostUsd(tokens, PRICING_TABLE[family]);
}

/** Cost `tokens` would have cost under a different model family — used by the Haiku-savings insight. */
export function calculateCostForFamily(family: ModelFamily, tokens: UsageTokens): number {
  return calculateCostUsd(tokens, PRICING_TABLE[family]);
}
