import { NextRequest, NextResponse } from "next/server";
import { getQuranChapters } from "@/lib/quran-reader";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const payload = await getQuranChapters(forceRefresh);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Quran chapters API failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load Quran chapters." },
      { status: 500 },
    );
  }
}
