# Kara Boutique - E-Commerce Platform

> Premium online fashion boutique specializing in ethnic and contemporary women's wear

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router) + Bootstrap 5
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL
- **Cache:** Redis
- **Storage:** AWS S3
- **Payments:** Razorpay
- **Shipping:** Shiprocket
- **Email:** AWS SES

## 📁 Project Structure

```
kara-boutique/
├── frontend/          # Next.js 14 App Router application
├── backend/           # Express.js REST API
├── database/          # Database schemas, migrations, seeds
├── shared/            # Shared TypeScript types & utilities
├── docs/              # Documentation
└── package.json       # Root workspace configuration
```

## 🎨 Design System

- **Primary Color:** #D4A373 (Rose Gold)
- **Secondary Color:** #F5E6D3 (Cream)
- **Accent Color:** #2C3333 (Charcoal)
- **Font:** Bootstrap 5 default (system fonts)

## 🛠️ Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- AWS Account (S3, SES)
- Razorpay Account
- Shiprocket Account

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/kara-boutique.git
cd kara-boutique
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` files in both `frontend` and `backend` directories:

#### Backend `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kara_boutique
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# AWS S3
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=kara-boutique-products

# AWS SES
AWS_SES_REGION=ap-south-1
SES_FROM_EMAIL=noreply@karaboutique.com

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Shiprocket
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Stock Reservation
STOCK_RESERVATION_MINUTES=10
```

#### Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Database Setup

```bash
# Create database (one-time)
createdb kara_boutique

# Apply base schema + SQL migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Or do both in one command
npm run db:setup

# Verify seed integrity (counts + foreign keys)
npm run db:verify
```

> `db:migrate` now runs `database/migrate.js`, which applies `database/schema.sql` only when base tables are missing and then applies pending SQL files from `database/migrations/`.

> `db:seed` now generates large demo data by default (**100 users**, **1200 products**, variants, images, orders, reviews, carts, and wishlist). Override with `SEED_USER_COUNT` and `SEED_PRODUCT_COUNT` if needed.

> Need a step-by-step local troubleshooting flow? Use `DATA_VISIBILITY_RUNBOOK.md` and run `npm run data:visibility:check`.

### 5. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Runs on http://localhost:3000
npm run dev:backend   # Runs on http://localhost:5000
```

## 🏗️ Production Deployment

### Backend (GoDaddy VPS)

```bash
# Build backend
cd backend
npm run build

# Start with PM2
pm2 start dist/server.js --name kara-backend
pm2 save
pm2 startup
```

### Frontend

```bash
# Build frontend
cd frontend
npm run build

# Start production server
npm run start
```

### NGINX Configuration

```nginx
server {
    listen 80;
    server_name karaboutique.com www.karaboutique.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

## 📊 Features

### Customer Features
- ✅ User Registration & Login (Email, OTP, Google)
- ✅ Product Browsing with Filters
- ✅ Product Search (Full-text)
- ✅ Size Charts & Measurements
- ✅ Shopping Cart with Stock Reservation (10 min)
- ✅ Wishlist (Database-persistent)
- ✅ Multiple Delivery Addresses
- ✅ COD Pincode Validation
- ✅ Coupon Application
- ✅ Razorpay Payment Integration
- ✅ Order Tracking
- ✅ Cancel/Return Orders
- ✅ Product Reviews & Ratings
- ✅ Review Flagging System
- ✅ AI Recommendations (Rule-based)

### Admin Features
- ✅ Admin Login with 2FA (TOTP + SMS)
- ✅ Product Management (CRUD)
- ✅ Bulk Product Upload (CSV)
- ✅ Inventory Management
- ✅ Stock Logs & Auditing
- ✅ Order Management
- ✅ Refund Processing
- ✅ Coupon Management
- ✅ Analytics Dashboard
- ✅ Sales Reports
- ✅ Abandoned Cart Tracking
- ✅ User Management
- ✅ Pincode COD Management
- ✅ Admin Activity Logs

### Automated Features
- ✅ Abandoned Cart Emails (1hr, 24hr)
- ✅ Order Confirmation Emails
- ✅ Shipping Notifications
- ✅ Stock Alerts
- ✅ Invoice Generation (PDF)

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Admin 2FA (TOTP + SMS)
- Rate Limiting
- CORS Protection
- SQL Injection Prevention
- XSS Protection
- CSRF Protection
- Input Validation
- Admin Activity Logging

## 🧪 Testing

```bash
# Run backend unit tests
cd backend
npm run test:unit

# Run backend integration tests
npm run test:integration

# Run full backend test suite
npm test

# Run frontend lint/build checks
cd ../frontend
npm run lint
npm run build
```

## 📈 Performance Optimization

- Redis Caching (Products, Categories)
- PostgreSQL Indexing
- Image Optimization (WebP)
- CDN (Cloudflare)
- Server-Side Rendering (Next.js)
- Code Splitting
- Lazy Loading

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis Issues
```bash
# Check Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

## 📞 Support

For issues and support, contact: support@karaboutique.com

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js Team
- Express.js Community
- PostgreSQL Community
- Bootstrap Team

---

**Built with ❤️ for Kara Boutique**



### ✅ DB Release Checklist

```bash
# 1) Apply schema + migrations
npm run db:migrate

# 2) Seed data (custom volume optional)
SEED_USER_COUNT=100 SEED_PRODUCT_COUNT=1200 npm run db:seed

# 3) Verify and emit report JSON
SEED_USER_COUNT=100 SEED_PRODUCT_COUNT=1200 SEED_REPORT_FILE=database/artifacts/seed-report.json npm run db:verify
```

Expected result: `✅ Seed verification passed.` plus a JSON report at `database/artifacts/seed-report.json`.
