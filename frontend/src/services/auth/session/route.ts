import { NextRequest, NextResponse } from "next/server";
import { serverApiService } from "@/services/serverApi.service";

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("senbet_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const backendRes = await serverApiService.requestRaw(`${BACKEND_URL}/api/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (backendRes.status < 200 || backendRes.status >= 300) {
      const response = NextResponse.json({ user: null }, { status: 401 });
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
    }

    const data = JSON.parse(backendRes.data);
    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json(
      { message: "Backend service unreachable" },
      { status: 503 }
    );
  }
}
