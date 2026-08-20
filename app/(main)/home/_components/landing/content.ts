import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clapperboard,
  Gem,
  Gift,
  Handshake,
  Headphones,
  Megaphone,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

export type LandingLang = "ar" | "en";

export type Localized<T> = Record<LandingLang, T>;

export type CategoryItem = {
  title: Localized<string>;
  description: Localized<string>;
  count: string;
  icon: LucideIcon;
  image: string;
  /** Not a real signup-able/filterable category yet — shown as a teaser
   * with a "Coming soon" ribbon, not linked to Explore, no real count. */
  comingSoon?: boolean;
  /** Real categories only — which categoryCounts key this maps to. */
  filterKey?: "ugc" | "model";
};

export type StepItem = {
  title: Localized<string>;
  description: Localized<string>;
  icon: LucideIcon;
};

export type FeatureItem = {
  title: Localized<string>;
  description: Localized<string>;
  icon: LucideIcon;
};

export type FAQItem = {
  question: Localized<string>;
  answer: Localized<string>;
};

export const heroMedia = {
  image:
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2200&q=82",
  poster:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=82",
};

export const pageCopy = {
  ar: {
    heroBadge: "منصة موثوقة للمواهب والبراندات",
    headline: "احجز المواهب المناسبة لحملتك في دقائق",
    subtitle:
      "Talents تجمع البراندات مع صنّاع محتوى UGC وموديلز موثّقين — احجز، تعاون، واستلم النتيجة في مكان واحد.",
    primaryCta: "استكشف المواهب",
    secondaryCta: "ابدأ كموهوب",
    searchPlaceholder: "ابحث عن موهبة أو خدمة...",
    searchCategory: "اختر الفئة",
    searchLocation: "الموقع",
    searchBudget: "الميزانية",
    searchAction: "بحث",
    trustedBy: "يثق بنا فرق تسويق وعلامات تجارية تبحث عن نتائج حقيقية",
    showreel: "شاهد العينة",
    verified: "موثقون",
    fast: "استجابة سريعة",
    premium: "حملات مميزة",
    featuredTalents: "مواهب مختارة",
    categories: "تصفح حسب الفئة",
    howItWorks: "كيف تعمل المنصة؟",
    forBrands: "للبراندات",
    forTalents: "للمواهب",
    featuredBrands: "براندات وتجارب حملات",
    features: "كل ما تحتاجه لإدارة التعاون",
    testimonials: "ماذا يقول عملاؤنا؟",
    pricing: "باقات مرنة لكل مرحلة",
    faq: "أسئلة شائعة",
    finalCtaTitle: "جاهز تطلق حملتك القادمة؟",
    finalCtaText:
      "ابدأ بالبحث عن المواهب، راجع البورتفوليو، واحجز التعاون المناسب في تجربة واحدة سلسة.",
    finalCtaPrimary: "ابدأ الآن",
    finalCtaSecondary: "ابدأ كموهوب",
  },
  en: {
    heroBadge: "Trusted talent and brand marketplace",
    headline: "Book the right talent for your campaign in minutes",
    subtitle:
      "Talents connects brands with verified UGC creators and models — book, collaborate, and get the result in one place.",
    primaryCta: "Explore talents",
    secondaryCta: "Join as talent",
    searchPlaceholder: "Search a talent or service...",
    searchCategory: "Choose category",
    searchLocation: "Location",
    searchBudget: "Budget",
    searchAction: "Search",
    trustedBy: "Trusted by marketing teams and brands built around measurable work",
    showreel: "Watch sample",
    verified: "Verified",
    fast: "Fast response",
    premium: "Premium campaigns",
    featuredTalents: "Featured talents",
    categories: "Browse by category",
    howItWorks: "How it works",
    forBrands: "For brands",
    forTalents: "For talents",
    featuredBrands: "Brands and campaign moments",
    features: "Everything to manage collaboration",
    testimonials: "What clients say",
    pricing: "Flexible packages for every stage",
    faq: "FAQ",
    finalCtaTitle: "Ready to launch your next campaign?",
    finalCtaText:
      "Search talent, review portfolios, and book the right collaboration from one focused experience.",
    finalCtaPrimary: "Start now",
    finalCtaSecondary: "Join as talent",
  },
} as const;

