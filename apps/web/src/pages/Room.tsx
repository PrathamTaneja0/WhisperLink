import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/app/AppShell';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Toast } from '@/components/app/Toast';
import { ControlBar } from '@/components/app/ControlBar';
import { ChatPanel } from '@/components/app/ChatPanel';
import { ParticipantGrid } from '@/components/app/ParticipantGrid';
import { RemoteAudioSinks } from '@/components/app/RemoteAudioSink';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/app/FormError';
import { NameInput } from '@/components/app/NameInput';
import { Skeleton } from '@/components/ui/skeleton';
import { slideUp } from '@/lib/motion';
import { useSession } from '@/context/SessionContext';

export function RoomPage() {
  const { roomId: routeRoomId } = useParams<{ roomId: string }>();
  const session = useSession();
  const loadRoomRef = useRef(session.loadRoom);

  useEffect(() => {
    loadRoomRef.current = session.loadRoom;
  }, [session.loadRoom]);

  const [password, setPassword] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passError, setPassError] = useState<string>();
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (routeRoomId) {
      void loadRoomRef.current(routeRoomId);
    }
  }, [routeRoomId]);

  async function handlePasscodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) {
      setPassError('Enter your name');
      return;
    }
    setPassError(undefined);
    setPassLoading(true);
    try {
      await session.joinWithCredentials(nameInput.trim(), password);
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Invalid passcode');
    } finally {
      setPassLoading(false);
    }
  }

  async function handlePublicJoin() {
    if (!nameInput.trim()) {
      setPassError('Enter your name');
      return;
    }
    setPassLoading(true);
    try {
      await session.joinWithCredentials(nameInput.trim());
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setPassLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!routeRoomId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/r/${routeRoomId}`);
    session.showToast('Link copied');
  }

  if (session.phase === 'loading' || (session.phase === 'idle' && routeRoomId)) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (session.phase === 'ended' || !session.sessionExists) {
    return null;
  }

  if (session.phase === 'join-form') {
    return (
      <AppShell>
        <motion.div {...slideUp} className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="headline-lg">Join Session</h1>
            <p className="mt-2 text-sm text-muted">
              {session.isProtected ? 'Enter the passcode to join' : 'Ready to join this session'}
            </p>
          </div>
          {session.isProtected ? (
            <form onSubmit={handlePasscodeSubmit} className="card-session space-y-4 p-6 sm:p-8">
              <NameInput value={nameInput} onChange={setNameInput} />
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode"
                required
              />
              <FormError message={passError} />
              <Button type="submit" className="w-full" size="lg" disabled={passLoading}>
                {passLoading ? 'Joining…' : 'Join →'}
              </Button>
            </form>
          ) : (
            <div className="card-session space-y-4 p-6 sm:p-8">
              <NameInput value={nameInput} onChange={setNameInput} />
              <FormError message={passError} />
              <Button className="w-full" size="lg" onClick={handlePublicJoin} disabled={passLoading}>
                {passLoading ? 'Joining…' : 'Join →'}
              </Button>
            </div>
          )}
        </motion.div>
      </AppShell>
    );
  }

  if (session.phase === 'media-prompt') {
    return (
      <AppShell>
        <motion.div {...slideUp} className="mx-auto w-full max-w-md space-y-6 text-center">
          <h1 className="headline-lg">Ready to talk?</h1>
          <p className="text-sm text-muted">
            Click join to enable your microphone.
          </p>
          {session.mediaError && <FormError message={session.mediaError} />}
          <Button className="w-full" size="lg" onClick={() => void session.startMedia()}>
            Join with microphone
          </Button>
        </motion.div>
      </AppShell>
    );
  }

  const participantTiles = session.participants.map((p) => ({
    peerId: p.peerId,
    displayName: p.peerId === session.localPeerId ? (p.displayName || session.displayName || 'You') : p.displayName,
    isLocal: p.peerId === session.localPeerId,
    micMuted: p.peerId === session.localPeerId && session.hasMediaStream && !session.micEnabled,
    isSpeaking: session.speakingPeers.get(p.peerId) ?? false,
  }));

  const connectionVariant = session.connected ? 'success' : 'warning';

  const headerActions = (
    <>
      <StatusBadge label={session.formatted} variant={session.remainingSeconds <= 30 ? 'warning' : 'system'} />
      <StatusBadge
        label={session.connected ? 'Connected' : 'Connecting…'}
        variant={connectionVariant}
      />
      <StatusBadge label={`${session.participants.length} online`} variant="success" />
    </>
  );

  return (
    <AppShell variant="room" headerActions={headerActions}>
      <RemoteAudioSinks streams={session.remoteStreams} />
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <ParticipantGrid participants={participantTiles} />
        </div>
        {session.chatOpen && (
          <div className="h-80 lg:h-auto lg:w-80 lg:min-h-0">
            <ChatPanel
              messages={session.chatMessages}
              onSend={session.sendChat}
              localPeerId={session.localPeerId}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <ControlBar
          micEnabled={session.micEnabled}
          hasMediaStream={session.hasMediaStream}
          isHost={session.isHost}
          chatOpen={session.chatOpen}
          onToggleMic={session.toggleMic}
          onToggleChat={() => session.setChatOpen((v) => !v)}
          onCopyLink={handleCopyLink}
          onEndSession={() => void session.endSessionAsHost()}
          onLeave={session.leaveSession}
        />
      </div>

      {session.toast && (
        <Toast message={session.toast.message} visible variant={session.toast.variant} />
      )}
    </AppShell>
  );
}
