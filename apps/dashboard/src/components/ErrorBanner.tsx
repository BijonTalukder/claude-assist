import { AlertTriangle } from 'lucide-react';

export interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message} — showing the last data that loaded successfully.</span>
    </div>
  );
}
