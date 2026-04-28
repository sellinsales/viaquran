import { NextResponse } from "next/server";
import { updateRoutine } from "@/lib/dashboard-storage";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          completed?: boolean;
        }
      | null;

    const userId = body?.userId?.trim() || "guest-demo";
    if (!id) {
      return NextResponse.json({ error: "Routine id is required." }, { status: 400 });
    }

    const payload = await updateRoutine(userId, id, {
      completed: typeof body?.completed === "boolean" ? body.completed : undefined,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Update routine API failed", error);
    return NextResponse.json({ error: "Could not update routine." }, { status: 500 });
  }
}
