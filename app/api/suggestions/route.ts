import { NextRequest, NextResponse } from "next/server";
import { suggestSongs } from "@/lib/api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ items: [] });
  if (query.length > 120)
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  return NextResponse.json(
    { items: await suggestSongs(query) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
