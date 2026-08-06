# Profile Config Admin — Phase 1 Architecture Plan

> **Status:** Plan for review. **No code written.**
> **Depends on:** Phase 1 migrations (`supabase/migrations/20260806_*`), Phase 2 provider layer (`features/profiles/`).
> **Principle:** controlled configuration dashboard. Not a CMS, not a page builder.

---

## 0. What the existing admin surface actually looks like

Inspected before planning. Everything below follows it; nothing new is invented.

| Concern | Existing convention | Source |
|---|---|---|
| Auth (pages) | `app/(admin)/layout.tsx` — `getUser()` → service-role `profiles.role === "admin"` → `redirect("/")` | `app/(admin)/layout.tsx:8-29` |
| Auth (API) | A local `requireAdmin()` copy-pasted into each route: `getUser()` → `profiles.role === "admin"` → `403 { error: "Forbidden" }` | `app/api/admin/categories/route.ts:19-31` |
| Validation | **Zod is already the house pattern for admin config routes** — `categories`, `packages`, `trusted-brands`, `subscriptions`. `z.ZodError` → `400 { error, issues }` | `app/api/admin/categories/route.ts:9-17,50-52` |
| Page shape | `page.tsx` (server, `runtime = "edge"`, `dynamic = "force-dynamic"`) fetches → passes props → `_components/*Client.tsx` | `app/(admin)/admin/categories/page.tsx` |
| Chrome | `<AdminShell title={…}>` wraps every screen | `components/admin/AdminShell.tsx` |
| Layout idiom | **Master–detail two-panel**: `<aside className={styles.panel}>` list + `<section className={styles.panel}>` editor. Not table + modal. | `AdminCategoriesClient.tsx:131-180` |
| Styling | Shared CSS module `admin/packages/_components/AdminPackages.module.css`, imported cross-route by Categories. Classes: `layout, panel, panelHeader, list, form, field, gridTwo, primaryButton, secondaryButton, dangerButton, iconButton, pill, pillActive, muted, status, success, error, rowList, checkboxGrid` | `AdminCategoriesClient.tsx:6` |
| Mutations | Client `fetch("/api/admin/…")` → optimistic local `useState` update → `{ type: "success" \| "error", text }` banner | `AdminCategoriesClient.tsx:80-128` |
| Toggle idiom | `PATCH` with `{ action: "set_active", is_active }`, discriminated by a `safeParse` before the full-object schema | `app/api/admin/categories/[id]/route.ts:19-22,49-56` |
| Bilingual | Flat `const tx = { title: lang === "ar" ? "…" : "…" }` in the client (Categories style) | `AdminCategoriesClient.tsx:53-72` |
| Nav | `NAV_ITEMS` array + `TX.ar` / `TX.en` keys in `AdminSidebar.tsx` | `components/admin/AdminSidebar.tsx:26-68` |
| Available | `ConfirmationModal`, `StatusBadge`, `EmptyState`, `Pagination`, `LoadingSkeleton` | `components/admin/` |

**Correction to CLAUDE.md:** §2 and §12.7 say `zod` has "zero imports". That is stale — 7 files import it today. Requirement 5 (use Zod) is therefore not an adoption; it is following the existing convention. CLAUDE.md needs updating.

---

## 1. Routes

### Admin pages (4 new screens)

```
app/(admin)/admin/profile-types/
├── page.tsx                                   /admin/profile-types
│   └── _components/ProfileTypesClient.tsx
└── [id]/
    ├── sections/
    │   ├── page.tsx                           /admin/profile-types/[id]/sections
    │   └── _components/SectionsClient.tsx
    └── layout/
        ├── page.tsx                           /admin/profile-types/[id]/layout
        └── _components/LayoutOrderClient.tsx

app/(admin)/admin/sections/[id]/fields/
├── page.tsx                                   /admin/sections/[id]/fields
└── _components/
    ├── FieldsClient.tsx
    ├── FieldTypeForm.tsx                      dynamic form per field_type
    ├── OptionsEditor.tsx                      select / multi_select choices
    └── ValidationEditor.tsx                   structured validation_schema
```

Routes match the spec exactly. One note: the folder `[id]/layout/` is a route segment, **not** a Next.js `layout.tsx` — no conflict, but it will read oddly next to real layout files. Flagging so it is a conscious choice.

