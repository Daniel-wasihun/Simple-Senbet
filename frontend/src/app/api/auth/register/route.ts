import { NextRequest, NextResponse } from "next/server";
import { getTrustedOrigins, validateOriginHeader } from "@/lib/bffSecurity";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const origin = validateOriginHeader(request.method, request.headers.get("origin"), request.headers.get("referer"), request.headers.get("sec-fetch-site"), getTrustedOrigins());
  if (!origin.valid) return NextResponse.json({ message: origin.reason || "Forbidden request origin." }, { status: origin.status || 403 });

  const token = request.cookies.get("senbet_token")?.value;
  if (!token) return NextResponse.json({ message: "Sign in with an authorized school administrator account to register users." }, { status: 401 });

  try {
    const incoming = await request.json();
    const body = { name: incoming.name, email: incoming.email, role: incoming.role, password: incoming.password, password_confirmation: incoming.password_confirmation };
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ message: data?.message || "The account could not be registered." }, { status: response.status });
    return NextResponse.json({ message: data?.message, user: data?.user }, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to connect to the school account service." }, { status: 503 });
  }
}
