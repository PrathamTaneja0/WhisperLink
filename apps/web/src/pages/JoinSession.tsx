import { JoinPanel } from '@/components/app/JoinPanel';
import { PageHeader } from '@/components/app/PageHeader';
import { AnimatedPage, AnimatedPageSection } from '@/components/app/AnimatedPage';

export function JoinSessionPage() {
  return (
    <AnimatedPage>
      <AnimatedPageSection>
        <PageHeader title="Join a session" subtitle="Enter the room code or link you received" />
      </AnimatedPageSection>
      <AnimatedPageSection className="mx-auto w-full max-w-md">
        <JoinPanel />
      </AnimatedPageSection>
    </AnimatedPage>
  );
}
