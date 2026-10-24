export interface TeachingAssignmentSummary {
  id: number;
  class_id: number;
  class_name?: string | null;
  class_code?: string | null;
  section: string;
  course_id: number;
  course_name?: string | null;
  course_code?: string | null;
  academic_year_id: number;
  academic_year_name?: string | null;
  semester: string;
  is_primary: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'teacher' | 'student' | 'academic_director' | string;
  created_at: string;
  teaching_assignments?: TeachingAssignmentSummary[];
}

export interface AttendanceSessionSummary {
  id: number;
  academic_year_id: number;
  term_id: number;
  class_id: number;
  course_id: number | null;
  date: string;
  time_slot: string;
  status: 'draft' | 'submitted' | 'closed';
  submitted_by?: number | null;
  submitted_at?: string | null;
  closed_at?: string | null;
  is_draft: boolean;
  is_closed: boolean;
  is_teacher_editable: boolean;
  school_class?: {
    id: number;
    name: string;
    code: string;
  };
  course?: {
    id: number;
    name: string;
    code: string;
  } | null;
  academic_year?: {
    id: number;
    name: string;
  };
}

export interface SchoolClassSummary {
  id: number;
  name: string;
  code: string;
  number_of_sections?: number;
  passing_score?: number;
}

export interface CourseSummary {
  id: number;
  name: string;
  code: string;
  class_id?: number;
  is_active?: boolean;
}

export type AttendanceMark = 'present' | 'absent' | 'late' | 'excused';

export interface RosterStudent {
  id: number;
  name?: string;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  section?: string | null;
}

export interface SessionRosterResponse {
  session_id: number;
  class_id: number;
  course_id: number | null;
  date: string;
  section: string | null;
  total_students: number;
  students: RosterStudent[];
}

export interface SessionStudentRecordItem {
  id?: number;
  attendance_session_id?: number;
  student_id: number;
  mark: AttendanceMark;
  remarks?: string | null;
  marked_by?: number;
  marked_at?: string;
  student?: {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    gender?: string;
    phone_number?: string;
  };
}

export interface AttendanceDetailSession extends AttendanceSessionSummary {
  student_records?: SessionStudentRecordItem[];
  teacher_records?: Array<{
    id?: number;
    teacher_id: number;
    mark: AttendanceMark;
    remarks?: string | null;
    teacher?: { id: number; name: string; email: string };
  }>;
}

export interface AttendanceSummaryData {
  date: string;
  class_id: number | null;
  total_sessions: number;
  submitted_sessions: number;
  counts: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  };
  attendance_rate: number;
  absentees: Array<{
    student_id: number;
    student_name: string;
    class_id: number;
    class_name: string;
    course_id: number | null;
    course_title: string;
    session_id: number;
    remarks: string | null;
  }>;
}

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface AssessmentBreakdown {
  assessment_id: number;
  name: string | { en?: string; am?: string };
  total_score: number;
  weight_percentage: number;
  earned_score: number | null;
  earned_percentage: number;
  is_missing: boolean;
  remarks?: string | { en?: string; am?: string } | null;
}

export interface CourseGradeResult {
  course_id: number;
  course_name: string | { en?: string; am?: string };
  course_code: string;
  credit_hour: number;
  percentage: number;
  passing_score: number;
  is_passed: boolean;
  is_incomplete: boolean;
  missing_assessments_count: number;
  assessments: AssessmentBreakdown[];
}

export interface StudentReportCardData {
  student: {
    id: number;
    full_name: string | { en?: string; am?: string };
    christian_name?: string | { en?: string; am?: string } | null;
    gender: string;
  };
  academic_year: {
    id: number;
    name: string | { en?: string; am?: string };
  };
  class: {
    id: number;
    name: string | { en?: string; am?: string };
    code: string;
    passing_score: number;
  };
  section: string;
  semester: string;
  courses: CourseGradeResult[];
  summary: {
    total_courses: number;
    total_credits: number;
    total_marks_earned: number;
    total_marks_possible: number;
    overall_average: number;
    passing_score: number;
    failed_courses_count: number;
    status: 'PASS' | 'FAIL' | 'INCOMPLETE';
    is_passed: boolean | null;
    is_incomplete: boolean;
    section_rank: number | null;
    class_rank: number | null;
  };
  attendance: {
    total_sessions: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;
    score_adjustment: number;
  };
}

