@echo off
title Kara Boutique - Quick Start
color 0A

echo ========================================
echo   KARA BOUTIQUE - QUICK START SETUP
echo ========================================
echo.

REM Check if running in backend directory
if not exist "package.json" (
    echo ERROR: Please run this script from the backend directory!
    echo.
    echo Example:
    echo   cd D:\Personal\Kara\Kara Boutique\backend
    echo   quick-start.bat
    echo.
    pause
    exit /b 1
)

echo Step 1/5: Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

echo Step 2/5: Checking PostgreSQL installation...
psql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: PostgreSQL not found in PATH
    echo Make sure PostgreSQL is installed and running
    echo.
)
echo.

echo Step 3/5: Installing dependencies...
echo This may take 3-5 minutes...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 4/5: Installing TypeScript type definitions...
call npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid @types/qrcode @types/speakeasy @types/node-cron @types/pdfkit
echo ✓ Type definitions installed
echo.

echo Step 5/5: Checking environment file...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating template .env file...
    (
        echo # Server
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Database
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=kara_boutique
        echo DB_USER=postgres
        echo DB_PASSWORD=your_password_here
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-required
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Frontend
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Other
        echo STOCK_RESERVATION_MINUTES=10
    ) > .env
    echo ✓ Created template .env file
    echo.
    echo IMPORTANT: Edit .env and set your PostgreSQL password!
    notepad .env
) else (
    echo ✓ .env file exists
)
echo.

echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Create database: psql -U postgres -c "CREATE DATABASE kara_boutique;"
echo 3. Run schema: psql -U postgres -d kara_boutique -f ..\database\schema.sql
echo 4. Run migrations: psql -U postgres -d kara_boutique -f ..\database\migrations\005_add_email_verification.sql
echo 5. Start server: npm run dev
echo.
echo Press any key to start the development server...
pause >nul

echo.
echo Starting development server...
echo.
npm run dev
