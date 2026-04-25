import { NextResponse } from "next/server";
import { detectTheme } from "@/lib/theme-engine";
import { getAyahForTheme } from "@/lib/quran";
import { recordReflection } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { input?: string; userId?: string }
      | null;

    const input = body?.input?.trim() ?? "";
    const userId = body?.userId?.trim() || "guest-demo";

    if (!input) {
      return NextResponse.json(
        { error: "Please describe what happened or how you felt." },
        { status: 400 },
      );
    }

    const theme = detectTheme(input);
    const ayah = await getAyahForTheme(theme);
    const stored = await recordReflection(userId, input, theme.id);

    return NextResponse.json({
      input,
      theme,
      ayah,
      explanation: theme.explanation,
      actionSteps: theme.actionSteps,
      dailyGuidance: stored.dailyGuidance,
      progress: stored.progress,
      gainedXp: stored.gainedXp,
      recentEntries: stored.recentEntries,
      storageMode: stored.storageMode,
    });
  } catch (error) {
    console.error("Reflect API failed", error);
    return NextResponse.json(
      { error: "The platform could not generate guidance right now." },
      { status: 500 },
    );
  }
}
