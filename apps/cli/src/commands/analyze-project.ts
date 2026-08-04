import ora from 'ora';
import type { AnalysisResult } from '@claude-assist/types';
import { ClaudeAssistAnalyzer } from '@claude-assist/core';

/** Shared by launch.ts and scan.ts so the spinner/analyze logic isn't duplicated between them. */
export async function analyzeProjectWithSpinner(cwd: string): Promise<AnalysisResult> {
  const analyzer = new ClaudeAssistAnalyzer();
  const spinner = ora('Analyzing project...').start();

  const result = await analyzer.analyze(cwd).catch((error: unknown) => {
    spinner.fail('Analysis failed');
    throw error;
  });
  spinner.succeed('Analysis complete');

  return result;
}
