export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { invalidateCommunity, privateNoStoreHeaders } from "@/lib/cache";

// PATCH: Update an answer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: privateNoStoreHeaders() }
      );
    }

    const body = await request.json();

    // Check ownership
    const { data: answer } = await supabase
      .from("community_answers")
      .select("user_id, question_id")
      .eq("id", id)
      .single();

    if (!answer || answer.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: privateNoStoreHeaders() }
      );
    }

    const { data, error } = await supabase
      .from("community_answers")
      .update({
        content: body.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role,
          is_verified
        )
        `
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    invalidateCommunity(answer.question_id ?? null);
    return NextResponse.json(data[0], { headers: privateNoStoreHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: privateNoStoreHeaders() }
    );
  }
}

// DELETE: Delete an answer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: privateNoStoreHeaders() }
      );
    }

    // Check ownership
    const { data: answer } = await supabase
      .from("community_answers")
      .select("user_id, question_id")
      .eq("id", id)
      .single();

    if (!answer || answer.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: privateNoStoreHeaders() }
      );
    }

    const { error } = await supabase
      .from("community_answers")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    invalidateCommunity(answer.question_id ?? null);
    return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: privateNoStoreHeaders() }
    );
  }
}
