# WhisperLink Architecture

WhisperLink is an ephemeral voice-and-text chat app built on Cloudflare Workers, Durable Objects, and browser WebRTC.

## High-level flow

```
Browser (React)                    Cloudflare Worker                 Durable Object (Room)
     |                                    |                                  |
     |-- POST /api/sessions -------------->| create room metadata ------------>|
     |<-- joinToken, roomId ---------------|                                  |
     |                                    |                                  |
     |-- WebSocket /api/rooms/:id/ws ---->| proxy ---------------------------->|
     |   (signaling + chat relay)         |                                  |
     |                                    |                                  |
     |<======== WebRTC audio (P2P mesh) ===================================>|
```

1. **Session creation** — The worker validates input, generates a room ID, and asks the Room Durable Object to store ephemeral metadata (expiry, optional passcode hash, host peer ID).
2. **Join** — Clients receive a signed JWT join token containing their peer ID and display name. The token authorizes the WebSocket connection.
3. **Signaling** — WebRTC offer/answer/ICE messages are relayed through the Room DO to other participants. The server never decodes audio.
4. **Session end** — When time expires or the host ends the session, the DO broadcasts `session:ended`, closes sockets, and clears in-memory state.

## Chat: ephemeral relay model

Text chat uses a **relay-only** model — messages are never persisted.

```
Participant A                Room Durable Object              Participant B
     |                              |                              |
     |-- chat:message { text } ---->|                              |
     |                              |-- validate length/rate ------|
     |                              |-- broadcast chat:message --->|
     |<-- chat:message (echo) ------|                              |
```

### What the server does

- Accepts `chat:message` events over the room WebSocket.
- Validates message length (`MAX_MESSAGE_LENGTH`) and per-peer rate limits (`CHAT_RATE_LIMIT_PER_SEC`).
- Attaches sender `peerId`, `displayName`, and a server timestamp.
- Broadcasts the message to all connected peers in the room.

### What the server does not do

- Write messages to KV, D1, R2, or any durable storage.
- Retain message history after a peer disconnects or the session ends.
- Deliver messages to participants who join after a message was sent.

When a session ends (`destroyRoom`), the in-memory `chatRateLimits` map is cleared and no chat history remains on the server.

### Client-side behavior

The web app keeps chat messages in React state for the duration of the active session. Refreshing the page or rejoining starts with an empty transcript — consistent with the ephemeral design.

## Voice: WebRTC mesh

Audio travels peer-to-peer via a partial mesh (up to 6 participants). The worker provides TURN credentials when configured; otherwise clients fall back to a public STUN server. The Room DO relays signaling payloads only.

## Session metadata storage

The Room Durable Object stores:

| Field | Purpose |
|-------|---------|
| `expiresAt` | Session TTL |
| `isProtected` / `passwordHash` | Optional passcode gate |
| `hostPeerId` | Who can end the session |
| `ended` | Whether the session is finished |

No conversation content is stored. Passcodes are kept as salted hashes only.

## Packages

| Package | Role |
|---------|------|
| `apps/web` | React SPA — landing, session setup, room UI |
| `apps/worker` | HTTP API, WebSocket upgrade, Room Durable Object |
| `packages/shared` | Zod schemas, event types, shared constants |

## Security notes

- Join tokens are short-lived JWTs scoped to a room and peer.
- Rate limiting (KV) protects session creation and passcode attempts.
- Chat is rate-limited per peer to reduce abuse during relay.
