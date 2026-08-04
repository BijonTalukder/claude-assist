import { analyzeProjectWithSpinner } from './analyze-project.js';
import { renderSummary } from '../ui/render-summary.js';

export interface ScanCommandOptions {
  cwd: string;
}

export async function runScanCommand(options: ScanCommandOptions): Promise<void> {
  const result = await analyzeProjectWithSpinner(options.cwd);

  console.log('');
  console.log(renderSummary(result));
}
