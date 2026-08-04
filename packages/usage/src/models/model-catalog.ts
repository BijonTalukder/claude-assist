export type ModelFamily = 'haiku' | 'sonnet' | 'opus' | 'unknown';

export interface ModelCatalogEntry {
  family: ModelFamily;
  displayName: string;
}

// Raw model ids seen in session files (e.g. "claude-sonnet-5", "claude-haiku-4-5-20251001")
// aren't a closed set — new dated variants ship over time. Matching by family keyword,
// rather than an exact id list, means new model versions resolve correctly without a code change.
const FAMILY_PATTERNS: Array<{ pattern: RegExp; family: ModelFamily; displayName: string }> = [
  { pattern: /haiku/i, family: 'haiku', displayName: 'Claude Haiku' },
  { pattern: /sonnet/i, family: 'sonnet', displayName: 'Claude Sonnet' },
  { pattern: /opus/i, family: 'opus', displayName: 'Claude Opus' },
];

export function resolveModel(rawModelId: string): ModelCatalogEntry {
  for (const { pattern, family, displayName } of FAMILY_PATTERNS) {
    if (pattern.test(rawModelId)) {
      return { family, displayName };
    }
  }
  return { family: 'unknown', displayName: rawModelId };
}
