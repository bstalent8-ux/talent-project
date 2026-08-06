export const runtime = "edge";

// ─── GET /api/profile/completion ──────────────────────────────────────────────
// The signed-in user's completion state, computed by THEIR provider.
//
// Exists because completion was previously computed in the browser by
// ProfileCompletionCard importing calculateCompletion() directly — which hardcodes
// the talent weights, so a brand was scored against portfolio and packages it can
// never have. Moving the computation behind the provider is what makes the score
// provider-specific without the card knowing any profile type exists.
//
// Own-profile only. There is no `?userId=` parameter on purpose: completion
// exposes which parts of a profile are unfinished, which is not public data.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { privateNoStoreHeaders } from "@/lib/cache";
import { profileService } from "@/features/profiles";
import { toErrorResponse } from "@/features/profiles/errors/http";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: privateNoStoreHeaders() },
      );
    }

    const completion = await profileService.getCompletion(user.id);

    return NextResponse.json({ data: completion }, { headers: privateNoStoreHeaders() });
  } catch (e) {
    // An admin (or any typeless profile) has no completion. That is NOT_FOUND
    // from the service, and a 404 here rather than a 500 — the admin back-office
    // is simply not a profile surface.
    const response = toErrorResponse(e, "profile/completion");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
