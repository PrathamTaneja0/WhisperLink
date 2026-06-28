import { PageHeader } from '@/components/app/PageHeader';

export function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" subtitle="How WhisperLink handles your data" />
      <div className="card-privacy mx-auto max-w-lg space-y-6 p-6 sm:p-8 text-sm leading-relaxed text-muted">
        <p>
          WhisperLink is designed for ephemeral conversations. We do not require accounts,
          and we do not store conversation content after a session ends.
        </p>
        <section>
          <h2 className="font-display text-base text-foreground">What we do not store</h2>
          <p className="mt-2">
            Voice, text messages, or display names after a session expires or is ended.
            Your chosen name is used only for the active session.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base text-foreground">What happens during a session</h2>
          <p className="mt-2">
            Text messages are relayed in real time through our servers but are never written to
            permanent storage. Voice travels directly between participants when possible via WebRTC.
            If you refresh the page, your chat history is not recovered.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base text-foreground">Passcodes</h2>
          <p className="mt-2">
            If you protect a session, your passcode is stored as a cryptographic hash — never in plain text.
          </p>
        </section>
      </div>
    </>
  );
}
