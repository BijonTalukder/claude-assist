import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis } from '../types/analysis.js';
import { DEPENDENCY_FOLDER_NAMES, LOCKFILE_MANAGERS } from './folders.js';

/**
 * Inspects the dependency/lockfile layout: which package manager is in use,
 * whether a lockfile and `node_modules` exist on disk, and which dependency
 * folders are present.
 */
export class PackageAnalyzer implements Analyzer {
  readonly name = 'package';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    const rootPath = input.project.rootPath;

    const lockfileManager = LOCKFILE_MANAGERS.find(({ file }) => existsSync(join(rootPath, file)));
    const dependencyFolders = DEPENDENCY_FOLDER_NAMES.filter((name) => existsSync(join(rootPath, name)));

    return {
      packageManager: input.project.packageManager,
      hasLockfile: lockfileManager !== undefined,
      hasNodeModules: dependencyFolders.includes('node_modules'),
      dependencyFolders,
    };
  }
}