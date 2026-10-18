# ⛪ Simple Senbet — Sunday School Management System

A full-stack Sunday School Management MVP built with a **Laravel 13** backend API (PHP 8.4) and an embedded **Next.js 16** frontend client located in `frontend/`.

---

## 🏛️ Architecture Overview

The project is structured as a monorepo where Laravel serves as the backend REST API and Next.js is contained within the `frontend/` directory:

```
Simple-Senbet/
├── app/                  # Domain services, Models, Policies, FormRequests, Controllers
├── bootstrap/            # Application bootstrap & route registration
├── config/               # Application configuration (cors, database, sanctum, etc.)
├── database/             # Migrations, seeders, factories, SQLite storage
├── docs/                 # Postman collections and API documentation
├── frontend/             # Next.js 16 Client Application
│   ├── src/app/          # Next.js App Router (dashboard, attendance, login, report cards)
│   ├── src/context/      # React AuthContext & authentication provider
│   ├── tests/            # Node test runner integration suites (BFF security, workflow)
│   └── next.config.ts    # Next.js configuration
├── routes/               # API, web, and console routes
├── Dockerfile            # PHP 8.4 CLI container specification
├── docker-compose.yml    # Container orchestration for backend services
├── phpunit.xml           # Isolated test configuration (in-memory SQLite, array cache)
└── README.md             # Canonical project documentation
```

- **Backend (Root)**: Laravel 13 on **PHP 8.4**, providing versioned cached REST APIs (`CachedCrudService`), Spatie role-based authorization, academic grading services (`GradebookService`), attendance lifecycle management (`AttendanceService`), monthly dues & payments accounting (`MemberPaymentService`, `PaymentDashboardService`, `PaymentRuleService`), Ethiopian calendar conversion (`EthiopianDateService`), automated CLI dues reminders (`NotifyDuesCommand`), and CSV/HTML print export endpoints.
- **Frontend (`/frontend`)**: Next.js 16 with React 19, App Router, TypeScript, and Tailwind CSS. Features role-aware dashboards for teachers and administrators, attendance tracking, printable report cards, and BFF security origin validation.

---

## ⚙️ Prerequisites & Runtime Requirements

- **Docker & Docker Compose**: Docker 20.10+ and Docker Compose v2.0+ (Docker Compose v5.6+ tested).
- **PHP 8.4+**: The application dependencies (`composer.lock`) require PHP `>= 8.4.1`. When running on hosts with PHP 8.3 (such as default Ubuntu 24.04), all `artisan`, `composer`, and test commands should be executed via the provided Docker Compose container.
- **Node.js**: Node.js 20.x, 22.x, or 24.x (v24.21.0 tested) and npm 10+.

---

## ⚡ Quick Start with Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/Daniel-wasihun/Simple-Senbet.git
cd Simple-Senbet
```

### 2. Environment Setup

```bash
# Copy default environment
cp .env.example .env

# Generate application key via Docker
docker compose run --rm backend php artisan key:generate

# Initialize SQLite database file
touch database/database.sqlite
```

### 3. Run Database Migrations & Seeders

```bash
# Execute schema migrations
docker compose run --rm backend php artisan migrate

# Seed base roles and superadmin
docker compose run --rm backend php artisan db:seed --class=DatabaseSeeder

# (Optional) Seed test fixture with assigned teachers, students, and courses
docker compose run --rm backend php artisan db:seed --class=AttendanceTestSeeder
```

### 4. Start Services

#### Start Laravel Backend via Docker:
```bash
docker compose up backend
```
> Listens on `http://localhost:8000` (or `http://127.0.0.1:8000`).

#### Start Next.js Frontend:
```bash
cd frontend
npm install
npm run dev
```
> Listens on `http://localhost:3000` (or `http://127.0.0.1:3000`).

Alternatively, install root scripts:
```bash
npm run install:all
npm run dev
```

---

## 👥 Role-Based Access Boundaries

The system enforces strict multi-role authorization at both the API policy layer and the frontend client:

