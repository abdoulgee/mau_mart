# MAU MART - Campus Marketplace

A simple marketplace that connects buyers and sellers on campus, like Facebook Marketplace for students.

Anyone with an account can post things for sale. Buyers contact the seller through in-app chat or WhatsApp, meet on campus, and pay in person. There are no stores, carts, or online payments.

## Features

**Everyone**
- Post a listing: up to 4 photos, title, price, category, condition, meet-up location
- Edit, mark as sold or available again, and delete your own listings
- Browse the latest listings, browse by category, and search with sort and condition filters
- Chat in the app (real-time, with photos and read receipts) or tap **WhatsApp** to open a chat with a pre-filled message about the item
- Save listings, view seller profiles, report listings or users
- Notifications for new messages and moderation actions

**Admins**
- Dashboard with users, listings, chats and pending reports
- Suspend or edit users; super admins can change roles and reset passwords
- Feature listings on the home page; remove and restore listings
- Manage categories and home page banners
- Review reports (dismiss, remove listing, suspend user)
- App settings (branding, guest browsing, email verification, maintenance mode) and email provider (Resend or SMTP)

WhatsApp numbers are only shown to logged-in users.

## Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS, Zustand, Socket.IO client, PWA
- **Backend:** Flask, SQLAlchemy + Flask-Migrate, Flask-JWT-Extended, Flask-SocketIO
- **Database:** PostgreSQL (SQLite for tests)
- **Storage:** uploaded images are stored in PostgreSQL (`stored_files` table)
- **Email:** Resend or SMTP (codes are also printed to the server console)

## Getting started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then fill in the values
flask --app run db upgrade        # create the database tables
flask --app run seed              # super admin + starter categories (safe to re-run)
python run.py                     # http://localhost:5000
```

The super admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (development default: `admin@maumart.com` / `Admin123!`; change it after logging in).

**Local PostgreSQL:** create a database and role, then point `DATABASE_URL` at it:

```bash
psql -d postgres -c "CREATE ROLE maumart_app LOGIN PASSWORD 'choose-a-password';"
psql -d postgres -c "CREATE DATABASE mau_mart_marketplace OWNER maumart_app;"
# .env
DATABASE_URL=postgresql://maumart_app:choose-a-password@localhost:5432/mau_mart_marketplace
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # VITE_API_URL=http://localhost:5000
npm run dev                       # http://localhost:5173
```

## Design system

- **Colors** are semantic tokens (`canvas`, `surface`, `fg`, `brand`, `success`, `danger`, ...) defined as CSS variables in `src/index.css`, with a matching dark theme. Text and white-on-brand buttons meet WCAG AA contrast.
- **Icons** are [Lucide](https://lucide.dev) only (`lucide-react`). Category icons are stored by Lucide name; the allowed set is in `src/utils/categoryIcons.js`.
- **Type:** Inter; page titles `text-xl/2xl font-semibold`, section titles `text-base font-semibold`, body `text-sm`, metadata `text-xs`.
- **Components** live in `src/components/ui`: `Button`/`IconButton` (hover, focus, active, disabled, loading), `TextField`/`SelectField`/`TextAreaField`/`PasswordField` (labels, hints, errors), `Panel`, `DataTable` (table on desktop, stacked rows on phones), `Modal`/`ConfirmDialog`, `Tabs`, `Badge`, `Alert`, `EmptyState`/`ErrorState`, skeletons, toasts.
- **Forms** use `useForm` (`src/hooks/useForm.js`): fields validate on blur and on submit, focus moves to the first error, and server errors show as a form alert.
- **Pages** use `Page` (marketplace) or `AdminPage` (admin) for consistent titles, spacing and responsive navigation.

## Tests

```bash
cd backend
python -m unittest discover -s tests -t .
```

The tests run against an in-memory SQLite database. Email and file storage are mocked.

## Changing the database schema

Edit `backend/app/models.py`, then:

```bash
flask --app run db migrate -m "describe the change"
flask --app run db upgrade
```

## Project structure

```
frontend/src/
  pages/            Screens (Home, ProductDetail, ListingForm, Chat*, Profile*, admin/*)
  components/       ProductCard, ListingResults, CategoryChips, navigation, ui/*
  store/            Zustand stores (auth, chat, categories, settings, ui)
  hooks/            usePaginatedList
  services/api.js   Axios client with automatic token refresh
backend/app/
  models.py         User, Product, ProductMedia, Category, Chat, Message, Wishlist,
                    Report, Notification, AdsBanner, SmtpConfig, AppSettings
  routes/           auth, users, products, categories, chat, wishlist,
                    notifications, reports, uploads, admin
  sockets.py        Real-time chat delivery, typing and read receipts
  utils.py          Shared helpers (auth decorators, pagination, notifications)
backend/tests/      API tests
```

## Main API endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | Sign up (WhatsApp defaults to the phone number) |
| `POST /api/v1/auth/login` | Log in with email or student ID |
| `GET /api/v1/products` | Browse/search (`q`, `category`, `condition`, `sort`, `min_price`, `max_price`) |
| `POST /api/v1/products` | Post a listing (multipart: fields + `images`) |
| `POST /api/v1/products/:id/sold` | Mark sold / available |
| `GET /api/v1/products/mine` | Your listings |
| `GET /api/v1/users/:id` | Public seller profile |
| `POST /api/v1/chat/start` | Open a chat about a listing (`product_id`) or with a user (`user_id`) |
| `POST /api/v1/chat/:id/send` | Send a message |

Protected routes need `Authorization: Bearer <access_token>`.
