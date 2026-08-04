import type { Framework } from '@claude-assist/types';

export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/.vercel/**',
  '**/vendor/**',
  '**/*.min.js',
];

/** Extensions counted towards source lines of code. */
export const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.dart',
  '.vue',
  '.svelte',
  '.py',
  '.go',
  '.rb',
  '.java',
  '.kt',
  '.php',
  '.cs',
]);

/** Checked in order — the first dependency match wins. */
export const FRAMEWORK_DEPENDENCY_RULES: Array<{ framework: Framework; dependencies: string[] }> = [
  { framework: 'nextjs', dependencies: ['next'] },
  { framework: 'nestjs', dependencies: ['@nestjs/core'] },
  { framework: 'express', dependencies: ['express'] },
  { framework: 'react', dependencies: ['react'] },
];

export const BUILD_OUTPUT_FOLDER_NAMES = new Set(['dist', 'build', 'out', '.next']);
