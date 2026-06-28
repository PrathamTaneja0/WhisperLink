import { JoinPanel } from '@/components/app/JoinPanel';
import { PageHeader } from '@/components/app/PageHeader';

export function JoinSessionPage() {
  return (
    <>
      <PageHeader title="Join a session" subtitle="Enter the room code or link you received" />
      <div className="mx-auto w-full max-w-md">
        <JoinPanel />
      </div>
    </>
  );
}
