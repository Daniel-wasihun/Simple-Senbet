export type UserRole = "admin" | "teacher" | "student" | "staff";

export type AttendanceStatus = "present" | "absent" | "late" | "permission";

export type StudentStatus = "active" | "graduated" | "transferred" | "suspended";

export type EnrollmentStatus = "enrolled" | "passed" | "failed" | "withdrawn";

export type AssessmentType = "midterm" | "final" | "quiz" | "assignment" | "attendance" | "other";

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  parish_name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface SchoolMember {
  id: string;
  school_id: string;
  user_id: string;
  role: UserRole;
  is_owner: boolean;
  created_at: string;
  profile?: Profile;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string; // e.g. "2024-2025" or "2017 ዓ.ም"
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface ClassModel {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string; // e.g. "Grade 1", "Grade 5", "5ኛ ክፍል"
  level_category?: string; // e.g. "Childhood", "Youth", "Adult"
  room_number?: string;
  homeroom_teacher_id?: string;
  created_at: string;
  // Computed / Joined
  homeroom_teacher_name?: string;
  student_count?: number;
  course_count?: number;
}

export interface Student {
  id: string;
  school_id: string;
  student_id: string; // unique code e.g. "STU-001"
  full_name: string;
  gender: "male" | "female";
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  status: StudentStatus;
  created_at: string;
  // Current Enrollment helper
  current_class_id?: string;
  current_class_name?: string;
  current_enrollment_id?: string;
}

export interface StudentEnrollment {
  id: string;
  school_id: string;
  class_id: string;
  student_id: string;
  academic_year_id: string;
  roll_number?: number;
  enrollment_status: EnrollmentStatus;
  created_at: string;
  student?: Student;
}

export interface Course {
  id: string;
  school_id: string;
  class_id: string;
  academic_year_id: string;
  name: string; // e.g. "Bible Study", "Mezmur", "Church History", "Faith"
  code?: string;
  teacher_id?: string;
  created_at: string;
  // Joined
  teacher_name?: string;
  assessments_count?: number;
}

export interface CourseAssessment {
  id: string;
  school_id: string;
  course_id: string;
  name: string; // e.g. "Midterm", "Final Exam", "Assignment", "Attendance"
  assessment_type: AssessmentType;
  max_score: number; // e.g. 30, 50, 10
  weight_percentage: number; // e.g. 30%, 50%, 10%
  created_at: string;
}

export interface AssessmentResult {
  id: string;
  school_id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  remarks?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  class_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  created_at: string;
}

export interface ClassRosterEntry {
  student: Student;
  enrollment: StudentEnrollment;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    permission: number;
    attendanceRate: number; // percentage 0-100
  };
  courseScores: Record<
    string,
    {
      courseId: string;
      courseName: string;
      obtainedScore: number;
      maxPossibleScore: number;
      percentage: number;
      assessmentBreakdown: Record<string, number>; // assessmentId -> score
    }
  >;
  totalObtainedScore: number;
  totalMaxScore: number;
  overallAverage: number; // 0-100%
  rank: number;
  status: "Passed" | "Failed" | "In Progress";
}

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalCourses: number;
  todayAttendance: {
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    permission: number;
    rate: number;
  };
  recentResultsCount: number;
  classSummary: Array<{
    classId: string;
    className: string;
    studentCount: number;
    averageScore: number;
    attendanceRate: number;
  }>;
}
