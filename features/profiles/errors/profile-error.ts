// ─── ProfileError ─────────────────────────────────────────────────────────────
// The single error type crossing the service boundary.
//
// Rules (PROFILE_ADAPTER_PHASE2.md §9.3):
//   1. A raw Supabase / PostgREST message NEVER reaches a response body.
//   2. A table name NEVER reaches a response body.
//   3. A hidden profile (suspended / unapproved) is indistinguishable from a
//      nonexistent one, so the API can't be used as a moderation-status oracle.
//   4. Only VALIDATION_FAILED carries `details`, and only field keys plus
//      bilingual copy — never DB constraint text.

import type { DynamicValidationError } from "../types/dto";

export type ProfileErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_PROFILE_TYPE"
  | "PROVIDER_MISMATCH"
  | "NOT_BOOKABLE"
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ProfileErrorCode, number> = {
  NOT_FOUND:            404,
  UNAUTHORIZED:         401,
  FORBIDDEN:            403,
  // An unregistered slug is a data/registry bug, not a client mistake: 500
  // internally, but the public body stays "not found" (rule 2).
  INVALID_PROFILE_TYPE: 500,
  PROVIDER_MISMATCH:    409,
  NOT_BOOKABLE:         403,
  VALIDATION_FAILED:    400,
  CONFLICT:             409,
  INTERNAL:             500,
};

const PUBLIC_MESSAGE_BY_CODE: Record<ProfileErrorCode, string> = {
  NOT_FOUND:            "not found",
  UNAUTHORIZED:         "unauthorized",
  FORBIDDEN:            "forbidden",
  INVALID_PROFILE_TYPE: "not found",
  PROVIDER_MISMATCH:    "profile type mismatch",
  NOT_BOOKABLE:         "forbidden",
  VALIDATION_FAILED:    "validation failed",
  CONFLICT:             "conflict",
  INTERNAL:             "internal error",
};

export interface ProfileErrorBody {
  error:    string;
  details?: DynamicValidationError[];
}

export class ProfileError extends Error {
  readonly code:          ProfileErrorCode;
  readonly status:        number;
  readonly publicMessage: string;
  /** Server-side only. NEVER serialized. */
  readonly internal?:     unknown;
  readonly details?:      DynamicValidationError[];

  constructor(
    code: ProfileErrorCode,
    options: { internal?: unknown; details?: DynamicValidationError[]; publicMessage?: string } = {},
  ) {
    super(options.publicMessage ?? PUBLIC_MESSAGE_BY_CODE[code]);
    this.name          = "ProfileError";
    this.code          = code;
    this.status        = STATUS_BY_CODE[code];
    this.publicMessage = options.publicMessage ?? PUBLIC_MESSAGE_BY_CODE[code];
    this.internal      = options.internal;
    this.details       = options.details;
  }

  /** Body safe to return over the wire. */
  toBody(): ProfileErrorBody {
    return this.details?.length
      ? { error: this.publicMessage, details: this.details }
      : { error: this.publicMessage };
  }

  // ─── Factories ──────────────────────────────────────────────────────────────

  static notFound(internal?: unknown) {
    return new ProfileError("NOT_FOUND", { internal });
  }

  static unauthorized(internal?: unknown) {
    return new ProfileError("UNAUTHORIZED", { internal });
  }

  static forbidden(internal?: unknown) {
    return new ProfileError("FORBIDDEN", { internal });
  }

  static invalidProfileType(typeSlug: string) {
    return new ProfileError("INVALID_PROFILE_TYPE", {
      internal: `no provider registered for profile type "${typeSlug}"`,
    });
  }

  static providerMismatch(expected: string, actual: string) {
    return new ProfileError("PROVIDER_MISMATCH", {
      internal: `expected profile type "${expected}", got "${actual}"`,
    });
  }

  static notBookable(typeSlug: string) {
    return new ProfileError("NOT_BOOKABLE", {
      internal: `profile type "${typeSlug}" is not bookable`,
    });
  }

  static validation(errors: DynamicValidationError[]) {
    return new ProfileError("VALIDATION_FAILED", { details: errors });
  }

  static conflict(publicMessage: string, internal?: unknown) {
    return new ProfileError("CONFLICT", { publicMessage, internal });
  }

  static internal(internal?: unknown) {
    return new ProfileError("INTERNAL", { internal });
  }

  /** Wrap anything thrown below this layer. Never rethrows a raw DB error. */
  static from(e: unknown): ProfileError {
    if (e instanceof ProfileError) return e;
    return ProfileError.internal(e);
  }
}

/**
 * Repositories throw raw Supabase errors; this is the single place they become
 * a ProfileError. Duplicate-key is mapped to CONFLICT so a taken handle does
 * not surface as a 500.
 */
export function fromSupabaseError(error: { code?: string; message?: string } | null): ProfileError {
  if (!error) return ProfileError.internal("unknown supabase error");
  // 23505 = unique_violation
  if (error.code === "23505") return ProfileError.conflict("already taken", error);
  return ProfileError.internal(error);
}
