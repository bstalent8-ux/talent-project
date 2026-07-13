# Talent Platform — Implementation Roadmap
> AI-Assisted Development (Claude + Copilot + Codex)  
> Total Estimate: ~10 weeks · Check off tasks daily as you go

---

## How to use this file
- كل يوم افتح الفايل ده واشتغل على الـ tasks اللي في الـ phase الحالية
- لما تخلص task ← حط `x` جوا الـ `[ ]` تبقى `[x]`
- مكملش phase جديدة قبل ما كل checkboxes الـ phase الحالية تتعمل

---

## Phase 0 — Design + Project Setup
> **Estimate: 1 week** (مع AI بيتعمل في نص الوقت)

### UI/UX Design
- [ ] ارسم wireframes للشاشات الـ 8 الأساسية على Figma (أو Excalidraw لو حابب تبدأ سريع)
  - Homepage (hero + featured talents + categories)
  - Talents listing page
  - Talent profile page
  - Booking form
  - Auth pages (signup + login)
  - Client dashboard
  - Talent dashboard
  - Admin dashboard
- [ ] حدد الـ Design System: ألوان، fonts، spacing، border-radius
- [ ] عمل mobile layout لكل شاشة

### Project Setup
- [ ] تأكد إن Next.js 15 شغال (`npm run dev`)
- [ ] نزّل الـ packages الناقصة:
  ```bash
  npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers
  npm install @supabase/ssr @supabase/supabase-js
  npx shadcn@latest init
  ```
- [ ] Setup الـ folder structure:
  ```
  src/
    app/
      (auth)/
      (dashboard)/
      (public)/
    components/
      ui/          ← shadcn components
      shared/      ← Navbar, Footer, Cards
      forms/
    lib/
      supabase/
      validations/
    hooks/
    stores/        ← zustand stores
    types/
  ```
- [ ] Supabase: اعمل الـ tables الجديدة (users + talent_profiles) حسب الـ ERD في SYSTEM_DESIGN.md
- [ ] حط الـ env vars في `.env.local`
- [ ] تأكد إن الـ Supabase client شغال (عمل test query)
- [ ] Git: ابعت الـ initial setup على develop branch

---

## Phase 1 — Static Frontend (UI Only)
> **Estimate: 2 weeks** (مع Copilot + Claude بيتعملوا بسرعة)

### Shared Components
- [ ] Navbar (مع navigation links + auth state)
- [ ] Footer
- [ ] TalentCard component (صورة، اسم، category، tier badge، rating)
- [ ] PackageCard component (اسم الباكدج، السعر، الوصف)
- [ ] CategoryBadge + TierBadge
- [ ] LoadingSpinner / Skeleton loaders
- [ ] Modal component (reusable)

### Pages — Dummy Data
- [ ] Homepage: hero section + featured talents grid + categories
- [ ] `/talents` — listing page مع filter bar وsearch input
- [ ] `/talents/[id]` — profile page (bio, packages, portfolio, booking button)
- [ ] `/login` و `/signup` — auth pages (forms فقط، بدون logic)
- [ ] `/dashboard/client` — الحجزات بتاعت الكلاينت
- [ ] `/dashboard/talent` — الطلبات الواردة على التالنت
- [ ] `/admin` — قائمة talents pending + bookings

### Quality Check
- [ ] كل شاشة تتعرض صح على mobile (375px)
- [ ] كل شاشة تتعرض صح على desktop (1280px)
- [ ] مفيش TypeScript errors
- [ ] الـ dummy data واضحة ومنطقية

---

## Phase 2 — MVP Backend Integration
> **Estimate: 4 weeks** (أطول phase لأن فيها أكتر logic)

### Auth System
- [ ] Supabase Auth: signup بـ email + password
- [ ] بعد الـ signup: insert في `users` table بالـ role
- [ ] Login + redirect حسب الـ role (client → /dashboard/client، talent → /dashboard/talent)
- [ ] Logout
- [ ] Next.js Middleware: حمي الـ routes المحتاجة auth
- [ ] `useUser()` hook يرجع الـ current user وroleh

