import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clapperboard,
  Gem,
  Handshake,
  Headphones,
  Megaphone,
  Mic2,
  Paintbrush,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
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
};

export type DemoTalent = {
  name: Localized<string>;
  profession: Localized<string>;
  city: Localized<string>;
  rating: string;
  price: Localized<string>;
  image: string;
  portfolio: string[];
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

export type TestimonialItem = {
  quote: Localized<string>;
  name: Localized<string>;
  role: Localized<string>;
  image: string;
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
      "Talents تجمع البراندات مع مؤثرين، UGC creators، مصورين، موديلز ومقدمي برامج موثقين لتصميم حملات أسرع وأكثر احترافية.",
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
    finalCtaSecondary: "تصفح المواهب",
  },
  en: {
    heroBadge: "Trusted talent and brand marketplace",
    headline: "Book the right talent for your campaign in minutes",
    subtitle:
      "Talents connects brands with verified influencers, UGC creators, photographers, models and hosts for faster, sharper campaigns.",
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
    finalCtaSecondary: "Browse talents",
  },
} as const;

export const stats = [
  { value: "+12,500", label: { ar: "موهبة موثقة", en: "Verified talents" } },
  { value: "+3,200", label: { ar: "مشروع مكتمل", en: "Completed projects" } },
  { value: "98%", label: { ar: "معدل رضا العملاء", en: "Client satisfaction" } },
  { value: "24/7", label: { ar: "دعم على مدار الساعة", en: "Support coverage" } },
];

export const trustedBrands = ["Nexa", "Aurora", "Cairo Lab", "Studio 9", "Misk", "Pulse"];

export const categories: CategoryItem[] = [
  {
    title: { ar: "مؤثرون", en: "Influencers" },
    description: { ar: "صناع تأثير عبر المنصات الاجتماعية", en: "Social-first reach and influence" },
    count: "+2,450",
    icon: UsersRound,
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "UGC Creators", en: "UGC Creators" },
    description: { ar: "محتوى أصلي للمنتجات والحملات", en: "Native product and campaign content" },
    count: "+1,620",
    icon: Clapperboard,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "مصورون", en: "Photographers" },
    description: { ar: "تصوير منتجات، بورتريه وفعاليات", en: "Product, portrait and event shoots" },
    count: "+1,880",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "مخرجو فيديو", en: "Videographers" },
    description: { ar: "إعلانات قصيرة، ريلز وتغطيات", en: "Reels, short ads and coverage" },
    count: "+1,320",
    icon: Clapperboard,
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "مقدمون", en: "Hosts" },
    description: { ar: "تقديم فعاليات، بث مباشر وفيديو", en: "Events, live sessions and video hosting" },
    count: "+980",
    icon: Mic2,
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "موديلز", en: "Models" },
    description: { ar: "أزياء، جمال، منتجات ولايف ستايل", en: "Fashion, beauty, products and lifestyle" },
    count: "+1,250",
    icon: Sparkles,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "مصممون", en: "Designers" },
    description: { ar: "هوية، سوشيال، موشن وواجهات", en: "Brand, social, motion and digital design" },
    count: "+740",
    icon: Paintbrush,
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
  },
];

export const demoTalents: DemoTalent[] = [
  {
    name: { ar: "هيا الفاهدي", en: "Haya Al Fahdi" },
    profession: { ar: "عارضة أزياء", en: "Fashion model" },
    city: { ar: "الرياض", en: "Riyadh" },
    rating: "4.9",
    price: { ar: "من 6,500 ر.س", en: "From SAR 6,500" },
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    portfolio: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=75",
    ],
  },
  {
    name: { ar: "سالم باحمد", en: "Salem Bahamed" },
    profession: { ar: "مخرج محتوى", en: "Content director" },
    city: { ar: "دبي", en: "Dubai" },
    rating: "4.8",
    price: { ar: "من 2,800 ر.س", en: "From SAR 2,800" },
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    portfolio: [
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=75",
    ],
  },
  {
    name: { ar: "نورة السبيعي", en: "Nora Al Subaie" },
    profession: { ar: "مؤثرة جمال", en: "Beauty creator" },
    city: { ar: "جدة", en: "Jeddah" },
    rating: "5.0",
    price: { ar: "من 4,000 ر.س", en: "From SAR 4,000" },
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    portfolio: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=75",
    ],
  },
  {
    name: { ar: "فهد الدوسري", en: "Fahad Al Dosari" },
    profession: { ar: "مصمم ومصور", en: "Designer and photographer" },
    city: { ar: "القاهرة", en: "Cairo" },
    rating: "4.9",
    price: { ar: "من 3,200 ر.س", en: "From SAR 3,200" },
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
    portfolio: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=75",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=75",
    ],
  },
];

