# WhisperLink

Talk freely. No strings attached.

WhisperLink is a lightweight, anonymous voice and text chat app. Create a session, set a time limit, share a link, talk, then the session is destroyed. No accounts required.

## Features

- **Ephemeral sessions** — auto-expire or end manually
- **Public or password-protected** rooms
- **Voice and text** — up to 6 participants (P2P audio mesh)
- **Zero friction** — no sign-up, minimal clicks

## Tech stack

- **Frontend:** Vite + React + TypeScript + Tailwind + Framer Motion
- **Backend:** Cloudflare Workers + Durable Objects + KV
- **Deploy:** Cloudflare Pages (single platform)

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
npm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

### Run locally

Build the web app first, then start the worker (serves API + static assets):

```bash
npm run build --workspace=@whisperlink/web
npm run dev --workspace=@whisperlink/worker
```

Open http://localhost:8787

For frontend hot reload during development, run Vite separately:

```bash
npm run dev --workspace=@whisperlink/web   # http://localhost:5174 (proxies /api to worker)
```

### Tests

```bash
npm run test          # unit + integration tests
npm run test:e2e      # Playwright E2E tests
npm run lint
npm run typecheck
```

## Deploy to Cloudflare

1. Create a Cloudflare Pages project connected to this repo
2. Set build command: `npm run build`
3. Set output directory: `apps/web/dist`
4. Add secrets: `JWT_SECRET`, optionally `METERED_API_KEY` / `METERED_APP_NAME` for TURN
5. Create KV namespace for rate limiting and update `wrangler.toml` with the ID
6. Deploy via GitHub Actions or `npx wrangler pages deploy apps/web/dist --project-name=whisperlink`

## Environment variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Join token signing key (min 32 chars) |
| `METERED_API_KEY` | Optional TURN credentials (Metered.ca) |
| `METERED_APP_NAME` | Optional Metered app name |

## Privacy

Sessions are ephemeral. We do not store voice or text after a session ends. See [/privacy](/privacy) in the app.
