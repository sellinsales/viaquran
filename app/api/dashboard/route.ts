import { NextRequest, NextResponse } from "next/server";
import { getRoutineDashboard } from "@/lib/dashboard-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "guest-demo";
    const payload = await getRoutineDashboard(userId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Dashboard API failed", error);
    return NextResponse.json({ error: "The dashboard is temporarily unavailable." }, { status: 500 });
  }
}
