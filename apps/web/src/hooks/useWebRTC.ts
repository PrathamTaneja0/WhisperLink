import { useCallback, useEffect, useRef, useState } from 'react';
import type { Participant, SignalPayload } from '@whisperlink/shared';
import { getTurnCredentials } from '@/lib/api';

export interface RemotePeer {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
}

export type ToggleMicResult = { ok: true } | { ok: false; reason: 'no-stream' };

interface BufferedSignal {
  type: string;
  payload: unknown;
}

interface UseWebRTCOptions {
  localPeerId: string;
  participants: Participant[];
  connected: boolean;
  sendSignal: (type: 'signal:offer' | 'signal:answer' | 'signal:ice-candidate', payload: unknown) => void;
}

export function useWebRTC({
  localPeerId,
  participants,
  connected,
  sendSignal,
}: UseWebRTCOptions) {
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream | null>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [hasMediaStream, setHasMediaStream] = useState(false);
  const [mediaError, setMediaError] = useState<string>();
  const [iceServersReady, setIceServersReady] = useState(false);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const makingOfferRef = useRef<Set<string>>(new Set());
  const pendingSignalsRef = useRef<BufferedSignal[]>([]);
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const hasMediaStreamRef = useRef(false);

  useEffect(() => {
    hasMediaStreamRef.current = hasMediaStream;
  }, [hasMediaStream]);

  useEffect(() => {
    getTurnCredentials()
      .then(({ iceServers }) => {
        iceServersRef.current = iceServers;
        setIceServersReady(true);
      })
      .catch(() => {
        iceServersRef.current = [{ urls: 'stun:stun.l.google.com:19302' }];
        setIceServersReady(true);
      });
  }, []);

  const updateRemotePeer = useCallback((peerId: string, displayName: string, stream?: MediaStream | null) => {
    setRemotePeers((prev) => {
      const next = new Map(prev);
      const existing = next.get(peerId);
      next.set(peerId, {
        peerId,
        displayName,
        stream: stream !== undefined ? stream : (existing?.stream ?? null),
      });
      return next;
    });

    if (stream !== undefined) {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        if (stream) {
          next.set(peerId, stream);
        } else {
          next.delete(peerId);
        }
        return next;
      });
    }
  }, []);

  const flushIceCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current.get(peerId) ?? [];
    if (queued.length === 0) return;
    pendingIceRef.current.delete(peerId);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Non-fatal during mesh setup
      }
    }
  }, []);

  const sendOffer = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      if (makingOfferRef.current.has(peerId)) return;
      makingOfferRef.current.add(peerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('signal:offer', {
          targetPeerId: peerId,
          sdp: offer,
        } satisfies Partial<SignalPayload>);
      } catch {
        makingOfferRef.current.delete(peerId);
      }
    },
    [sendSignal],
  );

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    if (!localStreamRef.current) return;
    for (const track of localStreamRef.current.getAudioTracks()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
      if (sender) {
        void sender.replaceTrack(track);
      } else {
        pc.addTrack(track, localStreamRef.current);
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string, displayName: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

      attachLocalTracks(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('signal:ice-candidate', {
            targetPeerId: peerId,
            candidate: event.candidate.toJSON(),
          } satisfies Partial<SignalPayload>);
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        updateRemotePeer(peerId, displayName, stream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          makingOfferRef.current.delete(peerId);
        }
      };

      peersRef.current.set(peerId, pc);
      updateRemotePeer(peerId, displayName, null);

      if (isInitiator && hasMediaStreamRef.current) {
        void sendOffer(peerId, pc);
      }

      return pc;
    },
    [attachLocalTracks, sendOffer, sendSignal, updateRemotePeer],
  );

  const processSignal = useCallback(
    async (type: string, payload: unknown) => {
      const data = payload as SignalPayload;
      if (data.fromPeerId === localPeerId) return;

      const participant = participants.find((p) => p.peerId === data.fromPeerId);
      const displayName = participant?.displayName ?? 'Guest';

      let pc = peersRef.current.get(data.fromPeerId);
      if (!pc) {
        pc = createPeerConnection(data.fromPeerId, displayName, false);
      }

      try {
        if (type === 'signal:offer' && data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp as RTCSessionDescriptionInit));
          await flushIceCandidates(data.fromPeerId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('signal:answer', {
            targetPeerId: data.fromPeerId,
            sdp: answer,
          } satisfies Partial<SignalPayload>);
        } else if (type === 'signal:answer' && data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp as RTCSessionDescriptionInit));
          await flushIceCandidates(data.fromPeerId, pc);
          makingOfferRef.current.delete(data.fromPeerId);
        } else if (type === 'signal:ice-candidate' && data.candidate) {
          if (!pc.remoteDescription) {
            const queue = pendingIceRef.current.get(data.fromPeerId) ?? [];
            queue.push(data.candidate);
            pendingIceRef.current.set(data.fromPeerId, queue);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        }
      } catch {
        // Signaling errors are non-fatal during mesh setup
      }
    },
    [
      localPeerId,
      participants,
      createPeerConnection,
      flushIceCandidates,
      sendSignal,
    ],
  );

  const handleSignal = useCallback(
    (type: string, payload: unknown) => {
      if (!hasMediaStreamRef.current) {
        pendingSignalsRef.current.push({ type, payload });
        return;
      }
      void processSignal(type, payload);
    },
    [processSignal],
  );

  const flushPendingSignals = useCallback(() => {
    const pending = pendingSignalsRef.current.splice(0);
    for (const signal of pending) {
      void processSignal(signal.type, signal.payload);
    }
  }, [processSignal]);

  useEffect(() => {
    if (!hasMediaStream || !iceServersReady) return;
    flushPendingSignals();
  }, [hasMediaStream, iceServersReady, flushPendingSignals]);

  const renegotiateAll = useCallback(async () => {
    for (const [peerId, pc] of peersRef.current) {
      attachLocalTracks(pc);
      const isInitiator = localPeerId > peerId;
      if (isInitiator) {
        makingOfferRef.current.delete(peerId);
        await sendOffer(peerId, pc);
      }
    }
  }, [attachLocalTracks, localPeerId, sendOffer]);

  useEffect(() => {
    if (!connected || !hasMediaStream || !iceServersReady) return;

    for (const participant of participants) {
      if (participant.peerId === localPeerId) continue;
      if (!peersRef.current.has(participant.peerId)) {
        const isInitiator = localPeerId > participant.peerId;
        createPeerConnection(participant.peerId, participant.displayName, isInitiator);
      }
    }
  }, [participants, connected, hasMediaStream, iceServersReady, localPeerId, createPeerConnection]);

  useEffect(() => {
    const activePeerIds = new Set(participants.map((p) => p.peerId));
    for (const peerId of peersRef.current.keys()) {
      if (peerId !== localPeerId && !activePeerIds.has(peerId)) {
        const pc = peersRef.current.get(peerId);
        pc?.close();
        peersRef.current.delete(peerId);
        makingOfferRef.current.delete(peerId);
        pendingIceRef.current.delete(peerId);
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    }
  }, [participants, localPeerId]);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasMediaStream(true);
      setMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
      setMediaError(undefined);

      for (const [, pc] of peersRef.current) {
        attachLocalTracks(pc);
      }

      flushPendingSignals();
      await renegotiateAll();
    } catch {
      setMediaError('Microphone access denied. Please allow permissions and try again.');
    }
  }, [attachLocalTracks, flushPendingSignals, renegotiateAll]);

  const toggleMic = useCallback((): ToggleMicResult => {
    if (!localStreamRef.current) {
      return { ok: false, reason: 'no-stream' };
    }

    let nextEnabled = false;
    setMicEnabled((prev) => {
      nextEnabled = !prev;
      for (const track of localStreamRef.current!.getAudioTracks()) {
        track.enabled = nextEnabled;
      }
      return nextEnabled;
    });
    return { ok: true };
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    makingOfferRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    setRemotePeers((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  const cleanup = useCallback(() => {
    for (const [, pc] of peersRef.current) {
      pc.close();
    }
    peersRef.current.clear();
    makingOfferRef.current.clear();
    pendingSignalsRef.current = [];
    pendingIceRef.current.clear();
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemotePeers(new Map());
    setRemoteStreams(new Map());
    setHasMediaStream(false);
    setMicEnabled(true);
  }, []);

  return {
    remotePeers,
    remoteStreams,
    localStream,
    micEnabled,
    hasMediaStream,
    mediaError,
    startMedia,
    toggleMic,
    handleSignal,
    removePeer,
    cleanup,
  };
}
