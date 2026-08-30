import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

interface HiddenSessionsFile {
  hiddenSessionIds: string[];
}

/**
 * The dashboard's own list of sessions the user chose to hide. Hiding is reversible and
 * never touches Claude Code's transcript files — it only drops the session from this
 * dashboard's analytics. Persisted as JSON so the choice survives a restart.
 *
 * The in-memory set is the source of truth once loaded; the file is only re-read on the
 * first access. Nothing else writes this file, so there is no reload-on-change to do.
 */
export class HiddenSessionStore {
  private ids: Set<string> | null = null;

  constructor(private readonly filePath: string) {}

  list(): string[] {
    return [...this.load()];
  }

  has(sessionId: string): boolean {
    return this.load().has(sessionId);
  }

  hide(sessionId: string): void {
    const ids = this.load();
    if (ids.has(sessionId)) return;
    ids.add(sessionId);
    this.persist(ids);
  }

  unhide(sessionId: string): void {
    const ids = this.load();
    if (!ids.delete(sessionId)) return;
    this.persist(ids);
  }

  /**
   * Drops a session from the hidden list without rewriting it back in. Called after a
   * hard delete so a hidden-then-deleted session doesn't leave a dangling id behind.
   */
  forget(sessionId: string): void {
    this.unhide(sessionId);
  }

  private load(): Set<string> {
    if (this.ids) return this.ids;

    try {
      const parsed = JSON.parse(readFileSync(this.filePath, 'utf8')) as Partial<HiddenSessionsFile>;
      const ids = Array.isArray(parsed?.hiddenSessionIds) ? parsed.hiddenSessionIds : [];
      this.ids = new Set(ids.filter((id): id is string => typeof id === 'string'));
    } catch {
      // Missing file is the normal first-run case; a corrupt one is not worth failing the
      // whole dashboard over, so either way we start from an empty list.
      this.ids = new Set();
    }

    return this.ids;
  }

  private persist(ids: Set<string>): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const payload: HiddenSessionsFile = { hiddenSessionIds: [...ids] };
    writeFileSync(this.filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }
}
