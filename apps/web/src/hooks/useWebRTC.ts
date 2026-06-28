import { useCallback, useEffect, useRef, useState } from 'react';
import type { Participant, SignalPayload } from '@whisperlink/shared';
import { getTurnCredentials } from '@/lib/api';

interface RemotePeer {
  peerId: string;
  displayName: string;
}

export type ToggleMicResult = { ok: true } | { ok: false; reason: 'no-stream' };

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
  const [micEnabled, setMicEnabled] = useState(true);
  const [hasMediaStream, setHasMediaStream] = useState(false);
  const [mediaError, setMediaError] = useState<string>();
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const makingOfferRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getTurnCredentials()
      .then(({ iceServers }) => {
        iceServersRef.current = iceServers;
      })
      .catch(() => {
        iceServersRef.current = [{ urls: 'stun:stun.l.google.com:19302' }];
      });
  }, []);

  const trackRemotePeer = useCallback((peerId: string, displayName: string) => {
    setRemotePeers((prev) => {
      const next = new Map(prev);
      next.set(peerId, { peerId, displayName });
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string, displayName: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getAudioTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('signal:ice-candidate', {
            targetPeerId: peerId,
            candidate: event.candidate.toJSON(),
          } satisfies Partial<SignalPayload>);
        }
      };

      pc.ontrack = () => {
        trackRemotePeer(peerId, displayName);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          trackRemotePeer(peerId, displayName);
        }
      };

      peersRef.current.set(peerId, pc);
      trackRemotePeer(peerId, displayName);

      if (isInitiator && !makingOfferRef.current.has(peerId)) {
        makingOfferRef.current.add(peerId);
        setTimeout(async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal('signal:offer', {
              targetPeerId: peerId,
              sdp: offer,
            } satisfies Partial<SignalPayload>);
          } catch {
            // ignore offer errors
          }
        }, 100 * peersRef.current.size);
      }

      return pc;
    },
    [sendSignal, trackRemotePeer],
  );

  const handleSignal = useCallback(
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
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('signal:answer', {
            targetPeerId: data.fromPeerId,
            sdp: answer,
          } satisfies Partial<SignalPayload>);
        } else if (type === 'signal:answer' && data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp as RTCSessionDescriptionInit));
        } else if (type === 'signal:ice-candidate' && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch {
        // signaling errors are non-fatal during mesh setup
      }
    },
    [localPeerId, participants, createPeerConnection, sendSignal],
  );

  useEffect(() => {
    if (!connected || !localStreamRef.current) return;

    for (const participant of participants) {
      if (participant.peerId === localPeerId) continue;
      if (!peersRef.current.has(participant.peerId)) {
        const isInitiator = localPeerId > participant.peerId;
        createPeerConnection(participant.peerId, participant.displayName, isInitiator);
      }
    }
  }, [participants, connected, localPeerId, createPeerConnection]);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setHasMediaStream(true);
      setMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
      setMediaError(undefined);

      for (const [, pc] of peersRef.current) {
        for (const track of stream.getAudioTracks()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
          if (sender) {
            await sender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        }
      }
    } catch {
      setMediaError('Microphone access denied. Please allow permissions and try again.');
    }
  }, []);

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
    setRemotePeers((prev) => {
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
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
    setRemotePeers(new Map());
    setHasMediaStream(false);
    setMicEnabled(true);
  }, []);

  return {
    remotePeers,
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
