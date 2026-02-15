# 🔧 TYPESCRIPT ERROR TROUBLESHOOTING GUIDE

**Platform:** Windows 10/11  
**Last Updated:** February 15, 2026

---

## 🚨 COMMON TYPESCRIPT ERRORS & FIXES

### Error 1: "Could not find a declaration file for module 'pg'"

**Error Message:**
```
error TS7016: Could not find a declaration file for module 'pg'
```

**Solution:**
```cmd
cd backend
npm install --save-dev @types/pg
```

**Install all type definitions at once:**
```cmd
npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken
```

---

### Error 2: "Variable is declared but never used"

**Error Message:**
```
error TS6133: 'req' is declared but its value is never read.
```

**Solution 1 - Fix tsconfig.json:**
```json
{
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Solution 2 - Prefix with underscore:**
```typescript
// Instead of:
app.use((req, res, next) => {

// Use:
app.use((_req, _res, next) => {
```

---

### Error 3: "Not all code paths return a value"

**Error Message:**
```
error TS7030: Not all code paths return a value.
```

**Solution:**
Update tsconfig.json:
```json
{
  "compilerOptions": {
    "noImplicitReturns": false
  }
}
```

---

### Error 4: "Cannot find module '@kara-boutique/shared'"

**Error Message:**
```
error TS2307: Cannot find module '@kara-boutique/shared'
```

**Solution:**
This package doesn't exist. All imports have been fixed to use:
```typescript
import { User, UserRole } from '../types/shared.types';
```

**If you still see this error:**
```cmd
# Search and replace in all files
cd backend\src

# Using PowerShell
Get-ChildItem -Recurse -Filter *.ts | ForEach-Object {
    (Get-Content $_.FullName) -replace "@kara-boutique/shared", "../types/shared.types" | Set-Content $_.FullName
}
```

---

### Error 5: "Parameter implicitly has 'any' type"

**Error Message:**
```
error TS7006: Parameter 'client' implicitly has an 'any' type.
```

**Solution:**
Update tsconfig.json:
```json
{
  "compilerOptions": {
    "noImplicitAny": false
  }
}
```

---

### Error 6: "Property does not exist on type"

**Error Message:**
```
error TS2339: Property 'password_hash' does not exist on type 'User'.
```

**Solution:**
Check `backend/src/types/shared.types.ts` and ensure the property exists:
```typescript
export interface User {
  id: string;
  email: string;
  password_hash: string;  // Make sure this is NOT optional
  full_name: string;
  // ... other properties
}
```

---

## 🛠️ QUICK FIX COMMANDS

### Complete TypeScript Error Fix

Run these commands in order:

```cmd
cd backend

REM 1. Install all type definitions
npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid @types/qrcode @types/speakeasy @types/node-cron @types/pdfkit

REM 2. Install runtime dependencies
npm install socket.io date-fns

REM 3. Clear TypeScript cache
rmdir /s /q dist

REM 4. Try to start
npm run dev
```

---

## 📝 RECOMMENDED TSCONFIG.JSON

For development on Windows, use this relaxed configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Copy this to:** `backend/tsconfig.json`

---

## 🔍 DEBUGGING TYPESCRIPT ISSUES

### Check TypeScript Version

```cmd
cd backend
npx tsc --version
```

Should show: `Version 5.3.3` or higher

### Compile Manually to See Errors

```cmd
cd backend
npx tsc --noEmit
```

This will show all TypeScript errors without creating output files.

### Check Specific File

```cmd
npx tsc src/server.ts --noEmit
```

### Clear All Caches

```cmd
REM Stop the server (Ctrl+C)

REM Clear TypeScript build cache
rmdir /s /q dist

REM Clear Node modules
rmdir /s /q node_modules
del package-lock.json

REM Reinstall
npm install

REM Start fresh
npm run dev
```

---

## 🚀 AUTOMATED FIX SCRIPT

Create `fix-typescript.bat` in backend folder:

```batch
@echo off
echo Fixing TypeScript issues...
echo.

echo Step 1: Installing type definitions...
call npm install --save-dev @types/pg @types/cors @types/helmet @types/express @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid @types/qrcode @types/speakeasy @types/node-cron @types/pdfkit

echo.
echo Step 2: Installing runtime dependencies...
call npm install socket.io date-fns

echo.
echo Step 3: Clearing build cache...
if exist dist rmdir /s /q dist

echo.
echo Step 4: Testing compilation...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo Still have errors. Check the output above.
) else (
    echo.
    echo ✓ All TypeScript errors fixed!
    echo You can now run: npm run dev
)

pause
```

**Run it:**
```cmd
cd backend
fix-typescript.bat
```

---

## 📋 VERIFICATION CHECKLIST

After fixing errors, verify:

- [ ] `npx tsc --noEmit` runs without errors
- [ ] All type definitions installed (`@types/*`)
- [ ] tsconfig.json has relaxed settings
- [ ] No imports from `@kara-boutique/shared`
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:5000/health

---

## 💡 PREVENTION TIPS

### 1. Always Install Type Definitions

When installing a package, also install its types:
```cmd
npm install express
npm install --save-dev @types/express
```

### 2. Use Relaxed TypeScript for Development

Start with relaxed settings, tighten for production:
```json
{
  "compilerOptions": {
    "strict": false  // Development
    // "strict": true  // Production
  }
}
```

### 3. Keep TypeScript Updated

```cmd
npm install --save-dev typescript@latest
```

### 4. Use ESLint Instead of Strict TS

For code quality, use ESLint rather than super strict TypeScript:
```cmd
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

## 🆘 STILL HAVING ISSUES?

### Check Node/npm Versions

```cmd
node --version   # Should be 18+
npm --version    # Should be 9+
```

### Reinstall ts-node

```cmd
npm uninstall ts-node
npm install --save-dev ts-node
```

### Try ts-node-dev

Alternative to nodemon:
```cmd
npm install --save-dev ts-node-dev

REM In package.json, change:
"dev": "ts-node-dev --respawn src/server.ts"
```

### Use Plain JavaScript (Last Resort)

If TypeScript continues to cause issues:
```cmd
# Build to JavaScript
npm run build

# Run the built JavaScript
node dist/server.js
```

---

## ✅ SUCCESS INDICATORS

You know it's working when you see:

```
[nodemon] starting `ts-node src/server.ts`
✅ Database connected successfully
🚀 Server running on port 5000
📝 Environment: development
🔗 API URL: http://localhost:5000/api/v1
🔌 Socket.io initialized
```

**No TypeScript errors during startup!**

---

## 📞 QUICK REFERENCE

| Error Code | Meaning | Quick Fix |
|-----------|---------|-----------|
| TS7016 | Missing types | `npm i --save-dev @types/package-name` |
| TS6133 | Unused variable | Prefix with `_` or disable in tsconfig |
| TS7030 | Missing return | Add return or disable `noImplicitReturns` |
| TS2307 | Module not found | Check import path |
| TS7006 | Implicit any | Disable `noImplicitAny` or add type |
| TS2339 | Property missing | Check interface definition |

---

**Good luck! 🚀**
