import { CreatePanel } from '@/components/app/CreatePanel';
import { PageHeader } from '@/components/app/PageHeader';

export function StartSessionPage() {
  return (
    <>
      <PageHeader title="Start a session" subtitle="Set duration and access, then share the link" />
      <div className="mx-auto w-full max-w-md">
        <CreatePanel />
      </div>
    </>
  );
}
