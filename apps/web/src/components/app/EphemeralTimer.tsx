import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EphemeralTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  children: ReactNode;
  className?: string;
}

export function EphemeralTimer({ remainingSeconds, totalSeconds, children, className }: EphemeralTimerProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;
  const dashOffset = circumference * (1 - progress);
  const isLow = remainingSeconds <= 30 && remainingSeconds > 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)]"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={isLow ? 'var(--warning)' : 'var(--primary-brand)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 22 22)"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      {children}
    </div>
  );
}
