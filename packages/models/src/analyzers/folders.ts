/** Well-known generated/build output folders that add noise to project context. */
export const GENERATED_FOLDER_NAMES = [
  'dist',
  'build',
  'out',
  '.next',
  'coverage',
  '.turbo',
  '.vercel',
  'target',
  'bin',
  'obj',
  '.dart_tool',
];

/** Well-known dependency/cache folders (per language) that should stay out of context. */
export const DEPENDENCY_FOLDER_NAMES = ['node_modules', 'vendor', 'venv', '.venv', '__pycache__'];

/** Lockfiles that imply a package manager, checked in priority order. */
export const LOCKFILE_MANAGERS: Array<{ file: string; manager: string }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'bun.lockb', manager: 'bun' },
  { file: 'package-lock.json', manager: 'npm' },
];