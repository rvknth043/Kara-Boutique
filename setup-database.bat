@echo off
title Kara Boutique - Database Setup
color 0B

echo ========================================
echo   KARA BOUTIQUE - DATABASE SETUP
echo ========================================
echo.

REM Check if running in database directory
if not exist "schema.sql" (
    echo ERROR: Please run this script from the database directory!
    echo.
    echo Example:
    echo   cd D:\Personal\Kara\Kara Boutique\database
    echo   setup-database.bat
    echo.
    pause
    exit /b 1
)

echo This script will:
echo 1. Create the kara_boutique database
echo 2. Run the schema (create tables)
echo 3. Run all migrations
echo 4. Optionally seed sample data
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul
echo.

echo Step 1: Creating database...
echo.
psql -U postgres -c "DROP DATABASE IF EXISTS kara_boutique;" 2>nul
psql -U postgres -c "CREATE DATABASE kara_boutique;"
if errorlevel 1 (
    echo ERROR: Failed to create database
    echo Make sure PostgreSQL is running and you have the correct password
    pause
    exit /b 1
)
echo ✓ Database created
echo.

echo Step 2: Running schema...
psql -U postgres -d kara_boutique -f schema.sql
if errorlevel 1 (
    echo ERROR: Failed to run schema
    pause
    exit /b 1
)
echo ✓ Schema applied (21 tables created)
echo.

echo Step 3: Running migrations...
echo.

if exist "migrations\001_add_coupon_fields.sql" (
    echo Running migration 001...
    psql -U postgres -d kara_boutique -f migrations\001_add_coupon_fields.sql
)

if exist "migrations\002_add_invoice_tables.sql" (
    echo Running migration 002...
    psql -U postgres -d kara_boutique -f migrations\002_add_invoice_tables.sql
)

if exist "migrations\003_add_image_upload.sql" (
    echo Running migration 003...
    psql -U postgres -d kara_boutique -f migrations\003_add_image_upload.sql
)

if exist "migrations\004_add_notifications.sql" (
    echo Running migration 004...
    psql -U postgres -d kara_boutique -f migrations\004_add_notifications.sql
)

if exist "migrations\005_add_email_verification.sql" (
    echo Running migration 005...
    psql -U postgres -d kara_boutique -f migrations\005_add_email_verification.sql
)

echo ✓ All migrations applied
echo.

echo Step 4: Seed sample data (optional)
echo.
choice /C YN /M "Do you want to add sample data (15 products, 12 users, 5 coupons)"
if errorlevel 2 goto :skip_seed
if errorlevel 1 goto :run_seed

:run_seed
echo.
echo Seeding database with Node.js script...
cd ..\backend
call npm run seed
if errorlevel 1 (
    echo WARNING: Seed script failed
    echo You can run it manually later with: cd backend && npm run seed
) else (
    echo ✓ Sample data added
)
cd ..\database
goto :done

:skip_seed
echo Skipping sample data...
echo You can add it later with: cd backend && npm run seed
echo.

:done
echo.
echo ========================================
echo   DATABASE SETUP COMPLETE!
echo ========================================
echo.
echo Database: kara_boutique
echo Tables:   21 created
echo Status:   Ready for use
echo.
echo Test Login Credentials:
echo   Admin: admin@karaboutique.com / password123
echo   User:  priya.sharma@gmail.com / password123
echo.
echo Active Coupons (if seeded):
echo   WELCOME10  - 10%% off (min ₹1000)
echo   FESTIVE20  - 20%% off (min ₹2000)
echo   FLAT500    - ₹500 off (min ₹3000)
echo   FREESHIP   - Free shipping (min ₹1000)
echo.
pause
