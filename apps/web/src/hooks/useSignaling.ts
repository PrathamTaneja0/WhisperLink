import { useCallback, useEffect, useRef, useState } from 'react';
import type { WsMessage, Participant, ChatMessagePayload, SessionSyncPayload, SessionWarningPayload, SessionEndedPayload } from '@whisperlink/shared';
import { getWebSocketUrl } from '@/lib/api';

interface UseSignalingOptions {
  roomId: string;
  token: string;
  enabled?: boolean;
  onParticipants?: (participants: Participant[]) => void;
  onSignal?: (type: string, payload: unknown) => void;
  onChatMessage?: (message: ChatMessagePayload) => void;
  onSessionSync?: (payload: SessionSyncPayload) => void;
  onSessionWarning?: (payload: SessionWarningPayload) => void;
  onSessionEnded?: (payload: SessionEndedPayload) => void;
  onPeerLeft?: (peerId: string) => void;
}

export function useSignaling({
  roomId,
  token,
  enabled = true,
  onParticipants,
  onSignal,
  onChatMessage,
  onSessionSync,
  onSessionWarning,
  onSessionEnded,
  onPeerLeft,
}: UseSignalingOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef({
    onParticipants,
    onSignal,
    onChatMessage,
    onSessionSync,
    onSessionWarning,
    onSessionEnded,
    onPeerLeft,
  });

  useEffect(() => {
    callbacksRef.current = {
      onParticipants,
      onSignal,
      onChatMessage,
      onSessionSync,
      onSessionWarning,
      onSessionEnded,
      onPeerLeft,
    };
  }, [
    onParticipants,
    onSignal,
    onChatMessage,
    onSessionSync,
    onSessionWarning,
    onSessionEnded,
    onPeerLeft,
  ]);

  useEffect(() => {
    if (!roomId || !token || !enabled) return;

    const ws = new WebSocket(getWebSocketUrl(roomId, token));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        switch (msg.type) {
          case 'room:participants':
            callbacksRef.current.onParticipants?.(
              (msg.payload as { participants: Participant[] }).participants,
            );
            break;
          case 'signal:offer':
          case 'signal:answer':
          case 'signal:ice-candidate':
            callbacksRef.current.onSignal?.(msg.type, msg.payload);
            break;
          case 'chat:message':
            callbacksRef.current.onChatMessage?.(msg.payload as ChatMessagePayload);
            break;
          case 'session:sync':
            callbacksRef.current.onSessionSync?.(msg.payload as SessionSyncPayload);
            break;
          case 'session:warning':
            callbacksRef.current.onSessionWarning?.(msg.payload as SessionWarningPayload);
            break;
          case 'session:ended':
            callbacksRef.current.onSessionEnded?.(msg.payload as SessionEndedPayload);
            break;
          case 'room:leave':
            callbacksRef.current.onPeerLeft?.((msg.payload as { peerId: string }).peerId);
            break;
          default:
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, token, enabled]);

  const send = useCallback((message: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendSignal = useCallback(
    (type: 'signal:offer' | 'signal:answer' | 'signal:ice-candidate', payload: unknown) => {
      send({ type, payload });
    },
    [send],
  );

  const sendChat = useCallback(
    (text: string) => {
      send({ type: 'chat:message', payload: { text } });
    },
    [send],
  );

  return { connected, sendSignal, sendChat };
}
