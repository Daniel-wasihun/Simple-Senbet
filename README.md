# ✝ Senbet School Management MVP (የሰንበት ትምህርት ቤት መረጃ አስተዳደር)

A modern, fast, production-ready full-stack Sunday School (ሰንበት ትምህርት ቤት) management platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase PostgreSQL with Row Level Security (RLS)**, and **Docker**.

---

## 🎯 The Core MVP Workflow

This application executes the priority Sunday school workflow end-to-end:

$$\text{School Setup} \longrightarrow \text{Classes} \longrightarrow \text{Students} \longrightarrow \text{Courses} \longrightarrow \text{Assessment Breakdown} \longrightarrow \text{Daily Attendance} \longrightarrow \text{Results} \longrightarrow \text{Sum \& Average} \longrightarrow \text{Deterministic Rank} \longrightarrow \text{Class Roster}$$

### 1. User Registration & School Setup
* Register with email and password.
* Verification flow & role assignment as **School Owner / Admin**.
* Create a Senbet School with name, parish church name, code, contact, and academic year.
* Instant redirection into the school management dashboard.

### 2. Simple Role-Based Access
* Predefined roles: **Owner/Admin**, **Teacher**, **Student**, **Staff**.
* Integrated role switcher in the top navigation bar to test views and capabilities instantly.

### 3. Class Management
* Grade levels: Preschool (ቅድመ መደበኛ), Grades 1 through 12 (1ኛ - 12ኛ ክፍል), plus special fellowship groups.
* Tracks: Class Name, Level Category, Room Number, Homeroom Teacher, Student Count, and Course Count.
* Class details view with sub-tabs for enrolled students and assigned courses.

### 4. Class-Based Student Registry
* Student fields: Student ID (e.g. `STU-2024-001`), Full Name (የተማሪው ሙሉ ስም), Gender, Date of Birth, Guardian / Parent Name & Phone, Class, and Status.
* Class filter, real-time search, add student, edit student, delete student, and one-click transfer to another class.

### 5. Courses per Class
* Assign subjects per class (e.g. *መጽሐፍ ቅዱስ ጥናት / Bible Study*, *ዝማሬና ዜማ / Mezmur*, *የቤተክርስቲያን ታሪክ / Church History*, *ሥርዓተ ቤተክርስቲያንና ሃይማኖት / Faith & Dogma*).
* Link courses to class, assign teachers, and track evaluation completeness.

### 6. Assessment Breakdown Configuration
* Define course evaluation components (Midterm, Final Exam, Quiz 1, Quiz 2, Assignment, Attendance & Participation, Practical).
* Real-time validation ensuring percentage components total **100%** (or custom max scores).
* One-click presets: Standard (30% Mid / 50% Final / 10% Quiz / 10% Att), Simple (40% Mid / 60% Final), 4 Terms (25% each).

### 7. Results Entry & Automated Calculations
* Spreadsheet-like grade entry table per class, course, and assessment component.
* Instant clamping to maximum scores (e.g. 0 to 30).
* Automatic calculation of student score, percentage %, and Pass/Fail (አልፏል / ወድቋል) status.

### 8. Daily Attendance Roll-Call
* Daily class attendance with fast statuses: **Present (ተገኝቷል)**, **Absent (ቀረ)**, **Late (አርፍዷል)**, and **Permission (በፈቃድ)**.
* One-click **"Mark All Present"** for rapid daily roll-call.
* Date picker with default to today's date and real-time attendance rate calculation.

### 9. Class Roster & Deterministic Ranking
* Unified performance roster showing Student ID, Student Name, Attendance Rate %, individual course marks, Total Score, Average %, Rank, and Status.
* **Deterministic Ranking Algorithm**: Standard Competition Ranking (1224) where ties share identical rank and next rank skips accordingly.
* Medal badges for Top 3 (🥇 1st place, 🥈 2nd place, 🥉 3rd place).
* Print-ready formatting for report cards and class lists via `window.print()`.

