import { simpleGit } from 'simple-git';
import type { GitInfo } from '@claude-assist/types';

export class GitInfoProvider {
  async getInfo(rootPath: string): Promise<GitInfo> {
    const git = simpleGit(rootPath);

    const isRepo = await git.checkIsRepo().catch(() => false);
    if (!isRepo) {
      return {
        isRepo: false,
        branch: null,
        changedFiles: 0,
        untrackedFiles: 0,
        stagedFiles: 0,
        changedFilePaths: [],
      };
    }

    const status = await git.status();
    const untrackedFiles = status.not_added.length;
    const changedFiles = status.files.length - untrackedFiles;
    const stagedFiles = status.staged.length;
    const changedFilePaths = status.files
      .filter((file) => !status.not_added.includes(file.path))
      .map((file) => file.path);

    return {
      isRepo: true,
      branch: status.current,
      changedFiles,
      untrackedFiles,
      stagedFiles,
      changedFilePaths,
    };
  }
}