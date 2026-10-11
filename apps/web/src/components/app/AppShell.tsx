import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  minimal?: boolean;
  variant?: 'default' | 'room';
  headerActions?: ReactNode;
}

export function AppShell({
  children,
  minimal = false,
  variant = 'default',
  headerActions,
}: AppShellProps) {
  const isRoom = variant === 'room';

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader minimal={minimal} variant={variant} actions={headerActions} />
      <main
        className={cn(
          'mx-auto flex w-full flex-1 flex-col',
          isRoom ? 'px-4 pb-4 pt-2 sm:px-6 sm:pb-6' : 'max-w-container px-5 py-[15px] sm:px-8 lg:px-16',
        )}
      >
        {children}
      </main>
      <SiteFooter minimal={minimal || isRoom} />
    </div>
  );
}
