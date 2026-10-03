# Senbet School Management MVP — Implementation Plan

## 1. Project Overview & Business Concepts

The Senbet School Management MVP is a full-stack, single-tenant/multi-tenant capable Sunday School (ሰንበት ትምህርት ቤት) management platform. Built to streamline spiritual and academic education tracking, it preserves core business models identified in the prototype:

* **School / Parish Identity**: Sunday schools operating under a parish or diocese with specific academic terms and administrative ownership.
* **Levels & Grades**: Early childhood (ቅድመ መደበኛ) through Grade 12 (12ኛ ክፍል), plus special fellowship groups.
* **Senbet Curriculum**: Typical subjects including Bible Study (መጽሐፍ ቅዱስ), Church History (ታሪክ), Hymnody/Mezmur (ዝማሬ/ዜማ), Faith/Dogma (ሃይማኖትና ሥርዓት), Christian Ethics (ሥነ-ምግባር), and Language (ግዕዝ/አማርኛ).
* **Class-Based Student Registry**: Students enrolled per class and academic year, tracked with unique Student IDs, guardian contact, date of birth, and status (Active, In Progress, Passed, Failed).
* **Assessment Breakdown**: Flexible course evaluation schemes (Midterm, Final, Quiz, Assignments, Attendance) totaling 100% or weighted max marks.
* **Daily Attendance Registry**: Fast daily roll-call (Present, Absent, Late, Permission).
* **Deterministic Class Roster & Ranking**: Automated computation of totals, averages, and standard ranking for all students in a class.

---

## 2. Technology Stack

* **Framework**: Next.js (App Router, Full-stack with Server Actions & Route Handlers)
* **Language**: TypeScript (strict mode)
* **UI & Styling**: React 19/18, Tailwind CSS, shadcn/ui design system with Radix UI primitives & Lucide icons
* **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
* **Dual-Mode Persistence**: Robust Supabase integration with automatic fallback to local storage/in-memory simulated mock mode when environment variables are not yet configured, allowing instant out-of-the-box evaluation without blocking.
* **DevOps**: Dockerfile (multi-stage production build) & docker-compose.yml
* **Quality**: ESLint, Prettier, strict TypeScript

---

## 3. Database Schema (Supabase PostgreSQL + RLS)

```
schools
  ├── id (UUID, PK)
  ├── name (TEXT)
  ├── code (TEXT, UNIQUE)
  ├── parish_name (TEXT)
  ├── address, phone, email (TEXT)
  └── created_at (TIMESTAMPTZ)

profiles
  ├── id (UUID, PK, references auth.users)
  ├── full_name (TEXT)
  ├── phone (TEXT)
  ├── avatar_url (TEXT)
  └── created_at (TIMESTAMPTZ)

school_members
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── user_id (FK -> profiles)
  ├── role ('admin' | 'teacher' | 'student' | 'staff')
  └── is_owner (BOOLEAN)

academic_years
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── name (TEXT, e.g. "2024-2025" or "2016-2017 ዓ.ም")
  ├── is_active (BOOLEAN)
  └── start_date, end_date (DATE)

classes
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── academic_year_id (FK -> academic_years)
  ├── name (TEXT, e.g. "Grade 5", "5ኛ ክፍል")
  ├── level_category (TEXT)
  ├── room_number (TEXT)
  └── homeroom_teacher_id (FK -> profiles / school_members)

students
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── student_id (TEXT, UNIQUE within school)
  ├── full_name (TEXT)
  ├── gender ('male' | 'female')
  ├── date_of_birth (DATE)
  ├── parent_name (TEXT)
  ├── parent_phone (TEXT)
  ├── status ('active' | 'graduated' | 'transferred' | 'suspended')
  └── created_at (TIMESTAMPTZ)

student_class_enrollments
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── class_id (FK -> classes)
  ├── student_id (FK -> students)
  ├── academic_year_id (FK -> academic_years)
  ├── roll_number (INT)
  └── enrollment_status ('enrolled' | 'passed' | 'failed' | 'withdrawn')

courses
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── class_id (FK -> classes)
  ├── academic_year_id (FK -> academic_years)
  ├── name (TEXT, e.g. "Bible Study")
  ├── code (TEXT, e.g. "BIB-101")
  └── teacher_id (FK -> school_members)

course_assessments
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── course_id (FK -> courses)
  ├── name (TEXT, e.g. "Midterm Exam")
  ├── max_score (NUMERIC, e.g. 30.0)
  ├── weight_percentage (NUMERIC, e.g. 30.0)
  └── assessment_type ('midterm' | 'final' | 'quiz' | 'assignment' | 'attendance' | 'other')

assessment_results
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── assessment_id (FK -> course_assessments)
  ├── student_id (FK -> students)
  ├── score (NUMERIC)
  └── remarks (TEXT)

attendance_records
  ├── id (UUID, PK)
  ├── school_id (FK -> schools)
  ├── class_id (FK -> classes)
  ├── student_id (FK -> students)
  ├── date (DATE)
  ├── status ('present' | 'absent' | 'late' | 'permission')
  └── remarks (TEXT)
```

