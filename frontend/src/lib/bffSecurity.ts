export interface RouteRule {
  pattern: RegExp;
  allowedMethods: string[];
  description: string;
}

/**
 * Explicit route allowlist for the BFF backend proxy.
 * Only the specific endpoints and HTTP methods required by the dashboard and attendance workflow are permitted.
 * All administrative endpoints, user management, and unlisted CRUD routes are rejected.
 */
export const ALLOWED_PROXY_ROUTES: RouteRule[] = [
  { pattern: /^profile$/, allowedMethods: ["GET", "PATCH"], description: "View or update the signed-in user's profile" },
  { pattern: /^profile\/password$/, allowedMethods: ["PUT"], description: "Change the signed-in user's password" },
  // Identity and access administration. Laravel policies remain authoritative.
  { pattern: /^users$/, allowedMethods: ["GET", "POST"], description: "List or create users" },
  { pattern: /^users\/\d+$/, allowedMethods: ["GET", "PUT", "PATCH", "DELETE"], description: "Read, update, or remove a user" },
  { pattern: /^users\/\d+\/roles$/, allowedMethods: ["PUT"], description: "Replace a user's assigned roles" },
  { pattern: /^roles$/, allowedMethods: ["GET", "POST"], description: "List or create system roles" },
  { pattern: /^roles\/\d+$/, allowedMethods: ["GET", "PUT", "PATCH", "DELETE"], description: "Read, update, or remove a role" },
  { pattern: /^roles\/\d+\/permissions$/, allowedMethods: ["GET", "PUT"], description: "Read or replace role permissions" },
  { pattern: /^permissions$/, allowedMethods: ["GET", "POST"], description: "List or create permissions" },
  { pattern: /^permissions\/\d+$/, allowedMethods: ["PUT", "PATCH", "DELETE"], description: "Update or remove a permission" },
  // School resource CRUD. Laravel policies authorize each request.
  { pattern: /^(academic-years|school-classes|courses|assessments|assessment-results)$/, allowedMethods: ["GET", "POST"], description: "List or create school records" },
  { pattern: /^(academic-years|school-classes|courses|assessments|assessment-results)\/\d+$/, allowedMethods: ["GET", "PUT", "PATCH", "DELETE"], description: "Read, update, or remove school records" },
  { pattern: /^academic-years\/current$/, allowedMethods: ["GET"], description: "Read current academic year" },
  { pattern: /^teaching-assignments$/, allowedMethods: ["GET", "POST"], description: "List or create teaching assignments" },
  { pattern: /^teaching-assignments\/expected$/, allowedMethods: ["GET"], description: "List expected teachers" },
  { pattern: /^teaching-assignments\/\d+$/, allowedMethods: ["GET", "DELETE"], description: "Read or remove teaching assignments" },
  { pattern: /^teaching-assignments\/\d+\/end$/, allowedMethods: ["POST"], description: "End a teaching assignment" },
  { pattern: /^enrollments$/, allowedMethods: ["GET", "POST"], description: "List or create enrollments" },
  { pattern: /^enrollments\/(roster|\d+)$/, allowedMethods: ["GET"], description: "Read enrollment roster or detail" },
  { pattern: /^enrollments\/members\/\d+\/(transfer|withdraw)$/, allowedMethods: ["POST"], description: "Transfer or withdraw a student" },
  { pattern: /^promotion\/student\/\d+$/, allowedMethods: ["GET"], description: "Evaluate an individual student promotion" },
  { pattern: /^promotion\/(dry-run|commit)$/, allowedMethods: ["POST"], description: "Simulate or commit student promotions" },
  // 1. Attendance Sessions Collection: GET (list/filter), POST (create session)
  {
    pattern: /^attendance\/sessions$/,
    allowedMethods: ["GET", "POST"],
    description: "List attendance sessions or create new session",
  },
  // 2. Attendance Session Resource: GET (view details with records)
  {
    pattern: /^attendance\/sessions\/\d+$/,
    allowedMethods: ["GET", "DELETE"],
    description: "View or remove attendance session",
  },
  // 3. Attendance Session Roster: GET (resolve expected student roster for session)
  {
    pattern: /^attendance\/sessions\/\d+\/roster$/,
    allowedMethods: ["GET"],
    description: "Retrieve session student roster",
  },
  // 4. Attendance Session Submit: POST (atomic roll-call submission)
  {
    pattern: /^attendance\/sessions\/\d+\/submit$/,
    allowedMethods: ["POST"],
    description: "Submit attendance session marks",
  },
  // 5. Attendance Session Marks Correction: PATCH (24h correction engine)
  {
    pattern: /^attendance\/sessions\/\d+\/marks$/,
    allowedMethods: ["PATCH"],
    description: "Correct attendance session marks",
  },
  // 6. Attendance Session Close: POST (close session)
  {
    pattern: /^attendance\/sessions\/\d+\/close$/,
    allowedMethods: ["POST"],
    description: "Close attendance session",
  },
  // 7. Attendance Daily Summary: GET (summary & absentee list)
  {
    pattern: /^attendance\/summary$/,
    allowedMethods: ["GET"],
    description: "Daily attendance summary and absentee list",
  },
  // 8. School Classes: GET (list classes for teacher/admin dashboard)
  {
    pattern: /^school-classes$/,
    allowedMethods: ["GET"],
    description: "List school classes",
  },
  // 7. School Class Details: GET
  {
    pattern: /^school-classes\/\d+$/,
    allowedMethods: ["GET"],
    description: "View school class details",
  },
  // 8. Courses: GET (list courses for teacher/admin dashboard)
  {
    pattern: /^courses$/,
    allowedMethods: ["GET"],
    description: "List courses",
  },
  // 9. Course Details: GET
  {
    pattern: /^courses\/\d+$/,
    allowedMethods: ["GET"],
    description: "View course details",
  },
  // 10. Members: GET (student roster loading for roll-call in Milestone C)
  {
    pattern: /^members$/,
    allowedMethods: ["GET", "POST"],
    description: "List, register, or update member records",
  },
  // 11. Member Details: GET
  {
    pattern: /^members\/\d+$/,
    allowedMethods: ["GET", "PUT", "PATCH", "DELETE"],
    description: "View, update, or remove a member record",
  },
  // 12. Student Report Card: GET
  {
    pattern: /^report-cards\/student\/\d+$/,
    allowedMethods: ["GET"],
    description: "View student report card",
  },
  // 13. Class Gradebook: GET
  {
    pattern: /^report-cards\/class\/\d+$/,
    allowedMethods: ["GET"],
    description: "View class gradebook",
  },
  // 14. Class Gradebook CSV Export: GET
  {
    pattern: /^report-cards\/class\/\d+\/export\/csv$/,
    allowedMethods: ["GET"],
    description: "Export class gradebook CSV",
  },
  // 15. Class Gradebook Print Document: GET
  {
    pattern: /^report-cards\/class\/\d+\/export\/print$/,
    allowedMethods: ["GET"],
    description: "View printable class gradebook",
  },
  // 16. Payment Rules: GET, POST
  {
    pattern: /^payments\/rules$/,
    allowedMethods: ["GET", "POST"],
    description: "List or configure monthly payment rules",
  },
  // 17. Payment Dashboard Summary: GET
  {
    pattern: /^payments\/export\/(monthly-summary|transactions)$/,
    allowedMethods: ["GET"],
    description: "Export authorized payment reports",
  },
  {
    pattern: /^payments\/dashboard$/,
    allowedMethods: ["GET"],
    description: "View monthly payment reconciliation dashboard",
  },
  // 18. Member Payments Ledger: GET
  {
    pattern: /^payments\/members$/,
    allowedMethods: ["GET"],
    description: "List members monthly payment ledger",
  },
  // 19. Member Payment History: GET
  {
    pattern: /^payments\/members\/\d+$/,
    allowedMethods: ["GET"],
    description: "View member payment history and status",
  },
  // 20. Record Payment: POST
  {
    pattern: /^payments$/,
    allowedMethods: ["POST"],
    description: "Record a member payment transaction",
  },
  // 21. Void Payment: POST
  {
    pattern: /^payments\/\d+\/void$/,
    allowedMethods: ["POST"],
    description: "Void a recorded member payment with reason",
  },
  // 22. Payment Receipt: GET
  {
    pattern: /^payments\/\d+\/receipt$/,
    allowedMethods: ["GET"],
    description: "View printable payment receipt",
  },
];

