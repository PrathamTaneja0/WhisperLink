import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseRoomId } from '@whisperlink/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from './FormError';
import { NameInput } from './NameInput';
import { getSessionInfo, joinSession, storeJoinToken } from '@/lib/api';

export function JoinPanel() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resolvedRoomId, setResolvedRoomId] = useState<string | null>(null);

  async function checkRoom(roomId: string) {
    const info = await getSessionInfo(roomId);
    if (!info.exists) {
      throw new Error('Session not found or has ended');
    }
    setNeedsPassword(!!info.isProtected);
    setResolvedRoomId(roomId);
    return info;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    const roomId = resolvedRoomId ?? parseRoomId(roomInput);
    if (!roomId) {
      setError('Enter a valid room code or link');
      return;
    }

    if (!displayName.trim()) {
      setError('Enter your name');
      return;
    }

    setLoading(true);
    try {
      if (!resolvedRoomId) {
        await checkRoom(roomId);
      }

      const result = await joinSession(roomId, displayName.trim(), needsPassword ? password : undefined);
      storeJoinToken(roomId, result.joinToken);
      sessionStorage.setItem(`whisperlink:peer:${roomId}`, JSON.stringify({
        peerId: result.peerId,
        displayName: result.displayName,
      }));
      navigate(`/r/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-session space-y-6 p-6 sm:p-8">
      <NameInput value={displayName} onChange={setDisplayName} />
      <div>
        <label htmlFor="join-room" className="label-md">
          Room code or link
        </label>
        <Input
          id="join-room"
          value={roomInput}
          onChange={(e) => {
            setRoomInput(e.target.value);
            setResolvedRoomId(null);
            setNeedsPassword(false);
          }}
          placeholder="Paste room code or link"
          className="mt-2"
          required
        />
      </div>
      {needsPassword && (
        <div>
          <label htmlFor="join-password" className="label-md">
            Passcode
          </label>
          <PasswordInput
            id="join-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter passcode"
            className="mt-2"
            required
          />
        </div>
      )}
      <FormError message={error} />
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Joining…' : 'Join →'}
      </Button>
    </form>
  );
}
