import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateAssessmentBreakdown,
  clampScore,
  calculateAttendanceMetrics,
  calculateDeterministicRoster,
} from "../src/lib/calculations.ts";
import { translations } from "../src/i18n/translations.ts";
import type { SupportedLanguage } from "../src/i18n/translations.ts";
import {
  translateClassName,
  translateCourseName,
  translateAttendanceStatus,
  translateRole,
} from "../src/i18n/domain.ts";
import type {
  Student,
  StudentEnrollment,
  Course,
  CourseAssessment,
  AssessmentResult,
} from "../src/types/index.ts";

describe("Assessment Breakdown Validation", () => {
  test("accepts breakdown that sums to exactly 100%", () => {
    const items = [
      { name: "Quiz 1", max_score: 10, weight_percentage: 10 },
      { name: "Midterm", max_score: 30, weight_percentage: 30 },
      { name: "Attendance", max_score: 10, weight_percentage: 10 },
      { name: "Final", max_score: 50, weight_percentage: 50 },
    ];
    const result = validateAssessmentBreakdown(items);
    assert.equal(result.isValid, true);
    assert.equal(result.totalWeight, 100);
    assert.equal(result.totalMaxScore, 100);
    assert.equal(result.errors.length, 0);
  });

  test("rejects breakdown that sums to less than 100%", () => {
    const items = [
      { name: "Midterm", max_score: 40, weight_percentage: 40 },
      { name: "Final", max_score: 50, weight_percentage: 50 },
    ];
    const result = validateAssessmentBreakdown(items);
    assert.equal(result.isValid, false);
    assert.equal(result.totalWeight, 90);
    assert.equal(result.remainingWeight, 10);
    assert.ok(result.errors.some((e) => e.includes("100%")));
  });

  test("rejects breakdown that exceeds 100%", () => {
    const items = [
      { name: "Midterm", max_score: 50, weight_percentage: 50 },
      { name: "Final", max_score: 60, weight_percentage: 60 },
    ];
    const result = validateAssessmentBreakdown(items);
    assert.equal(result.isValid, false);
    assert.equal(result.totalWeight, 110);
    assert.equal(result.remainingWeight, -10);
  });

  test("flags empty name and invalid max_score or weight", () => {
    const items = [
      { name: "", max_score: 0, weight_percentage: -5 },
    ];
    const result = validateAssessmentBreakdown(items);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.length >= 2);
  });
});

describe("Score Clamping", () => {
  test("preserves valid scores between 0 and max", () => {
    assert.equal(clampScore(25, 30), 25);
    assert.equal(clampScore(0, 30), 0);
    assert.equal(clampScore(30, 30), 30);
  });

  test("clamps negative scores to 0", () => {
    assert.equal(clampScore(-5, 30), 0);
  });

  test("clamps over-scores to maxScore", () => {
    assert.equal(clampScore(35, 30), 30);
    assert.equal(clampScore(120, 100), 100);
  });
});

describe("Attendance Metrics Calculation", () => {
  test("computes 100% rate for all present", () => {
    const records = [
      { status: "present" },
      { status: "present" },
      { status: "present" },
    ];
    const metrics = calculateAttendanceMetrics(records);
    assert.equal(metrics.totalDays, 3);
    assert.equal(metrics.present, 3);
    assert.equal(metrics.attendanceRate, 100);
    assert.equal(metrics.rate, 100);
  });

  test("factors late as partial (0.5 weight)", () => {
    const records = [
      { status: "present" },
      { status: "late" },
    ];
    const metrics = calculateAttendanceMetrics(records);
    // (1 + 0.5) / 2 = 75%
    assert.equal(metrics.attendanceRate, 75);
    assert.equal(metrics.present, 1);
    assert.equal(metrics.late, 1);
  });

  test("handles empty records cleanly", () => {
    const metrics = calculateAttendanceMetrics([]);
    assert.equal(metrics.totalDays, 0);
    assert.equal(metrics.attendanceRate, 100);
  });
});

