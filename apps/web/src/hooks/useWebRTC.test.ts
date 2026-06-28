import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTC } from './useWebRTC';

vi.mock('@/lib/api', () => ({
  getTurnCredentials: vi.fn().mockResolvedValue({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  }),
}));

describe('useWebRTC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggleMic returns no-stream when media not started', () => {
    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-1',
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
    const track = { kind: 'audio', enabled: true, stop: vi.fn() };
    const stream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    };

    vi.stubGlobal(
      'navigator',
      {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(stream),
        },
      },
    );

    const { result } = renderHook(() =>
      useWebRTC({
        localPeerId: 'peer-1',
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

    await act(async () => {
      result.current.toggleMic();
    });

    expect(track.enabled).toBe(true);
    expect(result.current.micEnabled).toBe(true);
  });
});
