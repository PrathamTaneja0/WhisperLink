import type { Env } from '../types';

const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production-min-32-chars';

export function getJwtSecret(env: Env): string {
  return env.JWT_SECRET || DEV_FALLBACK_SECRET;
}