| Feature / Resource | Superadmin / Director | Assigned Teacher | Unassigned Teacher | Student |
|---|:---:|:---:|:---:|:---:|
| User & Role Management | ✅ Full CRUD | ❌ Denied (`403`) | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Academic Years & Terms | ✅ Full CRUD | ❌ Read-only | ❌ Read-only | ❌ Denied (`403`) |
| School Classes & Courses | ✅ Full CRUD | 👁️ View Assigned | 👁️ View Only | 👁️ View Only |
| Student Enrollments | ✅ Full CRUD | 👁️ Roster View | ❌ Denied (`403`) | 👁️ Own Profile |
| Attendance Sessions | ✅ Full CRUD / Close | ✅ Create & Submit | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Assessment & Mark Entry | ✅ Full CRUD | ✅ Assigned Course | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Class Gradebook Overview | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Student Report Card | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | 👁️ Own Only |
| CSV Gradebook Export | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Printable Report Card | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | 👁️ Own Only |
| Payment Rules Configuration | ✅ Full CRUD | 👁️ View Only | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Payment Dashboard & Ledger | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Member Payment History | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Record Member Payments | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Void Payment Transactions | ✅ Full Access | ❌ Denied (`403`) | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Payment Receipts (Print/JSON) | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |
| Financial CSV Exports | ✅ Full Access | ✅ Assigned Class | ❌ Denied (`403`) | ❌ Denied (`403`) |

---

## 📊 Report Card & Export Behavior

### 1. Printable Report Cards & HTML Gradebook
> [!NOTE]
> **Printable Report Limitation:** The printable report card endpoint (`/api/report-cards/class/{id}/export/print` and frontend `/report-cards/{id}`) outputs **print-optimized semantic HTML** with dedicated `@media print` stylesheets designed for direct browser printing and the browser's native **"Save as PDF"** feature. The application does not use server-side binary PDF generation (e.g., wkhtmltopdf or DomPDF); all PDF generation is handled client-side via the browser print engine.

Features included in printable reports:
- Bilingual English and Amharic headers.
- Watermark indicators on provisional or incomplete report cards where assessments remain pending.
- Rank calculation display (class rank and section rank) with tie handling.
- Verification signature blocks for Class Teacher and Academic Director.

### 2. Gradebook CSV Export
The CSV export endpoint (`/api/report-cards/class/{id}/export/csv`) implements:
- **UTF-8 Byte Order Mark (BOM)**: Ensures proper rendering of Amharic (Ethiopic) Unicode characters across Microsoft Excel, Apple Numbers, and LibreOffice.
- **Formula Injection Mitigation**: Any field beginning with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`) to prevent CSV injection / execution.

### 3. Attendance Independence
Attendance tracking remains purely informational and **never silently alters academic assessment scores**. Even if a student has an attendance rate of 0%, the score adjustment is strictly 0.00%, ensuring grade integrity.

---

## 💰 Monthly Member Payments & Accounting Subsystem

The monthly payments subsystem manages Sunday School member dues, rule-based pricing, payment recording, receipts, automated dues reminders, and financial exports.

### 1. Dual Calendar Integration (Ethiopian & Gregorian)
- **Canonical Storage**: All dates (`payment_date`, `created_at`, billing months) are canonically stored in standard UTC Gregorian dates (`YYYY-MM-DD` / `YYYY-MM`).
- **Ethiopian Date Service (`EthiopianDateService`)**: Dynamically computes corresponding Ethiopian Calendar (E.C.) dates with month names in both Amharic and English phonetics (e.g. `መስከረም 2019 ዓ.ም.` / `Meskerem 2019 E.C.`) for UI presentation, printable receipts, and financial exports.

### 2. Flexible Rule Engine & Credit Carry-Forward
- **Eligibility Criteria**: Rules configure standard dues amounts with optional age thresholds (`minimum_age`), minimum class grades (`minimum_class_id`), or specific target classes (`class_id`).
- **Credit Carry-Forward**: Overpayments in a given billing month can automatically carry forward as credit to reduce dues in subsequent months when `allow_credit_carry_forward` is enabled on the active rule.

### 3. Payment Processing, Idempotency & Concurrency Safety
- **Supported Payment Methods**: `CASH`, `BANK_TRANSFER`, `TELEBIRR`, `CBE_BIRR`, `CHECK`, `MOBILE_MONEY`, `OTHER`.
- **Sequential Receipt Numbers**: Unique, human-readable receipt numbers (format `RCP-YYYYMM-XXXX`) generated atomically using database table locking and unique index constraints (`member_payments_reference_number_unique`).
- **Idempotency**: Clients can supply an optional `idempotency_key`. The backend enforces uniqueness to prevent duplicate charges caused by network retries.
- **Atomic Transactions**: All balance recalculations and status transitions (`PAID`, `PARTIAL`, `UNPAID`, `OVERPAID`) execute inside isolated database transactions.

### 4. Voiding & Immutable Audit Trail
- **Soft Voiding**: Completed payments can be voided via `POST /api/payments/{id}/void` by authorized administrators only.
- **Mandatory Reason**: Requires an explanation (`reason`) between 3 and 255 characters, which is recorded in the immutable audit log (`PaymentAuditLog`).
- **Automatic Recalculation**: Voiding immediately reverts applied credits and recalculates member balances. Already-voided payments cannot be voided again (`422 Unprocessable Content`).

### 5. Automated Dues Notifications CLI Command
- **Artisan Command**:
  ```bash
  # Execute reminder dispatch simulation (dry-run)
  php artisan payments:notify-dues --dry-run

  # Live dispatch for a specific billing month and class
  php artisan payments:notify-dues --month=2026-10 --class=1
  ```
- **Concurrency Isolation**: Implements Laravel's `Isolatable` interface to prevent overlapping concurrent cron executions.
- **Granular Reporting**: Generates execution metrics distinguishing eligible, fully-settled, exempt/minor, previously-notified, and dispatched reminders.

### 6. Financial CSV Exports & Security Safeguards
- **Export Endpoints**:
  - `GET /api/payments/export/monthly-summary`: High-level financial KPIs (expected, collected, remaining, collection rate) followed by a full member-by-member ledger.
  - `GET /api/payments/export/transactions`: Detailed chronological transaction journal with both Gregorian and Ethiopian payment dates.
- **Ge'ez Unicode Compatibility**: Streams CSV with a UTF-8 Byte Order Mark (`\xEF\xBB\xBF`) ensuring Amharic text renders correctly in Microsoft Excel, Apple Numbers, and LibreOffice.
- **OWASP Formula Injection Mitigation**: Any field starting with formula execution characters (`=`, `+`, `-`, `@`, `\t`, `\r`) is sanitized by prefixing with a single quote (`'`).

