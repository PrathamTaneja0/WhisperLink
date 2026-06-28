import { z } from 'zod';

export const DURATION_PRESETS = [5, 10, 15, 30, 60] as const;
export const MAX_PARTICIPANTS = 6;
export const MAX_DURATION_MINUTES = 120;
export const MIN_DURATION_MINUTES = 1;
export const DEFAULT_DURATION_MINUTES = 30;
export const MAX_MESSAGE_LENGTH = 500;
export const CHAT_RATE_LIMIT_PER_SEC = 5;
export const JOIN_TOKEN_TTL_SEC = 300;
export const PASSCODE_MIN_LENGTH = 4;
export const PASSCODE_MAX_LENGTH = 32;
export const SESSION_RATE_LIMIT_PER_HOUR = 10;
export const PASSCODE_MAX_ATTEMPTS = 5;
export const PASSCODE_LOCKOUT_MINUTES = 15;

export const createSessionSchema = z.object({
  durationMinutes: z
    .number()
    .int()
    .min(MIN_DURATION_MINUTES)
    .max(MAX_DURATION_MINUTES),
  access: z.enum(['public', 'protected']),
  password: z.string().min(PASSCODE_MIN_LENGTH).max(PASSCODE_MAX_LENGTH).optional(),
}).refine(
  (data) => data.access === 'public' || (data.access === 'protected' && !!data.password),
  { message: 'Password required for protected sessions', path: ['password'] },
);

export const joinSessionSchema = z.object({
  password: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;

export const createSessionResponseSchema = z.object({
  roomId: z.string(),
  joinUrl: z.string(),
  expiresAt: z.string(),
  isProtected: z.boolean(),
  joinToken: z.string(),
  peerId: z.string(),
  displayName: z.string(),
});

export const sessionInfoResponseSchema = z.object({
  exists: z.boolean(),
  expiresAt: z.string().optional(),
  participantCount: z.number().optional(),
  isProtected: z.boolean().optional(),
});

export const joinSessionResponseSchema = z.object({
  joinToken: z.string(),
  expiresAt: z.string(),
  serverTime: z.string(),
  peerId: z.string(),
  displayName: z.string(),
});

export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type SessionInfoResponse = z.infer<typeof sessionInfoResponseSchema>;
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;
