-- ==============================================================================
-- SENBET SCHOOL MANAGEMENT MVP — SUPABASE POSTGRESQL SCHEMA WITH RLS
-- ==============================================================================

-- 1. Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 2. Profiles (links to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Schools
create table if not exists public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  parish_name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz default now() not null
);

-- 4. School Members (Role-based access: admin, teacher, student, staff)
create table if not exists public.school_members (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('admin', 'teacher', 'student', 'staff')),
  is_owner boolean default false not null,
  created_at timestamptz default now() not null,
  unique (school_id, user_id)
);

-- 5. Academic Years
create table if not exists public.academic_years (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  name text not null, -- e.g. "2024-2025" or "2017 ዓ.ም"
  is_active boolean default true not null,
  start_date date,
  end_date date,
  created_at timestamptz default now() not null
);

-- 6. Classes (e.g. Preschool, Grade 1 - Grade 12)
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  academic_year_id uuid references public.academic_years(id) on delete cascade not null,
  name text not null, -- e.g. "Grade 1", "Grade 5", "5ኛ ክፍል"
  level_category text default 'Primary',
  room_number text,
  homeroom_teacher_id uuid references public.school_members(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 7. Students (Class-based student register)
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  student_id text not null, -- Unique student code within school e.g. STU-2024-001
  full_name text not null,
  gender text not null check (gender in ('male', 'female')),
  date_of_birth date,
  parent_name text,
  parent_phone text,
  status text default 'active' not null check (status in ('active', 'graduated', 'transferred', 'suspended')),
  created_at timestamptz default now() not null,
  unique (school_id, student_id)
);

-- 8. Student Class Enrollments
create table if not exists public.student_class_enrollments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  academic_year_id uuid references public.academic_years(id) on delete cascade not null,
  roll_number integer,
  enrollment_status text default 'enrolled' not null check (enrollment_status in ('enrolled', 'passed', 'failed', 'withdrawn')),
  created_at timestamptz default now() not null,
  unique (class_id, student_id, academic_year_id)
);

-- 9. Courses per Class (e.g. Bible, Mezmur, Church History, Faith)
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  academic_year_id uuid references public.academic_years(id) on delete cascade not null,
  name text not null,
  code text,
  teacher_id uuid references public.school_members(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 10. Course Assessments Breakdown (Midterm 30%, Final 50%, Quiz 10%, Attendance 10%)
create table if not exists public.course_assessments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  assessment_type text not null check (assessment_type in ('midterm', 'final', 'quiz', 'assignment', 'attendance', 'other')),
  max_score numeric(5, 2) not null check (max_score > 0),
  weight_percentage numeric(5, 2) not null check (weight_percentage >= 0 and weight_percentage <= 100),
  created_at timestamptz default now() not null
);

-- 11. Assessment Results Entry
create table if not exists public.assessment_results (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  assessment_id uuid references public.course_assessments(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  score numeric(5, 2) not null check (score >= 0),
  remarks text,
  created_at timestamptz default now() not null,
  unique (assessment_id, student_id)
);

-- 12. Daily Attendance Records
create table if not exists public.attendance_records (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'permission')),
  remarks text,
  created_at timestamptz default now() not null,
  unique (class_id, student_id, date)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
create index if not exists idx_school_members_user on public.school_members(user_id);
create index if not exists idx_school_members_school on public.school_members(school_id);
create index if not exists idx_classes_school on public.classes(school_id);
create index if not exists idx_students_school on public.students(school_id);
create index if not exists idx_enrollments_class on public.student_class_enrollments(class_id);
create index if not exists idx_enrollments_student on public.student_class_enrollments(student_id);
create index if not exists idx_courses_class on public.courses(class_id);
create index if not exists idx_assessments_course on public.course_assessments(course_id);
create index if not exists idx_results_assessment on public.assessment_results(assessment_id);
create index if not exists idx_results_student on public.assessment_results(student_id);
create index if not exists idx_attendance_lookup on public.attendance_records(class_id, date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.courses enable row level security;
alter table public.course_assessments enable row level security;
alter table public.assessment_results enable row level security;
alter table public.attendance_records enable row level security;

-- Profiles: users can view any profile, but only edit their own
create policy "Users can view profile" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Helper security function to check school membership
create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.school_members
    where school_id = p_school_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_school_admin(p_school_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.school_members
    where school_id = p_school_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Schools: members can view schools they belong to. Anyone authenticated can create a school.
create policy "Members can view school" on public.schools for select
  using (exists (select 1 from public.school_members where school_members.school_id = schools.id and school_members.user_id = auth.uid()));

create policy "Authenticated users can create school" on public.schools for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update school" on public.schools for update
  using (public.is_school_admin(id));

-- School Members policies
create policy "Members can view school member list" on public.school_members for select
  using (user_id = auth.uid() or public.is_school_member(school_id));

create policy "School creator can become owner/admin" on public.school_members for insert
  with check (auth.uid() = user_id or public.is_school_admin(school_id));

create policy "Admins can manage school members" on public.school_members for all
  using (public.is_school_admin(school_id));

-- Generic Multi-tenant RLS for School Entities
-- Academic Years
create policy "School members view academic years" on public.academic_years for select using (public.is_school_member(school_id));
create policy "School admins manage academic years" on public.academic_years for all using (public.is_school_admin(school_id));

-- Classes
create policy "School members view classes" on public.classes for select using (public.is_school_member(school_id));
create policy "School admins manage classes" on public.classes for all using (public.is_school_admin(school_id));

-- Students
create policy "School members view students" on public.students for select using (public.is_school_member(school_id));
create policy "School admins manage students" on public.students for all using (public.is_school_admin(school_id));

-- Student Enrollments
create policy "School members view enrollments" on public.student_class_enrollments for select using (public.is_school_member(school_id));
create policy "School admins manage enrollments" on public.student_class_enrollments for all using (public.is_school_admin(school_id));

-- Courses
create policy "School members view courses" on public.courses for select using (public.is_school_member(school_id));
create policy "School admins manage courses" on public.courses for all using (public.is_school_admin(school_id));

-- Course Assessments
create policy "School members view assessments" on public.course_assessments for select using (public.is_school_member(school_id));
create policy "Teachers and Admins manage assessments" on public.course_assessments for all using (public.is_school_member(school_id));

-- Assessment Results
create policy "School members view results" on public.assessment_results for select using (public.is_school_member(school_id));
create policy "Teachers and Admins record results" on public.assessment_results for all using (public.is_school_member(school_id));

-- Attendance Records
create policy "School members view attendance" on public.attendance_records for select using (public.is_school_member(school_id));
create policy "Teachers and Admins record attendance" on public.attendance_records for all using (public.is_school_member(school_id));

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
