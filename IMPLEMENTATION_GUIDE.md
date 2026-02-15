# Kara Boutique - Implementation & Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [Development Workflow](#development-workflow)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment](#post-deployment)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
```bash
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm or yarn
```

### Installation Steps

```bash
# 1. Navigate to project
cd kara-boutique

# 2. Install root dependencies
npm install

# 3. Install workspace dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd shared && npm install && cd ..

# 4. Setup database
createdb kara_boutique
psql kara_boutique < database/schema.sql

# 5. Create backend .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 6. Create frontend .env file
touch frontend/.env.local
# Add:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
# NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key

# 7. Start Redis
redis-server

# 8. Start development servers
npm run dev
```

---

## 🔧 Detailed Setup

### 1. Database Setup

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kara_boutique;

# Exit
\q
```

#### Run Schema
```bash
psql -U postgres -d kara_boutique -f database/schema.sql
```

#### Verify Tables
```bash
psql -U postgres -d kara_boutique

# List all tables
\dt

# Should see 19 tables:
# - users
# - admin_2fa
# - user_addresses
# - categories
# - products
# - product_variants
# - product_images
# - size_charts
# - wishlist
# - orders
# - order_items
# - payments
# - coupons
# - reviews
# - review_flags
# - abandoned_carts
# - inventory_logs
# - admin_activity_logs
# - pincode_cod
```

### 2. Redis Setup

#### Install Redis (Ubuntu)
```bash
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### 3. AWS Setup

#### S3 Bucket
1. Login to AWS Console
2. Navigate to S3
3. Create bucket: `kara-boutique-products`
4. Enable public read access for images
5. Configure CORS:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

#### SES (Email Service)
1. Navigate to AWS SES
2. Verify email address: `noreply@karaboutique.com`
3. Request production access (move out of sandbox)
4. Create SMTP credentials
5. Add to .env

#### IAM User
1. Create IAM user: `kara-boutique-app`
2. Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonSESFullAccess`
3. Create access keys
4. Add to .env

### 4. Razorpay Setup

1. Sign up at https://razorpay.com
2. Get API keys from Dashboard
3. Setup webhook:
   - URL: `https://yourdomain.com/api/v1/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
4. Add keys to .env

### 5. Shiprocket Setup

1. Sign up at https://shiprocket.in
2. Get API credentials
3. Test with sample order
4. Add credentials to .env

---

## 💻 Development Workflow

### File Structure to Create

Since the codebase has 230+ files, create them in this priority order:

#### Priority 1: Backend Core (30 files)
```
backend/src/
├── middleware/
│   ├── errorHandler.ts
│   ├── rateLimiter.ts
│   ├── auth.middleware.ts
│   ├── admin.middleware.ts
│   └── validate.middleware.ts
│
├── utils/
│   ├── jwt.ts
│   ├── bcrypt.ts
│   ├── otp.ts
│   ├── pagination.ts
│   └── helpers.ts
│
├── models/
│   ├── User.model.ts
│   ├── Product.model.ts
│   ├── Order.model.ts
│   └── ... (16 models total)
│
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── product.service.ts
│   └── ... (12 services)
│
├── controllers/
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   └── ... (10 controllers)
│
└── routes/
    ├── auth.routes.ts
    ├── product.routes.ts
    └── ... (11 routes)
```

#### Priority 2: Frontend Core (40 files)
```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── ... (pages)
│
├── components/
│   ├── common/
│   ├── product/
│   └── ... (30 components)
│
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
│
└── context/
    ├── AuthContext.tsx
    └── CartContext.tsx
```

### Development Commands

```bash
# Backend only
cd backend
npm run dev

# Frontend only  
cd frontend
npm run dev

# Both (from root)
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Code Quality

```bash
# Linting
cd backend && npm run lint
cd frontend && npm run lint

# Type checking
cd backend && tsc --noEmit
cd frontend && tsc --noEmit
```

---

## 🌐 Production Deployment

### Server Setup (GoDaddy VPS)

#### 1. Initial Server Setup
```bash
# Connect to VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Redis
apt install -y redis-server

