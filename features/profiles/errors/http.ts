import "server-only";

// ─── Route-handler error mapping ──────────────────────────────────────────────
// One place where a thrown error becomes a response, so no route can leak a
// raw PostgREST message or a table name (PROFILE_ADAPTER_PHASE2.md §9.3).
//
// Response shape follows the existing admin convention:
//   ZodError → 400 { error, issues }   (app/api/admin/categories/route.ts:50)
//   otherwise → { error } with the ProfileError status.

import { NextResponse } from "next/server";
import { z } from "zod";
import { ProfileError } from "./profile-error";

export function toErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
  }

  const profileError = ProfileError.from(error);

  // internal holds the raw DB error — logged, never serialized.
  if (profileError.status >= 500) {
    console.error(`[${context}]`, profileError.code, profileError.internal);
  } else {
    console.warn(`[${context}]`, profileError.code, profileError.publicMessage);
  }

  return NextResponse.json(profileError.toBody(), { status: profileError.status });
}
