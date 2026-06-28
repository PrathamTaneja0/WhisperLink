import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

function createKv(store = new Map<string, string>()) {
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  } as unknown as KVNamespace;
}

describe('checkRateLimit', () => {
  it('allows requests under limit', async () => {
    const kv = createKv();
    const result = await checkRateLimit(kv, 'test-key', 3, 3600);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests over limit', async () => {
    const kv = createKv();
    await checkRateLimit(kv, 'test-key', 2, 3600);
    await checkRateLimit(kv, 'test-key', 2, 3600);
    const result = await checkRateLimit(kv, 'test-key', 2, 3600);
    expect(result.allowed).toBe(false);
  });
});
