import { getJwtSecret } from '../lib/env';
import {
  createSessionSchema,
  joinSessionSchema,
  generateDisplayName,
  generatePeerId,
} from '@whisperlink/shared';
import type { Env } from '../types';
import { generateRoomId, hashPassword } from '../lib/crypto';
import { issueJoinToken, issueHostJoinToken, verifyJoinToken } from '../lib/jwt';
import {
  checkRateLimit,
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts,
} from '../lib/rate-limit';

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

function getRoomStub(env: Env, roomId: string) {
  const id = env.ROOM.idFromName(roomId);
  return env.ROOM.get(id);
}

export async function handleCreateSession(request: Request, env: Env): Promise<Response> {
  const ip = getClientIp(request);
  const limit = parseInt(env.SESSION_RATE_LIMIT_PER_HOUR, 10);
  const rateResult = await checkRateLimit(env.RATE_LIMIT, `create:${ip}`, limit, 3600);
  if (!rateResult.allowed) {
    return json({ error: 'Rate limit exceeded' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, 400);
  }

  const { durationMinutes, access, password } = parsed.data;
  const roomId = generateRoomId();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const isProtected = access === 'protected';
  const hostPeerId = generatePeerId();
  const displayName = generateDisplayName();

  let passwordHash: { hash: string; salt: string } | undefined;
  if (isProtected && password) {
    passwordHash = await hashPassword(password);
  }

  const stub = getRoomStub(env, roomId);
  const createRes = await stub.fetch('http://internal/', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      roomId,
      expiresAt,
      isProtected,
      passwordHash,
      hostPeerId,
    }),
  });

  if (!createRes.ok) {
    return json({ error: 'Failed to create session' }, 500);
  }

  const joinToken = await issueHostJoinToken(roomId, hostPeerId, displayName, getJwtSecret(env));
  const url = new URL(request.url);
  const joinUrl = `${url.origin}/r/${roomId}`;

  return json({
    roomId,
    joinUrl,
    expiresAt,
    isProtected,
    joinToken,
    peerId: hostPeerId,
    displayName,
  });
}

export async function handleGetSession(
  roomId: string,
  env: Env,
): Promise<Response> {
  const stub = getRoomStub(env, roomId);
  const res = await stub.fetch('http://internal/', {
    method: 'POST',
    body: JSON.stringify({ action: 'info' }),
  });
  const data = await res.json();
  return json(data);
}

export async function handleJoinSession(
  roomId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const ip = getClientIp(request);
  const lockoutKey = `lockout:${roomId}:${ip}`;
  const lockout = await checkLockout(env.RATE_LIMIT, lockoutKey);
  if (lockout.locked) {
    return json({ error: 'Too many attempts. Try again later.' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = joinSessionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Invalid input' }, 400);
  }

  const stub = getRoomStub(env, roomId);
  const infoRes = await stub.fetch('http://internal/', {
    method: 'POST',
    body: JSON.stringify({ action: 'info' }),
  });
  const info = (await infoRes.json()) as {
    exists: boolean;
    isProtected?: boolean;
    expiresAt?: string;
  };

  if (!info.exists) {
    return json({ error: 'Invalid passcode' }, 401);
  }

  if (info.isProtected) {
    const verifyRes = await stub.fetch('http://internal/', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify-password', password: parsed.data.password }),
    });

    if (!verifyRes.ok) {
      const maxAttempts = parseInt(env.PASSCODE_MAX_ATTEMPTS, 10);
      const lockoutMinutes = parseInt(env.PASSCODE_LOCKOUT_MINUTES, 10);
      const result = await recordFailedAttempt(
        env.RATE_LIMIT,
        lockoutKey,
        maxAttempts,
        lockoutMinutes,
      );
      if (result.locked) {
        return json({ error: 'Too many attempts. Try again later.' }, 429);
      }
      return json({ error: 'Invalid passcode' }, 401);
    }
  }

  await clearFailedAttempts(env.RATE_LIMIT, lockoutKey);

  const peerId = generatePeerId();
  const displayName = generateDisplayName();
  const joinToken = await issueJoinToken(
    { roomId, peerId, displayName, isHost: false },
    getJwtSecret(env),
  );

  return json({
    joinToken,
    expiresAt: info.expiresAt,
    serverTime: new Date().toISOString(),
    peerId,
    displayName,
  });
}

export async function handleEndSession(
  roomId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const token = auth.slice(7);
  const payload = await verifyJoinToken(token, getJwtSecret(env), roomId);
  if (!payload || !payload.isHost) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const stub = getRoomStub(env, roomId);
  const res = await stub.fetch('http://internal/', {
    method: 'POST',
    body: JSON.stringify({ action: 'end', peerId: payload.peerId }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    return json({ error: err.error ?? 'Failed to end session' }, res.status);
  }

  return json({ ok: true });
}
