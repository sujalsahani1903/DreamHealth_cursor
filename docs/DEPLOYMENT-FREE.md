# Free deployment: Railway + Render + Vercel

| Service | Hosts | Free tier notes |
|---------|--------|-----------------|
| **MySQL** | [Railway](https://railway.app) | ~$5 trial credit; then usage-based |
| **React storefront** | [Render](https://render.com) static site | Free static sites |
| **Flask API** | [Vercel](https://vercel.com) | Hobby free; serverless Python |

Deploy in this order: **Database → Backend → Frontend** (frontend needs the API URL).

---

## 1. Push code to GitHub

Already on: `https://github.com/sujalsahani1903/DreamHealth_cursor`

---

## 2. Railway — MySQL database

1. [railway.app](https://railway.app) → **New Project** → **Deploy MySQL** (or **Add MySQL** from template).
2. Open the MySQL service → **Variables** / **Connect** and note:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
3. Build your SQLAlchemy URL (URL-encode special characters in the password):

   ```
   mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

   Example:

   ```
   mysql+pymysql://root:abc%40123@containers-us-west-xxx.railway.app:3306/railway
   ```

4. Import schema (from your PC with Railway’s **public** TCP proxy enabled, or Railway CLI):

   ```bash
   mysql -h HOST -P PORT -u USER -p DATABASE < database/schema.sql
   mysql -h HOST -P PORT -u USER -p DATABASE < database/seed.sql
   ```

   Optional: use MySQL Workbench / TablePlus with Railway’s connection string.

---

## 3. Vercel — Flask backend (API)

> **Note:** Vercel runs Python as **serverless**. It works for this API, but **admin image uploads** may not persist (no local disk). COD + Stripe webhooks usually work. For heavy file uploads, host the API on Render instead (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

1. [vercel.com](https://vercel.com) → **Add New Project** → import `DreamHealth_cursor`.
2. **Root Directory:** `backend`
3. **Framework Preset:** Other (uses `backend/vercel.json`)
4. **Environment variables:**

   | Variable | Value |
   |----------|--------|
   | `FLASK_ENV` | `production` |
   | `DATABASE_URL` | Railway URL from step 2 |
   | `SECRET_KEY` | long random string |
   | `JWT_SECRET_KEY` | long random string |
   | `FRONTEND_URL` | `https://YOUR-RENDER-SITE.onrender.com` (set after step 4) |
   | `STRIPE_SECRET_KEY` | Stripe test/live key |
   | `STRIPE_WEBHOOK_SECRET` | from Stripe webhook |
   | `ALLOW_PUBLIC_ADMIN` | `false` |
   | `RESEND_API_KEY` or `MAIL_*` | for OTP email (optional) |

5. **Deploy** → copy URL, e.g. `https://dream-health-api.vercel.app`
6. Test: `https://YOUR-API.vercel.app/health` → `{"status":"ok",...}`

### Stripe webhook (Vercel)

- Endpoint: `https://YOUR-API.vercel.app/api/payment/webhook`
- Event: `checkout.session.completed`

---

## 4. Render — React frontend (static)

1. [render.com](https://render.com) → **New** → **Static Site** → connect GitHub repo.
2. Settings:

   | Field | Value |
   |-------|--------|
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

3. **Environment variable:**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.vercel.app` (no trailing slash) |

4. **Redirects** (SPA): Render usually adds rewrite via `render.yaml` in `frontend/`. If routes 404 on refresh, add a rewrite rule `/*` → `/index.html`.

5. Deploy → URL like `https://dream-health-storefront.onrender.com`

6. Go back to **Vercel** → set `FRONTEND_URL` to this Render URL → **Redeploy** API (CORS).

---

## 5. Verify

- [ ] `GET https://api.../health` OK  
- [ ] Open Render site → shop loads products  
- [ ] Register / login  
- [ ] COD order completes  
- [ ] Admin: `admin@dreamhealthfoods.com` / `Password123!` (if seeded)

---

## Environment summary

```
Railway  → DATABASE_URL  → Vercel (backend)
Vercel   → API URL       → Render VITE_API_URL (frontend)
Render   → site URL      → Vercel FRONTEND_URL (CORS)
```

---

## If Vercel backend fails

Use **Render Web Service** for `backend/` (Gunicorn) instead — see [DEPLOYMENT.md](./DEPLOYMENT.md). Keep **Render static** for frontend and **Railway** for MySQL. That is the most reliable free combo for Flask + file uploads.
