import { NextRequest, NextResponse } from "next/server";
import { getTrustedOrigins, validateOriginHeader } from "@/lib/bffSecurity";
import { serverApiService } from "@/services/serverApi.service";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const origin = validateOriginHeader(request.method, request.headers.get("origin"), request.headers.get("referer"), request.headers.get("sec-fetch-site"), getTrustedOrigins());
  if (!origin.valid) return NextResponse.json({ message: origin.reason || "Forbidden request origin." }, { status: origin.status || 403 });
  try {
    const incoming = await request.json();
    const body = { token: incoming.token, email: incoming.email, password: incoming.password, password_confirmation: incoming.password_confirmation };
    const response = await serverApiService.requestRaw(`${BACKEND_URL}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, data: JSON.stringify(body) });
    const data = (() => { try { return JSON.parse(response.data); } catch { return null; } })();
    const ok = response.status >= 200 && response.status < 300;
    return NextResponse.json({ message: data?.message || (ok ? "Password updated." : "This reset link is invalid or expired.") }, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to connect to the password recovery service." }, { status: 503 });
  }
}
