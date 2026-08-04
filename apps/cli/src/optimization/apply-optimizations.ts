import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OptimizationPlan } from './types.js';

const MAX_CHANGED_FILES_FOR_FOCUS = 30;

export interface ApplyResult {
  claudeignoreWritten: boolean;
}

/**
 * Applies the plan's file-system optimizations. Currently that means writing a
 * `.claudeignore` when one is missing. It never overwrites an existing file and
 * never touches source code.
 */
export function applyOptimizations(plan: OptimizationPlan): ApplyResult {
  let claudeignoreWritten = false;

  if (plan.claudeIgnoreContent && !plan.hasClaudeIgnore) {
    writeFileSync(join(plan.rootPath, '.claudeignore'), plan.claudeIgnoreContent, 'utf8');
    claudeignoreWritten = true;
  }

  return { claudeignoreWritten };
}

export interface LaunchBuildInput {
  rootPath: string;
  claudeArgs: string[];
  changedFilePaths: string[];
  useChangedFiles: boolean;
  focusPackage: string | null;
  /** The "Project Focus" block to seed into Claude's system prompt. */
  focusPrompt?: string | null;
}

export interface LaunchBuildResult {
  args: string[];
  cwd: string;
  /** Seeded via --append-system-prompt when present. */
  systemPrompt: string | null;
  focusMessage: string | null;
}

/**
 * Builds the optimized launch context: seeds Claude with the changed files when
 * that optimization is active, and attaches the focus prompt. Source code is not
 * modified — only the context handed to Claude.
 */
export function buildLaunchContext(input: LaunchBuildInput): LaunchBuildResult {
  const changed = input.useChangedFiles ? input.changedFilePaths.slice(0, MAX_CHANGED_FILES_FOR_FOCUS) : [];

  return {
    args: [...changed, ...input.claudeArgs],
    cwd: input.rootPath,
    systemPrompt: input.focusPrompt ?? null,
    focusMessage: changed.length > 0 ? `Seeding Claude with ${changed.length} changed file(s).` : null,
  };
}
