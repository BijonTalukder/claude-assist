import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface DiscoveredSessionFile {
  /** Raw, encoded directory name — e.g. "-home-bijon-Desktop-Projects-claude". Not decoded; see raw-event.ts. */
  projectDirName: string;
  filePath: string;
  /** Session UUID, taken from the filename (and cross-checked against the file's own `sessionId` field when parsed). */
  sessionId: string;
}

const SESSION_FILE_EXTENSION = '.jsonl';

/** Walks `~/.claude/projects/*` for session files. Missing directories are not an error — just no results. */
export class SessionFileDiscovery {
  async discover(projectsDir: string): Promise<DiscoveredSessionFile[]> {
    const projectDirs = await readdir(projectsDir, { withFileTypes: true }).catch(() => []);
    const results: DiscoveredSessionFile[] = [];

    for (const projectDir of projectDirs) {
      if (!projectDir.isDirectory()) continue;

      const projectDirPath = join(projectsDir, projectDir.name);
      const files = await readdir(projectDirPath, { withFileTypes: true }).catch(() => []);

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(SESSION_FILE_EXTENSION)) continue;

        results.push({
          projectDirName: projectDir.name,
          filePath: join(projectDirPath, file.name),
          sessionId: file.name.slice(0, -SESSION_FILE_EXTENSION.length),
        });
      }
    }

    return results;
  }
}
