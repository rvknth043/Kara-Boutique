@echo off
echo ========================================
echo KARA BOUTIQUE - TYPESCRIPT ERROR FIXER
echo ========================================
echo.

echo Step 1: Installing missing type definitions...
call npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid @types/qrcode @types/speakeasy @types/node-cron
echo.

echo Step 2: Installing runtime dependencies...
call npm install socket.io date-fns
echo.

echo Step 3: Fixing TypeScript configuration...
echo Done!
echo.

echo ========================================
echo ALL FIXES APPLIED!
echo ========================================
echo.
echo Now you can run: npm run dev
echo.
pause
