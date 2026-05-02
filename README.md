# 📊 Subscription Tracker API

A RESTful API built with **Node.js**, **Express**, and **MongoDB** for tracking and managing subscriptions. Features JWT authentication, automated email reminders via **Upstash Workflow**, and bot/rate-limit protection via **Arcjet**.

## ✨ Features

- **Authentication** — Sign up, sign in, sign out with JWT tokens
- **User Management** — CRUD operations with ownership-based access control
- **Subscription Management** — Full CRUD with cancel, renewal tracking
- **Automated Reminders** — Email notifications at 7, 5, 2, and 1 days before renewal
- **Durable Workflows** — Upstash QStash-powered scheduling with `sleepUntil`
- **Security** — Arcjet bot detection, rate limiting, and shield protection
- **Password Safety** — Bcrypt hashing, passwords never exposed in API responses

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + Bcrypt |
| Workflows | Upstash QStash |
| Email | Nodemailer |
| Security | Arcjet (bot detection, rate limiting) |
| Dev Tools | Nodemon, ESLint |

## 📁 Project Structure

```
Subscription_Tracker/
├── config/
│   ├── arcjet.js          # Arcjet bot/rate-limit configuration
│   ├── env.js             # Environment variable loader
│   └── upstash.js         # Upstash Workflow client
├── controllers/
│   ├── auth.controller.js         # Sign up, sign in, sign out
│   ├── subscription.controller.js # Subscription CRUD + cancel + renewals
│   ├── user.controller.js         # User CRUD with ownership checks
│   └── workflow.controller.js     # Reminder workflow + email sending
├── database/
│   └── mongodb.js         # MongoDB connection
├── middlewares/
│   ├── arcjet.middleware.js  # Bot detection & rate limiting
│   ├── auth.middleware.js    # JWT token verification
│   └── error.middleware.js   # Global error handler
├── models/
│   ├── subscription.model.js # Subscription schema
│   └── user.model.js         # User schema
├── routes/
│   ├── auth.routes.js         # /api/v1/auth/*
│   ├── subscription.routes.js # /api/v1/subscriptions/*
│   ├── user.routes.js         # /api/v1/users/*
│   └── workflow.route.js      # /api/v1/workflows/*
├── .env.example           # Environment template (safe to commit)
├── app.js                 # Express app entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)
- [Upstash](https://upstash.com/) account (for QStash workflows)
- [Arcjet](https://arcjet.com/) account (for bot/rate-limit protection)

### Installation

```bash
# Clone the repository
git clone https://github.com/praveensource/Subscription_Tracker.git
cd Subscription_Tracker

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development.local
# Edit .env.development.local with your credentials
```

### Environment Variables

Copy `.env.example` and fill in your values:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5500) |
| `DB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `1d`) |
| `ARCJET_KEY` | Arcjet site key |
| `ARCJET_ENV` | `development` or `production` |
| `QSTASH_URL` | Upstash QStash URL |
| `QSTASH_TOKEN` | Upstash QStash token |
| `QSTASH_CURRENT_SIGNING_KEY` | QStash signing key (production only) |
| `QSTASH_NEXT_SIGNING_KEY` | QStash next signing key (production only) |
| `EMAIL_USER` | SMTP email (use [Ethereal](https://ethereal.email) for dev) |
| `EMAIL_PASS` | SMTP password |
| `SERVER_URL` | Public URL for QStash callbacks |

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/sign-up` | ❌ | Register a new user |
| `POST` | `/api/v1/auth/sign-in` | ❌ | Login and get JWT token |
| `POST` | `/api/v1/auth/sign-out` | ❌ | Logout |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/users` | ✅ | Get all users |
| `GET` | `/api/v1/users/:id` | ✅ | Get user by ID |
| `PUT` | `/api/v1/users/:id` | ✅ | Update own profile |
| `DELETE` | `/api/v1/users/:id` | ✅ | Delete own account |

### Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/subscriptions` | ❌ | Get all subscriptions |
| `GET` | `/api/v1/subscriptions/:id` | ❌ | Get subscription by ID |
| `POST` | `/api/v1/subscriptions` | ✅ | Create a subscription |
| `PUT` | `/api/v1/subscriptions/:id` | ✅ | Update own subscription |
| `DELETE` | `/api/v1/subscriptions/:id` | ✅ | Delete own subscription |
| `PUT` | `/api/v1/subscriptions/:id/cancel` | ✅ | Cancel a subscription |
| `GET` | `/api/v1/subscriptions/user/:id` | ✅ | Get subscriptions by user |
| `GET` | `/api/v1/subscriptions/upcoming-renewals` | ✅ | Get upcoming renewals |

### Workflows

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/workflows/subscription/reminder` | ❌ | Trigger reminder workflow (QStash) |
| `POST` | `/api/v1/workflows/subscription/reminder/test` | ❌ | Test reminders locally |

## 📧 Reminder Workflow

The workflow sends email reminders at **7, 5, 2, and 1 days** before a subscription's renewal date.

```
POST /api/v1/workflows/subscription/reminder/test
{
  "subscriptionId": "your-subscription-id"
}
```

**How it works:**

1. Fetches the subscription and validates it's active
2. Calculates reminder dates based on renewal date
3. For each reminder day:
   - **Production**: Uses `sleepUntil` to pause the workflow until the reminder date
   - **Test**: Sends immediately if the reminder date has passed
4. Sends email via Nodemailer (Ethereal for dev)
5. Marks the reminder as sent in the database

## 🔐 Authentication

All protected routes require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by signing in:

```bash
curl -X POST http://localhost:5500/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## 🧪 Testing with Ethereal Email

For development, use [Ethereal Email](https://ethereal.email) — a fake SMTP service that catches emails without delivering them:

1. Go to [ethereal.email/create](https://ethereal.email/create)
2. Copy the generated credentials to `.env.development.local`
3. Trigger a reminder — check the **Preview URL** in your terminal console

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
