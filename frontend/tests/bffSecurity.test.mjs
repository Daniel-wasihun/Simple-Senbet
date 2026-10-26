import test from "node:test";
import assert from "node:assert/strict";
import {
  validateOriginHeader,
  validateProxyPathAndMethod,
  getTrustedOrigins,
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
    assert.equal(validateProxyPathAndMethod("GET", ["report-cards", "class", "5", "export", "print"]).allowed, true);
  });

  await t.test("Permitted administrative and school management CRUD", () => {
    assert.equal(validateProxyPathAndMethod("GET", ["users"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["users"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["users", "1"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("PUT", ["users", "1", "roles"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["roles"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["roles"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["roles", "2", "permissions"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("PUT", ["roles", "2", "permissions"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["permissions"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["academic-years"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["academic-years"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["academic-years", "current"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["teaching-assignments"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["teaching-assignments"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["teaching-assignments", "expected"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["teaching-assignments", "1", "end"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["enrollments"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["enrollments", "members", "10", "transfer"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("POST", ["promotion", "dry-run"]).allowed, true);
    // Tolerates accidental api/backend prefixing
    assert.equal(validateProxyPathAndMethod("GET", ["api", "backend", "school-classes"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["api", "backend", "courses"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["api", "backend", "assessments"]).allowed, true);
    assert.equal(validateProxyPathAndMethod("GET", ["api", "backend", "teaching-assignments"]).allowed, true);
  });

  await t.test("Rejects unpermitted methods on restricted routes with 405", () => {
    const postCurrentYear = validateProxyPathAndMethod("POST", ["academic-years", "current"]);
    assert.equal(postCurrentYear.allowed, false);
    assert.equal(postCurrentYear.status, 405);

    const postSummary = validateProxyPathAndMethod("POST", ["attendance", "summary"]);
    assert.equal(postSummary.allowed, false);
    assert.equal(postSummary.status, 405);

    const postExpected = validateProxyPathAndMethod("POST", ["teaching-assignments", "expected"]);
    assert.equal(postExpected.allowed, false);
    assert.equal(postExpected.status, 405);

    const postDashboard = validateProxyPathAndMethod("POST", ["payments", "dashboard"]);
    assert.equal(postDashboard.allowed, false);
    assert.equal(postDashboard.status, 405);

    const getSubmit = validateProxyPathAndMethod("GET", ["attendance", "sessions", "42", "submit"]);
    assert.equal(getSubmit.allowed, false);
    assert.equal(getSubmit.status, 405);

    const postMarks = validateProxyPathAndMethod("POST", ["attendance", "sessions", "42", "marks"]);
    assert.equal(postMarks.allowed, false);
    assert.equal(postMarks.status, 405);
  });

  await t.test("Rejects unlisted, sensitive, and diagnostic endpoints with 403", () => {
    const telescope = validateProxyPathAndMethod("GET", ["telescope"]);
    assert.equal(telescope.allowed, false);
    assert.equal(telescope.status, 403);

    const horizon = validateProxyPathAndMethod("GET", ["horizon"]);
    assert.equal(horizon.allowed, false);
    assert.equal(horizon.status, 403);

    const debugbar = validateProxyPathAndMethod("GET", ["_debugbar"]);
    assert.equal(debugbar.allowed, false);
    assert.equal(debugbar.status, 403);

    const authLogin = validateProxyPathAndMethod("POST", ["auth", "login"]);
    assert.equal(authLogin.allowed, false);
    assert.equal(authLogin.status, 403);

    const status = validateProxyPathAndMethod("GET", ["status"]);
    assert.equal(status.allowed, false);
    assert.equal(status.status, 403);

    const env = validateProxyPathAndMethod("GET", ["env"]);
    assert.equal(env.allowed, false);
    assert.equal(env.status, 403);

    const admin = validateProxyPathAndMethod("GET", ["admin"]);
    assert.equal(admin.allowed, false);
    assert.equal(admin.status, 403);
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

test("BFF Security - Static Allowlist & Adversarial Origin Immunity", async (t) => {
  await t.test("Validates and normalizes legitimate configured HTTPS origin", () => {
    const origins = getTrustedOrigins(["https://senbet.example.com"]);
    assert.deepEqual(origins, ["https://senbet.example.com"]);
  });

  await t.test("Normalizes URLs with trailing paths and query strings to origin only", () => {
    const origins = getTrustedOrigins(["https://senbet.example.com:8443/app/dashboard?user=1#section"]);
    assert.deepEqual(origins, ["https://senbet.example.com:8443"]);
  });

  await t.test("Rejects malformed URLs and non-http/https protocols", () => {
    const origins = getTrustedOrigins([
      "not-a-valid-url",
      "ftp://senbet.example.com",
      "javascript:alert(1)",
      "",
      null,
    ]);
    assert.deepEqual(origins, []);
  });

  await t.test("Rejects URLs containing user credentials", () => {
    const origins = getTrustedOrigins(["https://admin:secret@senbet.example.com"]);
    assert.deepEqual(origins, []);
  });

  await t.test("Fails closed when configuration is empty", () => {
    const origins = getTrustedOrigins([]);
    assert.deepEqual(origins, []);

    // When trustedOrigins is empty, state-changing requests fail closed
    const res = validateOriginHeader("POST", "https://senbet.example.com", null, null, origins);
    assert.equal(res.valid, false);
    assert.equal(res.status, 403);
  });

  await t.test("Forged Host header cannot make an attacker origin trusted", () => {
    // Server is configured only for https://senbet.example.com
    const serverConfig = ["https://senbet.example.com"];
    const trusted = getTrustedOrigins(serverConfig);

    // Attacker sends Origin: https://evil.com with forged Host: evil.com or Host: senbet.example.com
    const attack1 = validateOriginHeader("POST", "https://evil.com", null, null, trusted);
    assert.equal(attack1.valid, false);
    assert.equal(attack1.status, 403);

    const attack2 = validateOriginHeader("POST", "https://evil.com", "https://senbet.example.com/login", null, trusted);
    assert.equal(attack2.valid, false);
    assert.equal(attack2.status, 403);
  });

  await t.test("Conflicting Origin and Referer are evaluated strictly", () => {
    const trusted = getTrustedOrigins(["https://senbet.example.com"]);

    // If Origin is provided, it takes precedence and must be trusted
    const res = validateOriginHeader("POST", "https://attacker.com", "https://senbet.example.com/login", null, trusted);
    assert.equal(res.valid, false);
    assert.equal(res.status, 403);
  });
});

