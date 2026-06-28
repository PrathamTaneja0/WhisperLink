import { describe, expect, it } from 'vitest';
import { computeRemainingSeconds, parseRoomId } from './utils';

describe('parseRoomId', () => {
  it('parses bare room code', () => {
    expect(parseRoomId('xK9mP2nQ4rSt')).toBe('xK9mP2nQ4rSt');
  });

  it('parses full URL', () => {
    expect(parseRoomId('https://whisperlink.app/r/xK9mP2nQ4rSt')).toBe('xK9mP2nQ4rSt');
  });

  it('parses path format', () => {
    expect(parseRoomId('r/xK9mP2nQ4rSt')).toBe('xK9mP2nQ4rSt');
  });

  it('returns null for invalid input', () => {
    expect(parseRoomId('abc')).toBeNull();
    expect(parseRoomId('')).toBeNull();
  });
});

describe('computeRemainingSeconds', () => {
  it('computes remaining time with offset', () => {
    const expiresAt = new Date(Date.now() + 60000).toISOString();
    const remaining = computeRemainingSeconds(expiresAt, 0);
    expect(remaining).toBeGreaterThanOrEqual(59);
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it('returns zero for past expiry', () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    expect(computeRemainingSeconds(expiresAt)).toBe(0);
  });
});
