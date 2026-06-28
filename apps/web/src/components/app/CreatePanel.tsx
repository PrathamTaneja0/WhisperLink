import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_DURATION_MINUTES, PASSCODE_MIN_LENGTH, PASSCODE_MAX_LENGTH } from '@whisperlink/shared';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { DurationPicker } from './DurationPicker';
import { AccessToggle } from './AccessToggle';
import { FormError } from './FormError';
import { createSession, storeJoinToken } from '@/lib/api';

export function CreatePanel() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(DEFAULT_DURATION_MINUTES);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (isProtected) {
      if (password.length < PASSCODE_MIN_LENGTH || password.length > PASSCODE_MAX_LENGTH) {
        setError(`Passcode must be ${PASSCODE_MIN_LENGTH}–${PASSCODE_MAX_LENGTH} characters`);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await createSession({
        durationMinutes: duration,
        access: isProtected ? 'protected' : 'public',
        password: isProtected ? password : undefined,
      });
      storeJoinToken(result.roomId, result.joinToken);
      if (isProtected) {
        sessionStorage.setItem(`whisperlink:pass:${result.roomId}`, password);
      }
      sessionStorage.setItem(`whisperlink:peer:${result.roomId}`, JSON.stringify({
        peerId: result.peerId,
        displayName: result.displayName,
      }));
      navigate(`/r/${result.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-privacy space-y-6 p-6 sm:p-8">
      <DurationPicker value={duration} onChange={setDuration} />
      <AccessToggle isProtected={isProtected} onChange={setIsProtected} />
      {isProtected && (
        <div>
          <label htmlFor="create-password" className="label-md">
            Passcode
          </label>
          <PasswordInput
            id="create-password"
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
        {loading ? 'Creating…' : 'Start Session →'}
      </Button>
    </form>
  );
}
