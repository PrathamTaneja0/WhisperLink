import type { Env } from '../types';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export async function handleTurnRequest(env: Env): Promise<Response> {
  if (env.METERED_API_KEY && env.METERED_APP_NAME) {
    try {
      const res = await fetch(
        `https://${env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${env.METERED_API_KEY}`,
      );
      if (res.ok) {
        const iceServers = await res.json();
        return Response.json({ iceServers });
      }
    } catch {
      // fall through to default
    }
  }

  return Response.json({ iceServers: DEFAULT_ICE_SERVERS });
}
