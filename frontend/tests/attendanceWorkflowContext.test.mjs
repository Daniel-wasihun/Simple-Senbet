import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Pure helper mirroring the context resolution logic in AttendanceTakingContent.
 */
export function resolveAttendanceSessionContext({
  session,
  userAssignments,
  urlSection,
  urlSemester,
  targetSection,
}) {
  if (!session) {
    return {
      resolvedSection: null,
      resolvedSemester: null,
      error: "Session data not loaded",
      canSubmit: false,
    };
  }

  // 1. Filter assignments matching session's class and course
  const matchingAssignments = (userAssignments || []).filter(
    (a) =>
      a.class_id === session.class_id &&
      (!session.course_id || a.course_id === session.course_id)
  );

  // 2. Resolve section: targetSection override > urlSection > matching assignment section
  const resolvedSection =
    targetSection ?? urlSection ?? matchingAssignments[0]?.section ?? null;

  // 3. Resolve semester: urlSemester > matched assignment semester > fallback
  const matchedAssignment =
    matchingAssignments.find((a) => !resolvedSection || a.section === resolvedSection) ||
    matchingAssignments[0];

  const resolvedSemester = urlSemester ?? matchedAssignment?.semester ?? null;

  // 4. Validate context for draft sessions
  if (session.status === "draft" && !resolvedSection) {
    return {
      resolvedSection: null,
      resolvedSemester,
      matchingAssignments,
      error:
        "Cannot resolve section context for attendance taking. A valid section must be assigned to your profile or provided in the request parameters.",
      canSubmit: false,
    };
  }

  if (session.status === "draft" && !resolvedSemester) {
    return {
      resolvedSection,
      resolvedSemester: null,
      matchingAssignments,
      error:
        "Cannot resolve semester context for attendance submission. A valid semester must be assigned to your profile or provided in the request parameters.",
      canSubmit: false,
    };
  }

  return {
    resolvedSection,
    resolvedSemester,
    matchingAssignments,
    error: null,
    canSubmit: true,
  };
}

/**
 * Builds the roster request URL based on resolved context.
 */
export function buildRosterUrl(sessionId, resolvedSection) {
  if (resolvedSection) {
    return `/api/backend/attendance/sessions/${sessionId}/roster?section=${encodeURIComponent(resolvedSection)}`;
  }
  return `/api/backend/attendance/sessions/${sessionId}/roster`;
}

/**
 * Builds the submission payload ensuring section and semester consistency.
 */
export function buildSubmissionPayload({
  resolvedSection,
  resolvedSemester,
  studentMarks,
  teacherMarks,
}) {
  if (!resolvedSection) {
    throw new Error("Cannot submit attendance: section context could not be determined.");
  }
  if (!resolvedSemester) {
    throw new Error("Cannot submit attendance: semester context could not be determined.");
  }

  return {
    section: resolvedSection,
    semester: resolvedSemester,
    student_marks: studentMarks,
    teacher_marks: teacherMarks,
  };
}

