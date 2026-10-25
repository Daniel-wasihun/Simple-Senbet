import { NextRequest, NextResponse } from "next/server";
import { validateOriginHeader, getTrustedOrigins } from "@/lib/bffSecurity";
import { serverApiService } from "@/services/serverApi.service";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  // Validate origin for state-changing logout requests
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
    const token = request.cookies.get("senbet_token")?.value;

    if (token) {
      try {
        await serverApiService.requestRaw(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Backend failure during logout should not prevent local session termination
      }
    }

    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    response.cookies.set({
      name: "senbet_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Logout completed" },
      { status: 200 }
    );
  }
}
