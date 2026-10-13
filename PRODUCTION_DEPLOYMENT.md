# MAU MART Production Deployment

The backend runs on Render, the frontend on Vercel, and the database on Neon PostgreSQL (created from Vercel's Storage tab). Uploaded photos are stored in the database, so no file storage service is needed.

## 1. Database

The marketplace redesign uses a **new schema**. It does not work with a database created by the old store/orders version.

- **Recommended:** create a new, empty PostgreSQL database and use its URL. With Neon, use the **direct (non-pooled)** connection string: the pooler shares sessions between clients, which breaks migrations and restores.
- **Or** empty the old one yourself (drop all its tables, including `alembic_version`) before deploying. This deletes all existing data.

Tables are created by migrations (`flask db upgrade`), not on app start.

## 2. Backend (Render)

1. **New +** > **Web Service**, connect the GitHub repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Environment:** Python (version from `backend/.python-version`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `flask --app run db upgrade && gunicorn -w 1 --threads 100 --bind 0.0.0.0:$PORT run:app`

   Or use **New +** > **Blueprint**: `render.yaml` in the repository root sets all of this up.
3. Environment variables:

   | Variable | Value |
   |----------|-------|
   | `FLASK_ENV` | `production` |
   | `SECRET_KEY`, `JWT_SECRET_KEY` | Long random strings (different from each other) |
   | `DATABASE_URL` | PostgreSQL connection URL |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First super admin, if the database has none yet. Without them no admin is created. |
   | `FRONTEND_URL` | Your Vercel URL, e.g. `https://maumart.vercel.app` (needed for CORS and live chat). Separate several with commas. |
   | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | For verification and password reset emails |

4. Deploy. The start command applies migrations, then starts the server.

Keep `-w 1`: live chat keeps connection state in memory, so it needs a single worker. `--threads` sets how many connections that worker handles at once.

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

## 5. Moving existing data

1. Dump the old database: `pg_dump "$OLD_URL" --no-owner --no-privileges -f maumart.sql`
2. Restore into the new one: `psql "$NEW_DIRECT_URL" -f maumart.sql`
3. From `backend/`, with `DATABASE_URL` set to the new database: `flask --app run db upgrade`, then `flask --app run import-uploads` to copy any photos saved in `app/uploads/` into the database.