### 10. Executive Dashboard
* Real-time KPIs: Total Students, Active Classes, Courses & Subjects, Today's Attendance Rate.
* Today's attendance summary (Present, Absent, Late, Permission breakdown and progress bar).
* Class Performance Summary Table linking directly to rosters and attendance.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Full-Stack) |
| **Language** | TypeScript (Strict mode) |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide Icons, shadcn/ui pattern |
| **Database** | Supabase PostgreSQL + Row Level Security (RLS) |
| **Authentication** | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) |
| **Containerization** | Docker (Multi-stage Alpine runner), Docker Compose |
| **Code Quality** | ESLint 9 + Prettier |

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app starts immediately pre-seeded with realistic Debre Mewi St. George Sunday School sample data for instant testing.

---

## 🐳 Running with Docker

Run the production multi-stage container locally:

```bash
docker compose up --build
```

The containerized app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Supabase PostgreSQL Setup & Migrations

The database schema and sample seed data are located in `/supabase`:

1. **`supabase/schema.sql`**: Full PostgreSQL schema with tables, foreign keys, indexes, triggers, and Row Level Security (RLS) policies isolating school tenants.
2. **`supabase/seed.sql`**: Sample data containing a Sunday School, Grade 1, 5, and 8 classes, enrolled students, subjects (Bible, Mezmur, History, Faith), assessments, attendance records, and grades.

### Connecting Your Supabase Project

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run the SQL script from `supabase/schema.sql` in your **Supabase SQL Editor**.
4. (Optional) Run `supabase/seed.sql` to populate sample data.

---

## 🧪 Available Scripts

* `npm run dev`: Start Next.js development server
* `npm run build`: Compile production build with standalone output
* `npm run start`: Start production server
* `npm run lint`: Run ESLint checks
* `npm run format`: Format codebase with Prettier
* `npm run format:check`: Check code formatting with Prettier

---

## 📁 Project Structure

```
├── Dockerfile                  # Production multi-stage Docker build
├── docker-compose.yml          # Container orchestration configuration
├── project-plan.md             # MVP implementation plan and architecture
├── supabase/
│   ├── schema.sql              # Supabase PostgreSQL schema with RLS & indexes
│   └── seed.sql                # Realistic Sunday School sample dataset
├── src/
│   ├── app/
│   │   ├── page.tsx            # Modern Landing page
│   │   ├── login/              # Account login with quick demo fill
│   │   ├── register/           # Registration with email verification flow
│   │   ├── create-school/      # Senbet School setup flow (become Admin/Owner)
│   │   ├── dashboard/          # Performance KPIs & class overview
│   │   ├── classes/            # Class management & Class details ([id])
│   │   ├── students/           # Class-based student register & search
│   │   ├── courses/            # Courses per class & Assessment Breakdown
│   │   ├── attendance/         # Daily roll-call (Present/Absent/Late/Permission)
│   │   ├── results/            # Results entry & auto calculations
│   │   ├── roster/             # Class roster & deterministic ranking
│   │   └── settings/           # Academic terms, role switcher, demo reset
│   ├── components/
│   │   ├── layout/             # AppLayout, Navbar, Sidebar
│   │   └── ui/                 # Reusable Button, Card, Badge, Table, Dialog, etc.
│   ├── context/
│   │   └── senbet-context.tsx  # Central store, persistence, CRUD, & ranking engine
│   ├── lib/
│   │   ├── mock-data.ts        # Pre-seeded Sunday School dataset
│   │   ├── supabase/           # Browser & server Supabase client utilities
│   │   └── utils.ts            # Formatting, cn, and ranking helpers
│   └── types/
│       └── index.ts            # Strict domain TypeScript interfaces
```

---

## 📜 License & Acknowledgments

Built for Orthodox Sunday Schools (ሰንበት ትምህርት ቤቶች) worldwide to facilitate spiritual learning, student progression, and diligent record-keeping.
