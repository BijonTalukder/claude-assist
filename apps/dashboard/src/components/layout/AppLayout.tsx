import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export interface AppLayoutProps {
  title: string;
  children: ReactNode;
  headerExtra?: ReactNode;
}

export function AppLayout({ title, children, headerExtra }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-ink-primary">{title}</h1>
          {headerExtra}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
