import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const storageMode = await getStorageMode();

  return NextResponse.json({
    status: "ok",
    storageMode,
    timestamp: new Date().toISOString(),
  });
}