# Install NGINX
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Git
apt install -y git
```

#### 2. Clone Repository
```bash
cd /var/www
git clone https://your-repo-url kara-boutique
cd kara-boutique
```

#### 3. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

#### 4. Configure Environment
```bash
# Backend .env
cp backend/.env.example backend/.env
nano backend/.env
# Update all production values

# Frontend .env
nano frontend/.env.local
# Add production API URL
```

#### 5. Setup Database
```bash
# Create database
sudo -u postgres createdb kara_boutique

# Run schema
sudo -u postgres psql kara_boutique < database/schema.sql

# Create DB user
sudo -u postgres psql
CREATE USER kara_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE kara_boutique TO kara_app;
\q
```

#### 6. Build Applications
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

#### 7. Start with PM2
```bash
# Backend
cd /var/www/kara-boutique/backend
pm2 start dist/server.js --name kara-backend

# Frontend
cd /var/www/kara-boutique/frontend
pm2 start npm --name kara-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 8. Configure NGINX
```bash
nano /etc/nginx/sites-available/karaboutique.com
```

Add configuration:
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/karaboutique.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart NGINX
systemctl restart nginx
```

#### 9. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d karaboutique.com -d www.karaboutique.com

# Auto-renewal
certbot renew --dry-run
```

#### 10. Cloudflare Setup
1. Add domain to Cloudflare
2. Update nameservers at GoDaddy
3. Enable:
   - DDoS protection
   - WAF rules
   - Caching
   - Always Use HTTPS
   - Auto Minify (JS, CSS, HTML)

### Database Backups

#### Automated Daily Backup
```bash
# Create backup script
nano /usr/local/bin/backup-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kara-boutique"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump kara_boutique > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-db.sh
```

### Security Hardening

#### Firewall (UFW)
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### Disable Root Login
```bash
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

#### Install Fail2Ban
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 📊 Post-Deployment

### Monitoring

#### PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# View status
pm2 status
```

#### Setup Alerts
```bash
# Email on restart
pm2 install pm2-auto-pull

# Slack notifications
pm2 install pm2-slack
```

### Performance Optimization

#### PostgreSQL Tuning
```bash
nano /etc/postgresql/14/main/postgresql.conf
```

Optimize:
```
shared_buffers = 512MB
effective_cache_size = 2GB
maintenance_work_mem = 128MB
work_mem = 16MB
```

#### Redis Tuning
```bash
nano /etc/redis/redis.conf
```

Set:
```
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Monitoring Tools

#### Setup Uptime Monitoring
- Use UptimeRobot or similar
- Monitor: https://karaboutique.com/health
- Alert on downtime

#### Log Rotation
```bash
nano /etc/logrotate.d/kara-boutique
```

Add:
```
/var/www/kara-boutique/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Initial data seeded (categories, admin user)
- [ ] SSL certificate installed
- [ ] Cloudflare configured
- [ ] Payment gateway tested
- [ ] Email sending verified
- [ ] SMS/OTP working
- [ ] Razorpay webhook configured
- [ ] Shiprocket API tested

### Post-Launch
- [ ] Monitor error logs
- [ ] Check payment transactions
- [ ] Verify order emails
- [ ] Test abandoned cart emails
- [ ] Monitor server resources
- [ ] Set up daily database backups
- [ ] Configure monitoring alerts
- [ ] Load test application
- [ ] Security audit
- [ ] Performance optimization

---

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
psql -U kara_app -d kara_boutique

# View logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Redis Connection Issues
```bash
# Check Redis status
systemctl status redis

# Test connection
redis-cli ping

# View logs
tail -f /var/log/redis/redis-server.log
```

#### PM2 Process Crashed
```bash
# View logs
pm2 logs kara-backend --lines 100

# Restart
pm2 restart kara-backend

# Check status
pm2 status
```

#### NGINX Issues
```bash
# Test configuration
nginx -t

# View error logs
tail -f /var/log/nginx/error.log

# Restart
systemctl restart nginx
```

---

## 📞 Support

For deployment issues:
- Email: tech@karaboutique.com
- Documentation: https://docs.karaboutique.com

---

**Happy Deploying! 🚀**
