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

- **Backend (Root)**: Laravel 13 on **PHP 8.4**, providing versioned cached REST APIs (`CachedCrudService`), Spatie role-based authorization, academic grading services (`GradebookService`), attendance lifecycle management (`AttendanceService`), and CSV/HTML print export endpoints.
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

---

## 🔒 Governance & Markdown Tracking Policy

Per project governance (`/home/daniel/Documents/Projects/fullstack/School/AGENTS.md`):
- **Only the repository-root `README.md` is tracked in Git.**
- All audit, milestone, and evaluation reports remain local-only, untracked, and ignored by `.gitignore`.
