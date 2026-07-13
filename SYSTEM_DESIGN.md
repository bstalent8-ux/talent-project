# Talent Marketplace Platform — System Design Document

> **Version:** 2.0  
> **Type:** System Design Specification (SDD)  
> **Date:** June 2026  
> **Source:** Derived from UI/UX mockups (Maya Khaled profile + Brief Wizard)

---

## 1. Project Overview

A professional talent marketplace connecting **models, influencers, UGC creators, and hosts** with **brands and clients** — featuring verified performance metrics, escrow-protected payments, and a structured brief-to-delivery workflow.

**Inspired by:** Fiverr + Upwork model, tailored for the Egyptian/Arab creative talent market.

---

## 2. User Roles

| Role | Description |
|---|---|
| **Talent** | Model, Influencer, UGC Creator, Host — creates profile, sets packages, receives briefs |
| **Client / Brand** | Company or individual looking to hire talent — sends briefs, pays via escrow |
| **Admin** | Platform moderator — approves profiles, verifies campaigns, manages disputes |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Components | Shadcn UI |
| State — Server | TanStack Query |
| State — UI | Zustand |
| Forms & Validation | React Hook Form + Zod |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth (JWT + RLS) |
| Realtime | Supabase Realtime |
| Media Storage | Cloudinary |
| Payments | Stripe Connect (Escrow model) |
| Deployment | Cloudflare Pages |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                      CLIENTS                          │
│  Client Browser  │  Talent Browser  │  Admin Panel   │
└────────────┬─────────────────────────────────────────┘
             │ HTTPS
┌────────────▼─────────────────────────────────────────┐
│                    FRONTEND                           │
│  App Router (SSR + CSR)   │  Shadcn Components        │
│  TanStack Query           │  React Hook Form + Zod    │
│  Zustand (UI state)       │  5-Step Brief Wizard       │
└────────────┬─────────────────────────────────────────┘
             │ fetch / Server Actions
