# Dream Health Foods — Full-stack ecommerce

Production-style ecommerce for **Dream Health Foods** (healthy grains, atta, millets, sattu, mixes) with a **React + Vite** storefront, **Flask** REST API, **MySQL**, **JWT** (email + password sign-in), **email OTP for signup & forgot-password only**, and **Stripe Checkout**.

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | React 18, Vite, Tailwind, Framer Motion, Recharts, React Router, Axios, react-hot-toast |
| `backend/` | Flask blueprints, JWT, bcrypt, SQLAlchemy, Stripe, Resend or SMTP mail |
| `database/` | `schema.sql` + `seed.sql` |

## Prerequisites

- **Node.js 18+** and **npm**
- **Python 3.11+**
- **MySQL 8+**

## MySQL setup

1. Start MySQL and create the database (or run the schema file which creates it):

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

2. Default seeded accounts (password **`Password123!`**):

   - **Admin:** `admin@dreamhealthfoods.com`
   - **Customer:** `priya@example.com`

3. The Python stack uses **`mysql+pymysql://`** (see `backend/requirements.txt`). On Linux production you may switch the URI to `mysql+mysqldb://` if you install `mysqlclient` instead.

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # then edit values
python app.py                   # http://127.0.0.1:5000
```

### Important `backend/.env` fields

- `DATABASE_URL` — SQLAlchemy URI, e.g. `mysql+pymysql://USER:PASS@HOST:3306/dream_health_foods`
- `JWT_SECRET_KEY`, `SECRET_KEY` — long random strings in production
- `FRONTEND_URL` — e.g. `http://localhost:5173` (comma-separated list supported for CORS)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard
- **Email (OTP for signup & forgot password):** set `RESEND_API_KEY` **or** SMTP (`MAIL_USERNAME` / `MAIL_PASSWORD`)

**Admin signup from the UI:** registration includes an “Admin” role option, but the backend will **force role `user`** unless `ALLOW_PUBLIC_ADMIN=true` in `.env` (recommended only for bootstrapping).

## Frontend setup

```bash
cd frontend
copy .env.example .env.local    # optional: set VITE_API_URL to your API origin in production
npm install
npm run dev                     # http://localhost:5173
```

- **Local dev:** leave `VITE_API_URL` empty so Axios calls `/api` and Vite **proxies** to `http://127.0.0.1:5000` (`vite.config.js`).
- **Production (Vercel):** set `VITE_API_URL=https://your-api.onrender.com` (no trailing slash).

### Brand logo

Replace `frontend/public/logo.svg` with your official artwork (or add `logo.png` and point `Navbar.jsx` to `/logo.png`).

## Stripe

1. Create a **Stripe** account and get **test** keys.
2. Put `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/.env`.
3. Expose webhook URL: `https://YOUR-API-HOST/api/payment/webhook` and select events at minimum **`checkout.session.completed`**.
4. Checkout flow: user creates an order → backend creates **Stripe Checkout Session** → user pays → webhook marks order **paid**, writes **transaction**, decrements **stock**, logs **inventory**, clears **cart**, sends **confirmation email** (when mail is configured).

## Email / OTP

- **Sign-in:** email + password only (no OTP). JWT access and refresh tokens are returned immediately on successful login.
- **Signup / forgot password:** OTP is stored as a **bcrypt hash** in `email_otps` and expires after `OTP_EXPIRY_MINUTES` (default 10).
- **Resend:** set `RESEND_API_KEY`; “from” must be a verified domain/sender in Resend.
- **SMTP:** configure `MAIL_*` variables; `RESEND_API_KEY` can be empty.

## Deployment

### Frontend — Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY` (optional for future Elements)

`vercel.json` includes SPA rewrites.

### Backend — Render / Railway

- Root directory: `backend`
- Start command (see `Procfile`): `gunicorn app:app --bind 0.0.0.0:$PORT`
- Set the same environment variables as `.env.example`.
- **Stripe webhooks** must target the public HTTPS URL of this service.

### Database — managed MySQL

Use PlanetScale, RDS, or any MySQL 8 host. Import `schema.sql` then `seed.sql` (or run migrations manually in production).

## API overview

- **Auth:** `/api/auth/signup`, `login`, `logout`, `send-otp`, `verify-otp`, `forgot-password`, `reset-password`, `refresh`, `profile`, `addresses` (CRUD)
- **Catalog:** `/api/products`, `/api/products/:id`, `/api/products/search`, `/api/products/category/:id`, admin CRUD
- **Categories:** `/api/categories`
- **Cart / wishlist:** `/api/cart/*`, `/api/wishlist/*`
- **Orders:** `/api/orders`, `/api/orders/my-orders`, `/api/orders/:id/invoice`, `/api/orders/all-orders` (admin)
- **Payments:** `/api/payment/create-checkout-session`, `webhook`, `success`, `cancel`
- **Reviews:** `/api/reviews/add`, `/api/reviews/product/:id`, `/api/reviews/:id`
- **Inventory / raw materials:** `/api/inventory/*`, `/api/raw-materials/*`
- **Admin:** `/api/admin/dashboard`, `users`, `orders`, `revenue-analytics`, `product-performance`, `top-selling-products`, `stock-summary`, `customer-feedbacks`, `reports`, `suppliers`, `upload`, `orders/:id/status`, `reviews/:id/reply`

## Security notes

- Passwords hashed with **bcrypt**; JWT access + refresh tokens.
- Configure **HTTPS** and **strong secrets** in production.
- Rate limiting via **Flask-Limiter** (defaults to in-memory store — use Redis in production for multi-instance).

## License

Proprietary — Dream Health Foods. All rights reserved.