Auth is inherited from `app/(admin)/layout.tsx` for all four. No per-page auth code.

### API — new namespace, not an extension

No existing admin route touches these tables, and the existing ones are strictly per-entity. Extending them would mean bolting unrelated concerns onto `categories` or `packages`. **New namespace, as you proposed:**

```
app/api/admin/profile-config/
├── types/route.ts                       GET (list, incl. inactive) · POST (create)
├── types/[id]/route.ts                  GET · PATCH · DELETE (guarded)
├── types/[id]/sections/route.ts         GET (incl. disabled) · POST
├── types/[id]/layout/route.ts           GET · PUT (replace)
├── sections/reorder/route.ts            PATCH (batch display_order)
├── sections/[id]/route.ts               PATCH · DELETE (guarded)
├── sections/[id]/fields/route.ts        GET (incl. disabled) · POST
├── fields/reorder/route.ts              PATCH (batch display_order)
└── fields/[id]/route.ts                 PATCH · DELETE (guarded)
```

Reorder is a **batch** endpoint (`[{ id, display_order }]`) rather than N single PATCHes — moving an item shifts several rows, and N round trips on an edge runtime is the wrong shape.

---

## 2. Data flow

```
page.tsx (server, edge)
   └─► profileConfigService.listTypes() / listSections() / listFields() / getLayout()
          └─► dynamicProfileRepository (+ new includeDisabled param)
                 └─► adminClient (service role)
   └─► props ──► *Client.tsx ("use client")
                    │  optimistic useState, exactly as AdminCategoriesClient
                    └─► fetch("/api/admin/profile-config/…")
                           └─► requireAdmin() → Zod parse → guards → repository write
                                  └─► dynamicProfileService.invalidateSchema(slug)
```

### New service: `features/profiles/services/profile-config.service.ts`

Admin-side reads and writes for the config tables. Kept separate from `dynamic-profile.service.ts`, which is the **runtime** read path and must stay lean and cached.

### Repository change required

`dynamicProfileRepository.findSectionsByType` / `findFieldsBySections` currently hard-filter `is_enabled = true` — correct for rendering, wrong for admin. Add an `includeDisabled = false` parameter. Runtime callers are unaffected by the default.

---

## 3. Screen designs

All four are the master–detail two-panel idiom from Categories.

### 3.1 `/admin/profile-types`

- **Left:** list of types. Each row: label, `slug`, pill for active/inactive, pill for bookable, count of profiles using it.
- **Right:** editor.

| Field | Control | Editable? |
|---|---|---|
| `slug` | text | **Create only.** Immutable after — code and `bookings.provider_type` reference it |
| `name` | text | ✅ |
| `name_en` / `name_ar` | text ×2 | ✅ |
| `description` | textarea | ✅ |
| `route_prefix` | text | ✅ (unique) |
| `is_active` | toggle | ✅ **guarded** — see §5 |
| `is_bookable` | toggle | ✅ **guarded** — see §5 |
| `core_table` | read-only | ❌ code-owned |
| `provider_key` | read-only | ❌ code-owned |
| provider status | read-only badge | "Registered" / "**No provider — cannot activate**" |

- Row links: **Sections →** and **Layout →**.
- Delete: enabled only when zero profiles reference the type (§5).

### 3.2 `/admin/profile-types/[id]/sections`

- **Left:** sections ordered by `display_order`, each with ▲▼ buttons, enabled pill, `kind` pill (core/dynamic).
- **Right:** editor — `key` (create-only), `title`, `title_en`, `title_ar`, `description`, `kind` (**create-only**), `weight` (0–100 slider+number), `visibility` (select: public/authenticated/owner/admin), `render_component` (**select from whitelist, never free text**), `icon`, `is_enabled`.
- Link per row: **Fields →** (disabled for `kind = "core"`, which has no dynamic fields by definition).
- Client-side pre-check on `key` uniqueness within the type; server is authoritative.

### 3.3 `/admin/sections/[id]/fields`

- **Left:** fields ordered by `display_order`, with ▲▼, enabled pill, `field_type` pill.
- **Right:** `FieldTypeForm` renders **dynamically from `field_type`**:

