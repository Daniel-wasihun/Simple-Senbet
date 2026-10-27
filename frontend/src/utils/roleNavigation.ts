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
    route: "/dashboard",
    description: "Full institutional oversight, system policies, user credentials, and audits.",
  },
  academic_director: {
    role: "academic_director",
    label: "Academic Director",
    amharicLabel: "የትምህርት ክፍል ኃላፊ",
    route: "/academics",
    description: "Curriculum oversight, course syllabi, teacher assignments, and grading terms.",
  },
  finance_officer: {
    role: "finance_officer",
    label: "Finance Officer",
    amharicLabel: "የፋይናንስና ሂሳብ ኃላፊ",
    route: "/finance",
    description: "Parish contributions, student tuition, event dues, and financial reports.",
  },
  attendance_officer: {
    role: "attendance_officer",
    label: "Attendance Officer",
    amharicLabel: "የቁጥጥርና ክትትል ኃላፊ",
    route: "/attendance",
    description: "Weekly liturgy & Sunday School attendance verification and session records.",
  },
  teacher: {
    role: "teacher",
    label: "Sunday School Teacher",
    amharicLabel: "የሰንበት ት/ቤት መምህር",
    route: "/attendance",
    description: "Class rosters, weekly attendance recording, and student academic evaluations.",
  },
  member_coordinator: {
    role: "member_coordinator",
    label: "Member Coordinator / Registrar",
    amharicLabel: "የአባላትና ምዝገባ አስተባባሪ",
    route: "/members",
    description: "Sunday school roster, spiritual records, family information, and baptism records.",
  },
  student: {
    role: "student",
    label: "Sunday School Student / Member",
    amharicLabel: "የሰንበት ት/ቤት ተማሪ",
    route: "/members",
    description: "Student profile, course enrollments, grade cards, and attendance record.",
  },
};

export function getDashboardRouteForRole(role?: string | null, permissions?: string[]): string {
  const normalized = role?.toLowerCase().trim();
  if (permissions?.length) {
    if (permissions.includes("payments.view") && !permissions.includes("attendance.view") && !permissions.some((p) => ["academic-years.view", "school-classes.create", "courses.create", "assessments.create"].includes(p))) {
      return "/finance";
    }
    if (permissions.includes("attendance.view") && !permissions.includes("school-classes.create") && !permissions.includes("courses.create")) {
      return "/attendance";
    }
    if (permissions.includes("members.view") && !permissions.includes("school-classes.create") && !permissions.includes("attendance.view")) {
      return "/members";
    }
    if (normalized === "student" && permissions.includes("courses.view")) {
      return "/academics";
    }
    if (permissions.some((p) => ["academic-years.view", "school-classes.create", "courses.create", "assessments.create"].includes(p))) {
      return "/academics";
    }
  }
  if (!role) return "/dashboard";

  const resolvedRole = normalized ?? "";

  if (resolvedRole === "superadmin" || resolvedRole === "super_admin" || resolvedRole === "admin" || resolvedRole === "super admin") {
    return "/dashboard";
  }
  if (resolvedRole === "academic_director" || resolvedRole === "academic_administrator" || resolvedRole.includes("academic")) {
    return "/academics";
  }
  if (resolvedRole === "finance_officer" || resolvedRole === "finance_administrator" || resolvedRole.includes("finance")) {
    return "/finance";
  }
  if (resolvedRole === "attendance_officer" || resolvedRole === "teacher" || resolvedRole.includes("attendance") || resolvedRole.includes("teacher")) {
    return "/attendance";
  }
  if (resolvedRole === "member_coordinator" || resolvedRole === "registrar" || resolvedRole.includes("member") || resolvedRole.includes("registra")) {
    return "/members";
  }
  if (resolvedRole === "student") {
    return "/academics";
  }

  return "/dashboard";
}