export interface ClassGradebookData {
  class: {
    id: number;
    name: string | { en?: string; am?: string };
    code: string;
    passing_score: number;
  };
  academic_year_id: number;
  semester: string;
  section: string | null;
  total_students: number;
  students: StudentReportCardData[];
}

export interface MonthlyPaymentRuleData {
  id: number;
  name: string | { en?: string; am?: string };
  amount: number;
  minimum_age: number | null;
  minimum_class_id: number | null;
  target_class_id: number | null;
  effective_from: string;
  effective_to: string | null;
  carry_forward_credit: boolean;
  is_active: boolean;
  minimum_class?: { id: number; name: string | { en?: string; am?: string }; code: string } | null;
  target_class?: { id: number; name: string | { en?: string; am?: string }; code: string } | null;
}

export interface PaymentAuditLogData {
  id: number;
  action: string;
  reason: string;
  performed_by: number;
  performer?: { id: number; name: string };
  created_at: string;
}

export interface MemberPaymentRecord {
  id: number;
  member_id: number;
  payment_rule_id: number | null;
  billing_month: string;
  amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY' | 'OTHER';
  payment_reference: string | null;
  receipt_number: string;
  is_void: boolean;
  void_reason: string | null;
  voided_at: string | null;
  paid_at: string;
  notes: string | null;
  rule?: MonthlyPaymentRuleData | null;
  recorded_by_user?: { id: number; name: string } | null;
  voided_by_user?: { id: number; name: string } | null;
  audit_logs?: PaymentAuditLogData[];
}

export interface MemberMonthlyStatus {
  member_id: number;
  member_code: string;
  full_name: string;
  christian_name?: string | null;
  phone_number?: string | null;
  class_id?: number | null;
  class_name?: string | null;
  age?: number | null;
  expected_amount: number;
  paid_amount: number;
  remaining_balance: number;
  overpaid_amount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERPAID' | 'EXEMPT';
  payments_count: number;
  last_payment_date?: string | null;
  last_receipt_number?: string | null;
}

export interface PaymentDashboardSummary {
  billing_month: string;
  financial_summary: {
    total_expected: number;
    total_collected: number;
    total_remaining: number;
    total_overpaid: number;
    collection_rate_percent: number;
  };
  member_counts: {
    total_members: number;
    eligible_members: number;
    paid_members: number;
    partial_members: number;
    unpaid_members: number;
    overpaid_members: number;
    exempt_members: number;
  };
  active_rules: MonthlyPaymentRuleData[];
}

export interface PaymentReceiptData {
  receipt_number: string;
  receipt_date: string;
  billing_month: string;
  amount: number;
  payment_method: string;
  payment_reference?: string | null;
  member: {
    id: number;
    member_code: string;
    full_name: string;
    christian_name?: string | null;
    phone_number?: string | null;
    class_name?: string | null;
  };
  status: {
    expected_amount: number;
    total_paid_for_month: number;
    remaining_balance: number;
    status: string;
  };
  recorded_by?: {
    id: number;
    name: string;
  } | null;
  is_void: boolean;
  void_reason?: string | null;
  payment_date_eth?: {
    year: number;
    month: number;
    day: number;
    month_name_en: string;
    month_name_am: string;
    formatted_en: string;
    formatted_am: string;
  } | null;
  billing_month_eth?: {
    year: number;
    month: number;
    month_name_en: string;
    month_name_am: string;
    formatted_am: string;
    formatted_en: string;
  } | null;
}


