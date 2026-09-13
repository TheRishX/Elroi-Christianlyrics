import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const languages = ["hindi", "nepali", "english"] as const;

export async function POST(request: NextRequest) {
  const secret = process.env.WORDPRESS_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const slug = typeof payload?.slug === "string" ? payload.slug : "";
  const language = languages.includes(payload?.language) ? payload.language : "";

  revalidateTag("songs", "max");
  revalidateTag("search", "max");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  if (language) revalidatePath(`/${language}`);
  if (slug) {
    revalidateTag(`song:${slug}`, "max");
    for (const entry of languages) revalidatePath(`/${entry}/${slug}`);
  }

  return NextResponse.json({
    ok: true,
    revalidated: { slug: slug || null, language: language || null },
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
