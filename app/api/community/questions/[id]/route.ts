import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch a specific question with all its answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // Fetch question with answers
    const { data: question, error: qError } = await supabase
      .from("community_questions")
      .select(
        `
        id,
        title,
        content,
        tags,
        views,
        status,
        created_at,
        updated_at,
        user_id,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role,
          is_verified
        ),
        community_answers (
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role,
            is_verified
          )
        )
        `
      )
      .eq("id", id)
      .single();

    if (qError) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Increment views
    await supabase
      .from("community_questions")
      .update({ views: (question.views || 0) + 1 })
      .eq("id", id);

    return NextResponse.json(question);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update a question
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
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check ownership
    const { data: question } = await supabase
      .from("community_questions")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!question || question.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("community_questions")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a question
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
        { status: 401 }
      );
    }

    // Check ownership
    const { data: question } = await supabase
      .from("community_questions")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!question || question.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("community_questions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
