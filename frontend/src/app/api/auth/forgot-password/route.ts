import { NextRequest, NextResponse } from "next/server";
import { getTrustedOrigins, validateOriginHeader } from "@/lib/bffSecurity";
import { serverApiService } from "@/services/serverApi.service";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export async function POST(request: NextRequest) {
  const origin = validateOriginHeader(request.method, request.headers.get("origin"), request.headers.get("referer"), request.headers.get("sec-fetch-site"), getTrustedOrigins());
  if (!origin.valid) return NextResponse.json({ message: origin.reason || "Forbidden request origin." }, { status: origin.status || 403 });
  try {
    const { email } = await request.json();
    const response = await serverApiService.requestRaw(`${BACKEND_URL}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, data: JSON.stringify({ email }) });
    const data = (() => { try { return JSON.parse(response.data); } catch { return null; } })();
    const ok = response.status >= 200 && response.status < 300;
    return NextResponse.json({ message: data?.message || (ok ? "If the account exists, a reset link has been sent." : "Unable to send a reset link.") }, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to connect to the password recovery service." }, { status: 503 });
  }
}
