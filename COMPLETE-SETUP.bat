@echo off
title Kara Boutique - Complete Setup
color 0E

echo ╔════════════════════════════════════════════╗
echo ║  KARA BOUTIQUE - COMPLETE SETUP WIZARD    ║
echo ║  Windows Installation Script              ║
echo ╚════════════════════════════════════════════╝
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%"

echo Current Directory: %CD%
echo Script Directory: %SCRIPT_DIR%
echo.

echo ========================================
echo STEP 1: CHECKING PREREQUISITES
echo ========================================
echo.

REM Check Node.js
echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js NOT FOUND
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version for Windows
    pause
    exit /b 1
) else (
    node --version
    echo ✓ Node.js installed
)
echo.

REM Check npm
echo [2/3] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm NOT FOUND
    pause
    exit /b 1
) else (
    npm --version
    echo ✓ npm installed
)
echo.

REM Check PostgreSQL
echo [3/3] Checking PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ PostgreSQL NOT FOUND in PATH
    echo.
    echo PostgreSQL is required for the database.
    echo Download from: https://www.postgresql.org/download/windows/
    echo.
    echo After installing, add it to PATH or run:
    echo   set PATH=%%PATH%%;C:\Program Files\PostgreSQL\14\bin
    echo.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
) else (
    psql --version
    echo ✓ PostgreSQL installed
)
echo.

echo All prerequisites checked!
echo.
pause

echo.
echo ========================================
echo STEP 2: DATABASE SETUP
echo ========================================
echo.

choice /C YN /M "Do you want to setup the database now"
if errorlevel 2 goto :skip_database
if errorlevel 1 goto :setup_database

:setup_database
echo.
echo Creating database...
psql -U postgres -c "CREATE DATABASE IF NOT EXISTS kara_boutique;" 2>nul
psql -U postgres -c "CREATE DATABASE kara_boutique;" >nul 2>&1
if errorlevel 1 (
    echo Database might already exist or credentials incorrect
) else (
    echo ✓ Database created
)

echo.
echo Running schema...
if exist "database\schema.sql" (
    psql -U postgres -d kara_boutique -f database\schema.sql
    echo ✓ Schema applied
) else if exist "schema.sql" (
    psql -U postgres -d kara_boutique -f schema.sql
    echo ✓ Schema applied
) else (
    echo ⚠ schema.sql not found - please run it manually
)

echo.
echo Running migrations...
if exist "database\migrations" (
    for %%f in (database\migrations\*.sql) do (
        echo   Running %%~nxf...
        psql -U postgres -d kara_boutique -f "%%f" >nul 2>&1
    )
) else if exist "migrations" (
    for %%f in (migrations\*.sql) do (
        echo   Running %%~nxf...
        psql -U postgres -d kara_boutique -f "%%f" >nul 2>&1
    )
)
echo ✓ Migrations applied
echo.

:skip_database

echo.
echo ========================================
echo STEP 3: BACKEND SETUP
echo ========================================
echo.

echo Setting up backend...
cd backend 2>nul || cd "%SCRIPT_DIR%backend" 2>nul
if errorlevel 1 (
    echo ERROR: Backend directory not found!
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo [1/3] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/3] Installing TypeScript type definitions...
call npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid @types/qrcode @types/speakeasy @types/node-cron @types/pdfkit
echo ✓ Type definitions installed
echo.

