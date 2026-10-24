/**
 * Role Navigation Utilities
 * Directs authenticated users to their designated Sunday School dashboard
 * according to Ethiopian Orthodox Church Sunday School departmental roles.
 */

export interface RoleDashboardMeta {
  role: string;
  label: string;
  amharicLabel: string;
  route: string;
  description: string;
}

export const ROLE_DASHBOARDS: Record<string, RoleDashboardMeta> = {
  superadmin: {
    role: "superadmin",
    label: "Super Administrator",
    amharicLabel: "ዋና አስተዳዳሪ",
    route: "/super-admin/dashboard",
    description: "Full institutional oversight, system policies, user credentials, and audits.",
  },
  academic_director: {
    role: "academic_director",
    label: "Academic Director",
    amharicLabel: "የትምህርት ክፍል ኃላፊ",
    route: "/acadamic/super-admin/dashboard",
    description: "Curriculum oversight, course syllabi, teacher assignments, and grading terms.",
  },
  finance_officer: {
    role: "finance_officer",
    label: "Finance Officer",
    amharicLabel: "የፋይናንስና ሂሳብ ኃላፊ",
    route: "/finance/super-admin/dashboard",
    description: "Parish contributions, student tuition, event dues, and financial reports.",
  },
  attendance_officer: {
    role: "attendance_officer",
    label: "Attendance Officer",
    amharicLabel: "የቁጥጥርና ክትትል ኃላፊ",
    route: "/attendance/super-admin/dashboard",
    description: "Weekly liturgy & Sunday School attendance verification and session records.",
  },
  teacher: {
    role: "teacher",
    label: "Sunday School Teacher",
    amharicLabel: "የሰንበት ት/ቤት መምህር",
    route: "/attendance/super-admin/dashboard",
    description: "Class rosters, weekly attendance recording, and student academic evaluations.",
  },
  member_coordinator: {
    role: "member_coordinator",
    label: "Member Coordinator / Registrar",
    amharicLabel: "የአባላትና ምዝገባ አስተባባሪ",
    route: "/member/super-admin/dashboard",
    description: "Sunday school roster, spiritual records, family information, and baptism records.",
  },
  student: {
    role: "student",
    label: "Sunday School Student / Member",
    amharicLabel: "የሰንበት ት/ቤት ተማሪ",
    route: "/member/super-admin/dashboard",
    description: "Student profile, course enrollments, grade cards, and attendance record.",
  },
};

export function getDashboardRouteForRole(role?: string | null): string {
  if (!role) return "/super-admin/dashboard";

  const normalized = role.toLowerCase().trim();

  // Superadmin / Admin
  if (
    normalized === "superadmin" ||
    normalized === "super_admin" ||
    normalized === "admin" ||
    normalized === "super admin"
  ) {
    return "/super-admin/dashboard";
  }

  // Academic Director / Academic Admin
  if (
    normalized === "academic_director" ||
    normalized === "academic_administrator" ||
    normalized.includes("academic")
  ) {
    return "/acadamic/super-admin/dashboard";
  }

  // Finance Officer / Admin
  if (
    normalized === "finance_officer" ||
    normalized === "finance_administrator" ||
    normalized.includes("finance")
  ) {
    return "/finance/super-admin/dashboard";
  }

  // Attendance Officer / Teacher
  if (
    normalized === "attendance_officer" ||
    normalized === "teacher" ||
    normalized.includes("attendance") ||
    normalized.includes("teacher")
  ) {
    return "/attendance/super-admin/dashboard";
  }

  // Member Coordinator / Registrar
  if (
    normalized === "member_coordinator" ||
    normalized === "registrar" ||
    normalized.includes("member") ||
    normalized.includes("registra")
  ) {
    return "/member/super-admin/dashboard";
  }

  // Student / General Member
  if (normalized === "student") {
    return "/member/super-admin/dashboard";
  }

  return "/super-admin/dashboard";
}
