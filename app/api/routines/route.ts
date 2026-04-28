import { NextResponse } from "next/server";
import { createRoutine, getRoutines } from "@/lib/dashboard-storage";
import { RoutineFrequency, ThemeId } from "@/lib/types";

export const runtime = "nodejs";

function isThemeId(value: string): value is ThemeId {
  return [
    "anger",
    "patience",
    "jealousy",
    "honesty",
    "sadness",
    "gratitude",
    "trust",
  ].includes(value);
}

function isFrequency(value: string): value is RoutineFrequency {
  return ["daily", "weekly", "monthly"].includes(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "guest-demo";
    const payload = await getRoutines(userId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Routines API failed", error);
    return NextResponse.json({ error: "Could not load routines." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          title?: string;
          time?: string;
          intention?: string;
          quranConnectionCount?: number;
          completed?: boolean;
          themeId?: string;
          frequency?: string;
        }
      | null;

    const userId = body?.userId?.trim() || "guest-demo";
    const title = body?.title?.trim() ?? "";
    const time = body?.time?.trim() ?? "";
    const intention = body?.intention?.trim() ?? "";
    const themeId = body?.themeId?.trim() ?? "";
    const frequency = body?.frequency?.trim().toLowerCase() ?? "";

    if (!title || !time || !intention || !isThemeId(themeId) || !isFrequency(frequency)) {
      return NextResponse.json({ error: "Invalid routine payload." }, { status: 400 });
    }

    const payload = await createRoutine(userId, {
      title,
      time,
      intention,
      quranConnectionCount:
        typeof body?.quranConnectionCount === "number" && body.quranConnectionCount > 0
          ? body.quranConnectionCount
          : 1,
      completed: Boolean(body?.completed),
      themeId,
      frequency,
    });

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Create routine API failed", error);
    return NextResponse.json({ error: "Could not create routine." }, { status: 500 });
  }
}
