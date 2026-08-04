import type { Language } from '@claude-assist/types';

interface LanguageIgnoreRule {
  folders: string[];
  patterns: string[];
}

/** Folder/pattern lists keyed by the language the scanner detected. */
const LANGUAGE_RULES: Partial<Record<Language, LanguageIgnoreRule>> = {
  typescript: {
    folders: ['node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.turbo'],
    patterns: ['*.tsbuildinfo', '*.d.ts.map', '.vercel'],
  },
  javascript: {
    folders: ['node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.turbo'],
    patterns: ['.vercel'],
  },
  dart: {
    folders: ['build', '.dart_tool'],
    patterns: [],
  },
  python: {
    folders: ['__pycache__', '.venv', 'venv', '.pytest_cache'],
    patterns: ['*.pyc', '.mypy_cache', '.ruff_cache'],
  },
  java: {
    folders: ['target'],
    patterns: ['.gradle'],
  },
  csharp: {
    folders: ['bin', 'obj'],
    patterns: [],
  },
  go: {
    folders: ['vendor'],
    patterns: ['bin'],
  },
  ruby: {
    folders: ['vendor/bundle'],
    patterns: [],
  },
  php: {
    folders: ['vendor'],
    patterns: [],
  },
  rust: {
    folders: ['target'],
    patterns: [],
  },
};

/** Patterns added when the project is a monorepo so each workspace stays lean. */
const MONOREPO_PATTERNS = [
  '**/node_modules',
  '**/dist',
  '**/build',
  '**/out',
  '**/coverage',
  '**/.next',
  '**/.turbo',
  '**/target',
  '**/vendor',
];

/**
 * Builds a language-aware `.claudeignore` from a template. Never overwrites: the
 * caller only writes this content when no `.claudeignore` exists yet. The list is a
 * template, not a strict reflection of what's on disk, so it keeps ignoring the
 * same folders after they are regenerated.
 */
export function buildClaudeIgnoreContent(language: Language, isMonorepo: boolean): string {
  const lines = [
    '# Claude Assist — automatically generated context exclusions.',
    '# Regenerate or edit freely; Claude Code reads this file to keep context focused.',
    '',
  ];

  const rule = LANGUAGE_RULES[language];

  if (isMonorepo) {
    lines.push('# Monorepo workspaces', ...MONOREPO_PATTERNS, '');
  } else if (rule) {
    lines.push('# Dependency & build folders', ...rule.folders, ...rule.patterns, '');
  } else {
    // Unknown language — a conservative baseline.
    lines.push('# Dependency & build folders', 'node_modules', 'dist', 'build', 'coverage', '');
  }

  return lines.join('\n');
}
