import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ActiveSessionBar } from './ActiveSessionBar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ActiveSessionBar />
      <main className="mx-auto flex w-full max-w-container flex-1 flex-col px-5 py-[15px] sm:px-8 lg:px-16">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