echo [3/3] Creating .env file...
if not exist ".env" (
    (
        echo # Server
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Database - IMPORTANT: Set your PostgreSQL password!
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=kara_boutique
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo.
        echo # JWT - IMPORTANT: Change this secret in production!
        echo JWT_SECRET=kara-boutique-jwt-secret-key-minimum-32-characters-for-security
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Frontend URL
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Redis (Optional)
        echo # REDIS_HOST=localhost
        echo # REDIS_PORT=6379
        echo.
        echo # AWS (Optional - for production)
        echo # AWS_REGION=ap-south-1
        echo # AWS_ACCESS_KEY_ID=
        echo # AWS_SECRET_ACCESS_KEY=
        echo # S3_BUCKET_NAME=
        echo.
        echo # Razorpay (Optional)
        echo # RAZORPAY_KEY_ID=
        echo # RAZORPAY_KEY_SECRET=
        echo.
        echo # SMS (Optional)
        echo SMS_PROVIDER=mock
        echo # TWILIO_ACCOUNT_SID=
        echo # TWILIO_AUTH_TOKEN=
        echo # TWILIO_PHONE_NUMBER=
        echo.
        echo # Other
        echo STOCK_RESERVATION_MINUTES=10
    ) > .env
    echo ✓ Created .env file
    echo.
    echo IMPORTANT: Review and update .env file with your settings
    echo Opening in Notepad...
    start notepad .env
    timeout /t 2 >nul
) else (
    echo ✓ .env file already exists
)
echo.

cd ..

echo.
echo ========================================
echo STEP 4: FRONTEND SETUP
echo ========================================
echo.

echo Setting up frontend...
cd frontend 2>nul || cd "%SCRIPT_DIR%frontend" 2>nul
if errorlevel 1 (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)

echo [1/2] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [2/2] Creating .env.local file...
if not exist ".env.local" (
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
        echo NEXT_PUBLIC_RAZORPAY_KEY_ID=
    ) > .env.local
    echo ✓ Created .env.local file
) else (
    echo ✓ .env.local file already exists
)
echo.

cd ..

echo.
echo ========================================
echo STEP 5: SEED SAMPLE DATA (OPTIONAL)
echo ========================================
echo.

choice /C YN /M "Do you want to add sample data (15 products, 12 users, 5 coupons)"
if errorlevel 2 goto :skip_seed
if errorlevel 1 goto :run_seed

:run_seed
echo.
echo Seeding database...
cd backend
call npm run seed
if errorlevel 1 (
    echo WARNING: Seed failed - you can run it later with: npm run seed
) else (
    echo ✓ Sample data added!
    echo.
    echo Test Login Credentials:
    echo   Admin: admin@karaboutique.com / password123
    echo   User:  priya.sharma@gmail.com / password123
)
cd ..

:skip_seed

echo.
echo ╔════════════════════════════════════════════╗
echo ║           SETUP COMPLETE! ✓               ║
echo ╚════════════════════════════════════════════╝
echo.
echo ┌────────────────────────────────────────────┐
echo │ Next Steps:                                │
echo ├────────────────────────────────────────────┤
echo │ 1. Review and update backend\.env file     │
echo │ 2. Start Backend:                          │
echo │    cd backend                              │
echo │    npm run dev                             │
echo │                                            │
echo │ 3. In a NEW terminal, start Frontend:     │
echo │    cd frontend                             │
echo │    npm run dev                             │
echo │                                            │
echo │ 4. Open browser:                           │
echo │    http://localhost:3000                   │
echo └────────────────────────────────────────────┘
echo.
echo ┌────────────────────────────────────────────┐
echo │ Quick Reference:                           │
echo ├────────────────────────────────────────────┤
echo │ Backend:   http://localhost:5000           │
echo │ Frontend:  http://localhost:3000           │
echo │ Health:    http://localhost:5000/health    │
echo │                                            │
echo │ Admin Login:                               │
echo │   admin@karaboutique.com / password123     │
echo │                                            │
echo │ Customer Login:                            │
echo │   priya.sharma@gmail.com / password123     │
echo └────────────────────────────────────────────┘
echo.
echo Active Coupons:
echo   WELCOME10  - 10%% off (min ₹1000)
echo   FESTIVE20  - 20%% off (min ₹2000)
echo   FLAT500    - ₹500 off (min ₹3000)
echo   FREESHIP   - Free shipping
echo.
choice /C YN /M "Do you want to start the servers now"
if errorlevel 2 goto :end
if errorlevel 1 goto :start_servers

:start_servers
echo.
echo Starting servers...
start "Kara Boutique - Backend" cmd /k "cd backend && npm run dev"
timeout /t 5 >nul
start "Kara Boutique - Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ✓ Servers started in separate windows!
echo.

:end
echo Thank you for using Kara Boutique!
echo.
pause
