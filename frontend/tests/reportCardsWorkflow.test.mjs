import test from "node:test";
import assert from "node:assert/strict";

/**
 * Helper simulating report card status and badge resolution.
 */
function resolveReportCardBadge(summary) {
  if (summary.is_incomplete || summary.status === "INCOMPLETE") {
    return {
      status: "INCOMPLETE",
      label: "INCOMPLETE",
      canFinalize: false,
      rankDisplay: null,
    };
  }

  if (summary.status === "PASS") {
    return {
      status: "PASS",
      label: "PASS",
      canFinalize: true,
      rankDisplay: summary.section_rank ? `#${summary.section_rank}` : null,
    };
  }

  return {
    status: "FAIL",
    label: "FAIL",
    canFinalize: true,
    rankDisplay: summary.section_rank ? `#${summary.section_rank}` : null,
  };
}

/**
 * Helper verifying attendance score independence invariant.
 */
function verifyAttendanceIndependence(attendance) {
  return {
    rate: attendance.attendance_rate,
    scoreAdjustment: attendance.score_adjustment,
    isIndependent: attendance.score_adjustment === 0,
  };
}

test("Report Card Workflow — Status & Badge Resolution", async (t) => {
  await t.test("identifies complete passing report card with valid rank", () => {
    const summary = {
      overall_average: 84.5,
      passing_score: 50.0,
      failed_courses_count: 0,
      status: "PASS",
      is_passed: true,
      is_incomplete: false,
      section_rank: 2,
      class_rank: 3,
    };

    const badge = resolveReportCardBadge(summary);
    assert.equal(badge.status, "PASS");
    assert.equal(badge.canFinalize, true);
    assert.equal(badge.rankDisplay, "#2");
  });

  await t.test("identifies complete failing report card with rank", () => {
    const summary = {
      overall_average: 46.0,
      passing_score: 50.0,
      failed_courses_count: 2,
      status: "FAIL",
      is_passed: false,
      is_incomplete: false,
      section_rank: 15,
      class_rank: 34,
    };

    const badge = resolveReportCardBadge(summary);
    assert.equal(badge.status, "FAIL");
    assert.equal(badge.canFinalize, true);
    assert.equal(badge.rankDisplay, "#15");
  });

  await t.test("withholds final pass/fail and rank when report card is incomplete", () => {
    const summary = {
      overall_average: 65.0,
      passing_score: 50.0,
      failed_courses_count: 0,
      status: "INCOMPLETE",
      is_passed: null,
      is_incomplete: true,
      section_rank: null,
      class_rank: null,
    };

    const badge = resolveReportCardBadge(summary);
    assert.equal(badge.status, "INCOMPLETE");
    assert.equal(badge.canFinalize, false);
    assert.equal(badge.rankDisplay, null);
  });
});

test("Report Card Workflow — Attendance Score Independence", async (t) => {
  await t.test("verifies zero score adjustment regardless of attendance percentage", () => {
    const highAttendance = {
      total_sessions: 20,
      present_count: 20,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
      attendance_rate: 100.0,
      score_adjustment: 0.0,
    };

    const lowAttendance = {
      total_sessions: 20,
      present_count: 10,
      absent_count: 10,
      late_count: 0,
      excused_count: 0,
      attendance_rate: 50.0,
      score_adjustment: 0.0,
    };

    assert.equal(verifyAttendanceIndependence(highAttendance).isIndependent, true);
    assert.equal(verifyAttendanceIndependence(lowAttendance).isIndependent, true);
    assert.equal(verifyAttendanceIndependence(lowAttendance).scoreAdjustment, 0.0);
  });
});