describe("Attendance Workflow Context Resolution & Contract Consistency", () => {
  const mockTeacherAssignments = [
    {
      id: 1,
      class_id: 1,
      course_id: 1,
      section: "A",
      semester: "semester_2",
      is_primary: true,
    },
    {
      id: 2,
      class_id: 2,
      course_id: 3,
      section: "B",
      semester: "semester_1",
      is_primary: false,
    },
    {
      id: 3,
      class_id: 3,
      course_id: 1,
      section: "C",
      semester: "semester_1",
      is_primary: false,
    },
    {
      id: 4,
      class_id: 3,
      course_id: 1,
      section: "D",
      semester: "semester_2",
      is_primary: false,
    },
  ];

  it("resolves Section A and Semester 2 when session matches Grade 9 Section A assignment", () => {
    const session = { id: 101, class_id: 1, course_id: 1, status: "draft" };
    const context = resolveAttendanceSessionContext({
      session,
      userAssignments: mockTeacherAssignments,
      urlSection: null,
      urlSemester: null,
    });

    assert.equal(context.resolvedSection, "A");
    assert.equal(context.resolvedSemester, "semester_2");
    assert.equal(context.error, null);
    assert.equal(context.canSubmit, true);

    const rosterUrl = buildRosterUrl(session.id, context.resolvedSection);
    assert.equal(rosterUrl, "/api/backend/attendance/sessions/101/roster?section=A");

    const payload = buildSubmissionPayload({
      resolvedSection: context.resolvedSection,
      resolvedSemester: context.resolvedSemester,
      studentMarks: [{ student_id: 1, mark: "present" }],
      teacherMarks: [{ teacher_id: 2, mark: "present" }],
    });

    assert.equal(payload.section, "A");
    assert.equal(payload.semester, "semester_2");
  });

  it("resolves Section B and Semester 1 when session matches alternate class/section assignment", () => {
    const session = { id: 102, class_id: 2, course_id: 3, status: "draft" };
    const context = resolveAttendanceSessionContext({
      session,
      userAssignments: mockTeacherAssignments,
      urlSection: null,
      urlSemester: null,
    });

    assert.equal(context.resolvedSection, "B");
    assert.equal(context.resolvedSemester, "semester_1");
    assert.equal(context.error, null);
    assert.equal(context.canSubmit, true);

    const rosterUrl = buildRosterUrl(session.id, context.resolvedSection);
    assert.equal(rosterUrl, "/api/backend/attendance/sessions/102/roster?section=B");

    const payload = buildSubmissionPayload({
      resolvedSection: context.resolvedSection,
      resolvedSemester: context.resolvedSemester,
      studentMarks: [{ student_id: 5, mark: "present" }],
      teacherMarks: [{ teacher_id: 2, mark: "present" }],
    });

    assert.equal(payload.section, "B");
    assert.equal(payload.semester, "semester_1");
  });

  it("respects explicit query parameters (?section=D&semester=semester_2) when teacher has multi-section assignments", () => {
    const session = { id: 103, class_id: 3, course_id: 1, status: "draft" };
    const context = resolveAttendanceSessionContext({
      session,
      userAssignments: mockTeacherAssignments,
      urlSection: "D",
      urlSemester: "semester_2",
    });

    assert.equal(context.resolvedSection, "D");
    assert.equal(context.resolvedSemester, "semester_2");
    assert.equal(context.matchingAssignments.length, 2);

    const rosterUrl = buildRosterUrl(session.id, context.resolvedSection);
    assert.equal(rosterUrl, "/api/backend/attendance/sessions/103/roster?section=D");

    const payload = buildSubmissionPayload({
      resolvedSection: context.resolvedSection,
      resolvedSemester: context.resolvedSemester,
      studentMarks: [{ student_id: 9, mark: "present" }],
      teacherMarks: [{ teacher_id: 2, mark: "present" }],
    });

    assert.equal(payload.section, "D");
    assert.equal(payload.semester, "semester_2");
  });

  it("fails safely with explicit error when teacher has no matching assignment and no parameters provided", () => {
    const session = { id: 104, class_id: 99, course_id: 99, status: "draft" };
    const context = resolveAttendanceSessionContext({
      session,
      userAssignments: mockTeacherAssignments,
      urlSection: null,
      urlSemester: null,
    });

    assert.equal(context.resolvedSection, null);
    assert.equal(context.canSubmit, false);
    assert.match(context.error, /Cannot resolve section context/);

    assert.throws(
      () => {
        buildSubmissionPayload({
          resolvedSection: context.resolvedSection,
          resolvedSemester: context.resolvedSemester,
          studentMarks: [{ student_id: 1, mark: "present" }],
          teacherMarks: [],
        });
      },
      {
        message: /Cannot submit attendance: section context could not be determined/,
      }
    );
  });

  it("allows submitted sessions to load records without blocking when section is not in parameters", () => {
    const session = { id: 105, class_id: 99, course_id: null, status: "submitted" };
    const context = resolveAttendanceSessionContext({
      session,
      userAssignments: mockTeacherAssignments,
      urlSection: null,
      urlSemester: null,
    });

    // Submitted sessions are already saved; they should not block viewing even if unassigned
    assert.equal(context.error, null);
    assert.equal(context.canSubmit, true);
  });
});
