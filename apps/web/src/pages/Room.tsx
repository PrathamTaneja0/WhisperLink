import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Participant, ChatMessagePayload } from '@whisperlink/shared';
import { AppShell } from '@/components/app/AppShell';
import { EmptyState } from '@/components/app/EmptyState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Toast } from '@/components/app/Toast';
import { ControlBar } from '@/components/app/ControlBar';
import { ChatPanel } from '@/components/app/ChatPanel';
import { ParticipantGrid } from '@/components/app/ParticipantGrid';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/app/FormError';
import { NameInput } from '@/components/app/NameInput';
import { Skeleton } from '@/components/ui/skeleton';
import { slideUp } from '@/lib/motion';
import {
  getSessionInfo,
  joinSession,
  getStoredJoinToken,
  storeJoinToken,
  clearJoinToken,
  endSession,
} from '@/lib/api';
import { useSignaling } from '@/hooks/useSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCountdown } from '@/hooks/useCountdown';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>();
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passError, setPassError] = useState<string>();
  const [passLoading, setPassLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localPeerId, setLocalPeerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant?: 'default' | 'error' } | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const signalHandlerRef = useRef<(type: string, payload: unknown) => void>(() => {});

  const { remainingSeconds, formatted, isExpired } = useCountdown(expiresAt, serverTimeOffset);

  const showToast = useCallback((message: string, variant: 'default' | 'error' = 'default') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    async function loadSession() {
      try {
        const info = await getSessionInfo(roomId!);
        if (!info.exists) {
          setSessionExists(false);
          return;
        }
        setSessionExists(true);
        setIsProtected(!!info.isProtected);
        setExpiresAt(info.expiresAt);

        const stored = getStoredJoinToken(roomId!);
        if (stored) {
          setJoinToken(stored);
          const peerRaw = sessionStorage.getItem(`whisperlink:peer:${roomId!}`);
          if (peerRaw) {
            const peer = JSON.parse(peerRaw) as { peerId: string; displayName: string };
            setLocalPeerId(peer.peerId);
            setDisplayName(peer.displayName);
          }
        }
      } catch {
        setSessionExists(false);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [roomId]);

  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);

  const { connected, sendSignal, sendChat } = useSignaling({
    roomId: roomId ?? '',
    token: joinToken ?? '',
    enabled: !!joinToken,
    onParticipants: setParticipants,
    onSignal: (type, payload) => signalHandlerRef.current(type, payload),
    onChatMessage: (msg) => setChatMessages((prev) => [...prev, msg]),
    onSessionSync: (payload) => {
      setExpiresAt(payload.expiresAt);
      setIsHost(payload.isHost);
      const serverTime = new Date(payload.serverTime).getTime();
      setServerTimeOffset(serverTime - Date.now());
    },
    onSessionWarning: (payload) => showToast(payload.message),
    onSessionEnded: () => {
      setSessionEnded(true);
      if (roomId) clearJoinToken(roomId);
    },
    onPeerLeft: (peerId) => webrtcRef.current?.removePeer(peerId),
  });

  const webrtc = useWebRTC({
    localPeerId,
    participants,
    connected: connected && joined && !!localPeerId,
    sendSignal,
  });

  webrtcRef.current = webrtc;
  signalHandlerRef.current = webrtc.handleSignal;

  async function handlePasscodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    if (!nameInput.trim()) {
      setPassError('Enter your name');
      return;
    }
    setPassError(undefined);
    setPassLoading(true);
    try {
      const result = await joinSession(roomId, nameInput.trim(), password);
      storeJoinToken(roomId, result.joinToken);
      setJoinToken(result.joinToken);
      setLocalPeerId(result.peerId);
      setDisplayName(result.displayName);
      sessionStorage.setItem(`whisperlink:peer:${roomId}`, JSON.stringify({
        peerId: result.peerId,
        displayName: result.displayName,
      }));
      setExpiresAt(result.expiresAt);
      const serverTime = new Date(result.serverTime).getTime();
      setServerTimeOffset(serverTime - Date.now());
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Invalid passcode');
    } finally {
      setPassLoading(false);
    }
  }

  async function handlePublicJoin() {
    if (!roomId) return;
    if (!nameInput.trim()) {
      setPassError('Enter your name');
      return;
    }
    setPassLoading(true);
    try {
      const result = await joinSession(roomId, nameInput.trim());
      storeJoinToken(roomId, result.joinToken);
      setJoinToken(result.joinToken);
      setLocalPeerId(result.peerId);
      setDisplayName(result.displayName);
      sessionStorage.setItem(`whisperlink:peer:${roomId}`, JSON.stringify({
        peerId: result.peerId,
        displayName: result.displayName,
      }));
      setExpiresAt(result.expiresAt);
      const serverTime = new Date(result.serverTime).getTime();
      setServerTimeOffset(serverTime - Date.now());
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setPassLoading(false);
    }
  }

  async function handleMediaJoin() {
    await webrtc.startMedia();
    setJoined(true);
  }

  async function handleCopyLink() {
    if (!roomId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/r/${roomId}`);
    showToast('Link copied');
  }

  async function handleEndSession() {
    if (!roomId || !joinToken) return;
    try {
      await endSession(roomId, joinToken);
      webrtc.cleanup();
      navigate('/');
    } catch {
      showToast('Failed to end session', 'error');
    }
  }

  function handleLeave() {
    webrtc.cleanup();
    if (roomId) clearJoinToken(roomId);
    navigate('/');
  }

  useEffect(() => {
    if (isExpired && joined) {
      setSessionEnded(true);
      webrtc.cleanup();
    }
  }, [isExpired, joined, webrtc]);

  useEffect(() => {
    return () => webrtc.cleanup();
  }, [webrtc]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!sessionExists || sessionEnded) {
    return (
      <AppShell>
        <EmptyState
          title="This session has ended"
          description="The conversation is no longer available."
        />
      </AppShell>
    );
  }

  if (!joinToken) {
    return (
      <AppShell>
        <motion.div {...slideUp} className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="headline-lg">Join Session</h1>
            <p className="mt-2 text-sm text-muted">
              {isProtected ? 'Enter the passcode to join' : 'Ready to join this session'}
            </p>
          </div>
          {isProtected ? (
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

  if (!joined) {
    return (
      <AppShell>
        <motion.div {...slideUp} className="mx-auto w-full max-w-md space-y-6 text-center">
          <h1 className="headline-lg">Ready to talk?</h1>
          <p className="text-sm text-muted">
            Click join to enable your microphone.
          </p>
          {webrtc.mediaError && <FormError message={webrtc.mediaError} />}
          <Button className="w-full" size="lg" onClick={handleMediaJoin}>
            Join with microphone
          </Button>
        </motion.div>
      </AppShell>
    );
  }

  const me = participants.find((p) => p.peerId === localPeerId);
  const tileDisplayName = me?.displayName ?? (displayName || 'You');

  const participantTiles = [
    {
      peerId: localPeerId,
      displayName: tileDisplayName,
      isLocal: true,
    },
    ...Array.from(webrtc.remotePeers.values()).map((p) => ({
      peerId: p.peerId,
      displayName: p.displayName,
      isLocal: false,
    })),
  ];

  const connectionVariant =
    connected ? 'success' : 'warning';

  const headerActions = (
    <>
      <StatusBadge label={formatted} variant={remainingSeconds <= 30 ? 'warning' : 'system'} />
      <StatusBadge
        label={connected ? 'Connected' : 'Connecting…'}
        variant={connectionVariant}
      />
      <StatusBadge label={`${participants.length} online`} variant="success" />
    </>
  );

  return (
    <AppShell variant="room" headerActions={headerActions}>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <ParticipantGrid participants={participantTiles} />
        </div>
        {chatOpen && (
          <div className="h-80 lg:h-auto lg:w-80 lg:min-h-0">
            <ChatPanel
              messages={chatMessages}
              onSend={sendChat}
              localPeerId={localPeerId}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <ControlBar
          micEnabled={webrtc.micEnabled}
          isHost={isHost}
          chatOpen={chatOpen}
          onToggleMic={webrtc.toggleMic}
          onToggleChat={() => setChatOpen((v) => !v)}
          onCopyLink={handleCopyLink}
          onEndSession={handleEndSession}
          onLeave={handleLeave}
        />
      </div>

      {toast && <Toast message={toast.message} visible variant={toast.variant} />}
    </AppShell>
  );
}
