# ⛪ Simple Senbet — Laravel + Next.js

A modern, clean full-stack application with a **Laravel 13** backend API and an embedded **Next.js 16** frontend located cleanly inside the `frontend/` directory.

---

## 🏛️ Architecture Overview

The project is structured as a clean monorepo where Laravel serves as the root backend application and Next.js is contained within the `frontend/` folder:

```
Simple-Senbet/
├── app/                  # Laravel application logic (Models, Controllers, Providers)
├── bootstrap/            # Application bootstrap & route registration
├── config/               # Laravel configuration (cors.php, database.php, etc.)
├── database/             # Database migrations, seeders, and factories
├── frontend/             # Next.js 16 Client Application (Embedded inside Laravel)
│   ├── src/
│   │   └── app/          # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies & scripts
│   ├── tsconfig.json     # TypeScript configuration
│   └── next.config.ts    # Next.js configuration (with allowedDevOrigins)
├── public/               # Laravel public web root (index.php)
├── routes/
│   ├── api.php           # REST API endpoints (/api/status, /api/senbet/summary)
│   ├── web.php           # Web routes
│   └── console.php       # Artisan console commands
├── storage/              # Framework storage & logs
├── artisan               # Laravel CLI tool
├── composer.json         # PHP dependencies
├── package.json          # Root scripts to orchestrate both apps
└── README.md             # Documentation
```

- **Backend (Root)**: Laravel 13 on PHP 8.3, providing RESTful JSON APIs, CORS handling, and PostgreSQL persistence.
- **Frontend (`/frontend`)**: Next.js 16 with React 19, App Router, TypeScript, and Tailwind CSS. Pre-configured for seamless API communication and hot reloading across `localhost` and `127.0.0.1`.

---

## ⚡ Quick Start (Cloning & Running in 3 Steps)

### 1. Clone the Repository

```bash
git clone https://github.com/Daniel-wasihun/Simple-Senbet.git
cd Simple-Senbet
```

### 2. Install Dependencies & Setup Environment

```bash
# Install PHP (Laravel) and Node (Next.js) dependencies in one go
npm run install:all

# Configure environment & generate app key
cp .env.example .env
php artisan key:generate

# Run database migrations
php artisan migrate
```

### 3. Start Both Services

```bash
npm run dev
```

This single command starts:
- 🟢 **Laravel API Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- 🔵 **Next.js Frontend UI**: [http://localhost:3000](http://localhost:3000) (also accessible at [http://127.0.0.1:3000](http://127.0.0.1:3000))

---

## 🖥️ Running Services Individually

If you prefer running the backend and frontend in separate terminal windows:

### Terminal 1: Laravel Backend
```bash
php artisan serve
```
> Listens on `http://127.0.0.1:8000`

### Terminal 2: Next.js Frontend
```bash
cd frontend
npm run dev
```
> Listens on `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status overview & quick documentation links |
| `GET` | `/api/status` | Backend health check, framework version & live DB connection status |
| `GET` | `/api/senbet/summary` | Sunday School modules, statistics & announcements |
| `GET` | `/up` | Laravel uptime & health check probe |

---

## ⚙️ Environment Configuration

### Database (`.env`)

#### PostgreSQL (Default):
```env
DB_CONNECTION=pgsql
DB_HOST=/var/run/postgresql    # or 127.0.0.1
DB_PORT=5432
DB_DATABASE=simple_senbet
DB_USERNAME=daniel
DB_PASSWORD=
```

#### SQLite (Alternative):
If you prefer SQLite without setting up PostgreSQL:
```env
DB_CONNECTION=sqlite
```
Create the file and migrate:
```bash
touch database/database.sqlite
php artisan migrate
```

---

## 💡 Troubleshooting & Notes

### WebSocket / HMR Connection Failed (`/_next/hmr`)
If you access the development site using `http://127.0.0.1:3000` instead of `localhost:3000`, Next.js 15+ blocks cross-origin dev resources by default. This project has already configured `allowedDevOrigins` in `frontend/next.config.ts`:
```ts
allowedDevOrigins: [
  "localhost:3000",
  "127.0.0.1:3000",
  "localhost",
  "127.0.0.1",
]
```
Both `http://localhost:3000` and `http://127.0.0.1:3000` work with hot module replacement (HMR).

### "Connection Refused" (`ERR_CONNECTION_REFUSED`)
Ensure the development servers are actively running:
- Run `npm run dev` at the root, or
- Run `php artisan serve` in one terminal and `cd frontend && npm run dev` in another.
