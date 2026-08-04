import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'default' | 'ghost' | 'active';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-surface-hover text-ink-primary hover:bg-surface-hover/70 border border-border',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-hover',
  active: 'bg-series-blue/15 text-series-blue border border-series-blue/40',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
