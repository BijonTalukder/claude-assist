import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { ProjectInfo, ProjectStats } from '@claude-assist/types';
import { FrameworkDetector, type PackageJsonShape } from './detectors/framework-detector.js';
import { LanguageDetector } from './detectors/language-detector.js';
import { PackageManagerDetector } from './detectors/package-manager-detector.js';
import { ProjectStatsCollector } from './stats/project-stats-collector.js';

export interface ProjectScanResult {
  project: ProjectInfo;
  stats: ProjectStats;
}

/**
 * Orchestrates framework/language/package-manager detection and file stats
 * collection for a single project root.
 */
export class ProjectScanner {
  constructor(
    private readonly frameworkDetector: FrameworkDetector = new FrameworkDetector(),
    private readonly languageDetector: LanguageDetector = new LanguageDetector(),
    private readonly packageManagerDetector: PackageManagerDetector = new PackageManagerDetector(),
    private readonly statsCollector: ProjectStatsCollector = new ProjectStatsCollector(),
  ) {}

  async scan(rootPath: string): Promise<ProjectScanResult> {
    const [packageJson, collected] = await Promise.all([
      this.readPackageJson(rootPath),
      this.statsCollector.collectFiles(rootPath),
    ]);

    const stats = await this.statsCollector.collectStats(rootPath, collected);

    const project: ProjectInfo = {
      name: packageJson?.name ?? basename(rootPath),
      rootPath,
      framework: this.frameworkDetector.detect(rootPath, packageJson),
      language: this.languageDetector.detect(rootPath, collected.extensionCounts),
      packageManager: this.packageManagerDetector.detect(rootPath),
    };

    return { project, stats };
  }

  private async readPackageJson(rootPath: string): Promise<PackageJsonShape | null> {
    try {
      const raw = await readFile(join(rootPath, 'package.json'), 'utf8');
      return JSON.parse(raw) as PackageJsonShape;
    } catch {
      return null;
    }
  }
}
