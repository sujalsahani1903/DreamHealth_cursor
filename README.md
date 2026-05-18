# Dream Health Foods

E-commerce site for a local grains/atta shop (Siliguri). Customers browse products, pick pack sizes, checkout with COD or Stripe. Admin manages stock, orders, and basic analytics.

**Stack:** React (Vite) + Flask + MySQL  

**Repo:** [github.com/sujalsahani1903/DreamHealth_cursor](https://github.com/sujalsahani1903/DreamHealth_cursor)

---

## What it does

- User auth: email/password login, OTP on signup & forgot-password (needs mail config)
- Products with variants (250g–5kg), cart, wishlist, buy-now
- Orders with per-line status (one item can ship before another)
- Payments: COD + Stripe Checkout (webhook marks order paid)
- Admin dashboard, product upload, inventory hooks
- Contact page with WhatsApp links

---

## Run locally

**Needs:** Node 18+, Python 3.11+, MySQL 8

```bash
# DB
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Seed logins (password `Password123!`):

- Admin: `admin@dreamhealthfoods.com`
- User: `priya@example.com`

```bash
# API
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # set DATABASE_URL at minimum
python app.py            # :5000
```

```bash
# UI
cd frontend
copy .env.example .env.local
npm install
npm run dev              # :5173 — proxies /api to Flask if VITE_API_URL is empty
```

Check API: `http://127.0.0.1:5000/health`

**Assumptions / caveats**

- Product images save to `backend/uploads/` — fine on a VPS; breaks on serverless (Vercel) unless you move to S3 later
- Stripe needs webhook URL pointing at your deployed API
- Email OTP won’t send until `MAIL_*` or `RESEND_API_KEY` is set in `.env`
- Rate limiter uses in-memory store (ok for demo, not for multi-instance prod)
- `ALLOW_PUBLIC_ADMIN=false` by default so random signups can’t pick admin

---

## Env vars

See `backend/.env.example` and `frontend/.env.example`.

| Where | Important keys |
|-------|----------------|
| backend | `DATABASE_URL`, `JWT_SECRET_KEY`, `SECRET_KEY`, `FRONTEND_URL`, Stripe keys |
| frontend | `VITE_API_URL` (only for production build — leave blank in local dev) |

---

## Deploy (free-ish)

Planned setup: Railway (MySQL) → Vercel (API) → Render (static frontend). Steps in [docs/DEPLOY.md](docs/DEPLOY.md).

If Vercel API gives trouble, put Flask on Render with Gunicorn (`backend/Procfile`) instead.

---

## Project layout

```
backend/     Flask routes, models, uploads
frontend/    React pages + admin panels
database/    schema.sql, seed.sql, migrations/
```

DB upgrades: `database/migrations/run_all_new_changes.sql` (ignore “duplicate column” if already applied).

---

## Notes for reviewers

- JWT access + refresh; tokens in `localStorage` (not httpOnly — known tradeoff)
- Order status on parent row is computed from line items in `backend/utils/order_helpers.py`
- CI runs frontend build + imports Flask app on push

MIT — see [LICENSE](LICENSE).
