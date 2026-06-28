import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessagePayload, Participant } from '@whisperlink/shared';
import {
  clearSessionStorage,
  endSession,
  getSessionInfo,
  getStoredJoinToken,
  joinSession,
  storeJoinToken,
} from '@/lib/api';
import { useSignaling } from '@/hooks/useSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCountdown } from '@/hooks/useCountdown';

export type SessionPhase = 'idle' | 'loading' | 'join-form' | 'media-prompt' | 'active' | 'ended';

interface SessionContextValue {
  roomId: string | null;
  phase: SessionPhase;
  sessionExists: boolean;
  isProtected: boolean;
  joinToken: string | null;
  localPeerId: string;
  displayName: string;
  joined: boolean;
  isHost: boolean;
  participants: Participant[];
  chatMessages: ChatMessagePayload[];
  chatOpen: boolean;
  connected: boolean;
  micEnabled: boolean;
  hasMediaStream: boolean;
  mediaError?: string;
  remotePeers: Map<string, { peerId: string; displayName: string }>;
  formatted: string;
  remainingSeconds: number;
  isActive: boolean;
  loadRoom: (roomId: string) => Promise<void>;
  joinWithCredentials: (name: string, password?: string) => Promise<void>;
  startMedia: () => Promise<void>;
  toggleMic: () => { ok: true } | { ok: false; reason: 'no-stream' };
  setChatOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  sendChat: (text: string) => void;
  attachSession: (
    roomId: string,
    joinToken: string,
    peerId: string,
    name: string,
    expiresAt: string,
    serverTime: string,
  ) => void;
  endSessionAsHost: () => Promise<void>;
  leaveSession: () => void;
  clearSession: () => void;
  showToast: (message: string, variant?: 'default' | 'error') => void;
  toast: { message: string; variant?: 'default' | 'error' } | null;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [sessionExists, setSessionExists] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>();
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [toast, setToast] = useState<{ message: string; variant?: 'default' | 'error' } | null>(null);

  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);
  const signalHandlerRef = useRef<(type: string, payload: unknown) => void>(() => {});
  const roomIdRef = useRef<string | null>(null);
  const joinedRef = useRef(false);
  roomIdRef.current = roomId;
  joinedRef.current = joined;

  const { remainingSeconds, formatted, isExpired } = useCountdown(expiresAt, serverTimeOffset);

  const showToast = useCallback((message: string, variant: 'default' | 'error' = 'default') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const clearSession = useCallback(() => {
    webrtcRef.current?.cleanup();
    const id = roomIdRef.current;
    if (id) clearSessionStorage(id);
    setRoomId(null);
    setPhase('idle');
    setSessionExists(false);
    setIsProtected(false);
    setJoinToken(null);
    setLocalPeerId('');
    setDisplayName('');
    setJoined(false);
    setIsHost(false);
    setParticipants([]);
    setChatMessages([]);
    setChatOpen(false);
    setExpiresAt(undefined);
    setServerTimeOffset(0);
  }, []);

  const finishSession = useCallback(() => {
    clearSession();
    setPhase('ended');
    navigate('/session-ended', { replace: true });
  }, [clearSession, navigate]);

  const { connected, sendSignal, sendChat } = useSignaling({
    roomId: roomId ?? '',
    token: joinToken ?? '',
    enabled: !!joinToken && !!roomId && phase !== 'ended' && phase !== 'idle',
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
    onSessionEnded: () => finishSession(),
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

  const loadRoom = useCallback(async (id: string) => {
    const currentRoom = roomIdRef.current;
    const stored = getStoredJoinToken(id);

    if (currentRoom === id && stored) {
      if (joinedRef.current) setPhase('active');
      return;
    }

    setRoomId(id);
    setPhase('loading');

    try {
      const info = await getSessionInfo(id);
      if (!info.exists) {
        setSessionExists(false);
        navigate('/session-ended', { replace: true });
        return;
      }

      setSessionExists(true);
      setIsProtected(!!info.isProtected);
      setExpiresAt(info.expiresAt);

      if (stored) {
        setJoinToken(stored);
        const peerRaw = sessionStorage.getItem(`whisperlink:peer:${id}`);
        if (peerRaw) {
          const peer = JSON.parse(peerRaw) as { peerId: string; displayName: string };
          setLocalPeerId(peer.peerId);
          setDisplayName(peer.displayName);
          setPhase((prev) => (prev === 'active' ? 'active' : 'media-prompt'));
        } else {
          setPhase('join-form');
        }
      } else {
        setPhase('join-form');
      }
    } catch {
      setSessionExists(false);
      navigate('/session-ended', { replace: true });
    }
  }, [navigate]);

  const attachSession = useCallback(
    (id: string, token: string, peerId: string, name: string, exp: string, serverTime: string) => {
      setRoomId(id);
      setJoinToken(token);
      setLocalPeerId(peerId);
      setDisplayName(name);
      setExpiresAt(exp);
      setSessionExists(true);
      setServerTimeOffset(new Date(serverTime).getTime() - Date.now());
      setPhase('media-prompt');
    },
    [],
  );

  const joinWithCredentials = useCallback(
    async (name: string, password?: string) => {
      if (!roomId) return;
      const result = await joinSession(roomId, name, password);
      storeJoinToken(roomId, result.joinToken);
      setJoinToken(result.joinToken);
      setLocalPeerId(result.peerId);
      setDisplayName(result.displayName);
      sessionStorage.setItem(`whisperlink:peer:${roomId}`, JSON.stringify({
        peerId: result.peerId,
        displayName: result.displayName,
      }));
      setExpiresAt(result.expiresAt);
      setServerTimeOffset(new Date(result.serverTime).getTime() - Date.now());
      setPhase('media-prompt');
    },
    [roomId],
  );

  const startMedia = useCallback(async () => {
    await webrtc.startMedia();
    setJoined(true);
    setPhase('active');
  }, [webrtc]);

  const toggleMic = useCallback(() => {
    const result = webrtc.toggleMic();
    if (!result.ok) {
      showToast('Enable your microphone first', 'error');
    }
    return result;
  }, [webrtc, showToast]);

  const endSessionAsHost = useCallback(async () => {
    if (!roomId || !joinToken) return;
    try {
      await endSession(roomId, joinToken);
      finishSession();
    } catch {
      showToast('Failed to end session', 'error');
    }
  }, [roomId, joinToken, finishSession, showToast]);

  const leaveSession = useCallback(() => {
    finishSession();
  }, [finishSession]);

  useEffect(() => {
    if (isExpired && joined && phase === 'active') {
      finishSession();
    }
  }, [isExpired, joined, phase, finishSession]);

  const isActive = !!roomId && !!joinToken && joined && phase === 'active';

  const value = useMemo<SessionContextValue>(
    () => ({
      roomId,
      phase,
      sessionExists,
      isProtected,
      joinToken,
      localPeerId,
      displayName,
      joined,
      isHost,
      participants,
      chatMessages,
      chatOpen,
      connected,
      micEnabled: webrtc.micEnabled,
      hasMediaStream: webrtc.hasMediaStream,
      mediaError: webrtc.mediaError,
      remotePeers: webrtc.remotePeers,
      formatted,
      remainingSeconds,
      isActive,
      loadRoom,
      joinWithCredentials,
      startMedia,
      toggleMic,
      setChatOpen,
      sendChat,
      attachSession,
      endSessionAsHost,
      leaveSession,
      clearSession,
      showToast,
      toast,
    }),
    [
      roomId,
      phase,
      sessionExists,
      isProtected,
      joinToken,
      localPeerId,
      displayName,
      joined,
      isHost,
      participants,
      chatMessages,
      chatOpen,
      connected,
      webrtc,
      formatted,
      remainingSeconds,
      isActive,
      loadRoom,
      joinWithCredentials,
      startMedia,
      toggleMic,
      attachSession,
      endSessionAsHost,
      leaveSession,
      clearSession,
      showToast,
      toast,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