// All 4 values are overridden with real numbers in LandingPage.tsx's
// HeroSection (totalTalents / completedProjects / avgRating from the DB) —
// these are only the fallback shown before that data resolves, plus the
// labels. index 2 used to be a fabricated "98% satisfaction" (no
// satisfaction-survey data exists anywhere in the schema); it's real avg
// rating now instead.
export const stats = [
  { value: "0", label: { ar: "موهبة موثقة", en: "Verified talents" } },
  { value: "0", label: { ar: "مشروع مكتمل", en: "Completed projects" } },
  { value: "—", label: { ar: "متوسط التقييم", en: "Avg. rating" } },
  { value: "24/7", label: { ar: "دعم على مدار الساعة", en: "Support coverage" } },
];

// Platform restricted to UGC + Model talents only (matches
// app/(auth)/register/page.tsx's TALENT_TYPES and the Explore filter) — the
// other 5 categories that used to show here (Influencers, Photographers,
// Videographers, Hosts, Designers) don't exist as a signup-able or
// filterable category anymore, so listing them here was actively
// misleading. `count` is intentionally NOT here — LandingPage.tsx injects
// the real per-category count from the DB (see categoryCounts prop).
export const categories: CategoryItem[] = [
  {
    title: { ar: "UGC Creators", en: "UGC Creators" },
    description: { ar: "محتوى أصلي للمنتجات والحملات", en: "Native product and campaign content" },
    count: "",
    icon: Clapperboard,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    filterKey: "ugc",
  },
  {
    title: { ar: "موديلز", en: "Models" },
    description: { ar: "أزياء، جمال، منتجات ولايف ستايل", en: "Fashion, beauty, products and lifestyle" },
    count: "",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    filterKey: "model",
  },
  // Not real categories yet (no signup path, no filter, no real accounts) —
  // shown as "Coming soon" teasers only, per explicit request.
  {
    title: { ar: "عائلات", en: "Family" },
    description: { ar: "أزواج مع أطفالهم لمحتوى عائلي وحملات لايف ستايل", en: "Couples with kids for family and lifestyle campaigns" },
    count: "",
    icon: Users,
    image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=900&q=80",
    comingSoon: true,
  },
  {
    title: { ar: "مروّجين", en: "Promoters" },
    description: { ar: "التواجد في الفعاليات وتوزيع العينات للزوار", en: "Event presence and sampling for visitors" },
    count: "",
    icon: Gift,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
    comingSoon: true,
  },
];

// demoTalents / brandMoments / testimonials were 100% fabricated (fake
// names, fake stock photos, fake quotes) with nothing real behind them.
// Removed entirely — LandingPage.tsx now renders real DB-backed data for
// all three (talents from public-talents.service.ts,
// testimonials/brandMoments from features/landing/services, submitted by
// real users and admin-approved before they show).

export const brandSteps: StepItem[] = [
  {
    title: { ar: "ابحث", en: "Search" },
    description: { ar: "فلتر المواهب حسب الفئة، المدينة، السعر ونوع المحتوى.", en: "Filter by category, city, budget and content style." },
    icon: Search,
  },
  {
    title: { ar: "راجع", en: "Review" },
    description: { ar: "شاهد الأعمال السابقة، التقييمات، والباقات قبل التواصل.", en: "Compare work, ratings and packages before you connect." },
    icon: Star,
  },
  {
    title: { ar: "احجز", en: "Book" },
    description: { ar: "أرسل brief واضح وابدأ التعاون بدون رسائل مشتتة.", en: "Send a clear brief and start without scattered messages." },
    icon: Handshake,
  },
];

export const talentSteps: StepItem[] = [
  {
    title: { ar: "أنشئ ملفك", en: "Create profile" },
    description: { ar: "اعرض خدماتك، أسعارك، وأفضل أعمالك في صفحة قوية.", en: "Present your services, pricing and strongest work." },
    icon: UserRound,
  },
  {
    title: { ar: "استقبل فرصا", en: "Receive opportunities" },
    description: { ar: "وصلك بالبراندات المناسبة بدل مطاردة الفرص يدويا.", en: "Meet matching brands without chasing work manually." },
    icon: BriefcaseBusiness,
  },
  {
    title: { ar: "ابن سمعتك", en: "Build reputation" },
    description: { ar: "تقييمات، أعمال منشورة، وسجل تعاون يزيد ثقة العملاء.", en: "Earn reviews, publish work and grow client trust." },
    icon: BadgeCheck,
  },
];

