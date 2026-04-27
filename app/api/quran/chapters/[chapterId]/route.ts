import { NextRequest, NextResponse } from "next/server";
import { getQuranChapter } from "@/lib/quran-reader";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> },
) {
  try {
    const { chapterId } = await context.params;
    const parsedChapterId = Number(chapterId);

    if (!Number.isInteger(parsedChapterId) || parsedChapterId < 1 || parsedChapterId > 114) {
      return NextResponse.json({ error: "Invalid chapter id." }, { status: 400 });
    }

    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const payload = await getQuranChapter(parsedChapterId, forceRefresh);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Quran chapter API failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load Quran chapter." },
      { status: 500 },
    );
  }
}
