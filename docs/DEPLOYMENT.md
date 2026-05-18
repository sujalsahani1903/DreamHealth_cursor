# Deployment guide

Checklist for publishing **Dream Health Foods** to production.

## Pre-push (GitHub)

- [ ] Confirm `backend/.env` and `frontend/.env.local` are **not** tracked (`git status`)
- [ ] Rotate any secrets that were ever committed (DB password, Stripe keys, JWT secrets)
- [ ] Run `npm run build` in `frontend/` locally
- [ ] Update README live-demo URL once deployed (optional)

## Database

1. Create a MySQL 8 database on your host (PlanetScale, RDS, Aiven, etc.).
2. Import schema:
   ```bash
   mysql -h HOST -u USER -p DATABASE < database/schema.sql
   ```
3. Optionally seed demo data (development/staging only):
   ```bash
   mysql -h HOST -u USER -p DATABASE < database/seed.sql
   ```
4. If upgrading an older database, run [database/migrations/run_all_new_changes.sql](../database/migrations/run_all_new_changes.sql).

## Backend (Render example)

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `gunicorn app:app --bind 0.0.0.0:$PORT` |
| Health check path | `/health` |

**Environment variables** (copy from `.env.example`):

- `FLASK_ENV=production`
- `DATABASE_URL` — hosted MySQL URI
- `SECRET_KEY`, `JWT_SECRET_KEY` — generate with `openssl rand -hex 32`
- `FRONTEND_URL` — your Vercel URL (no trailing slash)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Mail: `RESEND_API_KEY` or SMTP `MAIL_*`

### Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint  
2. URL: `https://YOUR-API-HOST/api/payment/webhook`  
3. Event: `checkout.session.completed` (minimum)  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Frontend (Vercel)

| Setting | Value |
|---------|--------|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework | Vite |

**Environment variables:**

- `VITE_API_URL=https://your-api.onrender.com` (no trailing slash)

`vercel.json` already includes SPA rewrites.

## Post-deploy verification

1. `GET https://your-api/health` → `{ "status": "ok" }`
2. Register / login on the live site
3. Place a **COD** test order (works without Stripe)
4. With Stripe test keys: complete checkout and confirm webhook marks order paid
5. Admin login → update an order line status

## Common issues

| Symptom | Fix |
|---------|-----|
| Logged out after payment | Set `FRONTEND_URL` to exact Vercel URL; ensure `VITE_API_URL` matches API |
| CORS errors | Add storefront URL to `FRONTEND_URL` |
| Webhook 400 | Wrong `STRIPE_WEBHOOK_SECRET` or body not raw |
| DB connection errors | Check `DATABASE_URL`, SSL params, firewall allowlist |
