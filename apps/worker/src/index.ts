import { Room } from './durable-objects/Room';
import type { Env } from './types';
import {
  handleCreateSession,
  handleGetSession,
  handleJoinSession,
  handleEndSession,
} from './routes/sessions';
import { handleTurnRequest } from './routes/turn';

export { Room };

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', serverTime: new Date().toISOString() });
    }

    if (url.pathname === '/api/sessions' && request.method === 'POST') {
      return handleCreateSession(request, env);
    }

    const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch) {
      const roomId = sessionMatch[1];
      if (request.method === 'GET') {
        return handleGetSession(roomId, env);
      }
    }

    const joinMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/join$/);
    if (joinMatch && request.method === 'POST') {
      return handleJoinSession(joinMatch[1], request, env);
    }

    const endMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/end$/);
    if (endMatch && request.method === 'POST') {
      return handleEndSession(endMatch[1], request, env);
    }

    if (url.pathname === '/api/turn' && request.method === 'GET') {
      return handleTurnRequest(env);
    }

    const wsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      const roomId = wsMatch[1];
      const id = env.ROOM.idFromName(roomId);
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
