export const runtime = 'edge';

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { canPerformAction } from "@/lib/permissions";
import { invalidateCommunity, privateNoStoreHeaders, publicCacheHeaders } from "@/lib/cache";

// GET: Fetch all questions with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const sort = searchParams.get("sort") || "recent"; // recent, popular
  const status = searchParams.get("status") || "all"; // all, open, pinned, closed
  const search = searchParams.get("search") || "";
  // Clamp — NaN or a huge value here turns into a 400 from PostgREST / a full scan.
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

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
        community_answers (
          id,
          content,
          created_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role,
            is_verified
          )
        )
        `,
        { count: "exact" }
      );

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter.
    // The `or()` argument is a PostgREST filter expression, so raw user input
    // could inject extra filters — strip the expression metacharacters first.
    if (search) {
      const safe = search.replace(/[,()"\\{}*%]/g, "").trim();
      if (safe) {
        query = query.or(
          `title.ilike.%${safe}%,content.ilike.%${safe}%,tags.cs.{${safe}}`
        );
      }
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
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    return NextResponse.json({
      questions: data || [],
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
    if (!canPerformAction("create_community_question", profile).allowed) {
      return NextResponse.json({ error: "forbidden" }, { status: 403, headers: privateNoStoreHeaders() });
    }

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400, headers: privateNoStoreHeaders() }
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
        { status: 400, headers: privateNoStoreHeaders() }
      );
    }

    invalidateCommunity(data[0]?.id ?? null);

    return NextResponse.json(data[0], { status: 201, headers: privateNoStoreHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: privateNoStoreHeaders() }
    );
  }
}