/**
 * Resolve trusted origins for CSRF origin validation.
 * Origins must be explicitly configured via server environment variables.
 * Never trust origins derived from incoming client request headers (Host, Origin, Referer, or X-Forwarded-*).
 */
export function getTrustedOrigins(customConfiguredOrigins?: string[]): string[] {
  const trusted: Set<string> = new Set();

  const configuredEnv = customConfiguredOrigins ?? [
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const rawVal of configuredEnv) {
    if (!rawVal || typeof rawVal !== "string") {
      continue;
    }

    const trimmed = rawVal.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const u = new URL(trimmed);
      // Only permit http: and https: protocols
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        continue;
      }
      // Reject URLs containing userinfo (credentials)
      if (u.username || u.password) {
        continue;
      }
      // Origin must have a valid non-empty hostname
      if (!u.hostname) {
        continue;
      }
      trusted.add(u.origin);
    } catch {
      // Ignore malformed URL
    }
  }

  // Standard development host origins: only permitted in non-production environments when custom origins are not passed
  if (process.env.NODE_ENV !== "production" && !customConfiguredOrigins) {
    trusted.add("http://localhost:3000");
    trusted.add("http://127.0.0.1:3000");
  }

  return Array.from(trusted);
}

/**
 * Validate incoming request origin for state-changing HTTP methods.
 * Protects against cross-origin forgery on BFF route handlers.
 */
