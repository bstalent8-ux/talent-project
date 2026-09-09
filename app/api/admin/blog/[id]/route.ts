export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requirePermission } from "@/lib/auth/permissions";
import { fetchAdminBlogPost, updateBlogPost, deleteBlogPost, slugExists } from "@/features/blog/services/admin-blog.service";
import { parseBlogPostInput } from "@/features/blog/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("blog", "update");
  if (denied) return denied;

  const { id } = await params;
  const existing = await fetchAdminBlogPost(id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const parsed = parseBlogPostInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.input.slug !== existing.slug && (await slugExists(parsed.input.slug, id))) {
    return NextResponse.json({ error: "a post with this slug already exists" }, { status: 409 });
  }

  const result = await updateBlogPost(id, parsed.input, existing.status);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const denied = await requirePermission("blog", "delete");
  if (denied) return denied;

  const { id } = await params;
  const ok = await deleteBlogPost(id);
  if (!ok) return NextResponse.json({ error: "delete failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
