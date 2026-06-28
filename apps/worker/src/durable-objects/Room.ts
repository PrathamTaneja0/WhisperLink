import { generateDisplayName, generatePeerId, MAX_MESSAGE_LENGTH, CHAT_RATE_LIMIT_PER_SEC, MAX_PARTICIPANTS } from '@whisperlink/shared';
import type { Participant, SignalPayload, ChatMessagePayload, SessionWarningPayload } from '@whisperlink/shared';
import { verifyJoinToken } from '../lib/jwt';
import type { Env, RoomState } from '../types';
import { getJwtSecret } from '../lib/env';

interface PeerAttachment {
  peerId: string;
  displayName: string;
  isHost: boolean;
  joinedAt: number;
}

interface CreateRoomRequest {
  action: 'create';
  roomId: string;
  expiresAt: string;
  isProtected: boolean;
  passwordHash?: { hash: string; salt: string };
  hostPeerId: string;
}

interface InitJoinRequest {
  action: 'init-join';
  token: string;
  jwtSecret: string;
}

interface EndRoomRequest {
  action: 'end';
  peerId: string;
}

interface GetInfoRequest {
  action: 'info';
}

interface VerifyPasswordRequest {
  action: 'verify-password';
  password?: string;
}

type RoomRequest = CreateRoomRequest | InitJoinRequest | EndRoomRequest | GetInfoRequest | VerifyPasswordRequest;

