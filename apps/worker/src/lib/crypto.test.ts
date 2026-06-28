import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { issueJoinToken, verifyJoinToken } from '../lib/jwt';

describe('crypto', () => {
  it('hashes and verifies password', async () => {
    const stored = await hashPassword('secret-pass');
    expect(await verifyPassword('secret-pass', stored)).toBe(true);
    expect(await verifyPassword('wrong-pass', stored)).toBe(false);
  });
});

describe('jwt', () => {
  const secret = 'test-secret-key-minimum-32-characters-long';

  it('issues and verifies join token', async () => {
    const token = await issueJoinToken(
      {
        roomId: 'room1234567890',
        peerId: 'peer-1',
        displayName: 'Quiet Fox',
        isHost: false,
      },
      secret,
    );
    const payload = await verifyJoinToken(token, secret, 'room1234567890');
    expect(payload?.peerId).toBe('peer-1');
  });

  it('rejects wrong room id', async () => {
    const token = await issueJoinToken(
      {
        roomId: 'room1234567890',
        peerId: 'peer-1',
        displayName: 'Quiet Fox',
        isHost: false,
      },
      secret,
    );
    const payload = await verifyJoinToken(token, secret, 'other-room');
    expect(payload).toBeNull();
  });
});
