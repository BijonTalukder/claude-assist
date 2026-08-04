import { FlaskConical } from 'lucide-react';

export function MockDataBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-series-yellow/30 bg-series-yellow/10 px-4 py-3 text-sm text-series-yellow">
      <FlaskConical className="h-4 w-4 flex-shrink-0" />
      <span>No local Claude Code history found yet — showing sample data so you can see how the dashboard looks.</span>
    </div>
  );
}
