import { NextResponse } from "next/server";
import { saveReflection } from "@/lib/storage";
import { ThemeId } from "@/lib/types";

export const runtime = "nodejs";

const VALID_THEME_IDS: ThemeId[] = [
  "anger",
  "patience",
  "jealousy",
  "honesty",
  "sadness",
  "gratitude",
  "trust",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          title?: string;
          input?: string;
          themeId?: string;
          ayahReference?: string;
        }
      | null;

    const userId = body?.userId?.trim() || "guest-demo";
    const title = body?.title?.trim() ?? "";
    const input = body?.input?.trim() ?? "";
    const ayahReference = body?.ayahReference?.trim() ?? "";
    const themeId = VALID_THEME_IDS.includes(body?.themeId as ThemeId)
      ? (body?.themeId as ThemeId)
      : null;

    if (!title || !input || !ayahReference || !themeId) {
      return NextResponse.json({ error: "Missing reflection details." }, { status: 400 });
    }

    const saved = await saveReflection(userId, {
      title,
      input,
      themeId,
      ayahReference,
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save API failed", error);
    return NextResponse.json({ error: "The reflection could not be saved." }, { status: 500 });
  }
}
