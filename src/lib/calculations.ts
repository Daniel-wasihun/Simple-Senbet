import type {
  Student,
  StudentEnrollment,
  Course,
  CourseAssessment,
  AssessmentResult,
  AttendanceRecord,
  ClassRosterEntry,
} from "../types/index.ts";

export interface AssessmentValidationResult {
  isValid: boolean;
  totalWeight: number;
  totalMaxScore: number;
  remainingWeight: number;
  errors: string[];
}

/**
 * Validates course assessment component scheme.
 * Ensures weights total 100% and max scores are positive.
 */
export function validateAssessmentBreakdown(
  items: Array<{ name: string; max_score: number; weight_percentage: number }>
): AssessmentValidationResult {
  const errors: string[] = [];
  let totalWeight = 0;
  let totalMaxScore = 0;

  if (items.length === 0) {
    errors.push("At least one assessment component is required.");
  }

  items.forEach((item, index) => {
    if (!item.name || !item.name.trim()) {
      errors.push(`Component #${index + 1} must have a name.`);
    }
    const maxScore = Number(item.max_score);
    if (isNaN(maxScore) || maxScore <= 0) {
      errors.push(
        `Component "${item.name || index + 1}" must have a maximum score greater than 0.`
      );
    } else {
      totalMaxScore += maxScore;
    }

    const weight = Number(item.weight_percentage);
    if (isNaN(weight) || weight < 0 || weight > 100) {
      errors.push(`Component "${item.name || index + 1}" weight must be between 0% and 100%.`);
    } else {
      totalWeight += weight;
    }
  });

  const roundedWeight = Math.round(totalWeight * 10) / 10;
  const isValid = roundedWeight === 100 && errors.length === 0;
  const remainingWeight = Math.round((100 - roundedWeight) * 10) / 10;

  if (roundedWeight !== 100) {
    errors.push(`Total weight must equal 100% (currently ${roundedWeight}%).`);
  }

  return {
    isValid,
    totalWeight: roundedWeight,
    totalMaxScore,
    remainingWeight,
    errors,
  };
}

/**
 * Clamps student input score safely between 0 and assessment max score.
 */
export function clampScore(score: number, maxScore: number): number {
  if (isNaN(score)) return 0;
  return Math.max(0, Math.min(maxScore, score));
}

/**
 * Calculates student attendance roll-call summary.
 */
export function calculateAttendanceMetrics(records: Array<{ status: string }>) {
  const totalDays = records.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let permission = 0;

  records.forEach((r) => {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "late") late++;
    else if (r.status === "permission") permission++;
  });

  // Late counts as partial presence (0.5)
  const attendanceRate =
    totalDays > 0 ? Math.round(((present + late * 0.5) / totalDays) * 100) : 100;

  return {
    totalDays,
    present,
    absent,
    late,
    permission,
    attendanceRate,
    rate: attendanceRate,
  };
}

/**
 * Deterministic standard competition ranking (1, 2, 2, 4).
 * Ties receive identical rank; following rank skips accordingly.
 */
export function calculateDeterministicRoster(
  enrolledStudents: Student[],
  classEnrollments: StudentEnrollment[],
  classCourses: Course[],
  assessments: CourseAssessment[],
  results: AssessmentResult[],
  attendanceRecords: AttendanceRecord[],
  classId: string
): ClassRosterEntry[] {
  // 1. Calculate unranked roster entries for each student
  const unrankedEntries: Array<Omit<ClassRosterEntry, "rank">> = enrolledStudents.map((student) => {
    const enrollment = classEnrollments.find((e) => e.student_id === student.id) || {
      id: "temp-" + student.id,
      school_id: student.school_id,
      class_id: classId,
      student_id: student.id,
      academic_year_id: "",
      enrollment_status: "enrolled",
      created_at: new Date().toISOString(),
    };

    // Attendance stats
    const studentAtt = attendanceRecords.filter(
      (a) => a.class_id === classId && a.student_id === student.id
    );
    const attendanceStats = calculateAttendanceMetrics(studentAtt);

    // Course scores calculation
    const courseScores: ClassRosterEntry["courseScores"] = {};
    let totalObtainedScore = 0;
    let totalMaxScore = 0;

    classCourses.forEach((c) => {
      const courseAssessmentsList = assessments.filter((a) => a.course_id === c.id);
      const assessmentBreakdown: Record<string, number> = {};
      let courseObtained = 0;
      let courseMax = 0;

      courseAssessmentsList.forEach((asm) => {
        const res = results.find((r) => r.assessment_id === asm.id && r.student_id === student.id);
        const score = res ? Number(res.score) : 0;
        assessmentBreakdown[asm.id] = score;
        courseObtained += score;
        courseMax += Number(asm.max_score);
      });

      const coursePercentage = courseMax > 0 ? Math.round((courseObtained / courseMax) * 100) : 0;

      courseScores[c.id] = {
        courseId: c.id,
        courseName: c.name,
        obtainedScore: courseObtained,
        maxPossibleScore: courseMax,
        percentage: coursePercentage,
        assessmentBreakdown,
      };

      totalObtainedScore += courseObtained;
      totalMaxScore += courseMax;
    });

    const overallAverage =
      totalMaxScore > 0 ? Math.round((totalObtainedScore / totalMaxScore) * 1000) / 10 : 0;

    let status: "Passed" | "Failed" | "In Progress" = "In Progress";
    if (totalMaxScore > 0) {
      status = overallAverage >= 50 ? "Passed" : "Failed";
    }

    return {
      student,
      enrollment,
      attendance: attendanceStats,
      courseScores,
      totalObtainedScore,
      totalMaxScore,
      overallAverage,
      status,
    };
  });

  // 2. Sort descending by totalObtainedScore, then by overallAverage
  const sorted = [...unrankedEntries].sort((a, b) => {
    if (b.totalObtainedScore !== a.totalObtainedScore) {
      return b.totalObtainedScore - a.totalObtainedScore;
    }
    return b.overallAverage - a.overallAverage;
  });

  // 3. Apply standard competition ranking (1, 2, 2, 4)
  let currentRank = 1;
  const rankedList: ClassRosterEntry[] = sorted.map((entry, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (entry.totalObtainedScore < prev.totalObtainedScore) {
        currentRank = index + 1;
      }
    }
    return {
      ...entry,
      rank: currentRank,
    };
  });

  return rankedList;
}
