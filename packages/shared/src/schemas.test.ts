import { describe, it, expect } from 'vitest';
import { createSessionSchema, joinSessionSchema, MAX_DURATION_MINUTES } from '@whisperlink/shared';

describe('session API schemas', () => {
  it('accepts valid create session payload with displayName', () => {
    const result = createSessionSchema.safeParse({
      displayName: 'Alice',
      durationMinutes: 30,
      access: 'public',
    });
    expect(result.success).toBe(true);
  });

  it('rejects duration above max', () => {
    const result = createSessionSchema.safeParse({
      displayName: 'Alice',
      durationMinutes: MAX_DURATION_MINUTES + 1,
      access: 'public',
    });
    expect(result.success).toBe(false);
  });

  it('requires displayName on join', () => {
    const result = joinSessionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts valid join payload', () => {
    const result = joinSessionSchema.safeParse({ displayName: 'Bob' });
    expect(result.success).toBe(true);
  });
});
