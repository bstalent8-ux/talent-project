import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch all questions with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const sort = searchParams.get("sort") || "recent"; // recent, popular
  const status = searchParams.get("status") || "all"; // all, open, pinned, closed
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = supabase
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
        user_id,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role,
          is_verified
        ),
        community_answers (count)
        `,
        { count: "exact" }
      );

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`
      );
    }

    // Apply sorting
    if (sort === "popular") {
      query = query.order("views", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      questions: data || [],
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

// POST: Create a new question
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { title, content, tags } = body;

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
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("community_questions")
      .insert({
        user_id: user.id,
        title,
        content,
        tags: tags || [],
        status: "open",
      })
      .select();

    if (error) {
      console.error("Supabase error in POST /api/community/questions:", error);
      return NextResponse.json(
        { error: error.message, details: error },
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