| `field_type` | Type-specific controls |
|---|---|
| `text` | `minLength`, `maxLength`, `pattern` |
| `number` | `min`, `max`, `step` |
| `boolean` | none |
| `select` | `OptionsEditor` (**≥1 option required** — DB CHECK enforces it) |
| `multi_select` | `OptionsEditor` + `maxItems` |
| `media` | `accept`; a fixed note that URLs are pinned to the Cloudinary host |
| `json` | child-shape rows (`key`, `field_type`, labels) + `maxItems` |

Shared controls: `key` (create-only), `label`, `label_en`, `label_ar`, placeholders, help text, `is_required`, `weight`, `is_enabled`, `display_order`.

**`validation_schema` and `options` are never raw JSON textareas.** They are structured sub-forms with a read-only JSON preview. A textarea would let an admin write a shape that breaks `buildFieldSchema()` at runtime for every user of that type — precisely the CMS failure mode we are avoiding.

### 3.4 `/admin/profile-types/[id]/layout`

- Two ordered columns, **main** and **sidebar**, built from that type's enabled sections.
- Move ▲▼ within a column, and ⇄ between columns. Unassigned sections sit in an "Available" tray.
- Live preview: a labelled wireframe of block order — **not** a profile render.
- Writes `profile_layouts.layout` as `{ main: [...keys], sidebar: [...keys] }` via `PUT`.

### 3.5 Reordering — no drag-and-drop

Drag-and-drop needs a library (`dnd-kit`, `react-beautiful-dnd`). Requirement: no new dependencies; CLAUDE.md §15.7 forbids heavyweight deps without a recorded decision. **▲▼ buttons + an editable numeric `display_order`.** Zero deps, keyboard-accessible, works under RTL without the transform maths drag-and-drop needs.

### 3.6 Sidebar entry

One new `NAV_ITEMS` row: `{ key: "profileConfig", href: "/admin/profile-types", icon: SlidersHorizontal }`, plus `TX.ar` `"إعدادات الملفات"` / `TX.en` `"Profile Config"`. `isActive` uses `pathname.startsWith`, so all sub-screens highlight it. `/admin/sections/[id]/fields` does not share the prefix — the Fields screen will carry a breadcrumb back to its type.

---

## 4. Server-side validation (Zod)

One schema module, `features/profiles/validation/config-schemas.ts`, imported by every route. Mirrors the DB constraints from `20260806_03`:

- `slug` / `key` — `/^[a-z][a-z0-9_]*$/` (matches the DB CHECK exactly, so a violation is a 400, never a 500)
- `kind` — `enum(["core","dynamic"])`
- `visibility` — `enum(["public","authenticated","owner","admin"])`
- `field_type` — `enum(["text","number","boolean","select","multi_select","media","json"])`
- `weight` — section `int 0–100`; field `int ≥ 0`
- `render_component` — `enum([...SECTION_RENDERER_KEYS])`, a shared const, **not** free text
- `options` — array; **non-empty when `field_type` is `select` or `multi_select`**
- `layout` — `{ main: string[], sidebar: string[] }`, every key resolving to an existing enabled section of that type, no duplicates across columns

Error shape follows the house pattern: `400 { error, issues }` on `ZodError`, `403 { error: "Forbidden" }`, `409 { error }` for guard violations.

---

## 5. Protected fields and guards

The part that separates "controlled config" from "a way to break production".

### Immutable after creation
| Field | Why |
|---|---|
| `profile_types.slug` | Referenced by the code registry **and** FK'd by `bookings.provider_type` |
| `profile_types.core_table`, `provider_key` | Code-owned; the DB must never point at a table with no provider |
| `profile_sections.key` | Core sections are matched by key in `provider.getCompletion()`; renaming silently zeroes a completion section |
| `profile_sections.kind` | `core` ↔ `dynamic` changes which subsystem owns the data |
| `profile_fields.key` | Contract with any client already reading the section |

### Conditional guards
| Action | Guard | Failure |
|---|---|---|
| `is_active = true` on a type | `providerRegistry.hasProvider(slug)` | `409 "no provider registered for this profile type"` |
| `is_bookable = true` | provider exists **and** `provider.meta.bookable` | `409 "provider does not support bookings"` |
| Change `field_type` | zero `profile_values` rows for that field | `409 "field already has stored values"` |
| `DELETE` a field | zero `profile_values` rows; else force `is_enabled = false` | `409 "disable instead of delete"` |
| `DELETE` a section | zero values across its fields; else disable | `409 "disable instead of delete"` |
| `DELETE` a type | zero `profiles.profile_type_id` references | `409 "N profiles use this type"` |
| Create/rename section `key` | unique per `profile_type_id` | `409 "key already exists for this profile type"` |
| Create field `key` | unique per `section_id` | `409` |

