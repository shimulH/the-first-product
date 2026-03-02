import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/facebook/webhook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const psid = searchParams.get("psid")?.trim();

  if (!psid) {
    return NextResponse.json({ error: "psid query parameter is required." }, { status: 400 });
  }

  let pageAccessToken: string;
  try {
    pageAccessToken = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  } catch {
    return NextResponse.json({ error: "FACEBOOK_PAGE_ACCESS_TOKEN is not configured." }, { status: 500 });
  }

  const profileUrl = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(psid)}`);
  profileUrl.searchParams.set("fields", "first_name,last_name,profile_pic");
  profileUrl.searchParams.set("access_token", pageAccessToken);

  const facebookResponse = await fetch(profileUrl.toString());
  const responseData: unknown = await facebookResponse.json().catch(() => null);

  if (!facebookResponse.ok) {
    return NextResponse.json(
      {
        error: "Failed to fetch user profile from Facebook.",
        details: responseData,
      },
      { status: facebookResponse.status },
    );
  }

  return NextResponse.json({
    profile: responseData,
  });
}
