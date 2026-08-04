import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import fg from 'fast-glob';
import type { FolderSize, ProjectStats } from '@claude-assist/types';
import { DEFAULT_IGNORE_PATTERNS, SOURCE_EXTENSIONS } from '../constants.js';
import { runWithConcurrency } from '../utils/concurrency.js';

const LINE_COUNT_CONCURRENCY = 32;
const MAX_LARGEST_FOLDERS = 5;

export interface CollectedFiles {
  files: string[];
  extensionCounts: Map<string, number>;
}

export class ProjectStatsCollector {
  async collectFiles(rootPath: string): Promise<CollectedFiles> {
    const files = await fg('**/*', {
      cwd: rootPath,
      ignore: DEFAULT_IGNORE_PATTERNS,
      onlyFiles: true,
      dot: false,
    });

    const extensionCounts = new Map<string, number>();
    for (const file of files) {
      const ext = extname(file);
      extensionCounts.set(ext, (extensionCounts.get(ext) ?? 0) + 1);
    }

    return { files, extensionCounts };
  }

  async collectStats(rootPath: string, collected: CollectedFiles): Promise<ProjectStats> {
    const sourceFiles = collected.files.filter((file) => SOURCE_EXTENSIONS.has(extname(file)));
    const lineCounts = await runWithConcurrency(sourceFiles, LINE_COUNT_CONCURRENCY, (file) =>
      this.countLines(rootPath, file),
    );

    return {
      totalFiles: collected.files.length,
      sourceLinesOfCode: lineCounts.reduce((sum, count) => sum + count, 0),
      largestFolders: this.computeLargestFolders(collected.files),
    };
  }

  private async countLines(rootPath: string, relativeFile: string): Promise<number> {
    try {
      const content = await readFile(join(rootPath, relativeFile), 'utf8');
      return content.length === 0 ? 0 : content.split('\n').length;
    } catch {
      // Binary files, permission errors, race conditions with deleted files, etc.
      return 0;
    }
  }

  private computeLargestFolders(files: string[]): FolderSize[] {
    const counts = new Map<string, number>();

    for (const file of files) {
      const topLevelFolder = file.includes('/') ? file.split('/')[0]! : '.';
      counts.set(topLevelFolder, (counts.get(topLevelFolder) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([path, fileCount]) => ({ path, fileCount }))
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, MAX_LARGEST_FOLDERS);
  }
}