**The `is_active` guard is the single most important control here.** `agency` is seeded inactive precisely because no `agency_profiles` table and no `AgencyProvider` exist. Letting an admin flip it on would make `ProfileService` throw `INVALID_PROFILE_TYPE` for every agency profile. The UI shows the reason inline and disables the toggle; the API rejects it regardless.

`DELETE` never hard-deletes anything carrying user data — matching the comment already in `20260806_03`: *"Sections are NEVER hard-deleted once profile_values rows exist."*

---

## 6. Cache invalidation — a constraint to decide on

`dynamicProfileService` caches the schema in a **module-level `Map`, per Cloudflare isolate**, TTL 5 minutes. An admin save can only clear the isolate that served the request. Other isolates keep serving the old schema until their TTL expires.

Options:

| | Approach | Cost | Staleness |
|---|---|---|---|
| **A (recommended)** | Accept the TTL. Call `invalidateSchema()` locally; show "Changes appear for all users within 5 minutes" in the UI | zero | ≤ 5 min |
| B | `profile_types.schema_version` column; the service compares versions on read | +1 query per schema read | ~0 |
| C | Drop the in-memory cache; rely on `unstable_cache` tags | needs the Workers cache spike from Phase 2 §13 first | ~0 |

**Recommend A.** Config changes are rare and administrative; 5 minutes is not a correctness problem, and B adds a query to the hottest read path to solve a problem nobody has yet. Revisit if admins complain.

---

## 7. Build order

| # | Deliverable | Verify |
|---|---|---|
| 1 | `config-schemas.ts` + `SECTION_RENDERER_KEYS` + `includeDisabled` on the repository | `tsc` |
| 2 | `profile-config.service.ts` (reads + guarded writes) | `tsc` |
| 3 | API: `types` + `types/[id]` | manual GET/POST/PATCH/DELETE, guards return 409 |
| 4 | Screen: `/admin/profile-types` + sidebar entry | activate/deactivate, delete blocked |
| 5 | API + screen: sections (incl. `sections/reorder`) | key uniqueness, reorder persists |
| 6 | API + screen: fields, incl. `FieldTypeForm` for all 7 types | each type round-trips |
| 7 | API + screen: layout | invalid keys rejected |
| 8 | Update CLAUDE.md (new routes, new admin area, the stale zod claim) | — |

Each step ships independently; nothing before step 4 is user-visible.

---

## 8. Acceptance criteria

1. Every mutation route: `requireAdmin()` → Zod parse → guards → write. No exceptions.
2. Immutable fields are rejected server-side, not merely hidden in the UI.
3. A type with no registered provider cannot be activated — verified against `agency`.
4. Nothing carrying `profile_values` data can be hard-deleted.
5. `render_component` and `field_type` come from shared enums; a value outside them is a 400.
6. `select` / `multi_select` cannot be saved with zero options (DB CHECK + Zod agree).
7. Reorder is one batch request.
8. Every string is bilingual (`ar` + `en`); the two-panel layout is verified in RTL.
9. No new dependency. No new state library. No new UI framework.
10. `npx tsc --noEmit` and `npm run build` clean.
11. Zero changes to the runtime read path (`dynamic-profile.service.ts` behaviour, providers, `ProfileService`) beyond the additive `includeDisabled` parameter.

---

## 9. Open questions

1. **Cache staleness** — confirm option A (5-minute TTL, no schema-version column).
2. **`kind` on create** — should admins be able to create a `core` section at all? Core sections must have matching provider code, so creating one from the UI produces a section that always scores `false`. **Recommend: creation restricted to `dynamic`; existing core sections editable but not creatable.**
3. **Field-type change** — the guard blocks it once values exist. Should the UI instead offer "disable this field and create a replacement"? Recommend yes, as a later enhancement.
4. **`requireAdmin()` duplication** — it is copy-pasted across ~10 routes. Extract to `lib/admin-auth.ts` and use it in the new routes only, or keep copying for consistency? **Recommend extracting, and not touching existing routes** — a shared auth helper is worth the small inconsistency.
