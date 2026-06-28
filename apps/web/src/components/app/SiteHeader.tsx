import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { WhisperLinkLogo } from './WhisperLinkLogo';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
  minimal?: boolean;
  variant?: 'default' | 'room';
  actions?: ReactNode;
}

export function SiteHeader({ minimal = false, variant = 'default', actions }: SiteHeaderProps) {
  const isRoom = variant === 'room';

  return (
    <header
      className={cn(
        'px-5 py-5 sm:px-8 lg:px-16',
        isRoom && 'glass-panel mx-4 mt-4 px-4 py-3 sm:mx-6',
      )}
    >
      <div
        className={cn(
          'mx-auto flex items-center justify-between gap-3',
          isRoom ? 'flex-wrap' : 'max-w-container',
        )}
      >
        <Link to="/" className="group flex items-center gap-3">
          <WhisperLinkLogo size="sm" />
          <span
            className={cn(
              'font-display text-foreground transition-colors group-hover:text-primary-brand',
              isRoom ? 'text-base' : 'text-lg',
            )}
          >
            WhisperLink
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {!minimal && (
            <Link
              to="/privacy"
              className="text-sm text-subtle transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
