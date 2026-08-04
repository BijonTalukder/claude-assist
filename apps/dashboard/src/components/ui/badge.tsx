import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'good' | 'warning' | 'serious';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-hover text-ink-secondary border-border',
  good: 'bg-status-good/10 text-status-good border-status-good/30',
  warning: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  serious: 'bg-status-serious/10 text-status-serious border-status-serious/30',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
