import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RecommendationInput } from '@claude-assist/types';
import type { Analyzer, ProjectAnalysis } from '../types/analysis.js';
import { GENERATED_FOLDER_NAMES } from './folders.js';

/**
 * Inspects the project's manifest/build layout: package.json, tsconfig, and which
 * generated output folders exist at the root. Produces no suggestions itself.
 */
export class ProjectAnalyzer implements Analyzer {
  readonly name = 'project';

  analyze(input: RecommendationInput): Partial<ProjectAnalysis> {
    const rootPath = input.project.rootPath;

    const generatedFolders = GENERATED_FOLDER_NAMES.filter((name) => existsSync(join(rootPath, name)));

    return {
      language: input.project.language,
      hasPackageJson: existsSync(join(rootPath, 'package.json')),
      hasTsConfig: existsSync(join(rootPath, 'tsconfig.json')),
      hasBuildFolder: generatedFolders.length > 0,
      generatedFolders,
    };
  }
}