import test from "node:test";
import assert from "node:assert/strict";
import {
  validateOriginHeader,
  validateProxyPathAndMethod,
  ALLOWED_PROXY_ROUTES,
} from "../src/lib/bffSecurity.ts";

test("BFF Security - Origin Validation", async (t) => {
  const trustedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

  await t.test("GET request is allowed without origin header", () => {
    const result = validateOriginHeader("GET", null, null, null, trustedOrigins);
    assert.equal(result.valid, true);
  });

  await t.test("POST request with valid same-origin is allowed", () => {
    const result = validateOriginHeader(
      "POST",
      "http://localhost:3000",
      null,
      "same-origin",
      trustedOrigins
    );
    assert.equal(result.valid, true);
  });

  await t.test("POST request with sec-fetch-site=cross-site is rejected with 403", () => {
    const result = validateOriginHeader(
      "POST",
      "http://localhost:3000",
      null,
      "cross-site",
      trustedOrigins
    );
    assert.equal(result.valid, false);
    assert.equal(result.status, 403);
    assert.match(result.reason, /Cross-site request rejected/);
  });

  await t.test("POST request with untrusted origin is rejected with 403", () => {
    const result = validateOriginHeader(
      "POST",
      "https://attacker-phishing.com",
      null,
      null,
      trustedOrigins
    );
    assert.equal(result.valid, false);
    assert.equal(result.status, 403);
    assert.match(result.reason, /Untrusted request origin/);
  });

  await t.test("POST request missing both origin and referer is rejected with 403", () => {
    const result = validateOriginHeader("POST", null, null, null, trustedOrigins);
    assert.equal(result.valid, false);
    assert.equal(result.status, 403);
    assert.match(result.reason, /Missing Origin and Referer headers/);
  });

  await t.test("POST request with malformed origin is rejected with 400", () => {
    const result = validateOriginHeader(
      "POST",
      "not a valid url",
      null,
      null,
      trustedOrigins
    );
    assert.equal(result.valid, false);
    assert.equal(result.status, 400);
    assert.match(result.reason, /Malformed Origin header/);
  });

  await t.test("POST request with trusted referer when origin is absent is allowed", () => {
    const result = validateOriginHeader(
      "POST",
      null,
      "http://localhost:3000/dashboard",
      null,
      trustedOrigins
    );
    assert.equal(result.valid, true);
  });
});

test("BFF Security - Route Allowlist Validation", async (t) => {
  await t.test("Permitted attendance sessions collection GET & POST", () => {
    const getRes = validateProxyPathAndMethod("GET", ["attendance", "sessions"]);
    assert.equal(getRes.allowed, true);
    assert.equal(getRes.normalizedPath, "attendance/sessions");

    const postRes = validateProxyPathAndMethod("POST", ["attendance", "sessions"]);
    assert.equal(postRes.allowed, true);
  });

  await t.test("Permitted single attendance session GET", () => {
    const res = validateProxyPathAndMethod("GET", ["attendance", "sessions", "42"]);
    assert.equal(res.allowed, true);
    assert.equal(res.normalizedPath, "attendance/sessions/42");
  });

  await t.test("Permitted attendance submission POST", () => {
    const res = validateProxyPathAndMethod("POST", ["attendance", "sessions", "42", "submit"]);
    assert.equal(res.allowed, true);
  });

  await t.test("Permitted attendance correction PATCH", () => {
    const res = validateProxyPathAndMethod("PATCH", ["attendance", "sessions", "42", "marks"]);
    assert.equal(res.allowed, true);
  });

  await t.test("Permitted attendance close POST", () => {
    const res = validateProxyPathAndMethod("POST", ["attendance", "sessions", "42", "close"]);
    assert.equal(res.allowed, true);
  });

  await t.test("Permitted attendance roster GET", () => {
    const res = validateProxyPathAndMethod("GET", ["attendance", "sessions", "42", "roster"]);
    assert.equal(res.allowed, true);
    assert.equal(res.normalizedPath, "attendance/sessions/42/roster");
  });

  await t.test("Permitted attendance summary GET", () => {
    const res = validateProxyPathAndMethod("GET", ["attendance", "summary"]);
    assert.equal(res.allowed, true);
    assert.equal(res.normalizedPath, "attendance/summary");
  });

  await t.test("Permitted school-classes, courses, and members reads", () => {
    assert.equal(validateProxyPathAndMethod("GET", ["school-classes"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["school-classes", "5"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["courses"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["courses", "12"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["members"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["members", "101"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["report-cards", "student", "101"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["report-cards", "class", "5"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["report-cards", "class", "5", "export", "csv"]).allowed, true);
  });

  await t.test("Rejects unpermitted methods on read-only routes with 405", () => {
    const postClass = validateProxyPathAndMethod("POST", ["school-classes"]);
    assert.equal(postClass.allowed, false);
    assert.equal(postClass.status, 405);

    const deleteCourse = validateProxyPathAndMethod("DELETE", ["courses", "1"]);
    assert.equal(deleteCourse.allowed, false);
    assert.equal(deleteCourse.status, 405);

    const deleteSession = validateProxyPathAndMethod("DELETE", ["attendance", "sessions", "1"]);
    assert.equal(deleteSession.allowed, false);
    assert.equal(deleteSession.status, 405);
  });

  await t.test("Rejects administrative and unlisted endpoints with 403", () => {
    const users = validateProxyPathAndMethod("GET", ["users"]);
    assert.equal(users.allowed, false);
    assert.equal(users.status, 403);

    const academicYears = validateProxyPathAndMethod("GET", ["academic-years"]);
    assert.equal(academicYears.allowed, false);
    assert.equal(academicYears.status, 403);

    const permissions = validateProxyPathAndMethod("GET", ["permissions"]);
    assert.equal(permissions.allowed, false);
    assert.equal(permissions.status, 403);

    const arbitrary = validateProxyPathAndMethod("GET", ["status"]);
    assert.equal(arbitrary.allowed, false);
    assert.equal(arbitrary.status, 403);
  });

  await t.test("Rejects path traversal attempts with 400", () => {
    const dotdot = validateProxyPathAndMethod("GET", ["..", "users"]);
    assert.equal(dotdot.allowed, false);
    assert.equal(dotdot.status, 400);

    const midTraversal = validateProxyPathAndMethod("GET", ["attendance", "..", "users"]);
    assert.equal(midTraversal.allowed, false);
    assert.equal(midTraversal.status, 400);

    const encodedSlash = validateProxyPathAndMethod("GET", ["attendance%2fsessions"]);
    assert.equal(encodedSlash.allowed, false);
    assert.equal(encodedSlash.status, 400);

    const nullByte = validateProxyPathAndMethod("GET", ["attendance%00sessions"]);
    assert.equal(nullByte.allowed, false);
    assert.equal(nullByte.status, 400);
  });
});
