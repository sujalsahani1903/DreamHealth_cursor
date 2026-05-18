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
- Set `FRONTEND_URL` after step 3
- Test: `/health`
- Stripe webhook: `https://YOUR-API.vercel.app/api/payment/webhook` → `checkout.session.completed`

**Caveat:** serverless = no persistent disk for admin image uploads. COD + login usually still work.

## 3. Render — frontend (static site)

| Setting | Value |
|---------|--------|
| Root | `frontend` |
| Build | `npm install && npm run build` |
| Publish | `dist` |
| Env | `VITE_API_URL=https://your-api.vercel.app` |

SPA rewrite: `/*` → `/index.html` if deep links 404.

## 4. Wire CORS

Redeploy Vercel with `FRONTEND_URL=https://your-app.onrender.com`.

## Fallback

API on Render web service + `gunicorn app:app` (see `backend/Procfile`) if Vercel Python acts up.
