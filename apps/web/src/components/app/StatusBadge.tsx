import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'system';
}

const variants = {
  default: 'bg-surface text-muted border-border',
  success: 'bg-success-bg text-success border-soft-cyan/60',
  warning: 'bg-warning-bg text-warning border-warning/30',
  error: 'bg-error-bg text-error border-error/30',
  system: 'bg-mist-pink/40 text-primary-brand border-mist-pink/60',
};

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-label',
        variants[variant],
      )}
    >
      {label}
    </span>
  );
}
