export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { createBlogPost, slugExists } from "@/features/blog/services/admin-blog.service";
import { parseBlogPostInput } from "@/features/blog/validation";

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("blog", "create");
  if (denied) return denied;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const parsed = parseBlogPostInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (await slugExists(parsed.input.slug)) {
    return NextResponse.json({ error: "a post with this slug already exists" }, { status: 409 });
  }

  const result = await createBlogPost(parsed.input, user.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
