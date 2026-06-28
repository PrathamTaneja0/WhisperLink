import { AppShell } from '@/components/app/AppShell';
import { PageHeader } from '@/components/app/PageHeader';

export function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Privacy" subtitle="How WhisperLink handles your data" />
      <div className="card-privacy mx-auto max-w-lg space-y-6 p-6 sm:p-8 text-sm leading-relaxed text-muted">
        <p>
          WhisperLink is designed for ephemeral conversations. We do not require accounts,
          and we do not store conversation content after a session ends.
        </p>
        <section>
          <h2 className="font-display text-base text-foreground">What we do not store</h2>
          <p className="mt-2">
            Voice, video, text messages, or personal information after a session expires or is ended.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base text-foreground">What happens during a session</h2>
          <p className="mt-2">
            Text messages are relayed in real time through our servers but are never written to
            permanent storage. Voice and video travel directly between participants when possible.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base text-foreground">Passcodes</h2>
          <p className="mt-2">
            If you protect a session, your passcode is stored as a cryptographic hash — never in plain text.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
