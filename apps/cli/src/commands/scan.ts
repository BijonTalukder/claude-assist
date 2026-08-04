import { analyzeProjectWithSpinner } from './analyze-project.js';
import { renderSummary } from '../ui/render-summary.js';

export interface ScanCommandOptions {
  cwd: string;
  /** Explicit user-selected scope — highest focus priority. */
  userSelection?: string;
}

export async function runScanCommand(options: ScanCommandOptions): Promise<void> {
  const result = await analyzeProjectWithSpinner(options.cwd, { userSelection: options.userSelection });

  console.log('');
  console.log(renderSummary(result));
}
