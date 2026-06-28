import { useCallback, useEffect, useRef, useState } from 'react';
import type { Participant, SignalPayload } from '@whisperlink/shared';
import { getTurnCredentials } from '@/lib/api';

interface RemotePeer {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
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

  const updateRemoteStream = useCallback((peerId: string, displayName: string, stream: MediaStream | null) => {
    setRemotePeers((prev) => {
      const next = new Map(prev);
      next.set(peerId, { peerId, displayName, stream });
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string, displayName: string, isInitiator: boolean) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
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

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        updateRemoteStream(peerId, displayName, stream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          updateRemoteStream(peerId, displayName, null);
        }
      };

      peersRef.current.set(peerId, pc);

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
    [sendSignal, updateRemoteStream],
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: camEnabled ? { width: { max: 1280 }, height: { max: 720 } } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(undefined);

      for (const [, pc] of peersRef.current) {
        for (const track of stream.getTracks()) {
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
  }, [camEnabled]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getAudioTracks()) {
        track.enabled = !track.enabled;
      }
      setMicEnabled((v) => !v);
    }
  }, []);

  const toggleCam = useCallback(async () => {
    const newCamState = !camEnabled;
    setCamEnabled(newCamState);

    if (!localStreamRef.current) return;

    if (newCamState) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { max: 1280 }, height: { max: 720 } },
        });
        const videoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        for (const [, pc] of peersRef.current) {
          pc.addTrack(videoTrack, localStreamRef.current);
        }
      } catch {
        setCamEnabled(false);
      }
    } else {
      for (const track of localStreamRef.current.getVideoTracks()) {
        track.stop();
        localStreamRef.current.removeTrack(track);
        for (const [, pc] of peersRef.current) {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) pc.removeTrack(sender);
        }
      }
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
  }, [camEnabled]);

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
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemotePeers(new Map());
  }, []);

  return {
    localStream,
    remotePeers,
    micEnabled,
    camEnabled,
    mediaError,
    startMedia,
    toggleMic,
    toggleCam,
    handleSignal,
    removePeer,
    cleanup,
  };
}
