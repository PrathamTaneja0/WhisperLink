export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const raw = await kv.get(key);
  let timestamps: number[] = raw ? (JSON.parse(raw) as number[]) : [];
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  await kv.put(key, JSON.stringify(timestamps), { expirationTtl: windowSeconds });

  return { allowed: true, remaining: limit - timestamps.length };
}

export async function checkLockout(
  kv: KVNamespace,
  key: string,
): Promise<{ locked: boolean; retryAfterSeconds?: number }> {
  const raw = await kv.get(key);
  if (!raw) return { locked: false };

  const data = JSON.parse(raw) as { until: number };
  const now = Date.now();
  if (data.until > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((data.until - now) / 1000) };
  }
  await kv.delete(key);
  return { locked: false };
}

export async function recordFailedAttempt(
  kv: KVNamespace,
  key: string,
  maxAttempts: number,
  lockoutMinutes: number,
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const attemptKey = `${key}:attempts`;
  const raw = await kv.get(attemptKey);
  const attempts = raw ? parseInt(raw, 10) + 1 : 1;

  if (attempts >= maxAttempts) {
    const until = Date.now() + lockoutMinutes * 60 * 1000;
    await kv.put(key, JSON.stringify({ until }), { expirationTtl: lockoutMinutes * 60 });
    await kv.delete(attemptKey);
    return { locked: true, attemptsRemaining: 0 };
  }

  await kv.put(attemptKey, String(attempts), { expirationTtl: 3600 });
  return { locked: false, attemptsRemaining: maxAttempts - attempts };
}

export async function clearFailedAttempts(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(`${key}:attempts`);
  await kv.delete(key);
}
