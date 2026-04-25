import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";
import { getStorageMode } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const storageMode = await getStorageMode();
  const build = await getBuildInfo();

  return NextResponse.json({
    status: "ok",
    storageMode,
    version: build.appVersion,
    buildTime: build.buildTime,
    commit: build.git.commitShort,
    timestamp: new Date().toISOString(),
  });
}
