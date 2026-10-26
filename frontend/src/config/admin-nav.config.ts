import {
  ArrowRightLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
  School,
  Users,
} from "lucide-react";

export interface AdminNavLink {
  label: string;
  translationKey: string;
  href: string;
  icon: LucideIcon;
  permissions: string[];
}

export interface AdminNavGroup {
  id: "membership" | "academics" | "finance" | "administration";
  translationKey: string;
  links: AdminNavLink[];
}

export const ADMIN_NAV_HOME_KEY = "dashboard.nav.dashboard";

// Only ONE dashboard option and unified UI
export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  {
    label: "Dashboard",
    translationKey: ADMIN_NAV_HOME_KEY,
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: [
      "users.view",
      "members.view",
      "school-classes.view",
      "courses.view",
      "attendance.view",
      "payments.view",
      "reports.view",
      "assessments.view",
    ],
  },
];

// Grouped semantic navigation options in exact operational sequence:
// Registration -> Enrollment -> Attendance -> Assessment -> Results -> Teaching Assignments -> Courses -> Classes -> Academic Years -> Promotions -> Finance -> Administration
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "membership",
    translationKey: "dashboard.groups.membership",
    links: [
      {
        label: "Member Registration",
        translationKey: "dashboard.nav.members",
        href: "/members/dashboard",
        icon: Users,
        permissions: ["members.view"],
      },
      {
        label: "Enrollments",
        translationKey: "dashboard.nav.enrollments",
        href: "/academics/enrollments",
        icon: GraduationCap,
        permissions: ["student-enrollments.view"],
      },
    ],
  },
  {
    id: "academics",
    translationKey: "dashboard.groups.academics",
    links: [
      {
        label: "Attendance",
        translationKey: "dashboard.nav.attendance",
        href: "/attendance/dashboard",
        icon: CalendarCheck,
        permissions: ["attendance.view"],
      },
      {
        label: "Assessments",
        translationKey: "dashboard.nav.assessments",
        href: "/academics/assessments",
        icon: ClipboardList,
        permissions: ["assessments.view"],
      },
      {
        label: "Assessment Results",
        translationKey: "dashboard.nav.results",
        href: "/academics/assessment-results",
        icon: Award,
        permissions: ["assessment-results.view"],
      },
      {
        label: "Teaching Assignments",
        translationKey: "dashboard.nav.assignments",
        href: "/academics/teaching-assignments",
        icon: Briefcase,
        permissions: ["teaching-assignments.view"],
      },
      {
        label: "Courses",
        translationKey: "dashboard.nav.courses",
        href: "/academics/courses",
        icon: BookOpen,
        permissions: ["courses.view"],
      },
      {
        label: "Classes",
        translationKey: "dashboard.nav.classes",
        href: "/academics/school-classes",
        icon: School,
        permissions: ["school-classes.view"],
      },
      {
        label: "Academic Years",
        translationKey: "dashboard.nav.academicYears",
        href: "/academics/academic-years",
        icon: Calendar,
        permissions: ["academic-years.view"],
      },
      {
        label: "Student Promotions",
        translationKey: "dashboard.nav.promotions",
        href: "/academics/promotions",
        icon: ArrowRightLeft,
        permissions: ["promotions.manage"],
      },
    ],
  },
  {
    id: "finance",
    translationKey: "dashboard.groups.finance",
    links: [
      {
        label: "Payments",
        translationKey: "dashboard.nav.payments",
        href: "/finance/dashboard",
        icon: CreditCard,
        permissions: ["payments.view", "payments.view.all"],
      },
    ],
  },
  {
    id: "administration",
    translationKey: "dashboard.groups.administration",
    links: [
      {
        label: "Users",
        translationKey: "dashboard.nav.users",
        href: "/administration/users",
        icon: Users,
        permissions: ["users.view"],
      },
      {
        label: "Roles & Permissions",
        translationKey: "dashboard.nav.accessControl",
        href: "/administration/access",
        icon: KeyRound,
        permissions: ["roles.view", "permissions.view"],
      },
    ],
  },
];

export const ADMIN_ROUTE_PERMISSIONS: Array<{ prefix: string; permissions: string[] }> = [
  { prefix: "/academics/academic-years", permissions: ["academic-years.view"] },
  { prefix: "/academics/school-classes", permissions: ["school-classes.view"] },
  { prefix: "/academics/courses", permissions: ["courses.view"] },
  { prefix: "/academics/teaching-assignments", permissions: ["teaching-assignments.view"] },
  { prefix: "/academics/enrollments", permissions: ["student-enrollments.view"] },
  { prefix: "/academics/assessments", permissions: ["assessments.view"] },
  { prefix: "/academics/assessment-results", permissions: ["assessment-results.view"] },
  { prefix: "/academics/promotions", permissions: ["promotions.manage"] },
  { prefix: "/dashboard", permissions: ["users.view", "members.view", "school-classes.view", "courses.view", "attendance.view", "payments.view", "reports.view", "assessments.view"] },
  { prefix: "/academics/dashboard", permissions: ["academic-years.view", "school-classes.view", "courses.view", "teaching-assignments.view", "student-enrollments.view", "assessments.view", "assessment-results.view", "reports.view", "promotions.manage"] },
  { prefix: "/attendance/dashboard", permissions: ["attendance.view"] },
  { prefix: "/finance/dashboard", permissions: ["payments.view", "payments.view.all"] },
  { prefix: "/members/dashboard", permissions: ["members.view"] },
  { prefix: "/administration/users", permissions: ["users.view"] },
  { prefix: "/administration/access", permissions: ["roles.view", "permissions.view"] },
];
