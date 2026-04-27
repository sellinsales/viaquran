import { NextResponse } from "next/server";
import { detectTheme } from "@/lib/theme-engine";
import { shareCommunityPost } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          title?: string;
          excerpt?: string;
          anonymous?: boolean;
        }
      | null;

    const userId = body?.userId?.trim() || "guest-demo";
    const title = body?.title?.trim() ?? "";
    const excerpt = body?.excerpt?.trim() ?? "";
    const anonymous = Boolean(body?.anonymous);

    if (!title || !excerpt) {
      return NextResponse.json({ error: "A title and message are required to share." }, { status: 400 });
    }

    const theme = detectTheme(`${title} ${excerpt}`);
    const shared = await shareCommunityPost(userId, {
      title,
      excerpt,
      themeId: theme.id,
      anonymous,
    });

    return NextResponse.json(shared);
  } catch (error) {
    console.error("Share API failed", error);
    return NextResponse.json({ error: "The post could not be shared." }, { status: 500 });
  }
}