---

## 🧪 Testing & Verification Quality Gates

All quality checks run in fully isolated environments:

### Backend PHPUnit Suite (via Docker PHP 8.4)
```bash
docker compose run --rm backend php artisan test
```
*Executes 203 automated feature and unit tests (857 assertions) using an in-memory SQLite database and array cache store with zero persistence leaks.*

### Disposable Database Rollback & Seeder Idempotency Verification
```bash
docker compose run --rm backend sh -c '
  touch /tmp/test.sqlite &&
  DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan migrate:fresh --force &&
  DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan db:seed --class=AttendanceTestSeeder --force &&
  DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan db:seed --class=AttendanceTestSeeder --force &&
  DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan migrate:rollback --force &&
  DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan migrate --force &&
  rm -f /tmp/test.sqlite
'
```

### Frontend Integration Tests
```bash
node --test frontend/tests/*.mjs
```
*Executes 49 tests across 5 test suites covering query serialization, session closure authorization, absentee aggregations, attendance context resolution, and BFF security origin/route allowlisting.*

### Frontend ESLint
```bash
npm --prefix frontend run lint
```
*Zero errors and zero warnings.*

### Next.js Production Build
```bash
npm --prefix frontend run build
```
*Compiles all 10 static and dynamic routes cleanly with Turbopack and strict TypeScript validation.*

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user; returns Sanctum bearer token and role/assignments |
| `POST` | `/api/auth/logout` | Revoke active API token |
| `GET` | `/api/profile` | Current user profile with teaching assignments |
| `GET` | `/api/status` | Application health probe, framework version, DB status |
| `GET` | `/api/senbet/summary` | Module counts and public announcements |
| `API` | `/api/school-classes` | School class CRUD (cached with versioned invalidation) |
| `API` | `/api/courses` | Course and subject CRUD |
| `API` | `/api/members` | Student member registration and profile CRUD |
| `API` | `/api/assessments` | Assessment definition CRUD with weight validation |
| `API` | `/api/assessment-results` | Mark entry and validation |
| `GET` | `/api/attendance/summary` | Aggregated attendance rates and absentee drilldown |
| `GET` | `/api/attendance/sessions/{id}/roster` | Expected student roster for session |
| `POST` | `/api/attendance/sessions/{id}/submit` | Atomic submission of student and teacher attendance marks |
| `PATCH` | `/api/attendance/sessions/{id}/marks` | 24-hour teacher correction window or admin override |
| `POST` | `/api/attendance/sessions/{id}/close` | Administrative session closure |
| `GET` | `/api/report-cards/student/{id}` | Individual student report card with pass/fail/incomplete status |
| `GET` | `/api/report-cards/class/{id}` | Comprehensive class gradebook with sectional and class-wide rankings |
| `GET` | `/api/report-cards/class/{id}/export/csv` | Authorized class gradebook CSV export |
| `GET` | `/api/report-cards/class/{id}/export/print` | Authorized print-optimized HTML gradebook |
| `GET` | `/api/payments/rules` | List configured monthly payment rules and eligibility criteria |
| `POST` | `/api/payments/rules` | Create a monthly payment rule (admin only) |
| `GET` | `/api/payments/dashboard` | Reconciled monthly payment dashboard metrics (`month`, `class_id`) |
| `GET` | `/api/payments/members` | Paginated, filterable member payment ledger (`month`, `class_id`, `status`, `search`) |
| `GET` | `/api/payments/members/{id}/history` | Complete historical payment ledger for a specific member |
| `POST` | `/api/payments` | Record a member payment transaction (with idempotency support) |
| `POST` | `/api/payments/record` | Alias endpoint for recording a member payment transaction |
| `POST` | `/api/payments/{id}/void` | Soft-void a payment transaction with required audit reason (admin only) |
| `GET` | `/api/payments/{id}/receipt` | Dual-calendar printable receipt data (E.C. & G.C.) |
| `GET` | `/api/payments/export/monthly-summary` | Streamed monthly payment financial summary CSV export |
| `GET` | `/api/payments/export/transactions` | Streamed granular payment transaction ledger CSV export |

