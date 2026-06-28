import { useEffect, useState } from 'react';
import { computeRemainingSeconds, formatRemainingTime } from '@whisperlink/shared';

export function useCountdown(expiresAt: string | undefined, serverTimeOffset = 0) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      setRemaining(computeRemainingSeconds(expiresAt, serverTimeOffset));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, serverTimeOffset]);

  return {
    remainingSeconds: remaining,
    formatted: formatRemainingTime(remaining),
    isExpired: remaining <= 0,
  };
}
