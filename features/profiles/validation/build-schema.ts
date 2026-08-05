import "server-only";

// ─── Dynamic field validation ─────────────────────────────────────────────────
// Compiles a profile_fields row into a Zod schema.
//
// This is the first real use of `zod` in the codebase (installed since the
// start, zero imports — CLAUDE.md §12.7). It is confined to dynamic fields;
// hand-rolled validation elsewhere is untouched by Phase 2.
//
// Unknown-key rejection is NOT done with Zod's strict mode. Incoming keys are
// resolved against the field registry first, and a key that resolves to no
// field is rejected there. That keeps strictness independent of Zod's
// object-mode API.

import { z } from "zod";
import type { RawProfileField } from "../types/raw";

/** Only Cloudinary-hosted media is accepted, matching the CSP in next.config.ts. */
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

interface ValidationBag {
  minLength?: number;
  maxLength?: number;
  pattern?:   string;
  min?:       number;
  max?:       number;
  maxItems?:  number;
}

interface OptionRow {
  value: string;
}

function readOptions(raw: unknown): OptionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o) => o && typeof o === "object" && "value" in (o as object))
    .map((o) => ({ value: String((o as Record<string, unknown>).value) }));
}

function enumValues(field: RawProfileField): [string, ...string[]] | null {
  const values = readOptions(field.options).map((o) => o.value);
  if (values.length === 0) return null;
  return values as [string, ...string[]];
}

export function buildFieldSchema(field: RawProfileField): z.ZodTypeAny {
  const v = (field.validation_schema ?? {}) as ValidationBag;
  let schema: z.ZodTypeAny;

  switch (field.field_type) {
    case "text": {
      let s = z.string().max(v.maxLength ?? 2000);
      if (v.minLength) s = s.min(v.minLength);
      if (v.pattern) {
        try {
          s = s.regex(new RegExp(v.pattern));
        } catch {
          // A malformed pattern in config must not take down validation.
          // The length constraints still apply.
        }
      }
      schema = s;
      break;
    }

    case "number":
      schema = z.number().min(v.min ?? -1e12).max(v.max ?? 1e12);
      break;

    case "boolean":
      schema = z.boolean();
      break;

    case "select": {
      const values = enumValues(field);
      // A select with no options is a config error; reject every value rather
      // than silently accepting anything.
      schema = values ? z.enum(values) : z.never();
      break;
    }

    case "multi_select": {
      const values = enumValues(field);
      schema = values
        ? z.array(z.enum(values)).max(v.maxItems ?? 20)
        : z.array(z.never()).max(0);
      break;
    }

    case "media":
      schema = z.string().url().startsWith(CLOUDINARY_PREFIX);
      break;

    case "json":
      // Structured repeating data. The child shape lives in `options` and is
      // rendered client-side; server-side we bound the size only.
      // TODO(phase-3): compile `options` into a per-child object schema.
      schema = z.array(z.record(z.string(), z.unknown())).max(v.maxItems ?? 25);
      break;

    default:
      schema = z.unknown();
  }

  return field.is_required ? schema : schema.nullable().optional();
}

export interface FieldValidationOutcome {
  ok:      boolean;
  value?:  unknown;
  message?: string;
}

/** Validates one value. Never throws. */
export function validateFieldValue(field: RawProfileField, value: unknown): FieldValidationOutcome {
  // An explicit null clears an optional field.
  if (value === null || value === undefined) {
    if (field.is_required) return { ok: false, message: "required" };
    return { ok: true, value: null };
  }

  const result = buildFieldSchema(field).safeParse(value);
  if (result.success) return { ok: true, value: result.data };

  const first = result.error.issues?.[0];
  return { ok: false, message: first?.message ?? "invalid value" };
}