---

## 🚀 Production Operations & Deployment Runbooks

### 1. Production Architecture & Runtime Reality
> [!IMPORTANT]
> **Runtime Server Architecture:** The default `Dockerfile` executes `php artisan serve`, which utilizes PHP's built-in single-threaded CLI development server. **This server is strictly unsuitable for production use.** 
> Production deployments must utilize **PHP-FPM (`php:8.4-fpm-alpine`) coupled with an Nginx or Caddy reverse proxy**, or alternatively a container runtime like FrankenPHP.

Recommended Production Architecture:
```
[ Client Browser / HTTPS ]
            │
            ▼
┌───────────────────────────────┐
│ Nginx Reverse Proxy (TLS)    │  (Terminates SSL, serves static assets, enforces rate limits)
└──────────────┬────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Next.js BFF  │  │ PHP-FPM 8.4  │  (Laravel API backend with OPcache enabled)
│ (Port 3000)  │  │ (Port 9000)  │
└──────────────┘  └──────┬───────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
     ┌──────────────┐        ┌──────────────┐
     │ PostgreSQL 16│        │ Redis 7      │  (Persistent storage & distributed cache/locks)
     └──────────────┘        └──────────────┘
```

#### Production Docker Compose Example (`docker-compose.prod.yml`)
```yaml
services:
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./public:/var/www/html/public:ro
      - ./certs:/etc/ssl/certs:ro
    depends_on:
      - backend
      - frontend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.fpm
    restart: unless-stopped
    env_file: .env.production
    volumes:
      - ./storage:/var/www/html/storage
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./frontend/.env.production
    depends_on:
      - backend

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: simple_senbet_production
      POSTGRES_USER: senbet_app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U senbet_app -d simple_senbet_production"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

### 2. Production Environment & Security Hardening
Before bringing services up in production:

1. **Provision Environment Files:**
   ```bash
   cp .env.production.example .env
   cp frontend/.env.production.example frontend/.env.production
   ```
2. **Generate Strong Application Key:**
   ```bash
   php artisan key:generate --force
   ```
3. **Verify Critical Hardening Flags:**
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `SESSION_SECURE_COOKIE=true` (forces browser cookies to transmit exclusively over TLS)
   - `SESSION_SAME_SITE=lax` (mitigates CSRF vulnerabilities)
   - `CORS_ALLOWED_ORIGINS=https://senbet.example.com` (restricts cross-origin browser requests to the canonical domain)
   - `BCRYPT_ROUNDS=12` (provides robust password hashing work-factor)
4. **Compile Production Caches:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```
   *(To clear caches during zero-downtime rolling updates: `php artisan optimize:clear`)*

---

### 3. Database Backup & Disaster Recovery Runbook

#### A. Database Requirements
- PostgreSQL 16 or newer.
- Persistent dedicated volume for containerized databases (`pgdata`).
- Isolated recovery target database for pre-cutover verification.

#### B. On-Demand Full Database Backup
Generate a compressed, atomic PostgreSQL dump using custom archive format (`-Fc`):
```bash
# Set timestamp and backup target directory
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/senbet"
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump via Docker or directly on host
docker compose exec -T postgres pg_dump \
  -U senbet_app \
  -d simple_senbet_production \
  -Fc \
  --verbose \
  > "${BACKUP_DIR}/senbet_db_${BACKUP_TIMESTAMP}.dump"
