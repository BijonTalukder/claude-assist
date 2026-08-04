import { basename } from 'node:path';
import type { SessionRecord } from '../types/index.js';
import type { SessionSummaryRow } from '../types/analytics.js';
import type { ResolvedTurn } from './resolved-turn.js';
import { resolveModel } from '../models/model-catalog.js';

export function buildSessionRows(sessions: SessionRecord[], turns: ResolvedTurn[]): SessionSummaryRow[] {
  const turnsBySessionId = new Map<string, ResolvedTurn[]>();
  for (const turn of turns) {
    const list = turnsBySessionId.get(turn.sessionId) ?? [];
    list.push(turn);
    turnsBySessionId.set(turn.sessionId, list);
  }

  return sessions.map((session) => {
    const sessionTurns = turnsBySessionId.get(session.sessionId) ?? [];

    const tokensByModel = new Map<string, number>();
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;
    let totalTokens = 0;
    let totalCostUsd = 0;

    for (const turn of sessionTurns) {
      inputTokens += turn.tokens.input;
      outputTokens += turn.tokens.output;
      cacheReadTokens += turn.tokens.cacheRead;
      cacheCreationTokens += turn.tokens.cacheCreation;
      totalTokens += turn.totalTokens;
      totalCostUsd += turn.costUsd;
      tokensByModel.set(turn.model, (tokensByModel.get(turn.model) ?? 0) + turn.totalTokens);
    }

    const primaryModel = Array.from(tokensByModel.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
    const projectName = basename(session.projectPath) || session.projectPath;

    return {
      sessionId: session.sessionId,
      date: session.firstTimestamp ?? session.lastTimestamp ?? '',
      projectName,
      projectPath: session.projectPath,
      primaryModel,
      primaryModelDisplayName: resolveModel(primaryModel).displayName,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      totalTokens,
      totalCostUsd,
      title: session.title,
    };
  });
}
