import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { RangeFilter } from '../RangeFilter';
import { DataSourceNotice } from '../DataSourceNotice';

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
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-ink-primary">{title}</h1>
          <div className="flex items-center gap-4">
            <RangeFilter />
            {headerExtra}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-6">
          <DataSourceNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
