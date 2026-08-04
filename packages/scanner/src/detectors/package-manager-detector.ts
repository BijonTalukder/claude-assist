import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PackageManager } from '@claude-assist/types';

const LOCKFILE_MANAGERS: Array<{ file: string; manager: PackageManager }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'bun.lockb', manager: 'bun' },
  { file: 'package-lock.json', manager: 'npm' },
];

export class PackageManagerDetector {
  detect(rootPath: string): PackageManager {
    for (const { file, manager } of LOCKFILE_MANAGERS) {
      if (existsSync(join(rootPath, file))) return manager;
    }
    return 'unknown';
  }
}
