import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { ParseWarning, SessionRecord, TurnDuration, UsageTurn } from '../types/index.js';
import type { RawEvent } from './raw-event.js';

/**
 * Streams a single session `.jsonl` file line-by-line (never loads the whole
 * file into memory — these files grow unbounded over a project's lifetime)
 * and reduces it into one SessionRecord.
 */
export class SessionFileParser {
  async parse(filePath: string, projectDirName: string, sessionIdFallback: string): Promise<SessionParseOutcome> {
    const turns: UsageTurn[] = [];
    const turnDurations: TurnDuration[] = [];
    const warnings: ParseWarning[] = [];

    let sessionId = sessionIdFallback;
    let projectPath: string | null = null;
    let title: string | null = null;
    let cliVersion: string | null = null;
    let firstTimestamp: string | null = null;
    let lastTimestamp: string | null = null;

    const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Infinity });

    let lineNumber = 0;
    for await (const rawLine of rl) {
      lineNumber += 1;
      const line = rawLine.trim();
      if (!line) continue;

      let event: RawEvent;
      try {
        event = JSON.parse(line) as RawEvent;
      } catch {
        warnings.push({ file: filePath, line: lineNumber, message: 'Skipped a line that was not valid JSON.' });
        continue;
      }

      if (event.sessionId) sessionId = event.sessionId;
      if (event.cwd && !projectPath) projectPath = event.cwd;
      if (event.version) cliVersion = event.version;
      if (event.timestamp) {
        if (!firstTimestamp || event.timestamp < firstTimestamp) firstTimestamp = event.timestamp;
        if (!lastTimestamp || event.timestamp > lastTimestamp) lastTimestamp = event.timestamp;
      }

      if (event.type === 'ai-title' && event.aiTitle) {
        title = event.aiTitle;
        continue;
      }

      if (event.type === 'system' && event.subtype === 'turn_duration' && event.timestamp) {
        turnDurations.push({
          timestamp: event.timestamp,
          durationMs: event.durationMs ?? 0,
          messageCount: event.messageCount ?? 0,
        });
        continue;
      }

      if (event.type === 'assistant' && event.message?.model && event.timestamp) {
        const usage = event.message.usage ?? {};
        turns.push({
          sessionId,
          projectPath: projectPath ?? event.cwd ?? 'unknown',
          timestamp: event.timestamp,
          model: event.message.model,
          gitBranch: event.gitBranch ?? null,
          isSidechain: event.isSidechain ?? false,
          tokens: {
            input: usage.input_tokens ?? 0,
            output: usage.output_tokens ?? 0,
            cacheRead: usage.cache_read_input_tokens ?? 0,
            cacheCreation: usage.cache_creation_input_tokens ?? 0,
          },
        });
      }
    }

    const session: SessionRecord = {
      sessionId,
      projectPath: projectPath ?? 'unknown',
      projectDirName,
      title,
      cliVersion,
      firstTimestamp,
      lastTimestamp,
      turns,
      turnDurations,
      sourceFile: filePath,
    };

    return { session, warnings };
  }
}

export interface SessionParseOutcome {
  session: SessionRecord;
  warnings: ParseWarning[];
}
