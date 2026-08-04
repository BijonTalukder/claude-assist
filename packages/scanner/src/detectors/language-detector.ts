import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Language } from '@claude-assist/types';

export class LanguageDetector {
  detect(rootPath: string, extensionCounts: Map<string, number>): Language {
    if (existsSync(join(rootPath, 'pubspec.yaml'))) return 'dart';
    if (existsSync(join(rootPath, 'tsconfig.json'))) return 'typescript';

    const typescriptCount = (extensionCounts.get('.ts') ?? 0) + (extensionCounts.get('.tsx') ?? 0);
    const javascriptCount =
      (extensionCounts.get('.js') ?? 0) +
      (extensionCounts.get('.jsx') ?? 0) +
      (extensionCounts.get('.mjs') ?? 0) +
      (extensionCounts.get('.cjs') ?? 0);
    const dartCount = extensionCounts.get('.dart') ?? 0;

    if (dartCount > typescriptCount && dartCount > javascriptCount) return 'dart';
    if (typescriptCount > 0) return 'typescript';
    if (javascriptCount > 0) return 'javascript';
    return 'unknown';
  }
}
