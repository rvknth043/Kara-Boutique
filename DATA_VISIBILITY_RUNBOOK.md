# Data Visibility Checklist Runbook

Use this runbook when "seed completed" but UI still looks empty.

## 1) Start dependencies

```bash
# PostgreSQL + Redis must be running first
# (service names vary by OS)
```

## 2) Configure backend env

```bash
cp backend/.env.example backend/.env
# set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD and FRONTEND_URL
```

## 3) Migrate + seed + verify

```bash
npm run db:migrate
SEED_USER_COUNT=100 SEED_PRODUCT_COUNT=1200 npm run db:seed
SEED_USER_COUNT=100 SEED_PRODUCT_COUNT=1200 SEED_REPORT_FILE=database/artifacts/seed-report.json npm run db:verify
```

Expected:
- `✅ Seed verification passed.`
- report file created at `database/artifacts/seed-report.json`

## 4) Start backend + frontend

```bash
# terminal 1
npm run dev:backend

# terminal 2
npm run dev:frontend
```

## 5) API visibility smoke check (concrete)

```bash
npm run data:visibility:check
```

This command validates:
- `/health` is OK
- products endpoint returns non-zero rows
- categories endpoint returns non-zero rows
- featured products endpoint responds

## 6) Manual UI checks

Open:
- `http://localhost:3000/products` → product grid should show items.
- `http://localhost:3000` → featured/home blocks should render with API data.

## 7) If products are still not visible

1. Confirm frontend points to backend API:
   - `frontend/.env.local` should contain `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`
2. Confirm backend health:
   - `curl http://localhost:5000/health`
3. Confirm product API directly:
   - `curl "http://localhost:5000/api/v1/products?limit=12&page=1"`
4. Check backend logs for DB/Redis/auth errors.
5. Re-run seed verify with report and inspect `database/artifacts/seed-report.json`.

## 8) CI parity (optional)

CI already executes migrate/seed/verify and uploads seed report artifact (`seed-verification-report`).