export const features: FeatureItem[] = [
  {
    title: { ar: "مواهب موثقة", en: "Verified talent" },
    description: { ar: "ملفات مراجعة بعناية مع بيانات واضحة قبل الحجز.", en: "Reviewed profiles with clear data before booking." },
    icon: ShieldCheck,
  },
  {
    title: { ar: "Briefs منظمة", en: "Structured briefs" },
    description: { ar: "حوّل فكرة الحملة إلى طلب واضح قابل للتنفيذ.", en: "Turn campaign intent into an actionable request." },
    icon: Megaphone,
  },
  {
    title: { ar: "مقارنة ذكية", en: "Smart comparison" },
    description: { ar: "قارن الأسعار، التقييمات، التخصصات والأعمال بسرعة.", en: "Compare prices, ratings, specialties and work quickly." },
    icon: Gem,
  },
  {
    title: { ar: "حالة دفع واضحة", en: "Clear payment status" },
    description: { ar: "تأكيد يدوي واضح ينقل الحجز إلى التنفيذ بدون وعود غير مبنية.", en: "Manual confirmation keeps bookings moving without overstating payment automation." },
    icon: WalletCards,
  },
  {
    title: { ar: "تواصل أسرع", en: "Faster communication" },
    description: { ar: "رسائل وتنبيهات تقلل الانتظار بين الطلب والتنفيذ.", en: "Messages and notifications reduce wait time." },
    icon: Headphones,
  },
  {
    title: { ar: "جاهز للحملات", en: "Campaign-ready" },
    description: { ar: "من discovery إلى booking، كل خطوة مصممة للتحويل.", en: "From discovery to booking, every step supports conversion." },
    icon: Zap,
  },
];


export const pricingPackages = [
  {
    name: { ar: "ابدأ", en: "Starter" },
    price: { ar: "مجاني", en: "Free" },
    description: { ar: "للبراندات التي تريد استكشاف المواهب.", en: "For brands exploring talent options." },
  },
  {
    name: { ar: "حملات", en: "Campaigns" },
    price: { ar: "حسب الطلب", en: "Custom" },
    description: { ar: "لإدارة حملة كاملة مع أكثر من موهبة.", en: "For full campaigns with multiple creators." },
  },
  {
    name: { ar: "Talent Pro", en: "Talent Pro" },
    price: { ar: "قريبا", en: "Soon" },
    description: { ar: "أدوات ظهور وتحليل للمواهب المحترفة.", en: "Visibility and analytics for professional talent." },
  },
];

export const faqs: FAQItem[] = [
  {
    question: { ar: "هل يمكن تصفح المواهب بدون حساب؟", en: "Can I browse without an account?" },
    answer: { ar: "نعم، يمكن تصفح الملفات العامة. الحجز والتواصل يتطلبان تسجيل الدخول.", en: "Yes. Public profiles are browsable, while booking and messaging require sign in." },
  },
  {
    question: { ar: "هل المواهب موثقة؟", en: "Are talents verified?" },
    answer: { ar: "المنصة مصممة لتمييز الملفات الموثقة وإظهار التقييمات والبورتفوليو بوضوح.", en: "The platform highlights verified profiles, ratings and portfolio evidence clearly." },
  },
  {
    question: { ar: "هل الصفحة تدعم العربي والإنجليزي؟", en: "Does the page support Arabic and English?" },
    answer: { ar: "نعم، التصميم مبني RTL/LTR وتبديل اللغة موجود ضمن النظام الحالي.", en: "Yes, the layout supports RTL/LTR and follows the existing language switcher." },
  },
  {
    question: { ar: "هل الباقات هنا تنفيذ كامل؟", en: "Are packages fully implemented?" },
    answer: { ar: "الباقات الآن ديناميكية من لوحة التحكم، والاشتراك يتفعل مباشرة بدون ربط دفع في هذه المرحلة.", en: "Packages are now managed dynamically from admin, and subscriptions activate immediately without payment integration in this phase." },
  },
];

export const floatingChips = [
  { ar: "UGC", en: "UGC", icon: Camera },
  { ar: "موديلز", en: "Models", icon: Sparkles },
];

export const quoteIcon = Quote;
export const checkIcon = CheckCircle2;
