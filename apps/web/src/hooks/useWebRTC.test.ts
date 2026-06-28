import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebRTC } from './useWebRTC';

vi.mock('@/lib/api', () => ({
  getTurnCredentials: vi.fn().mockResolvedValue({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }),
}));

describe('useWebRTC', () => {
  const pcs: Array<{
    remoteDescription: RTCSessionDescription | null;
    setRemoteDescription: ReturnType<typeof vi.fn>;
    addIceCandidate: ReturnType<typeof vi.fn>;
    ontrack: ((event: RTCTrackEvent) => void) | null;
  }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    pcs.length = 0;

    class MockRTCSessionDescription implements RTCSessionDescriptionInit {
      type: RTCSdpType;
      sdp?: string;
      constructor(init: RTCSessionDescriptionInit) {
        this.type = init.type ?? 'offer';
        this.sdp = init.sdp;
      }
    }

    class MockRTCIceCandidate implements RTCIceCandidateInit {
      candidate?: string;
      sdpMid?: string | null;
      sdpMLineIndex?: number | null;
      constructor(init: RTCIceCandidateInit) {
        Object.assign(this, init);
      }
      toJSON() {
        return this;
      }
    }

    vi.stubGlobal('RTCSessionDescription', MockRTCSessionDescription);
    vi.stubGlobal('RTCIceCandidate', MockRTCIceCandidate);

    class MockRTCPeerConnection {
      remoteDescription = null as RTCSessionDescription | null;
      localDescription = null as RTCSessionDescription | null;
      connectionState = 'new' as RTCPeerConnectionState;
      onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
      ontrack: ((event: RTCTrackEvent) => void) | null = null;
      onconnectionstatechange: (() => void) | null = null;
      addTrack = vi.fn();
      close = vi.fn();
      createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' });
      createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' });
      setLocalDescription = vi.fn().mockImplementation(async (desc: RTCSessionDescriptionInit) => {
        this.localDescription = desc as RTCSessionDescription;
      });
      setRemoteDescription = vi.fn().mockImplementation(async (desc: RTCSessionDescriptionInit) => {
        this.remoteDescription = desc as RTCSessionDescription;
      });
      addIceCandidate = vi.fn().mockResolvedValue(undefined);
      getSenders = () => [] as Array<{ track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }>;

      constructor() {
        pcs.push(this);
      }
    }

    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('toggleMic returns no-stream when media not started', () => {
    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [],
        connected: false,
        sendSignal: vi.fn(),
      }),
    );

    const toggleResult = result.current.toggleMic();
    expect(toggleResult).toEqual({ ok: false, reason: 'no-stream' });
    expect(result.current.hasMediaStream).toBe(false);
  });

  it('toggleMic toggles track enabled after startMedia', async () => {
    const track = { kind: 'audio', enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });

    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [],
        connected: false,
        sendSignal: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.startMedia();
    });

    expect(result.current.hasMediaStream).toBe(true);
    expect(result.current.micEnabled).toBe(true);

    await act(async () => {
      const toggleResult = result.current.toggleMic();
      expect(toggleResult).toEqual({ ok: true });
    });

    expect(track.enabled).toBe(false);
    expect(result.current.micEnabled).toBe(false);
  });

  it('buffers signals until startMedia then processes them', async () => {
    const sendSignal = vi.fn();
    const track = { kind: 'audio', enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });

    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [{ peerId: 'peer-a', displayName: 'Alice', isHost: true }],
        connected: true,
        sendSignal,
      }),
    );

    await act(async () => {
      await result.current.handleSignal('signal:offer', {
        fromPeerId: 'peer-a',
        sdp: { type: 'offer', sdp: 'remote-offer' },
      });
    });

    expect(pcs.length).toBe(0);

    await act(async () => {
      await result.current.startMedia();
    });

    await waitFor(() => {
      expect(pcs.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(pcs[0]?.setRemoteDescription).toHaveBeenCalled();
    });
  });

  it('stores remote stream from ontrack', async () => {
    const sendSignal = vi.fn();
    const track = { kind: 'audio', enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
    const localStream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream;
    const remoteTrack = { kind: 'audio', stop: vi.fn() } as unknown as MediaStreamTrack;
    const remoteStream = {
      getAudioTracks: () => [remoteTrack],
      getTracks: () => [remoteTrack],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(localStream),
      },
    });

    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [{ peerId: 'peer-a', displayName: 'Alice', isHost: true }],
        connected: true,
        sendSignal,
      }),
    );

    await act(async () => {
      await result.current.startMedia();
    });

    await act(async () => {
      pcs[0]?.ontrack?.({
        streams: [remoteStream],
        track: remoteTrack,
      } as unknown as RTCTrackEvent);
    });

    expect(result.current.remoteStreams.get('peer-a')).toBe(remoteStream);
  });

  it('queues ice candidates until remote description is set', async () => {
    const sendSignal = vi.fn();
    const track = { kind: 'audio', enabled: true, stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });

    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [{ peerId: 'peer-a', displayName: 'Alice', isHost: true }],
        connected: true,
        sendSignal,
      }),
    );

    await act(async () => {
      await result.current.startMedia();
    });

    await waitFor(() => {
      expect(pcs.length).toBeGreaterThan(0);
    });

    const pc = pcs[0]!;

    await act(async () => {
      await result.current.handleSignal('signal:ice-candidate', {
        fromPeerId: 'peer-a',
        candidate: { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 },
      });
    });

    expect(pc.addIceCandidate).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSignal('signal:answer', {
        fromPeerId: 'peer-a',
        sdp: { type: 'answer', sdp: 'answer-sdp' },
      });
    });

    await waitFor(() => {
      expect(pc.addIceCandidate).toHaveBeenCalled();
    });
  });

  it('removePeer clears remote stream state', () => {
    const sendSignal = vi.fn();
    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-b',
        participants: [],
        connected: false,
        sendSignal,
      }),
    );

    act(() => {
      result.current.removePeer('peer-a');
    });

    expect(result.current.remoteStreams.has('peer-a')).toBe(false);
    expect(result.current.remotePeers.has('peer-a')).toBe(false);
  });
});
