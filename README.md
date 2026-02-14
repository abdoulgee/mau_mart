# MAU MART - Campus Marketplace PWA

A comprehensive Progressive Web App (PWA) for campus marketplace, enabling students to buy and sell products, services, food, and accommodations.

## 🚀 Features

### For Buyers
- Browse products by categories
- Search with filters
- Real-time chat with sellers
- Order tracking
- Reviews and ratings

### For Sellers
- Store dashboard with analytics
- Product management
- Order management
- Subscription plans
- Featured listings
- Ad placements

### For Admins
- User management
- Store approvals
- Product moderation
- Reports handling
- SMTP configuration
- Site settings

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- Socket.IO client
- PWA ready

**Backend:**
- Flask (Python)
- PostgreSQL
- Flask-SocketIO
- JWT Authentication
- Flask-Mail

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file from .env.example
cp .env.example .env

# Initialize database
flask db upgrade

# Run server
python run.py
```

### Environment Variables

Create `.env` in backend folder:

```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/maumart
JWT_SECRET_KEY=your-jwt-secret
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 📱 PWA Installation

1. Open the app in Chrome/Safari
2. Click "Install" or "Add to Home Screen"
3. The app works offline with cached data

## 🔒 API Authentication

All protected routes require JWT token:

```
Authorization: Bearer <access_token>
```

## 📁 Project Structure

```
mau_mart/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── layouts/        # App layouts
│   │   ├── store/          # Zustand stores
│   │   └── services/       # API services
│   ├── vite.config.js
│   └── package.json
│
└── backend/
    ├── app/
    │   ├── routes/         # API blueprints
    │   ├── models.py       # Database models
    │   ├── sockets.py      # WebSocket events
    │   └── services/       # Business logic
    ├── requirements.txt
    └── run.py
```

## 🎯 Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | User registration |
| `POST /api/v1/auth/login` | User login |
| `GET /api/v1/products` | List products |
| `GET /api/v1/stores/:id` | Store profile |
| `POST /api/v1/orders` | Create order |
| `GET /api/v1/chats` | User chats |
| `POST /api/v1/subscriptions/subscribe` | Subscribe to plan |

## 🧪 Testing

```bash
# Frontend
npm run lint
npm run build

# Backend
pytest
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and create PR

---

Built with ❤️ for campus communities
