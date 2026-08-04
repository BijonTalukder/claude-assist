import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Language } from '@claude-assist/types';

interface LanguageRule {
  language: Language;
  /** Marker files that unambiguously identify the language. */
  markers?: string[];
  /** Source extensions that count towards this language. */
  extensions?: string[];
}

const LANGUAGE_RULES: LanguageRule[] = [
  { language: 'dart', markers: ['pubspec.yaml'] },
  { language: 'typescript', markers: ['tsconfig.json'] },
  { language: 'python', markers: ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'] },
  { language: 'java', markers: ['pom.xml', 'build.gradle', 'build.gradle.kts'] },
  { language: 'go', markers: ['go.mod'] },
  { language: 'ruby', markers: ['Gemfile', 'Rakefile'] },
  { language: 'php', markers: ['composer.json'] },
  { language: 'rust', markers: ['Cargo.toml'] },
];

const LANGUAGE_EXTENSIONS: Array<{ language: Language; extensions: string[] }> = [
  { language: 'typescript', extensions: ['.ts', '.tsx'] },
  { language: 'javascript', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  { language: 'dart', extensions: ['.dart'] },
  { language: 'python', extensions: ['.py'] },
  { language: 'java', extensions: ['.java'] },
  { language: 'csharp', extensions: ['.cs'] },
  { language: 'go', extensions: ['.go'] },
  { language: 'ruby', extensions: ['.rb'] },
  { language: 'php', extensions: ['.php'] },
  { language: 'rust', extensions: ['.rs'] },
];

function countExtensions(extensionCounts: Map<string, number>, extensions: string[]): number {
  return extensions.reduce((sum, ext) => sum + (extensionCounts.get(ext) ?? 0), 0);
}

export class LanguageDetector {
  detect(rootPath: string, extensionCounts: Map<string, number>): Language {
    // Marker files are authoritative — a Python project won't have a Cargo.toml.
    for (const rule of LANGUAGE_RULES) {
      if (rule.markers?.some((marker) => existsSync(join(rootPath, marker)))) {
        return rule.language;
      }
    }

    // Otherwise pick the language with the most source files.
    let best: Language = 'unknown';
    let bestCount = 0;
    for (const { language, extensions } of LANGUAGE_EXTENSIONS) {
      const count = countExtensions(extensionCounts, extensions);
      if (count > bestCount) {
        bestCount = count;
        best = language;
      }
    }

    return best;
  }
}