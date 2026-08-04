import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis } from '../types/analysis.js';
import { DEPENDENCY_FOLDER_NAMES, GENERATED_FOLDER_NAMES } from './folders.js';

function ignoresAny(content: string, names: string[]): boolean {
  const pattern = new RegExp(
    names
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|'),
    'i',
  );
  return pattern.test(content);
}

/**
 * Inspects whether a `.claudeignore` exists and whether it already excludes the
 * folders that typically bloat context (node_modules and generated output).
 */
export class ClaudeIgnoreAnalyzer implements Analyzer {
  readonly name = 'claudeignore';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    const file = join(input.project.rootPath, '.claudeignore');
    if (!existsSync(file)) {
      return { hasClaudeIgnore: false };
    }

    let content = '';
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      content = '';
    }

    return {
      hasClaudeIgnore: true,
      claudeIgnoreIgnoresNodeModules: ignoresAny(content, DEPENDENCY_FOLDER_NAMES.filter((name) => name === 'node_modules')),
      claudeIgnoreIgnoresGenerated: ignoresAny(content, GENERATED_FOLDER_NAMES),
    };
  }
}