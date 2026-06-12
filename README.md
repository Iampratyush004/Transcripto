# Live Coding Interview App

Next.js app with **Nhost** email/password auth and **Deepgram** live speech-to-text.

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your real keys (Next.js does NOT read .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` in the project root:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | Nhost project subdomain |
| `NEXT_PUBLIC_NHOST_REGION` | Nhost region (e.g. `us-east-1`) |
| `NEXT_PUBLIC_DEEPGRAM_API_KEY` | Deepgram API key |

Example:

```env
NEXT_PUBLIC_NHOST_SUBDOMAIN=abcdefghijkl
NEXT_PUBLIC_NHOST_REGION=us-east-1
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key
```

Restart the dev server after changing env vars.

---

## Nhost setup guide

1. Go to [https://app.nhost.io](https://app.nhost.io) and create a free account.
2. **Create a new project** (any name).
3. Open **Settings → General** and copy:
   - **Subdomain** → `NEXT_PUBLIC_NHOST_SUBDOMAIN`
   - **Region** → `NEXT_PUBLIC_NHOST_REGION`
4. **Enable email/password auth**
   - Go to **Authentication → Settings**
   - Ensure **Email + Password** sign-in is enabled
5. **Optional: disable email verification** (faster for interviews)
   - **Authentication → Settings**
   - Turn off “Require email verification” if you want instant login after signup
6. Paste values into `.env.local` and run `npm run dev`.

### Routes

| Path | Purpose |
|------|---------|
| `/login` | Email/password login |
| `/signup` | Create account |
| `/dashboard` | Protected; redirects to `/login` if not authenticated |

Session persistence is handled by Nhost (browser storage). The app uses `nhost.auth` directly — no React context provider.

Protected routes check `isLoggedIn()` on the client and call `redirect('/login')` if needed. No middleware.

---

## Deepgram setup guide

1. Go to [https://console.deepgram.com](https://console.deepgram.com) and sign up.
2. Open **API Keys** and **Create a new API key**.
3. Copy the key into `.env.local` as `NEXT_PUBLIC_DEEPGRAM_API_KEY`.
4. Ensure your Deepgram project has **streaming / live** access (default on free tier with credits).

### How it works in this app

- Click **Start Recording** → browser asks for microphone permission
- Audio is captured with `MediaRecorder` (WebM/Opus chunks every 250ms)
- Chunks stream over WebSocket to Deepgram `nova-2` model
- Interim and final transcripts update React state in real time
- **Stop Recording** closes the mic and WebSocket
- Nothing is saved to a database

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Microphone denied | Allow mic in browser site settings; use HTTPS or localhost |
| Deepgram connection failed | Check API key, credits, and env var name |
| No transcript | Speak after status shows **Recording**; check browser console |

> **Note:** The Deepgram API key is exposed to the browser (`NEXT_PUBLIC_*`). Fine for demos/interviews; use a server-side token endpoint in production.

---

## Project structure

```
src/
  app/
    login/page.tsx       # Login
    signup/page.tsx      # Signup
    dashboard/page.tsx   # Protected dashboard + recording
  components/
    AuthForm.tsx         # Shared login/signup form
  lib/
    nhost.ts             # Nhost client
    deepgram.ts          # Mic capture + Deepgram WebSocket
```

## Scripts

```bash
npm run dev    # Development
npm run build  # Production build
npm run start  # Run production server
```
