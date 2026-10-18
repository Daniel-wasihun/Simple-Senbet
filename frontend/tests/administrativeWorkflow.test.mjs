/**
 * administrativeWorkflow.test.mjs
 * Comprehensive unit test suite for SENBET-MVP-008B Administrative Attendance Workflow.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Helper to build sessions query string
 */
function buildSessionsQueryParams({ page = 1, perPage = 15, date = '', classId = '', status = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  if (date) params.set('date', date);
  if (classId) params.set('class_id', String(classId));
  if (status && status !== 'all') params.set('status', status);
  return params.toString();
}

/**
 * Helper to build summary query string
 */
function buildSummaryQueryParams({ date = '', classId = '' } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (classId) params.set('class_id', String(classId));
  return params.toString();
}

/**
 * Administrative closure eligibility evaluator
 */
function evaluateClosureEligibility(user, session) {
  if (!user || (user.role !== 'superadmin' && user.role !== 'academic_director')) {
    return { canClose: false, reason: 'Unauthorized: Only administrators can close attendance sessions.' };
  }
  if (!session) {
    return { canClose: false, reason: 'Invalid session.' };
  }
  if (session.status === 'closed') {
    return { canClose: false, reason: 'Session is already closed and permanently archived.' };
  }
  if (session.status === 'draft') {
    return { canClose: false, reason: 'Draft sessions must be submitted before closure.' };
  }
  if (session.status !== 'submitted') {
    return { canClose: false, reason: `Invalid session status: ${session.status}` };
  }
  return { canClose: true, reason: 'Session is eligible for administrative closure.' };
}

/**
 * Administrative session inspector section resolver
 */
function resolveAdminInspectionSection(user, session, querySection = null) {
  const isAdmin = user?.role === 'superadmin' || user?.role === 'academic_director';
  const assignments = (user?.teaching_assignments || []).filter(
    (a) => a.class_id === session?.class_id && (!session?.course_id || a.course_id === session?.course_id)
  );

  const defaultSec = assignments[0]?.section ?? (isAdmin ? 'A' : null);
  const resolvedSec = querySection ?? defaultSec;

  if (session?.status === 'draft' && !resolvedSec && !isAdmin) {
    return { ok: false, error: 'Cannot resolve section context for attendance taking.' };
  }

  return { ok: true, section: resolvedSec };
}

describe('Administrative Attendance Workflow — Query Parameter Serialization', () => {
  it('correctly builds default pagination query string', () => {
    const qs = buildSessionsQueryParams({ page: 1, perPage: 15 });
    assert.equal(qs, 'page=1&per_page=15');
  });

  it('correctly appends date, class_id, and status filters when specified', () => {
    const qs = buildSessionsQueryParams({
      page: 2,
      perPage: 15,
      date: '2026-10-18',
      classId: 3,
      status: 'submitted',
    });
    assert.equal(qs, 'page=2&per_page=15&date=2026-10-18&class_id=3&status=submitted');
  });

  it('omits status filter when status is "all" or empty string', () => {
    const qsAll = buildSessionsQueryParams({ page: 1, status: 'all' });
    assert.equal(qsAll, 'page=1&per_page=15');

    const qsEmpty = buildSessionsQueryParams({ page: 1, status: '' });
    assert.equal(qsEmpty, 'page=1&per_page=15');
  });

  it('correctly builds summary query string with date and optional class drilldown', () => {
    const qsNoClass = buildSummaryQueryParams({ date: '2026-10-18' });
    assert.equal(qsNoClass, 'date=2026-10-18');

    const qsWithClass = buildSummaryQueryParams({ date: '2026-10-18', classId: 2 });
    assert.equal(qsWithClass, 'date=2026-10-18&class_id=2');
  });
});

describe('Administrative Attendance Workflow — Session Closure Authorization & Rules', () => {
  const superadminUser = { id: 1, name: 'Super Admin', role: 'superadmin' };
  const academicDirectorUser = { id: 2, name: 'Director', role: 'academic_director' };
  const teacherUser = { id: 3, name: 'Teacher', role: 'teacher' };
  const studentUser = { id: 4, name: 'Student', role: 'student' };

  it('allows superadmin to close a submitted session', () => {
    const session = { id: 10, status: 'submitted' };
    const res = evaluateClosureEligibility(superadminUser, session);
    assert.equal(res.canClose, true);
  });

  it('allows academic_director to close a submitted session', () => {
    const session = { id: 10, status: 'submitted' };
    const res = evaluateClosureEligibility(academicDirectorUser, session);
    assert.equal(res.canClose, true);
  });

  it('rejects teacher from closing an attendance session', () => {
    const session = { id: 10, status: 'submitted' };
    const res = evaluateClosureEligibility(teacherUser, session);
    assert.equal(res.canClose, false);
    assert.match(res.reason, /Only administrators/);
  });

  it('rejects student from closing an attendance session', () => {
    const session = { id: 10, status: 'submitted' };
    const res = evaluateClosureEligibility(studentUser, session);
    assert.equal(res.canClose, false);
  });

  it('rejects closing a draft session (must be submitted first)', () => {
    const session = { id: 11, status: 'draft' };
    const res = evaluateClosureEligibility(superadminUser, session);
    assert.equal(res.canClose, false);
    assert.match(res.reason, /must be submitted/);
  });

  it('rejects closing an already closed session', () => {
    const session = { id: 12, status: 'closed' };
    const res = evaluateClosureEligibility(superadminUser, session);
    assert.equal(res.canClose, false);
    assert.match(res.reason, /already closed/);
  });
});

describe('Administrative Attendance Workflow — Roster Inspection & Context Fallbacks', () => {
  const adminWithoutAssignments = { id: 1, name: 'Auditor', role: 'superadmin', teaching_assignments: [] };
  const teacherWithoutAssignments = { id: 5, name: 'Teacher No Assignments', role: 'teacher', teaching_assignments: [] };

  it('allows administrators without teaching assignments to inspect draft session by falling back safely to Section A', () => {
    const draftSession = { id: 20, class_id: 1, status: 'draft' };
    const res = resolveAdminInspectionSection(adminWithoutAssignments, draftSession, null);
    assert.equal(res.ok, true);
    assert.equal(res.section, 'A');
  });

  it('preserves explicit query section parameter for administrator inspection', () => {
    const draftSession = { id: 20, class_id: 1, status: 'draft' };
    const res = resolveAdminInspectionSection(adminWithoutAssignments, draftSession, 'C');
    assert.equal(res.ok, true);
    assert.equal(res.section, 'C');
  });

  it('blocks teacher without teaching assignments from draft attendance without section context', () => {
    const draftSession = { id: 20, class_id: 1, status: 'draft' };
    const res = resolveAdminInspectionSection(teacherWithoutAssignments, draftSession, null);
    assert.equal(res.ok, false);
    assert.match(res.error, /Cannot resolve section context/);
  });
});

describe('Administrative Attendance Workflow — Absentee Summary Aggregation', () => {
  const summaryFixture = {
    date: '2026-10-18',
    class_id: null,
    total_sessions: 3,
    submitted_sessions: 2,
    counts: { present: 45, absent: 3, late: 2, excused: 1, total: 51 },
    attendance_rate: 88.24,
    absentees: [
      { student_id: 101, student_name: 'Abebe Bikila', class_name: 'Grade 9', course_title: 'Homeroom', session_id: 1, remarks: 'Sick' },
      { student_id: 102, student_name: 'Almaz Ayana', class_name: 'Grade 10', course_title: 'Math', session_id: 2, remarks: null },
      { student_id: 103, student_name: 'Kenenisa Bekele', class_name: 'Grade 9', course_title: 'Homeroom', session_id: 1, remarks: 'Family event' },
    ],
  };

  it('correctly aggregates absentees and extracts drilldown session IDs', () => {
    assert.equal(summaryFixture.absentees.length, 3);
    const sessionIds = [...new Set(summaryFixture.absentees.map((a) => a.session_id))];
    assert.deepEqual(sessionIds, [1, 2]);
  });

  it('identifies absentees with specific remarks/reasons', () => {
    const withRemarks = summaryFixture.absentees.filter((a) => a.remarks !== null);
    assert.equal(withRemarks.length, 2);
    assert.equal(withRemarks[0].remarks, 'Sick');
  });
});
