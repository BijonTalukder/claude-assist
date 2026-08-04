import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Framework } from '@claude-assist/types';
import { FRAMEWORK_DEPENDENCY_RULES } from '../constants.js';

export interface PackageJsonShape {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class FrameworkDetector {
  detect(rootPath: string, packageJson: PackageJsonShape | null): Framework {
    const dependencies = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

    for (const rule of FRAMEWORK_DEPENDENCY_RULES) {
      if (rule.dependencies.some((dependency) => dependency in dependencies)) {
        return rule.framework;
      }
    }

    if (existsSync(join(rootPath, 'pubspec.yaml'))) {
      return 'flutter';
    }

    return 'unknown';
  }
}
