# Deploy notes

Order: **MySQL (Railway) → API (Vercel) → frontend (Render)**. Frontend build needs the API URL; API needs `FRONTEND_URL` for CORS after frontend is live.

## 1. Railway — MySQL

1. New project → add MySQL.
2. Copy connection vars → build:
   ```
   mysql+pymysql://USER:PASS@HOST:PORT/DB
   ```
   Encode `@` in password as `%40`.
3. Import (enable public TCP if connecting from laptop):
   ```bash
   mysql -h HOST -P PORT -u USER -p DB < database/schema.sql
   mysql -h HOST -P PORT -u USER -p DB < database/seed.sql
   ```

## 2. Vercel — backend

- Import repo, **root directory:** `backend`
- Env: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, `FLASK_ENV=production`, Stripe keys, `ALLOW_PUBLIC_ADMIN=false`
- `DATABASE_URL` must reach MySQL — `mysql://...` from Railway is OK (app rewrites to `mysql+pymysql`). URL-encode `@` in passwords as `%40`.
- Set `FRONTEND_URL` after step 3
- Test: `https://YOUR-ACTUAL-PROJECT.vercel.app/health` (not the placeholder `your-api.vercel.app` from docs)
- Vercel project → **Settings → General** → confirm **Root Directory** = `backend`
- If routes 404: redeploy after `api/index.py` + `vercel.json` are pushed; enable legacy builds if prompted
- Stripe webhook: `https://YOUR-API.vercel.app/api/payment/webhook` → `checkout.session.completed`

**Caveat:** serverless = no persistent disk for admin image uploads. COD + login usually still work.

## 3. Render — frontend (static site)

| Setting | Value |
|---------|--------|
| Root | `frontend` |
| Build | `npm install && npm run build` |
| Publish | `dist` |
| Env | `VITE_API_URL=https://your-api.vercel.app` |

**Render settings (important):**
- Service type: **Static Site** (not Web Service)
- Root directory: `frontend`
- Build: `npm ci && npm run build`
- Publish directory: `dist` (not `frontend/dist` if root is already `frontend`)

**If you see 404 on `/assets/*.js` or “Failed to fetch dynamically imported module”:**
1. Render → your static site → **Manual Deploy** → check **Clear build cache**
2. After deploy, open site in **incognito** (old `index-*.js` in cache pointed at deleted chunks)
3. In browser DevTools → Network, click a 404 `.js` URL — if the response is HTML, the SPA rewrite is wrong; if true 404, the `dist/assets` folder was not fully published (re-check publish path)

## 4. Wire CORS

Redeploy Vercel with `FRONTEND_URL=https://your-app.onrender.com`.

## Fallback

API on Render web service + `gunicorn app:app` (see `backend/Procfile`) if Vercel Python acts up.
