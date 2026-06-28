import { CreatePanel } from '@/components/app/CreatePanel';
import { PageHeader } from '@/components/app/PageHeader';
import { AnimatedPage, AnimatedPageSection } from '@/components/app/AnimatedPage';

export function StartSessionPage() {
  return (
    <AnimatedPage>
      <AnimatedPageSection>
        <PageHeader title="Start a session" subtitle="Set duration and access, then share the link" />
      </AnimatedPageSection>
      <AnimatedPageSection className="mx-auto w-full max-w-md">
        <CreatePanel />
      </AnimatedPageSection>
    </AnimatedPage>
  );
}
