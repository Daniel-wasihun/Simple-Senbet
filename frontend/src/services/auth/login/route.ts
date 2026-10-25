import { NextRequest, NextResponse } from "next/server";
import { validateOriginHeader, getTrustedOrigins } from "@/lib/bffSecurity";
import { serverApiService } from "@/services/serverApi.service";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  // Validate origin for login attempts
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

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 422 }
      );
    }

    const backendRes = await serverApiService.requestRaw(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: JSON.stringify({
        email,
        password,
        device_name: "nextjs-browser-session",
      }),
    });

    const data = (() => { try { return JSON.parse(backendRes.data); } catch { return null; } })();

    if (backendRes.status < 200 || backendRes.status >= 300) {
      return NextResponse.json(
        { message: data?.message || "Invalid credentials provided." },
        { status: backendRes.status }
      );
    }

    const token = data.token;
    const user = data.user;

    const response = NextResponse.json({
      message: data.message || "Logged in successfully",
      user,
    });

    // Store token in an httpOnly, SameSite=Lax cookie.
    // Inaccessible to client JavaScript, mitigating token theft via XSS.
    response.cookies.set({
      name: "senbet_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the authentication server. Please try again later." },
      { status: 503 }
    );
  }
}
