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

// Friendly, human-facing labels for the model ids we know about. Anything not listed here
// falls back to the family label above, so a brand-new dated variant never shows raw id noise.
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Sonnet family
  'claude-sonnet-5': 'Claude Sonnet 5',
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-sonnet-4': 'Claude Sonnet 4',
  'claude-3-5-sonnet': 'Claude Sonnet 3.5',
  'claude-3-5-sonnet-20241022': 'Claude Sonnet 3.5',
  'claude-3-5-sonnet-20240620': 'Claude Sonnet 3.5',
  // Opus family
  'claude-opus-5': 'Claude Opus 5',
  'claude-opus-4-1': 'Claude Opus 4.1',
  'claude-opus-4-1-20250805': 'Claude Opus 4.1',
  'claude-opus-4': 'Claude Opus 4',
  'claude-3-opus': 'Claude Opus 3',
  'claude-3-opus-20240229': 'Claude Opus 3',
  // Haiku family
  'claude-haiku-4-5': 'Claude Haiku 4.5',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-haiku-4': 'Claude Haiku 4',
  'claude-3-5-haiku': 'Claude Haiku 3.5',
  'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
  'claude-3-haiku-20240307': 'Claude Haiku 3',
};

export function resolveModel(rawModelId: string): ModelCatalogEntry {
  for (const { pattern, family, displayName } of FAMILY_PATTERNS) {
    if (pattern.test(rawModelId)) {
      return { family, displayName: MODEL_DISPLAY_NAMES[rawModelId] ?? displayName };
    }
  }
  return { family: 'unknown', displayName: rawModelId };
}
