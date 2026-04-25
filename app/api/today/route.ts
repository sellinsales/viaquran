import { NextRequest, NextResponse } from "next/server";
import { getDashboard } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "guest-demo";
    const dashboard = await getDashboard(userId);

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Today API failed", error);
    return NextResponse.json({ error: "The dashboard is temporarily unavailable." }, { status: 500 });
  }
}
