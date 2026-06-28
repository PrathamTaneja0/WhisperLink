const ADJECTIVES = [
  'Quiet', 'Calm', 'Swift', 'Bold', 'Soft', 'Bright', 'Cool', 'Warm',
  'Gentle', 'Quick', 'Silent', 'Clear', 'Deep', 'Light', 'Wise', 'Free',
] as const;

const ANIMALS = [
  'Fox', 'Heron', 'Owl', 'Lynx', 'Hawk', 'Wolf', 'Deer', 'Bear',
  'Raven', 'Crane', 'Otter', 'Panda', 'Tiger', 'Eagle', 'Finch', 'Seal',
] as const;

export function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

export function generatePeerId(): string {
  return crypto.randomUUID();
}

const ROOM_ID_PATTERN = /\/r\/([a-zA-Z0-9_-]{12,})/;

export function parseRoomId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(ROOM_ID_PATTERN);
  if (urlMatch) return urlMatch[1];

  const pathMatch = trimmed.match(/^r\/([a-zA-Z0-9_-]{12,})$/);
  if (pathMatch) return pathMatch[1];

  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) return trimmed;

  return null;
}

export function formatRemainingTime(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeRemainingSeconds(expiresAt: string, serverTimeOffset = 0): number {
  const expires = new Date(expiresAt).getTime();
  const now = Date.now() + serverTimeOffset;
  return Math.max(0, Math.floor((expires - now) / 1000));
}
