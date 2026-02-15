# 🪟 KARA BOUTIQUE - COMPLETE WINDOWS SETUP GUIDE

**Last Updated:** February 15, 2026  
**Platform:** Windows 10/11  
**Time Required:** 30-45 minutes

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Installation](#step-by-step-installation)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES

### Required Software

1. **Node.js 18+ and npm**
   - Download: https://nodejs.org/
   - Click "Download for Windows (x64)"
   - Run the installer
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL 14+**
   - Download: https://www.postgresql.org/download/windows/
   - Run the installer
   - Remember your postgres password!
   - Add to PATH during installation
   - Verify: `psql --version`

3. **Git (Optional but recommended)**
   - Download: https://git-scm.com/download/win
   - Use defaults during installation
   - Verify: `git --version`

4. **Code Editor**
   - VS Code: https://code.visualstudio.com/
   - Or any editor you prefer

---

## 🚀 STEP-BY-STEP INSTALLATION

### STEP 1: Extract the Project

1. Extract `kara-boutique-WITH-ENHANCEMENTS.tar.gz`
2. You should have a folder structure like:
   ```
   D:\Personal\Kara\Kara Boutique\
   ├── backend\
   ├── frontend\
   ├── database\
   └── documentation\
   ```

### STEP 2: Open Command Prompt

**Method 1 - Using Windows Search:**
1. Press `Win + S`
2. Type "cmd" or "Command Prompt"
3. Click "Run as administrator"

**Method 2 - Using File Explorer:**
1. Navigate to project folder
2. Hold `Shift` + Right-click in folder
3. Select "Open PowerShell window here" or "Open Command Prompt here"

---

## 🗄️ DATABASE SETUP

### STEP 1: Create Database

Open Command Prompt and run:

```cmd
# Login to PostgreSQL (will ask for password)
psql -U postgres

# Create database
CREATE DATABASE kara_boutique;

# Exit
\q
```

### STEP 2: Run Schema

```cmd
# Navigate to database folder
cd "D:\Personal\Kara\Kara Boutique\database"

# Run schema
psql -U postgres -d kara_boutique -f schema.sql

# Run migrations
psql -U postgres -d kara_boutique -f migrations\001_add_coupon_fields.sql
psql -U postgres -d kara_boutique -f migrations\002_add_invoice_tables.sql
psql -U postgres -d kara_boutique -f migrations\003_add_image_upload.sql
psql -U postgres -d kara_boutique -f migrations\005_add_email_verification.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
... (19 times total)
```

### STEP 3: Seed Database (Optional but Recommended)

```cmd
# Navigate to backend folder
cd "D:\Personal\Kara\Kara Boutique\backend"

# Install dependencies first (next section)
# Then run seed script
npm run seed
```

**You'll get:**
- 15 products
- 12 users (2 admins, 10 customers)
- 5 active coupons
- Sample orders and reviews

---

## 💻 BACKEND SETUP

### STEP 1: Navigate to Backend Folder

```cmd
cd "D:\Personal\Kara\Kara Boutique\backend"
```

### STEP 2: Install Dependencies

```cmd
npm install
```

**This will install ~197 packages and may take 3-5 minutes.**

### STEP 3: Install Missing Type Definitions

```cmd
npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken
```

### STEP 4: Create Environment File

Create a file named `.env` in the backend folder:

```cmd
# Using notepad
notepad .env
```

**Paste this content:**

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kara_boutique
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-minimum-32-characters
JWT_EXPIRES_IN=7d

# Redis (Optional - can skip for now)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS (Optional - for email/storage)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=kara-boutique-uploads
AWS_SES_FROM_EMAIL=

# Razorpay (Optional - for payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# SMS (Optional)
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Other
STOCK_RESERVATION_MINUTES=10
```

**IMPORTANT:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

**Save the file:** Press `Ctrl+S`, then close Notepad.

### STEP 5: Verify Backend Installation

```cmd
# Check if node_modules exists
dir node_modules

# Check if .env exists
dir .env
```

---

## 🎨 FRONTEND SETUP

### STEP 1: Navigate to Frontend Folder

```cmd
cd "D:\Personal\Kara\Kara Boutique\frontend"
```

### STEP 2: Install Dependencies

```cmd
npm install
```

**This will install ~30 packages and may take 2-3 minutes.**

### STEP 3: Create Environment File

Create `.env.local` file:

```cmd
notepad .env.local
```

**Paste this content:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

**Save the file:** Press `Ctrl+S`, then close Notepad.

### STEP 4: Verify Frontend Installation

```cmd
dir node_modules
dir .env.local
```

---

## ▶️ RUNNING THE APPLICATION

### OPTION 1: Two Separate Terminals (Recommended)

**Terminal 1 - Backend:**
```cmd
cd "D:\Personal\Kara\Kara Boutique\backend"
npm run dev
```

**Expected Output:**
```
[nodemon] starting `ts-node src/server.ts`
✅ Database connected successfully
🚀 Server running on port 5000
📝 Environment: development
🔗 API URL: http://localhost:5000/api/v1
🔌 Socket.io initialized
```

**Terminal 2 - Frontend:**
```cmd
cd "D:\Personal\Kara\Kara Boutique\frontend"
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### OPTION 2: Using Start Script (Coming Soon)

We can create a `start.bat` file to run both:

```cmd
notepad start.bat
```

**Paste this:**
```batch
@echo off
echo Starting Kara Boutique...

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
```

**Save and run:**
```cmd
start.bat
```

---

## 🌐 ACCESS THE APPLICATION

1. **Frontend (User Interface):** http://localhost:3000
2. **Backend API:** http://localhost:5000/api/v1
3. **Health Check:** http://localhost:5000/health

### Test Login Credentials

**Admin:**
- Email: `admin@karaboutique.com`
- Password: `password123`

**Customer:**
- Email: `priya.sharma@gmail.com`
- Password: `password123`

---

## 🧪 TESTING

### 1. Test Database Connection

```cmd
cd backend
node -e "require('./dist/config/database').testConnection()"
```

### 2. Test Backend API

**Using Browser:**
- Visit: http://localhost:5000/health
- Should see: `{"status":"OK","timestamp":"...","uptime":...}`

**Using curl (if installed):**
```cmd
curl http://localhost:5000/health
```

### 3. Test Frontend

**Using Browser:**
- Visit: http://localhost:3000
- Should see Kara Boutique homepage

### 4. Seed Database and Test Complete Flow

```cmd
cd backend
npm run seed
```

**Then test:**
1. Visit http://localhost:3000
2. Click "Login"
3. Use: `priya.sharma@gmail.com` / `password123`
4. Browse products
5. Add to cart
6. Apply coupon: `WELCOME10`
7. Complete checkout

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module"

**Solution:**
```cmd
# Delete node_modules and reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Error: "Port 5000 already in use"

**Solution 1 - Find and kill process:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2 - Change port:**
Edit backend `.env`:
```env
PORT=5001
```

### Error: "Database connection failed"

**Check if PostgreSQL is running:**
```cmd
# Check service status
sc query postgresql-x64-14

# Start if not running
net start postgresql-x64-14
```

**Verify credentials:**
```cmd
psql -U postgres -d kara_boutique
# Should ask for password and connect
```

### Error: "TypeScript compilation errors"

**Solution:**
```cmd
cd backend
# Clear TypeScript cache
rmdir /s /q dist
# Rebuild
npm run build
```

### Error: "Redis connection failed"

**Solution:**
Redis is optional. Edit backend `.env`:
```env
# Comment out or remove Redis config
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

Then update `backend/src/config/redis.ts` to make it optional.

### Frontend won't start

**Solution:**
```cmd
cd frontend
# Clear Next.js cache
rmdir /s /q .next
# Reinstall
npm install
npm run dev
```

### Can't access localhost:3000

**Check Windows Firewall:**
1. Open Windows Security
2. Firewall & network protection
3. Allow an app through firewall
4. Allow Node.js

---

## 📝 COMMON COMMANDS REFERENCE

### Backend Commands

```cmd
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run seed         # Seed database
npm run lint         # Check code quality
```

### Frontend Commands

```cmd
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Check code quality
```

### Database Commands

```cmd
# Connect to database
psql -U postgres -d kara_boutique

# List tables
\dt

# Check table data
SELECT * FROM users;
SELECT * FROM products LIMIT 5;

# Exit
\q
```

---

## 🔐 SECURITY NOTES

### Before Production Deployment:

1. **Change all default passwords:**
   ```env
   JWT_SECRET=generate-new-random-32-character-secret
   DB_PASSWORD=use-strong-database-password
   ```

2. **Set NODE_ENV to production:**
   ```env
   NODE_ENV=production
   ```

3. **Enable HTTPS**
4. **Configure proper CORS**
5. **Set up proper logging**
6. **Configure Redis for sessions**

---

## 📊 VERIFICATION CHECKLIST

After setup, verify:

- [ ] PostgreSQL is running
- [ ] Database `kara_boutique` exists
- [ ] 21 tables created
- [ ] Seed data loaded (optional)
- [ ] Backend .env file created
- [ ] Frontend .env.local file created
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:5000/health
- [ ] Can login with test credentials
- [ ] Can browse products

---

## 🎯 NEXT STEPS

Once everything is running:

1. **Test the complete user flow:**
   - Register → Browse → Cart → Checkout → Payment

2. **Test admin features:**
   - Login as admin
   - Manage products
   - View analytics
   - Process orders

3. **Configure real services (Optional):**
   - AWS S3 for image uploads
   - AWS SES for emails
   - Razorpay for payments
   - Twilio/MSG91 for SMS

4. **Read the feature guides:**
   - ADVANCED_FEATURES_GUIDE.md
   - TESTING_GUIDE.md
   - API_DOCUMENTATION.md

---

## 💡 TIPS FOR WINDOWS DEVELOPMENT

### 1. Use Windows Terminal (Better than CMD)
Download from Microsoft Store: "Windows Terminal"

### 2. Use Git Bash (Unix-like commands)
Comes with Git for Windows

### 3. VS Code Recommended Extensions
- ESLint
- Prettier
- PostgreSQL
- Thunder Client (API testing)

### 4. Keep Terminal Open
Don't close the terminal windows running the servers!

### 5. Use Ctrl+C to Stop Servers
In the terminal, press `Ctrl+C` to stop the development server.

---

## 📞 NEED HELP?

### Quick Checks:
1. Is PostgreSQL running?
2. Are both .env files created?
3. Did npm install complete successfully?
4. Are you in the correct directory?
5. Did you run the database schema?

### Common Issues:
- "Module not found" → Run `npm install` again
- "Port in use" → Change port or kill process
- "Database error" → Check PostgreSQL is running
- "Compilation error" → Check tsconfig.json settings

---

## ✅ SUCCESS!

If you see:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ Can login and browse products
- ✅ Database connected

**🎉 CONGRATULATIONS! Your Kara Boutique platform is running!**

---

**Happy Development! 🚀**