┌────────────▼─────────────────────────────────────────┐
│                   API LAYER                           │
│  /api/v1/*  │  Middleware (Auth + Role + RLS)  │  Zod │
└────────────┬─────────────────────────────────────────┘
             │ Supabase JS SDK
┌────────────▼─────────────────────────────────────────┐
│                   BACKEND                             │
│  Supabase Auth  │  PostgreSQL  │  Realtime            │
│                 │  Edge Functions (notifications, escrow) │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│               EXTERNAL SERVICES                       │
│  Cloudinary (media)  │  Stripe Connect (escrow)       │
│  Resend (email)      │  AI assistant (Claude API)     │
└──────────────────────────────────────────────────────┘
```

---

## 5. Core Features (Extracted from Mockups)

### 5.1 Talent Profile Page

#### Header Section
- Avatar + Full Gallery (up to 12 photos)
- Name, Tier badge (Gold / Silver / Platinum)
- Verified checkmark
- Specialties tags (Model · Fashion · Commercial · Lifestyle)
- Location, Member since date
- Star rating + review count
- Total profile views

#### Trust Badges
- Identity Verified
- Bank Verified
- Phone Verified
- Fast Responder
- Top Rated
- Platform Committed

#### Performance Snapshot (top of profile)
- Total profile views (e.g. 2.1M+)
- Avg. Engagement Rate (CTR)
- Growth % (30-day trend)
- Response Rate %
- Each metric shows trend (+38%, +17%)

#### Response Metrics
- Avg. Reply Time (e.g. 1.2h)
- Response Rate %
- Repeat Clients %

#### Top Campaign Showcase
- Campaign name + brand
- Before / After metric (e.g. CTR 1.3% → 3.6%)
- Video thumbnail
- "View Case Study" link

#### Physical Attributes (for models)
- Height, Size, Weight
- Shoe Size, Hair Color, Eye Color
- Languages, Age Range
- Location

#### Social Proof
- Follower count per platform (Instagram, TikTok, YouTube, LinkedIn)

#### Availability
- Available Now status
- Next Available Date
- Available for: Travel / Runway / Campaigns / Events / UGC

#### Navigation Tabs
1. Overview
2. Portfolio
3. Previous Shoots
4. Verified Through Talents
5. Reviews
6. Packages & Offers
7. About
8. Availability

#### Portfolio Section
- Grid of photos and videos
- Filter: All / Photos / Videos / Runway / Commercial / Editorial / Lookbooks
- Video thumbnails with duration
- "Featured" badge on hero item
- "View all 24" link

#### Previous Shoots (Self-Reported)
- Each item: image, title, type tag, year
- "Self Reported" label with info tooltip
- Option to add proof (link/screenshot)
- Warning: "not verified by Talents platform"

#### Verified Through Talents
- Campaigns completed via platform
- Brand name + logo
- Campaign results: CTR, Views, Engagement
- Star rating from brand
- Quote from brand team
- "Repeat Client" badge

#### Brands Worked With
- Logo grid (noon, Samsung, H&M, L'Oreal, Adidas, SHEIN)

#### Packages & Offers
Three tiers displayed:
- **Starter** — basic package, lowest price
- **Growth** ⭐ Most Popular — mid-tier
- **Premium** — full-service, highest price

Each package shows:
- Name + icon
- Price (EGP)
- What's included (checklist)
- "Select Package" button

#### Usage Rights & Add-ons
- Usage rights: Organic (included) / Paid Ads (3 months +X EGP) / Full Rights (+X EGP)
- Raw Files add-on
- Calculated live in sidebar

#### Sticky Bottom Bar
- Talent avatar + name + rating
- Selected package + add-ons summary
- Estimated total price
- "Continue to Brief →" CTA
- Escrow protection badge

#### Ask Talent (AI Assistant)
- "Ask Maya" section
- "Ask a Question" button → opens chat/AI interface

---

### 5.2 Brief Wizard (5-Step Flow)

**Step 1 — Project Type**
Options (single select):
- Photoshoot (Editorial, Lookbook, Campaign)
- Commercial (Ads, Brand Campaigns)
- UGC / Content (Social Media Content)
- Runway / Show (Fashion Shows, Events)
- Video / Reels (TikTok, Instagram Reels)
- Other (Custom project)

**Step 2 — Project Details**
Fields:
- Project Title
- City (dropdown)
- Shoot Date (date picker)
- Duration (dropdown: 1h, 2h, 4h, 6h, Full Day)
- Number of Looks / Outfits
- Shoot Location (Studio / Outdoor / Both) — radio buttons
- Project Description (textarea)

**Step 3 — Requirements**
Deliverables (multi-select checkboxes):
- Photos
- Videos / Reels
- Behind the Scenes
- Raw Footage

Usage Rights (multi-select):
- Organic Social Media
- Paid Ads
- Website
- Print

Platforms for Paid Ads (shown if Paid Ads selected):
- Instagram
- Facebook
- TikTok
- YouTube
- Other

Additional Notes (optional textarea)

**Step 4 — Budget & Summary**
- Selected package card (image, name, price)
- "Change Package" option
- Add-ons checklist with prices:
  - Additional Look (+700 EGP)
  - Paid Ads Rights — 3 months (+800 EGP)
  - Rush Delivery — 24h (+600 EGP)
  - Travel — Inside Cairo (+1,000 EGP)
- Price Summary sidebar:
  - Package Price
  - Add-ons Total
  - Service Fee (5%)
  - **Total Estimated**
- Escrow protection note

**Step 5 — Review & Submit**
- Project Summary (all fields from steps 1-3)
- Selected Package + Add-ons
- "What happens next?" timeline:
  1. Maya will review and respond
  2. If accepted, escrow will be funded
  3. Work together, receive deliverables
  4. Release payment when satisfied
- "Submit Brief & Invite" button

**After Submission — Confirmation Page**
- "Brief Submitted!" with checkmark animation
- What's Next steps:
  1. Talent reviews brief
  2. If accepted → escrow funded
  3. Project in progress
  4. Approve & release payment
- "Go to Projects" / "Back to Model" buttons

---

### 5.3 Escrow Payment Flow

```
Client selects package + add-ons
  → Submits brief
  → Talent accepts
  → Client funds escrow (Stripe)
  → Work in progress
  → Talent delivers work
  → Client approves deliverables
  → Escrow released to talent
  → (Dispute flow if needed → Admin mediates)
```

States:
- `draft` — brief being created
- `sent` — brief submitted, waiting talent response
- `accepted` — talent accepted, waiting payment
- `escrowed` — payment held, work in progress
- `delivered` — talent submitted deliverables
- `approved` — client approved, payment released
- `disputed` — admin intervention needed
- `cancelled` — cancelled before escrow

---

### 5.4 Marketplace / Explore Page

- Search bar (search talents, services)
- Navigation: Explore / Jobs / Messages / Community / For Brands
- Category filters
- Talent cards with key metrics
- Save / wishlist functionality
- Share profile

---

## 6. Database Design (ERD)

### 6.1 users
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT UNIQUE NOT NULL
role            TEXT NOT NULL CHECK (role IN ('client', 'talent', 'admin'))
full_name       TEXT
avatar_url      TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.2 talent_profiles
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID REFERENCES users(id) ON DELETE CASCADE

-- Basic Info
name              TEXT NOT NULL
bio               TEXT
category          TEXT CHECK (category IN ('model', 'influencer', 'ugc_creator', 'host'))
specialties       TEXT[]   -- ['Fashion', 'Commercial', 'Lifestyle']
location          TEXT
member_since      TIMESTAMPTZ DEFAULT now()

-- Media
avatar_url        TEXT
cover_image_url   TEXT
gallery_urls      TEXT[]   -- up to 12 photos

-- Physical (for models)
height_cm         INT
size              TEXT
weight_kg         INT
shoe_size         TEXT
hair_color        TEXT
eye_color         TEXT
age_range         TEXT     -- '20-30'
languages         TEXT[]   -- ['AR', 'EN']

-- Availability
is_available      BOOLEAN DEFAULT true
next_available    DATE
available_for     TEXT[]   -- ['Travel', 'Runway', 'Campaigns', 'Events', 'UGC']

-- Social Proof
instagram_url     TEXT
instagram_followers INT
tiktok_url        TEXT
tiktok_followers  INT
youtube_url       TEXT
youtube_followers INT
linkedin_url      TEXT
linkedin_followers INT

-- Performance (updated by system)
total_views       INT DEFAULT 0
avg_engagement    FLOAT
avg_ctr           FLOAT
response_rate     FLOAT
avg_reply_hours   FLOAT
repeat_client_pct FLOAT

-- Trust
is_identity_verified  BOOLEAN DEFAULT false
is_bank_verified      BOOLEAN DEFAULT false
is_phone_verified     BOOLEAN DEFAULT false
is_approved           BOOLEAN DEFAULT false
tier                  TEXT CHECK (tier IN ('platinum', 'gold', 'silver'))

-- Ratings
rating            FLOAT DEFAULT 0
reviews_count     INT DEFAULT 0

created_at        TIMESTAMPTZ DEFAULT now()
```

### 6.3 talent_packages
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
talent_id       UUID REFERENCES talent_profiles(id) ON DELETE CASCADE

name            TEXT NOT NULL        -- 'Starter', 'Growth', 'Premium'
icon            TEXT                 -- emoji or icon name
price           NUMERIC NOT NULL
currency        TEXT DEFAULT 'EGP'
description     TEXT
is_popular      BOOLEAN DEFAULT false

-- What's included
includes        JSONB DEFAULT '[]'   -- ['1 Hour Photoshoot', '30 Photos', ...]
shoot_sessions  INT
edited_photos   INT
video_reels     INT
looks           INT
delivery_days   INT
revision_count  INT
revisions_window_hours INT

created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.4 package_addons
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
talent_id       UUID REFERENCES talent_profiles(id)

name            TEXT NOT NULL        -- 'Additional Look', 'Rush Delivery'
price           NUMERIC NOT NULL
unit            TEXT                 -- 'per look', 'per month', 'flat'
category        TEXT CHECK (category IN ('usage_rights', 'delivery', 'travel', 'extra_content'))
```

### 6.5 briefs
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id       UUID REFERENCES users(id)
talent_id       UUID REFERENCES talent_profiles(id)
package_id      UUID REFERENCES talent_packages(id)

-- Step 1
project_type    TEXT CHECK (project_type IN ('photoshoot','commercial','ugc','runway','video','other'))

-- Step 2
title           TEXT NOT NULL
city            TEXT
shoot_date      DATE
duration_hours  FLOAT
looks_count     INT
location_type   TEXT CHECK (location_type IN ('studio','outdoor','both'))
description     TEXT

-- Step 3
deliverables    TEXT[]   -- ['photos', 'videos', 'bts', 'raw']
usage_rights    TEXT[]   -- ['organic', 'paid_ads', 'website', 'print']
paid_platforms  TEXT[]   -- ['instagram', 'facebook', 'tiktok', 'youtube']
notes           TEXT

-- Step 4 - Pricing
selected_addons JSONB    -- [{addon_id, name, price}]
addons_total    NUMERIC
service_fee     NUMERIC
total_price     NUMERIC
currency        TEXT DEFAULT 'EGP'

-- Status
status          TEXT DEFAULT 'draft' CHECK (status IN (
                  'draft','sent','accepted','escrowed',
                  'delivered','approved','disputed','cancelled'))

-- Escrow
stripe_payment_intent_id TEXT
escrow_funded_at  TIMESTAMPTZ
delivered_at      TIMESTAMPTZ
approved_at       TIMESTAMPTZ

created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### 6.6 portfolio_items
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
talent_id       UUID REFERENCES talent_profiles(id) ON DELETE CASCADE

type            TEXT CHECK (type IN ('photo','video'))
url             TEXT NOT NULL
thumbnail_url   TEXT
duration_sec    INT              -- for videos
category        TEXT             -- 'fashion_film', 'commercial', 'editorial'
is_featured     BOOLEAN DEFAULT false
sort_order      INT DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.7 previous_shoots (self-reported)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
talent_id       UUID REFERENCES talent_profiles(id) ON DELETE CASCADE

title           TEXT NOT NULL
type_tag        TEXT             -- 'Runway', 'Editorial', 'Brand Campaign'
year            INT
image_url       TEXT
proof_url       TEXT             -- link/screenshot proof
is_verified     BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.8 verified_campaigns (completed via platform)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
brief_id        UUID REFERENCES briefs(id)
talent_id       UUID REFERENCES talent_profiles(id)
client_id       UUID REFERENCES users(id)

brand_name      TEXT
brand_logo_url  TEXT
campaign_title  TEXT
niche           TEXT             -- 'Skincare', 'Fashion'
completed_at    TIMESTAMPTZ

-- Results
ctr_before      FLOAT
ctr_after       FLOAT
total_views     INT
engagement_rate FLOAT

-- Review
rating          FLOAT
review_text     TEXT
is_repeat_client BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.9 reviews
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
brief_id        UUID REFERENCES briefs(id)
reviewer_id     UUID REFERENCES users(id)
talent_id       UUID REFERENCES talent_profiles(id)

rating          FLOAT NOT NULL CHECK (rating BETWEEN 1 AND 5)
text            TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### 6.10 notifications
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE

type            TEXT   -- 'brief_received', 'brief_accepted', 'payment_escrowed', etc.
title           TEXT
body            TEXT
is_read         BOOLEAN DEFAULT false
meta            JSONB  -- {brief_id, talent_id, ...}
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## 7. User Flows

### 7.1 Client — Hire a Talent
```
1. Browse /explore → search / filter
2. Open talent profile
3. Review portfolio, packages, metrics
4. Select package → sticky bar updates
5. Click "Continue to Brief →"
6. Complete 5-step Brief Wizard
7. Submit brief
8. Talent accepts → client funds escrow
9. Work in progress
10. Talent delivers
11. Client approves → payment released
12. Client leaves review
```

### 7.2 Talent — Receive and Complete a Brief
```
1. Receive brief notification
2. Review brief details (project type, requirements, budget)
3. Accept or decline
4. Client funds escrow
5. Complete the work
6. Submit deliverables via platform
7. Client approves
8. Payment released to talent
```

### 7.3 Talent — Build Profile
```
1. Signup → role = talent
2. Complete profile wizard:
   - Basic info, bio, specialties
   - Physical attributes
   - Social links + follower counts
   - Availability settings
3. Upload portfolio (photos + videos via Cloudinary)
4. Add previous shoots (self-reported)
5. Set 3 packages (Starter / Growth / Premium)
6. Add add-ons and usage rights pricing
7. Submit for admin approval
8. Admin approves → profile goes live
```

### 7.4 Admin — Moderation
```
1. Review pending talent profiles
2. Verify identity documents
3. Approve / reject with reason
4. Verify campaign results (mark as "Verified Through Talents")
5. Handle disputes between client and talent
6. Manage platform settings
```

---

## 8. Data Flow

### 8.1 Brief Wizard State
```
Wizard state lives in Zustand (client-side)
Each step saves to local state
Step 4 calculates price in real-time:
  total = package.price + sum(addons) + (total * 0.05 service fee)
On Submit → POST /api/v1/briefs → saved to DB with status 'sent'
```

### 8.2 Escrow Flow
```
Brief accepted by talent
  → POST /api/v1/payments/create-intent
  → Stripe PaymentIntent created (amount = total_price)
  → Client completes payment on frontend
  → Stripe webhook → /api/v1/webhooks/stripe
  → Brief status updated to 'escrowed'
  → Talent notified via Realtime

Talent submits deliverables
  → Brief status → 'delivered'
  → Client notified

Client approves
  → POST /api/v1/payments/release
  → Stripe Transfer to talent's connected account
  → Brief status → 'approved'
  → Review prompt triggered
```

### 8.3 Performance Metrics Update
```
After each completed brief:
  → Edge Function calculates new averages
  → Updates talent_profiles:
      avg_ctr, avg_engagement, response_rate, repeat_client_pct
  → Recalculates tier (platinum / gold / silver) based on thresholds
```

---

## 9. API Routes

```
/api/v1/
  talents/
    GET    /                    → list talents (with filters)
    GET    /[id]                → full talent profile
    POST   /                    → create profile (talent)
    PATCH  /[id]                → update profile (talent | admin)

  packages/
    GET    /talent/[id]         → packages for a talent
    POST   /                    → create package (talent)
    PATCH  /[id]                → update package
    DELETE /[id]                → delete package

  portfolio/
    POST   /                    → add portfolio item
    DELETE /[id]                → remove item
    PATCH  /[id]/featured       → set as featured

  briefs/
    GET    /                    → list briefs (filtered by role)
    GET    /[id]                → brief detail
    POST   /                    → create/submit brief
    PATCH  /[id]/accept         → talent accepts
    PATCH  /[id]/decline        → talent declines
    PATCH  /[id]/deliver        → talent submits deliverables
    PATCH  /[id]/approve        → client approves
    PATCH  /[id]/dispute        → open dispute

  payments/
    POST   /create-intent       → create Stripe PaymentIntent
    POST   /release             → release escrow to talent
    POST   /webhooks/stripe     → Stripe webhook handler

  reviews/
    POST   /                    → submit review (after approved brief)
    GET    /talent/[id]         → reviews for a talent

  upload/
    POST   /                    → upload to Cloudinary (server-side)

  admin/
    GET    /pending-talents      → pending approval queue
    PATCH  /talents/[id]/approve
    PATCH  /talents/[id]/reject
    GET    /disputes
    PATCH  /disputes/[id]/resolve

  auth/
    POST   /signup
    POST   /login
    POST   /logout
```

---

## 10. Security

| Concern | Solution |
|---|---|
| Data isolation | Supabase RLS per user_id and role |
| Auth | JWT via Supabase Auth, validated in middleware |
| Payments | Stripe handles card data, never touches our server |
| Escrow release | Server-side only, verified brief status before release |
| Media upload | Server-side Cloudinary upload, API key never in client |
| Admin actions | `service_role` key server-side only |
| Zod validation | On every POST/PATCH endpoint |

### Security Checklist
- [ ] RLS: clients see only their own briefs
- [ ] RLS: talents see only briefs directed to them
- [ ] RLS: admin bypass via server `service_role` only
- [ ] Stripe webhook signature verification
- [ ] Escrow release only when `brief.status = 'delivered'`
- [ ] Portfolio upload size/type validation (Cloudinary + Zod)
- [ ] Rate limiting on brief submission and payment endpoints

---

## 11. MVP vs Full Version

### MVP (Ship First)
| Feature | Notes |
|---|---|
| Talent profile (full) | All sections except AI assistant |
| 3-tier packages | Starter / Growth / Premium |
| Add-ons | Static list per talent |
| Brief Wizard (5 steps) | Without escrow — manual payment first |
| Booking status lifecycle | sent → accepted → completed |
| Admin approval | Talent profiles |
| Portfolio upload | Cloudinary |
| Reviews | After completed brief |

### V2 (After Beta)
| Feature | Notes |
|---|---|
| Stripe Escrow | Full automated payment flow |
| Performance metrics | Auto-calculated after campaigns |
| Verified campaigns | Admin verifies results |
| Realtime notifications | Supabase Realtime |
| Availability calendar | Interactive date picker |
| AI assistant ("Ask Talent") | Claude API |
| Physical attributes search | Filter models by height/size |
| Brands worked with | Logo upload + display |

---

## 12. State Management

### Zustand Stores
```
briefWizardStore    → 5-step wizard state (step, formData per step)
uiStore             → modals, sidebar, active tab
authStore           → current user session (mirrors Supabase session)
```

### TanStack Query Keys
```
['talent', id]            → single talent profile
['talents', filters]      → listing with search/filters
['briefs', userId, role]  → briefs list per user
['packages', talentId]    → packages for a talent
['reviews', talentId]     → reviews for a talent
```

---

## 13. Performance Strategy

| Technique | Applied To |
|---|---|
| SSR (Server Components) | Talent profile page, Explore listing |
| Static Generation | Homepage, category pages |
| TanStack Query cache | All client-side navigations |
| Cloudinary transformations | Auto-resize, compress, WebP conversion |
| Lazy loading | Portfolio grid (below fold) |
| Pagination (cursor-based) | Talent listing, reviews |
| Cloudflare Edge cache | Static assets |

---

## 14. Git Workflow

```
main          ← production only
  └── develop ← integration
        ├── feature/brief-wizard
        ├── feature/talent-profile-v2
        ├── feature/packages-addons
        ├── feature/escrow-payments
        └── feature/admin-verification
```

---

## 15. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=                 # server only
CLOUDINARY_API_SECRET=              # server only

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                  # server only
STRIPE_WEBHOOK_SECRET=              # server only

# AI (V2)
ANTHROPIC_API_KEY=                  # server only

# App
NEXT_PUBLIC_APP_URL=
```

---

## 16. Open Questions (Decide Before Building)

- [ ] **Currency:** EGP only, or multi-currency support?
- [ ] **Service fee:** 5% on client side only, or split with talent?
- [ ] **Dispute resolution:** Manual (admin) or automated rules?
- [ ] **AI assistant:** Real-time Claude API, or pre-written FAQ?
- [ ] **Talent tiers (Gold/Silver/Platinum):** Manual admin assignment or auto based on metrics?
- [ ] **Physical attributes:** Required for models only, or optional for all?

---

*Last updated: June 2026 — v2.0 based on UI/UX mockup analysis*
