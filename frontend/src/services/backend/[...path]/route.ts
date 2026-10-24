import { NextRequest, NextResponse } from "next/server";
import {
  validateOriginHeader,
  validateProxyPathAndMethod,
  getTrustedOrigins,
} from "@/lib/bffSecurity";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  // 1. SEC-01: CSRF & Origin Validation on mutating requests
  const trustedOrigins = getTrustedOrigins();
  const originCheck = validateOriginHeader(
    request.method,
    request.headers.get("origin"),
    request.headers.get("referer"),
    request.headers.get("sec-fetch-site"),
    trustedOrigins
  );

  if (!originCheck.valid) {
    return NextResponse.json(
      { message: originCheck.reason || "Forbidden: Invalid request origin." },
      { status: originCheck.status || 403 }
    );
  }

  // 2. SEC-02: Route allowlist and path traversal validation
  const { path } = await params;
  const routeCheck = validateProxyPathAndMethod(request.method, path);

  if (!routeCheck.allowed) {
    return NextResponse.json(
      { message: routeCheck.reason || "Forbidden: Unpermitted endpoint." },
      { status: routeCheck.status || 403 }
    );
  }

  // 3. Build safe target URL strictly anchored to BACKEND_URL
  const targetUrl = new URL(`/api/${routeCheck.normalizedPath}`, BACKEND_URL);

  // Preserve sanitized query parameters
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    // Reject control characters or newlines in query params
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f]/.test(key) || /[\x00-\x1f\x7f]/.test(value)) {
      return NextResponse.json(
        { message: "Bad Request: Malformed query parameters." },
        { status: 400 }
      );
    }
    targetUrl.searchParams.append(key, value);
  }

  // 4. Header filtering: only forward Accept, Content-Type, and Authorization
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const token = request.cookies.get("senbet_token")?.value;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  try {
    const backendRes = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    });

    const responseData = await backendRes.text();
    return new NextResponse(responseData, {
      status: backendRes.status,
      headers: {
        "Content-Type": backendRes.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Backend API service unreachable" },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}
