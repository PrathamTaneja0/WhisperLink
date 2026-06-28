import { useEffect, useRef, useState } from 'react';
import { computeRemainingSeconds, formatRemainingTime } from '@whisperlink/shared';

export function useCountdown(
  expiresAt: string | undefined,
  serverTimeOffset = 0,
  onExpire?: () => void,
) {
  const [remaining, setRemaining] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const next = computeRemainingSeconds(expiresAt, serverTimeOffset);
      setRemaining((prev) => {
        if (prev > 0 && next <= 0) {
          onExpireRef.current?.();
        }
        return next;
      });
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
