import type { TokenEstimate } from './types.js';

/**
 * Rough per-file token heuristic. Real tokenization is overkill here — the goal is
 * an order-of-magnitude reduction estimate, not an exact count.
 */
const AVG_TOKENS_PER_FILE = 400;

/** How much focusing a single monorepo package cuts the remaining context. */
const FOCUS_PACKAGE_FACTOR = 0.3;

export interface TokenEstimationInput {
  /** Tokens from the already-scanned source (excludes ignored folders). */
  scannedSourceTokens: number;
  /** present folder -> number of files in it (capped). */
  folderFileCounts: Map<string, number>;
  changedFiles: number;
  focusCurrentPackage: boolean;
  useChangedFiles: boolean;
}

/**
 * Heuristic estimate of the context Claude would load today (everything,
 * including node_modules/build output) vs. after optimization, and the reduction.
 *
 * The scanner ignores node_modules/dist/etc. when computing `scannedSourceTokens`,
 * so the "current" number adds those back via per-folder file counts, and the
 * "optimized" number starts from the scanned source and only gets smaller.
 */
export function estimateTokens(input: TokenEstimationInput): TokenEstimate {
  const { scannedSourceTokens, folderFileCounts } = input;

  const noiseTokens = Array.from(folderFileCounts.values()).reduce(
    (sum, count) => sum + count * AVG_TOKENS_PER_FILE,
    0,
  );

  const currentTokens = scannedSourceTokens + noiseTokens;

  let optimizedTokens = Math.max(scannedSourceTokens, 0);

  if (input.useChangedFiles) {
    // Launching on only the changed files makes the context the changed files alone.
    optimizedTokens = input.changedFiles * AVG_TOKENS_PER_FILE;
  } else if (input.focusCurrentPackage) {
    optimizedTokens = Math.round(optimizedTokens * FOCUS_PACKAGE_FACTOR);
  }

  return {
    currentTokens,
    optimizedTokens,
    reductionPercent: reductionPercent(currentTokens, optimizedTokens),
  };
}

function reductionPercent(current: number, optimized: number): number {
  if (current <= 0) return 0;
  const reduction = Math.round((1 - optimized / current) * 100);
  return Math.min(Math.max(reduction, 0), 99);
}