```

#### C. Safe Disaster Recovery & Restore Runbook (Two-Step Verification Procedure)
**NEVER execute `pg_restore --clean` directly against the live production database without a verified snapshot and isolated test restore.**

##### Step 1: Pre-Restore Safety Snapshot & Archive Verification
```bash
# 1. Inspect archive Table of Contents (TOC) and verify file integrity
pg_restore --list /var/backups/senbet/senbet_db_TARGET.dump | head -n 30

# 2. Capture immediate safety snapshot of live database before any cutover
docker compose exec -T postgres pg_dump \
  -U senbet_app \
  -d simple_senbet_production \
  -Fc \
  > "/var/backups/senbet/pre_restore_safety_$(date +%Y%m%d_%H%M%S).dump"
```

##### Step 2: Isolated Restoration & Integrity Verification
```bash
# 3. Create fresh, isolated recovery database
docker compose exec -T postgres psql -U senbet_app -d postgres -c "DROP DATABASE IF EXISTS simple_senbet_recovery;"
docker compose exec -T postgres psql -U senbet_app -d postgres -c "CREATE DATABASE simple_senbet_recovery OWNER senbet_app;"

# 4. Restore into isolated recovery database wrapped in a single transaction
docker compose exec -T postgres pg_restore \
  -U senbet_app \
  -d simple_senbet_recovery \
  --single-transaction \
  --no-owner \
  --no-privileges \
  /var/backups/senbet/senbet_db_TARGET.dump

# 5. Verify restored schema, table count, and row counts
docker compose exec -T postgres psql -U senbet_app -d simple_senbet_recovery -c "\dt"
docker compose exec -T postgres psql -U senbet_app -d simple_senbet_recovery -c "SELECT count(*) FROM users; SELECT count(*) FROM attendance_sessions;"
```

##### Step 3: Production Cutover & Promotion
```bash
# 6. Put application in maintenance mode with secret token
php artisan down --secret="disaster-recovery-override-token"

# 7. Terminate active database connections and swap database names
docker compose exec -T postgres psql -U senbet_app -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'simple_senbet_production';
  ALTER DATABASE simple_senbet_production RENAME TO simple_senbet_deprecated_$(date +%Y%m%d_%H%M%S);
  ALTER DATABASE simple_senbet_recovery RENAME TO simple_senbet_production;
"

# 8. Run any pending database migrations
php artisan migrate --force

# 9. Bring application back online
php artisan up
```

##### Step 4: Fallback & Abort Procedure
If integrity validation fails in Step 2:
1. Drop the temporary database: `DROP DATABASE simple_senbet_recovery;`
2. Keep the live production database untouched.
3. Review restore error logs and evaluate archive provenance.

#### D. Operational Recovery Planning Guidelines
- **Snapshot Frequency:** Schedule automated snapshots (e.g., via host systemd timer or cron) during low-traffic windows.
- **Off-Host Replication:** Store encrypted backup dumps on off-host durable storage (S3, B2, or isolated backup server).
- **Periodic Restore Drills:** Periodically rehearse the two-step verification procedure against non-production staging environments.

---

### 4. Operational Monitoring & Observability

#### A. Health Check Endpoints
The backend provides two non-authenticated health inspection endpoints:
- **`GET /up`**: Lightweight HTTP 200 liveness probe for container orchestrators (Kubernetes, AWS ECS, Docker swarm).
- **`GET /api/status`**: Readiness and database connectivity probe. Internal database names and patch versions are redacted to prevent information disclosure:
  ```json
  {
    "status": "online",
    "database": {
      "connected": true
    },
    "timestamp": "2026-10-18T12:00:00+00:00"
  }
  ```
  *(Returns HTTP 200 when healthy, or HTTP 503 Service Unavailable if database connectivity fails).*

#### B. Logging & Log Rotation Policy
- **Stack & Daily Driver:** Set `LOG_STACK=daily` and `LOG_DAILY_DAYS=14` in production `.env`.
- **Log Level:** Set `LOG_LEVEL=warning` in production to prevent disk bloat while capturing warnings and unhandled exceptions.
- **Sensitive Field Redaction:** Passwords, tokens, credentials, and authentication authorization headers are automatically omitted or masked by Laravel's exception handler and FormRequest input sanitization.

---

## 🔒 Governance & Markdown Tracking Policy

Per project governance (`/home/daniel/Documents/Projects/fullstack/School/AGENTS.md`):
- **Only the repository-root `README.md` is tracked in Git.**
- All audit, milestone, and evaluation reports remain local-only, untracked, and ignored by `.gitignore`.
