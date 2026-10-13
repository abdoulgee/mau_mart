# MAU MART Production Deployment

The backend runs on Render, the frontend on Vercel, the database on PostgreSQL (Supabase, CockroachDB or Render Postgres), and uploaded photos in Supabase Storage.

## 1. Database

The marketplace redesign uses a **new schema**. It does not work with a database created by the old store/orders version.

- **Recommended:** create a new, empty PostgreSQL database and use its URL.
- **Or** empty the old one yourself (drop all its tables, including `alembic_version`) before deploying. This deletes all existing data.

Tables are created by migrations (`flask db upgrade`), not on app start.

## 2. Backend (Render)

1. **New +** > **Web Service**, connect the GitHub repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Environment:** Python (uses `runtime.txt`, Python 3.11)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `flask --app run db upgrade && gunicorn --worker-class eventlet -w 1 run:app`
3. Environment variables:

   | Variable | Value |
   |----------|-------|
   | `FLASK_ENV` | `production` |
   | `SECRET_KEY`, `JWT_SECRET_KEY` | Long random strings (different from each other) |
   | `DATABASE_URL` | PostgreSQL connection URL |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First super admin. **Required in production.** Without them no admin is created. |
   | `FRONTEND_URL` | Your Vercel URL, e.g. `https://maumart.vercel.app` (needed for CORS and live chat) |
   | `BACKEND_URL` | This service's URL, e.g. `https://maumart-api.onrender.com` |
   | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | For verification and password reset emails |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | For photo storage. Without them photos are saved on the server's disk, which Render wipes on each deploy. |

4. Deploy. The start command applies migrations, then starts the server.

Keep `-w 1`: live chat keeps connection state in memory, so it needs a single worker.

## 3. Frontend (Vercel)

1. **Add New** > **Project**, import the repository.
2. **Root Directory:** `frontend` (Vercel detects Vite).
3. Environment variable `VITE_API_URL` = the Render backend URL, e.g. `https://maumart-api.onrender.com`.
4. Deploy. `vercel.json` already routes every path to the app.

## 4. After the first deploy

1. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and change the password (Profile > Change password).
2. **Admin > Categories:** add categories (e.g. Phones & Gadgets, Books, Fashion, Food, Hostel Items).
3. **Admin > App settings:** site name, logo, support email, and your WhatsApp number if you want sellers to be able to request featured listings.
4. **Admin > Email:** choose Resend or SMTP and send a test email.

## 5. Database network access

If your database provider restricts connections by IP (e.g. CockroachDB's allowlist), allow Render's outbound IPs, or `0.0.0.0/0` while testing.
