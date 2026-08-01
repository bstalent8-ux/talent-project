export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { canPerformAction } from "@/lib/permissions";
import { invalidateCommunity, privateNoStoreHeaders, publicCacheHeaders } from "@/lib/cache";

// GET: Fetch answers for a specific question
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const questionId = searchParams.get("question_id");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

  if (!questionId) {
    return NextResponse.json(
      { error: "question_id is required" },
      { status: 400, headers: privateNoStoreHeaders() }
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
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    return NextResponse.json({
      answers: data || [],
      total: count || 0,
      limit,
      offset,
    }, { headers: publicCacheHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: privateNoStoreHeaders() }
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
        { status: 401, headers: privateNoStoreHeaders() }
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, account_status, is_suspended")
      .eq("id", user.id)
      .single();
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500, headers: privateNoStoreHeaders() });
    }
    if (!canPerformAction("create_community_answer", profile).allowed) {
      return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
    }

    // Validate input
    if (!question_id || !content) {
      return NextResponse.json(
        { error: "question_id and content are required" },
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    // Check if question exists
    const { data: question, error: qError } = await supabase
      .from("community_questions")
      .select("id")
      .eq("id", question_id)
      .single();

    if (qError) {
      const status = qError.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: status === 404 ? "question not found" : qError.message },
        { status, headers: privateNoStoreHeaders() }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: "question not found" },
        { status: 404, headers: privateNoStoreHeaders() }
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
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    invalidateCommunity(question_id);

    return NextResponse.json(data[0], { status: 201, headers: privateNoStoreHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: privateNoStoreHeaders() }
    );
  }
}
