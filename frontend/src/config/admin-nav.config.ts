import {
  ArrowRightLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
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
  id: "academics" | "finance" | "administration";
  translationKey: string;
  links: AdminNavLink[];
}

export const ADMIN_NAV_HOME_KEY = "dashboard.nav.dashboard";

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  {
    label: "Dashboard",
    translationKey: ADMIN_NAV_HOME_KEY,
    href: "/dashboard",
    icon: LayoutDashboard,
    permissions: ["users.view", "members.view", "school-classes.view", "courses.view", "attendance.view", "payments.view", "reports.view", "assessments.view"],
  },
  {
    label: "Members",
    translationKey: "dashboard.nav.members",
    href: "/members/dashboard",
    icon: Users,
    permissions: ["members.view"],
  },
];

// Menu visibility follows the Laravel permission keys. A grouped menu only
// renders when at least one of its child links is available to the user.
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "academics",
    translationKey: "dashboard.groups.academics",
    links: [
      { label: "Academic Director", translationKey: "dashboard.nav.academics", href: "/academics/dashboard", icon: GraduationCap, permissions: ["academic-years.view", "school-classes.view", "courses.view", "teaching-assignments.view", "student-enrollments.view", "assessments.view", "assessment-results.view", "reports.view", "promotions.manage"] },
      { label: "Attendance", translationKey: "dashboard.nav.attendance", href: "/attendance/dashboard", icon: CalendarCheck, permissions: ["attendance.view"] },
      { label: "Academic years", translationKey: "dashboard.nav.academicYears", href: "/academics/academic-years", icon: GraduationCap, permissions: ["academic-years.view"] },
      { label: "Classes", translationKey: "dashboard.nav.classes", href: "/academics/school-classes", icon: BookOpen, permissions: ["school-classes.view"] },
      { label: "Courses", translationKey: "dashboard.nav.courses", href: "/academics/courses", icon: BookOpen, permissions: ["courses.view"] },
      { label: "Teaching assignments", translationKey: "dashboard.nav.assignments", href: "/academics/teaching-assignments", icon: ClipboardList, permissions: ["teaching-assignments.view"] },
      { label: "Enrollments", translationKey: "dashboard.nav.enrollments", href: "/academics/enrollments", icon: Users, permissions: ["student-enrollments.view"] },
      { label: "Assessments", translationKey: "dashboard.nav.assessments", href: "/academics/assessments", icon: ClipboardList, permissions: ["assessments.view"] },
      { label: "Assessment results", translationKey: "dashboard.nav.results", href: "/academics/assessment-results", icon: ClipboardList, permissions: ["assessment-results.view"] },
      { label: "Student promotions", translationKey: "dashboard.nav.promotions", href: "/academics/promotions", icon: ArrowRightLeft, permissions: ["promotions.manage"] },
    ],
  },
  {
    id: "finance",
    translationKey: "dashboard.groups.finance",
    links: [
      { label: "Payments", translationKey: "dashboard.nav.payments", href: "/finance/dashboard", icon: CreditCard, permissions: ["payments.view", "payments.view.all"] },
    ],
  },
  {
    id: "administration",
    translationKey: "dashboard.groups.administration",
    links: [
      { label: "Users", translationKey: "dashboard.nav.users", href: "/administration/users", icon: Users, permissions: ["users.view"] },
      { label: "Roles & permissions", translationKey: "dashboard.nav.accessControl", href: "/administration/access", icon: KeyRound, permissions: ["roles.view", "permissions.view"] },
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