---

## 4. MVP Implementation Phases

* **Phase 1: Project Setup & Core Plumbing**
  - Scaffold Next.js TypeScript app with Tailwind CSS, Lucide icons, shadcn component library.
  - Setup ESLint, Prettier, environment configuration (`.env.example`).
  - Configure Supabase client (`client.ts`, `server.ts`, `middleware.ts`) and database schema SQL migration scripts (`supabase/schema.sql`).
  - Implement full mock/demo fallback provider for instant testing when Supabase credentials are empty or offline.

* **Phase 2: Authentication & School Setup**
  - Register with email and password, verification handling.
  - Create Senbet School flow (School Name, Parish, Academic Year).
  - Assign Owner/Admin role and redirect to Dashboard.
  - Simple role-based guard for navigation.

* **Phase 3: Class Management & Academic Years**
  - Create and manage Classes (e.g. Preschool, Grades 1-12).
  - Associate class with Academic Year and assigned Teacher.
  - Class details view with navigation to Students, Courses, Attendance, and Roster.

* **Phase 4: Student Registration & Class Enrollment**
  - Register student with Student ID, Full Name, Gender, Date of Birth, Guardian contact, Status.
  - Filter and view students by Class.
  - Edit student details, search students by name or ID.
  - Move student between classes.

* **Phase 5: Courses per Class**
  - Create and edit subjects/courses assigned to specific class (Bible, Mezmur, Church History, Faith, etc.).
  - Assign teacher to course.
  - View enrolled students.

* **Phase 6: Assessment Breakdown**
  - Define course assessment components (e.g. Midterm 30%, Final 50%, Quiz 10%, Attendance 10%).
  - Real-time validation ensuring total equals 100% or valid max score.
  - Add/Edit/Remove assessment items.

* **Phase 7: Assessment Results Entry**
  - Fast matrix / table view for entering student results per assessment.
  - Automatic calculation of assessment total, course total, percentage, and pass/fail.

* **Phase 8: Daily Attendance Roll-Call**
  - Select class and date (defaulting to today).
  - Fast bulk marking: Present, Absent, Late, Permission.
  - One-click "Mark All Present", quick individual toggle, instant save and edit.

* **Phase 9: Class Roster & Deterministic Ranking**
  - Unified Class Roster table: Student, Student ID, Attendance stats, Course scores, Total, Average %, Rank, Status.
  - Deterministic ranking algorithm with correct tie handling (Standard Competition Ranking / 1224).
  - Printable / Export-ready layout.

* **Phase 10: Dashboard, Polish & Dockerization**
  - Dashboard stats: Total students, classes, courses, today's attendance summary, recent results, performance overview.
  - Navigation sidebar and top bar with school switcher, breadcrumbs, user profile.
  - Dockerfile and docker-compose.yml for local and containerized production deployment.
  - End-to-end verification and testing.
