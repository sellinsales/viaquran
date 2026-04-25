import { NextRequest, NextResponse } from "next/server";
import { getDiagnosticsReport } from "@/lib/diagnostics";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const configuredToken = process.env.DIAGNOSTICS_TOKEN?.trim();

  if (!configuredToken) {
    return process.env.NODE_ENV !== "production";
  }

  const requestToken =
    request.nextUrl.searchParams.get("token")?.trim() ||
    request.headers.get("x-diagnostics-token")?.trim();

  return requestToken === configuredToken;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized diagnostics request.",
      },
      { status: 401 },
    );
  }

  try {
    const report = await getDiagnosticsReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("Diagnostics failed", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Diagnostics failed.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