export class Room implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private roomState: RoomState | null = null;
  private chatRateLimits = new Map<string, number[]>();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/ws')) {
      return this.handleWebSocket(request);
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as RoomRequest;
      return this.handleAction(body);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleAction(body: RoomRequest, _request?: Request): Promise<Response> {
    switch (body.action) {
      case 'create':
        return this.createRoom(body);
      case 'info':
        return this.getInfo();
      case 'end':
        return this.endRoom(body.peerId);
      case 'verify-password':
        return this.verifyPassword(body.password);
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  }

  private async loadState(): Promise<RoomState | null> {
    if (this.roomState) return this.roomState;
    const stored = await this.state.storage.get<RoomState>('room');
    this.roomState = stored ?? null;
    return this.roomState;
  }

  private async verifyPassword(password?: string): Promise<Response> {
    const room = await this.loadState();
    if (!room || room.ended || !room.isProtected || !room.passwordHash) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (!password) {
      return Response.json({ error: 'Invalid passcode' }, { status: 401 });
    }

    const { verifyPassword: verify } = await import('../lib/crypto');
    const valid = await verify(password, room.passwordHash);
    if (!valid) {
      return Response.json({ error: 'Invalid passcode' }, { status: 401 });
    }

    return Response.json({ ok: true });
  }

  private async createRoom(body: CreateRoomRequest): Promise<Response> {
    const existing = await this.loadState();
    if (existing && !existing.ended) {
      return Response.json({ error: 'Room already exists' }, { status: 409 });
    }

    const roomState: RoomState = {
      roomId: body.roomId,
      expiresAt: body.expiresAt,
      isProtected: body.isProtected,
      passwordHash: body.passwordHash,
      hostPeerId: body.hostPeerId,
      createdAt: new Date().toISOString(),
      ended: false,
    };

    this.roomState = roomState;
    await this.state.storage.put('room', roomState);

    const expiresMs = new Date(body.expiresAt).getTime();
    await this.state.storage.setAlarm(expiresMs);

    return Response.json({ ok: true });
  }

  private async getInfo(): Promise<Response> {
    const room = await this.loadState();
    if (!room || room.ended) {
      return Response.json({ exists: false });
    }

    if (new Date(room.expiresAt).getTime() <= Date.now()) {
      return Response.json({ exists: false });
    }

    const sockets = this.state.getWebSockets();
    return Response.json({
      exists: true,
      expiresAt: room.expiresAt,
      participantCount: sockets.length,
      isProtected: room.isProtected,
    });
  }

  private async endRoom(peerId: string): Promise<Response> {
    const room = await this.loadState();
    if (!room || room.ended) {
      return Response.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.hostPeerId !== peerId) {
      return Response.json({ error: 'Only host can end session' }, { status: 403 });
    }

    await this.destroyRoom('ended');
    return Response.json({ ok: true });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response('Missing token', { status: 401 });
    }

    const room = await this.loadState();
    if (!room || room.ended) {
      return new Response('Session not found', { status: 404 });
    }

    if (new Date(room.expiresAt).getTime() <= Date.now()) {
      return new Response('Session expired', { status: 410 });
    }

    const payload = await verifyJoinToken(token, getJwtSecret(this.env), room.roomId);
    if (!payload) {
      return new Response('Invalid token', { status: 401 });
    }

    const sockets = this.state.getWebSockets();
    if (sockets.length >= MAX_PARTICIPANTS) {
      return new Response('Room full', { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const attachment: PeerAttachment = {
      peerId: payload.peerId,
      displayName: payload.displayName,
      isHost: payload.isHost,
      joinedAt: Date.now(),
    };

    this.state.acceptWebSocket(server, [JSON.stringify(attachment)]);

    this.broadcast(
      {
        type: 'room:join',
        payload: {
          peerId: payload.peerId,
          displayName: payload.displayName,
          isHost: payload.isHost,
          expiresAt: room.expiresAt,
          serverTime: new Date().toISOString(),
        },
      },
      server,
    );

    this.broadcastParticipants();

    server.send(
      JSON.stringify({
        type: 'session:sync',
        payload: {
          expiresAt: room.expiresAt,
          serverTime: new Date().toISOString(),
          isHost: payload.isHost,
        },
      }),
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    let parsed: { type: string; payload: unknown };
    try {
      parsed = JSON.parse(message) as { type: string; payload: unknown };
    } catch {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message' } }));
      return;
    }

    const attachment = this.getAttachment(ws);
    if (!attachment) return;

    switch (parsed.type) {
      case 'signal:offer':
      case 'signal:answer':
      case 'signal:ice-candidate':
        this.relaySignal(attachment.peerId, parsed.payload as SignalPayload, parsed.type);
        break;
      case 'chat:message':
        this.handleChatMessage(ws, attachment, parsed.payload as { text: string });
        break;
      default:
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const attachment = this.getAttachment(ws);
    if (!attachment) return;

    const room = await this.loadState();
    if (room && room.hostPeerId === attachment.peerId) {
      await this.transferHost();
    }

    this.broadcast(
      {
        type: 'room:leave',
        payload: { peerId: attachment.peerId },
      },
      ws,
    );
    this.broadcastParticipants();
  }

  async webSocketError(): Promise<void> {
    // Connection will close; webSocketClose handles cleanup
  }

  async alarm(): Promise<void> {
    await this.destroyRoom('expired');
  }

  private getAttachment(ws: WebSocket): PeerAttachment | null {
    const tags = this.state.getTags(ws);
    if (tags.length === 0) return null;
    try {
      return JSON.parse(tags[0]) as PeerAttachment;
    } catch {
      return null;
    }
  }

  private relaySignal(fromPeerId: string, payload: SignalPayload, type: string): void {
    const target = payload.targetPeerId;
    for (const ws of this.state.getWebSockets()) {
      const attachment = this.getAttachment(ws);
      if (attachment?.peerId === target) {
        ws.send(
          JSON.stringify({
            type,
            payload: { ...payload, fromPeerId },
          }),
        );
        break;
      }
    }
  }

  private handleChatMessage(
    ws: WebSocket,
    attachment: PeerAttachment,
    payload: { text: string },
  ): void {
    const text = payload.text?.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message' } }));
      return;
    }

    const now = Date.now();
    const timestamps = this.chatRateLimits.get(attachment.peerId) ?? [];
    const recent = timestamps.filter((t) => now - t < 1000);
    if (recent.length >= CHAT_RATE_LIMIT_PER_SEC) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Rate limit exceeded' } }));
      return;
    }
    recent.push(now);
    this.chatRateLimits.set(attachment.peerId, recent);

    const message: ChatMessagePayload = {
      peerId: attachment.peerId,
      displayName: attachment.displayName,
      text,
      timestamp: now,
    };

    this.broadcast({ type: 'chat:message', payload: message });
  }

  private broadcastParticipants(): void {
    const participants: Participant[] = [];
    for (const ws of this.state.getWebSockets()) {
      const attachment = this.getAttachment(ws);
      if (attachment) {
        participants.push({
          peerId: attachment.peerId,
          displayName: attachment.displayName,
          isHost: attachment.isHost,
        });
      }
    }

    this.broadcast({
      type: 'room:participants',
      payload: { participants },
    });
  }

  private broadcast(message: { type: string; payload: unknown }, exclude?: WebSocket): void {
    const data = JSON.stringify(message);
    for (const ws of this.state.getWebSockets()) {
      if (ws !== exclude) {
        try {
          ws.send(data);
        } catch {
          // Socket may be closing
        }
      }
    }
  }

  private async transferHost(): Promise<void> {
    const room = await this.loadState();
    if (!room) return;

    let oldest: PeerAttachment | null = null;
    for (const ws of this.state.getWebSockets()) {
      const attachment = this.getAttachment(ws);
      if (attachment && (!oldest || attachment.joinedAt < oldest.joinedAt)) {
        oldest = attachment;
      }
    }

    if (oldest) {
      room.hostPeerId = oldest.peerId;
      oldest.isHost = true;
      this.roomState = room;
      await this.state.storage.put('room', room);

      for (const ws of this.state.getWebSockets()) {
        const attachment = this.getAttachment(ws);
        if (attachment?.peerId === oldest.peerId) {
          this.state.acceptWebSocket(ws, [JSON.stringify(oldest)]);
        }
      }

      this.broadcastParticipants();
    }
  }

  private async destroyRoom(reason: 'expired' | 'ended'): Promise<void> {
    const room = await this.loadState();
    if (room) {
      room.ended = true;
      this.roomState = room;
      await this.state.storage.put('room', room);
    }

    this.broadcast({
      type: 'session:ended',
      payload: { reason },
    });

    for (const ws of this.state.getWebSockets()) {
      try {
        ws.close(1000, 'Session ended');
      } catch {
        // ignore
      }
    }

    await this.state.storage.deleteAlarm();
    this.chatRateLimits.clear();
  }

  async sendWarning(warning: SessionWarningPayload): Promise<void> {
    this.broadcast({ type: 'session:warning', payload: warning });
  }
}

export { generatePeerId, generateDisplayName };
