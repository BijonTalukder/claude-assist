import { basename } from 'node:path';
import type { SessionRecord, UsageTurn } from '../types/index.js';
import { calculateCostForModel } from '../pricing/cost-calculator.js';

export interface ResolvedTurn extends UsageTurn {
  costUsd: number;
  totalTokens: number;
  projectName: string;
  sessionTitle: string | null;
}

function toProjectName(projectPath: string): string {
  const name = basename(projectPath);
  return name.length > 0 ? name : projectPath;
}

/** Flattens every turn across every session into one list, with cost/derived fields attached once. */
export function resolveTurns(sessions: SessionRecord[]): ResolvedTurn[] {
  const resolved: ResolvedTurn[] = [];

  for (const session of sessions) {
    const projectName = toProjectName(session.projectPath);

    for (const turn of session.turns) {
      const tokens = turn.tokens;
      resolved.push({
        ...turn,
        costUsd: calculateCostForModel(turn.model, tokens),
        totalTokens: tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation,
        projectName,
        sessionTitle: session.title,
      });
    }
  }

  return resolved;
}