### Talents Module
- [ ] Fetch talents من Supabase بـ SSR على `/talents`
- [ ] Fetch single talent على `/talents/[id]`
- [ ] Talent يقدر يعمل/يعدل بروفايله من الـ dashboard
- [ ] Media upload: صور وفيديو بـ Cloudinary عبر `/api/v1/upload`

### Booking Module
- [ ] Client يبعت booking request من profile page
- [ ] Zod schema للـ booking form validation
- [ ] POST `/api/v1/bookings` → insert في Supabase
- [ ] Talent يشوف الطلبات الواردة في الـ dashboard
- [ ] Talent يقبل أو يرفض الطلب (status: accepted / rejected)
- [ ] Client يشوف status حجزاته في الـ dashboard

### Admin Module
- [ ] Admin يشوف كل الـ talents اللي status بتاعتهم pending
- [ ] Admin يعمل approve / reject للـ talent profile
- [ ] Admin يشوف كل الـ bookings
- [ ] RLS policies: تأكد إن كل دور يشوف بياناته بس

### Forms & Validation
- [ ] كل form بتستخدم React Hook Form + Zod
- [ ] Error messages واضحة للـ user
- [ ] Loading states على كل الـ buttons

---

## Phase 3 — Beta Launch
> **Estimate: 2 weeks**

### Deploy
- [ ] Build بدون errors (`npm run build`)
- [ ] Deploy على Cloudflare Pages
- [ ] Domain مربوط (أو Cloudflare subdomain مؤقتاً)
- [ ] ENV vars محطوطة في Cloudflare dashboard
- [ ] Test الـ production build كامل

### Onboarding
- [ ] Onboard أول 5 talents يدوياً (ساعدهم يكملوا البروفايل)
- [ ] Invite 10–15 beta testers (clients)
- [ ] Approve الـ talent profiles من Admin dashboard

### Monitoring
- [ ] Sentry للـ error tracking (أو Cloudflare Analytics)
- [ ] Lighthouse audit: Performance + Accessibility + SEO
- [ ] تأكد Core Web Vitals مقبولة (LCP < 2.5s)

### Feedback Loop
- [ ] اجمع feedback من الـ beta users (Google Form بسيط)
- [ ] اعمل قائمة بالـ bugs والمشاكل
- [ ] صلح الـ critical bugs (اللي بتمنع الاستخدام)
- [ ] صلح الـ UI issues الكبيرة

---

## Phase 4 — V2 Features
> **Estimate: 3 weeks+** (بتبدأ بعد ما الـ Beta مستقر)

### Realtime Notifications
- [ ] Supabase Realtime: subscribe على تغييرات الـ bookings
- [ ] Notification badge في الـ Navbar
- [ ] Toast notification لما يجي طلب جديد أو يتقبل

### Reviews & Ratings
- [ ] بعد الـ booking يبقى completed، الـ client يقدر يعمل review
- [ ] عرض الـ rating على الـ talent profile
- [ ] حساب الـ average rating تلقائياً

### Campaigns Module
- [ ] Brand ينشر campaign (title، budget، description)
- [ ] Talent يشوف الـ campaigns ويتقدم عليها
- [ ] Brand يشوف الـ applications

### Advanced Search
- [ ] فلتر بـ category، tier، price range، rating
- [ ] Sort: highest rated، most booked، newest

### Email Notifications
- [ ] Resend أو SendGrid setup
- [ ] Email لما الـ booking يتقبل أو يترفض
- [ ] Email welcome لما talent يتعمله approve

---

## Dependency Order
```
Auth → Talent Profiles → Bookings → Admin → Beta Launch → V2
```
> مكملش step قبل اللي قبله يشتغل 100%

---

## AI Workflow Tips
- **Claude**: System design, architecture decisions, complex logic, code review
- **Copilot**: Autocomplete أثناء الكتابة، boilerplate، repetitive components
- **Codex**: Generate complete components من description، refactor كود

---

*Last updated: June 2026*