export function validateOriginHeader(
  method: string,
  originHeader: string | null,
  refererHeader: string | null,
  secFetchSiteHeader: string | null,
  trustedOrigins: string[]
): { valid: boolean; status?: number; reason?: string } {
  const upperMethod = method.toUpperCase();

  // Read-only / safe methods do not alter state
  if (upperMethod === "GET" || upperMethod === "HEAD" || upperMethod === "OPTIONS") {
    return { valid: true };
  }

  // Sec-Fetch-Site explicitly indicates cross-site subrequest
  if (secFetchSiteHeader && secFetchSiteHeader === "cross-site") {
    return {
      valid: false,
      status: 403,
      reason: "Forbidden: Cross-site request rejected.",
    };
  }

  // State-changing requests must provide either Origin or Referer
  if (!originHeader && !refererHeader) {
    return {
      valid: false,
      status: 403,
      reason: "Forbidden: Missing Origin and Referer headers on state-changing request.",
    };
  }

  if (originHeader) {
    try {
      const originUrl = new URL(originHeader).origin;
      if (!trustedOrigins.includes(originUrl)) {
        return {
          valid: false,
          status: 403,
          reason: "Forbidden: Untrusted request origin.",
        };
      }
    } catch {
      return {
        valid: false,
        status: 400,
        reason: "Bad Request: Malformed Origin header.",
      };
    }
  } else if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader).origin;
      if (!trustedOrigins.includes(refererUrl)) {
        return {
          valid: false,
          status: 403,
          reason: "Forbidden: Untrusted referer origin.",
        };
      }
    } catch {
      return {
        valid: false,
        status: 400,
        reason: "Bad Request: Malformed Referer header.",
      };
    }
  }

  return { valid: true };
}

/**
 * Validate and sanitize path segments against path traversal and the route allowlist.
 */
export function validateProxyPathAndMethod(
  method: string,
  pathSegments: string[]
): {
  allowed: boolean;
  status?: number;
  normalizedPath?: string;
  reason?: string;
} {
  const upperMethod = method.toUpperCase();

  if (!pathSegments || pathSegments.length === 0) {
    return {
      allowed: false,
      status: 400,
      reason: "Bad Request: Missing API path.",
    };
  }

  // Traversal & character safety checks
  for (const segment of pathSegments) {
    if (segment === "." || segment === ".." || segment.includes("..")) {
      return {
        allowed: false,
        status: 400,
        reason: "Bad Request: Path traversal segments are forbidden.",
      };
    }

    // Check for control characters, slashes, or encoded separator tampering
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f\\/]/.test(segment) || /%00|%2f|%5c/i.test(segment)) {
      return {
        allowed: false,
        status: 400,
        reason: "Bad Request: Malformed path encoding or separators.",
      };
    }
  }

  const normalizedPath = pathSegments.join("/");

  // Match against route allowlist
  for (const rule of ALLOWED_PROXY_ROUTES) {
    if (rule.pattern.test(normalizedPath)) {
      if (!rule.allowedMethods.includes(upperMethod)) {
        return {
          allowed: false,
          status: 405,
          reason: `Method Not Allowed: ${upperMethod} is not permitted for this route.`,
        };
      }
      return {
        allowed: true,
        normalizedPath,
      };
    }
  }

  return {
    allowed: false,
    status: 403,
    reason: "Forbidden: Target API endpoint is not permitted through the proxy.",
  };
}
