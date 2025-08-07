## minauty

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

To run the devserver:
```
npm install
npm run dev
```

---

## Setup & Environments

Create an `.env` (or use Vercel Project Environment Variables) with Vercel KV credentials:

```
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

You can copy from `.env.example` and fill values from Vercel → Storage → KV.

---

## Local Development

- Frontend (Vite):
  - `npm install`
  - `npm run dev` → http://localhost:5173

- Edge API (Vercel dev):
  - Install Vercel CLI: `npm i -g vercel`
  - Login & link: `vercel login` → `vercel link`
  - Pull env: `vercel env pull .env.local`
  - Run: `vercel dev` (serves `/api/*` via `api/index.ts`)

---

## Build

```
npm run build
```

Output directory: `dist`

---

## Deploy to Vercel

1. Create a Vercel project and connect this repo.
2. Create a KV database (Vercel → Storage → KV) and add env vars to Project Settings.
3. Ensure `vercel.json` is present (Edge function + SPA rewrites).
4. Framework preset: Vite (or Other), Build Command: `vite build`, Output: `dist`.
5. Deploy from dashboard or run:

```
vercel
vercel --prod
```

---

## API Overview (Edge /api)

- `POST /api/message` — store offline message (rate-limited, ~5/hour per pair)
- `GET /api/messages?userID=...` — fetch & clear pending messages
- `POST /api/ack` — acknowledge delivery (log)
- `POST /api/presence/online|offline` — set presence
- `GET /api/presence/:userID` — get presence
- `POST /api/heartbeat` — update lastSeen + online
- `POST /api/cleanup` — no-op (KV auto-expire + clear-on-delivery)

---

## Notes

- CORS is permissive for development; restrict origins in production if needed.
- No SQL migrations required in Vercel mode; using Vercel KV as backing store.
- Frontend lives under `src/react-app/` and calls same-origin `/api/*` endpoints.