export const brandMoments = [
  {
    title: { ar: "إطلاق عطر فاخر", en: "Luxury fragrance launch" },
    location: { ar: "الرياض", en: "Riyadh" },
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "حملة جمال ولايف ستايل", en: "Beauty and lifestyle campaign" },
    location: { ar: "دبي", en: "Dubai" },
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: { ar: "تصوير منتجات تقني", en: "Tech product production" },
    location: { ar: "القاهرة", en: "Cairo" },
    image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=900&q=80",
  },
];

export const brandSteps: StepItem[] = [
  {
    title: { ar: "ابحث واستكشف", en: "Search and discover" },
    description: { ar: "فلتر المواهب حسب الفئة، المدينة، السعر ونوع المحتوى.", en: "Filter by category, city, budget and content style." },
    icon: Search,
  },
  {
    title: { ar: "راجع البورتفوليو", en: "Review portfolios" },
    description: { ar: "شاهد الأعمال السابقة، التقييمات، والباقات قبل التواصل.", en: "Compare work, ratings and packages before you connect." },
    icon: Star,
  },
  {
    title: { ar: "احجز وابدأ", en: "Book and launch" },
    description: { ar: "أرسل brief واضح وابدأ التعاون بدون رسائل مشتتة.", en: "Send a clear brief and start without scattered messages." },
    icon: Handshake,
  },
];

export const talentSteps: StepItem[] = [
  {
    title: { ar: "أنشئ ملفك", en: "Create your profile" },
    description: { ar: "اعرض خدماتك، أسعارك، وأفضل أعمالك في صفحة قوية.", en: "Present your services, pricing and strongest work." },
    icon: UserRound,
  },
  {
    title: { ar: "استقبل فرصا مناسبة", en: "Receive relevant briefs" },
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
    title: { ar: "مدفوعات آمنة", en: "Secure payments" },
    description: { ar: "تجربة دفع وحجز قابلة للتوسع مع نمو المنصة.", en: "A scalable payment and booking foundation." },
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

export const testimonials: TestimonialItem[] = [
  {
    quote: {
      ar: "اختصرنا وقت البحث من أسبوعين إلى يوم واحد، وجودة الملفات خلت قرار الحجز أسهل.",
      en: "We reduced talent search from two weeks to one day, and profiles made booking decisions easier.",
    },
    name: { ar: "سارة القحطاني", en: "Sara Al Qahtani" },
    role: { ar: "مديرة تسويق", en: "Marketing lead" },
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote: {
      ar: "أول مرة أحس إن منصة مواهب عربية شكلها وflow بتاعها مناسب لشغل enterprise.",
      en: "It finally feels like an Arabic talent marketplace that can support serious enterprise work.",
    },
    name: { ar: "علي المهندس", en: "Ali El Mohandes" },
    role: { ar: "مؤسس وكالة إبداعية", en: "Creative agency founder" },
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote: {
      ar: "البورتفوليو والتقييمات خلونا نختار الشخص المناسب بدون مكالمات طويلة.",
      en: "Portfolios and reviews helped us choose the right person without long discovery calls.",
    },
    name: { ar: "منى عادل", en: "Mona Adel" },
    role: { ar: "Brand manager" , en: "Brand manager" },
    image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=300&q=80",
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
    answer: { ar: "هذا Preview بصري فقط للـ landing، بدون تغيير flow الدفع أو الحجز الحالي.", en: "This is a landing-page preview only and does not change current booking or payment flows." },
  },
];

export const floatingChips = [
  { ar: "مصوري فيديو", en: "Videographers", icon: Clapperboard },
  { ar: "موديلز", en: "Models", icon: Sparkles },
  { ar: "UGC", en: "UGC", icon: Camera },
  { ar: "مؤثرون", en: "Influencers", icon: UsersRound },
];

export const quoteIcon = Quote;
export const checkIcon = CheckCircle2;
