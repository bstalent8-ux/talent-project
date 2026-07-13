import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch answers for a specific question
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const questionId = searchParams.get("question_id");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!questionId) {
    return NextResponse.json(
      { error: "question_id is required" },
      { status: 400 }
    );
  }

  try {
    const { data, error, count } = await supabase
      .from("community_answers")
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
        `,
        { count: "exact" }
      )
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      answers: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new answer/comment
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { question_id, content } = body;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate input
    if (!question_id || !content) {
      return NextResponse.json(
        { error: "question_id and content are required" },
        { status: 400 }
      );
    }

    // Check if question exists
    const { data: question, error: qError } = await supabase
      .from("community_questions")
      .select("id")
      .eq("id", question_id)
      .single();

    if (qError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("community_answers")
      .insert({
        question_id,
        user_id: user.id,
        content,
      })
      .select(
        `
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
        `
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