describe("Deterministic Ranking and Roster Engine", () => {
  const classId = "cls-1";
  const dummyStudents: Student[] = [
    {
      id: "s1",
      school_id: "sch-1",
      student_id: "STU-001",
      full_name: "Abebe Kebede",
      gender: "male",
      status: "active",
      created_at: "",
    },
    {
      id: "s2",
      school_id: "sch-1",
      student_id: "STU-002",
      full_name: "Chaltu Tolosa",
      gender: "female",
      status: "active",
      created_at: "",
    },
    {
      id: "s3",
      school_id: "sch-1",
      student_id: "STU-003",
      full_name: "Dawit Haile",
      gender: "male",
      status: "active",
      created_at: "",
    },
    {
      id: "s4",
      school_id: "sch-1",
      student_id: "STU-004",
      full_name: "Ermias Tadesse",
      gender: "male",
      status: "active",
      created_at: "",
    },
  ];

  const dummyEnrollments: StudentEnrollment[] = dummyStudents.map((s) => ({
    id: "enr-" + s.id,
    school_id: "sch-1",
    class_id: classId,
    student_id: s.id,
    academic_year_id: "ay-1",
    enrollment_status: "enrolled",
    created_at: "",
  }));

  const dummyCourses: Course[] = [
    { id: "c1", school_id: "sch-1", class_id: classId, academic_year_id: "ay-1", name: "Bible Study", code: "BIB", created_at: "" },
  ];

  const dummyAssessments: CourseAssessment[] = [
    {
      id: "a1",
      school_id: "sch-1",
      course_id: "c1",
      name: "Final",
      assessment_type: "final",
      max_score: 100,
      weight_percentage: 100,
      created_at: "",
    },
  ];

  test("correctly assigns ranks with standard competition tie skipping (1, 2, 2, 4)", () => {
    // S1: 95 (Rank 1)
    // S2: 85 (Rank 2 - Tie)
    // S3: 85 (Rank 2 - Tie)
    // S4: 70 (Rank 4 - Skipped 3)
    const dummyResults: AssessmentResult[] = [
      { id: "r1", school_id: "sch-1", assessment_id: "a1", student_id: "s1", score: 95, created_at: "" },
      { id: "r2", school_id: "sch-1", assessment_id: "a1", student_id: "s2", score: 85, created_at: "" },
      { id: "r3", school_id: "sch-1", assessment_id: "a1", student_id: "s3", score: 85, created_at: "" },
      { id: "r4", school_id: "sch-1", assessment_id: "a1", student_id: "s4", score: 70, created_at: "" },
    ];

    const roster = calculateDeterministicRoster(
      dummyStudents,
      dummyEnrollments,
      dummyCourses,
      dummyAssessments,
      dummyResults,
      [],
      classId
    );

    assert.equal(roster.length, 4);

    const s1Row = roster.find((r) => r.student.id === "s1");
    const s2Row = roster.find((r) => r.student.id === "s2");
    const s3Row = roster.find((r) => r.student.id === "s3");
    const s4Row = roster.find((r) => r.student.id === "s4");

    assert.equal(s1Row?.rank, 1);
    assert.equal(s2Row?.rank, 2);
    assert.equal(s3Row?.rank, 2);
    assert.equal(s4Row?.rank, 4); // Deterministic skip: next is 4, NOT 3!

    assert.equal(s1Row?.status, "Passed");
    assert.equal(s4Row?.status, "Passed");
  });
});

describe("Localization Dictionaries Integrity", () => {
  const languages: SupportedLanguage[] = ["en", "am", "or"];

  test("all supported languages provide translations for required app sections", () => {
    const requiredSections = [
      "common",
      "nav",
      "dashboard",
      "classes",
      "students",
      "courses",
      "assessments",
      "attendance",
      "results",
      "roster",
      "settings",
      "auth",
    ];

    for (const lang of languages) {
      const dict = translations[lang];
      assert.ok(dict, `Dictionary for language ${lang} must exist`);

      const allKeys = Object.keys(dict);

      for (const section of requiredSections) {
        const matchingKeys = allKeys.filter((k) => k.startsWith(section + "."));
        assert.ok(
          matchingKeys.length > 0,
          `Language "${lang}" must have keys under section prefix "${section}."`
        );
      }
    }
  });

  test("domain translators support EN, AM, and OR", () => {
    // Classes
    assert.equal(translateClassName("Grade 1", "en"), "Grade 1");
    assert.equal(translateClassName("Grade 1", "am"), "1ኛ ክፍል");
    assert.equal(translateClassName("Grade 1", "or"), "Kutaa 1ffaa");

    // Courses
    assert.equal(translateCourseName("Bible Study", "en"), "Bible Study");
    assert.equal(translateCourseName("Bible Study", "am"), "መጽሐፍ ቅዱስ ጥናት");
    assert.equal(translateCourseName("Bible Study", "or"), "Qo'annoo Kitaaba Qulqulluu");

    // Roles
    assert.equal(translateRole("admin", "en"), "Owner / Admin");
    assert.equal(translateRole("admin", "am"), "ባለቤት / አስተዳዳሪ");
    assert.equal(translateRole("admin", "or"), "Abbaa Qabeenyaa / Bulchaa");

    // Attendance
    assert.equal(translateAttendanceStatus("present", "en"), "Present");
    assert.equal(translateAttendanceStatus("present", "am"), "ተገኝቷል");
    assert.equal(translateAttendanceStatus("present", "or"), "Argameera");
  });
});
