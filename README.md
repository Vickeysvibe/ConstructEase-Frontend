# ConstructEase web

React 18 + TypeScript + Vite. Talks to the ConstructEase API (`Constructease-Backend`, contract in its `docs/API.md`).

```bash
cp .env.example .env        # optional; defaults work with the dev proxy
npm install
npm run dev                 # http://localhost:5173, proxies /api → http://localhost:8000
npm run typecheck && npm run lint && npm test && npm run build
```

## How it fits together

```
src/
  app/        router, AppShell (top bar + site sidebar), auth (session bootstrap), guards, site context + permissions
  lib/api/    client.ts (the only HTTP client), types.ts (mirror of docs/API.md)
  lib/        format.ts (₹, qty, dates), hooks.ts (URL list params, form errors, export jobs)
  ui/         design tokens + component kit — every screen is built from these
  features/   one folder per area; pages are default exports, lazy-loaded by app/router.tsx
```

- **Auth**: the access token lives in memory only. The refresh token is an httpOnly cookie; on load and on any 401 the client calls `/auth/refresh` once (shared between concurrent requests) and retries.
- **Server state**: TanStack Query. List filters, page and sort live in the URL (`useListParams`) so lists are linkable.
- **Forms**: react-hook-form + zod. API field errors are mapped onto inputs with `applyFieldErrors`.
- **Permissions**: `useSite().can("purchasing:write")` mirrors the API matrix to hide what a role can't do. The API enforces everything regardless.
- **Feedback**: `notify.success/error` toasts and `useConfirm()` dialogs. `window.alert/confirm` are banned by lint.

See `docs/FRONTEND.md` for the rules every page follows.

## Deploy (Vercel)

`vercel.json` serves `index.html` for every app route (so refreshing `/sites/...` works) and sets security headers.
Leave `VITE_API_URL` unset: the app calls `/api/v1` on its own domain, and Vercel forwards it to the API, keeping the
refresh cookie first-party. Add the forward once the API has a URL, as the first rewrite in `vercel.json`:

```json
{ "source": "/api/:path*", "destination": "https://YOUR-API-HOST/api/:path*" }
```

On the API set `CORS_ORIGINS` to the Vercel URL, `COOKIE_SECURE=true` and `COOKIE_SAMESITE=lax`.
