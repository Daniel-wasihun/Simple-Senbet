import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enLocale = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../src/locales/en/common.json"), "utf8")
);
const amLocale = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../src/locales/am/common.json"), "utf8")
);
const omLocale = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../src/locales/om/common.json"), "utf8")
);

describe("Dashboard Sidebar Navigation Architecture", () => {
  it("enforces exactly ONE dashboard option pointing to /dashboard in admin-nav.config.ts", () => {
    const configFile = fs.readFileSync(
      path.resolve(__dirname, "../src/config/admin-nav.config.ts"),
      "utf8"
    );

    // Verify ADMIN_NAV_LINKS has exactly one dashboard link
    assert.match(
      configFile,
      /export const ADMIN_NAV_LINKS: AdminNavLink\[\] = \[\s*\{\s*label: "Dashboard",\s*translationKey: ADMIN_NAV_HOME_KEY,\s*href: "\/dashboard"/
    );

    // Verify academics dashboard is not present in ADMIN_NAV_GROUPS
    assert.doesNotMatch(
      configFile,
      /href: "\/academics\/dashboard"/
    );
  });

  it("organizes navigation groups in the strict pedagogical operational sequence", () => {
    const configFile = fs.readFileSync(
      path.resolve(__dirname, "../src/config/admin-nav.config.ts"),
      "utf8"
    );

    // Membership: Registration -> Enrollments
    const membershipIdx = configFile.indexOf('id: "membership"');
    const membersLinkIdx = configFile.indexOf('href: "/members/dashboard"');
    const enrollmentsLinkIdx = configFile.indexOf('href: "/academics/enrollments"');
    assert.ok(membershipIdx !== -1, "Membership group must exist");
    assert.ok(membershipIdx < membersLinkIdx && membersLinkIdx < enrollmentsLinkIdx);

    // Academics: Attendance -> Assessments -> Results -> Assignments -> Courses -> Classes -> Years -> Promotions
    const academicsIdx = configFile.indexOf('id: "academics"');
    const attendanceIdx = configFile.indexOf('href: "/attendance/dashboard"');
    const assessmentsIdx = configFile.indexOf('href: "/academics/assessments"');
    const resultsIdx = configFile.indexOf('href: "/academics/assessment-results"');
    const assignmentsIdx = configFile.indexOf('href: "/academics/teaching-assignments"');
    const coursesIdx = configFile.indexOf('href: "/academics/courses"');
    const classesIdx = configFile.indexOf('href: "/academics/school-classes"');
    const yearsIdx = configFile.indexOf('href: "/academics/academic-years"');
    const promotionsIdx = configFile.indexOf('href: "/academics/promotions"');

    assert.ok(academicsIdx < attendanceIdx);
    assert.ok(attendanceIdx < assessmentsIdx);
    assert.ok(assessmentsIdx < resultsIdx);
    assert.ok(resultsIdx < assignmentsIdx);
    assert.ok(assignmentsIdx < coursesIdx);
    assert.ok(coursesIdx < classesIdx);
    assert.ok(classesIdx < yearsIdx);
    assert.ok(yearsIdx < promotionsIdx);

    // Finance: Payments
    const financeIdx = configFile.indexOf('id: "finance"');
    const paymentsIdx = configFile.indexOf('href: "/finance/dashboard"');
    assert.ok(promotionsIdx < financeIdx);
    assert.ok(financeIdx < paymentsIdx);

    // Administration: Users -> Access
    const adminIdx = configFile.indexOf('id: "administration"');
    const usersIdx = configFile.indexOf('href: "/administration/users"');
    const accessIdx = configFile.indexOf('href: "/administration/access"');
    assert.ok(paymentsIdx < adminIdx);
    assert.ok(adminIdx < usersIdx);
    assert.ok(usersIdx < accessIdx);
  });
});

describe("Dashboard Sidebar Translation Parity & Integrity", () => {
  const expectedNavKeys = [
    "dashboard",
    "members",
    "enrollments",
    "attendance",
    "assessments",
    "results",
    "assignments",
    "courses",
    "classes",
    "academicYears",
    "promotions",
    "payments",
    "users",
    "accessControl",
  ];

  const expectedGroupKeys = [
    "membership",
    "academics",
    "finance",
    "administration",
  ];

  for (const key of expectedNavKeys) {
    it(`provides valid translation for nav key '${key}' across en, am, and om`, () => {
      assert.ok(enLocale.dashboard.nav[key], `en missing nav.${key}`);
      assert.ok(amLocale.dashboard.nav[key], `am missing nav.${key}`);
      assert.ok(omLocale.dashboard.nav[key], `om missing nav.${key}`);

      // Crucial: No question mark corruptions (????)
      assert.doesNotMatch(amLocale.dashboard.nav[key], /\?/, `am nav.${key} contains corruption`);
      assert.doesNotMatch(enLocale.dashboard.nav[key], /\?/, `en nav.${key} contains corruption`);
      assert.doesNotMatch(omLocale.dashboard.nav[key], /\?/, `om nav.${key} contains corruption`);
    });
  }

  for (const group of expectedGroupKeys) {
    it(`provides valid translation for group '${group}' across en, am, and om`, () => {
      assert.ok(enLocale.dashboard.groups[group], `en missing group.${group}`);
      assert.ok(amLocale.dashboard.groups[group], `am missing group.${group}`);
      assert.ok(omLocale.dashboard.groups[group], `om missing group.${group}`);

      assert.doesNotMatch(amLocale.dashboard.groups[group], /\?/, `am group.${group} contains corruption`);
      assert.doesNotMatch(enLocale.dashboard.groups[group], /\?/, `en group.${group} contains corruption`);
      assert.doesNotMatch(omLocale.dashboard.groups[group], /\?/, `om group.${group} contains corruption`);
    });
  }

  it("verifies amharic translation contains proper Ethiopian Ge'ez characters", () => {
    assert.equal(amLocale.dashboard.nav.dashboard, "ዳሽቦርድ");
    assert.equal(amLocale.dashboard.nav.members, "የአባላት ምዝገባ");
    assert.equal(amLocale.dashboard.nav.enrollments, "የተማሪዎች ምዝገባ");
    assert.equal(amLocale.dashboard.nav.attendance, "የተማሪዎች ክትትል");
    assert.equal(amLocale.dashboard.nav.assessments, "ምዘናዎችና ፈተናዎች");
    assert.equal(amLocale.dashboard.nav.results, "የምዘና ውጤቶች");
    assert.equal(amLocale.dashboard.nav.assignments, "የመምህራን ምደባ");
    assert.equal(amLocale.dashboard.nav.courses, "የትምህርት አይነቶች");
    assert.equal(amLocale.dashboard.nav.classes, "ክፍሎች");
    assert.equal(amLocale.dashboard.nav.academicYears, "የትምህርት ዘመናት");
    assert.equal(amLocale.dashboard.nav.promotions, "የተማሪዎች ክፍል ዝውውር");
    assert.equal(amLocale.dashboard.nav.payments, "ክፍያዎችና መዋጮ");
    assert.equal(amLocale.dashboard.nav.users, "የተጠቃሚ መለያዎች");
    assert.equal(amLocale.dashboard.nav.accessControl, "ሚናዎችና ፈቃዶች");
  });
});
