export interface VideoItem {
  id: string;
  title: { en: string; ar: string };
  category: { en: string; ar: string };
  duration: string;
  views: string;
  thumbnail: string;
  videoUrl?: string;
  hook: string;
  hookRate: string;
  brand: string;
  aspectRatio: string;
  scriptSnippet: string;
}

export interface MetricItem {
  id: string;
  label: { en: string; ar: string };
  value: string;
  status: { en: string; ar: string };
  statusType: 'excellent' | 'very_good' | 'good';
  color: string;
  sparkline: number[];
  change: string;
  description: { en: string; ar: string };
}

export interface PackageItem {
  id: string;
  name: { en: string; ar: string };
  priceEGP: number;
  priceUSD: number;
  popular?: boolean;
  tag?: { en: string; ar: string };
  features: { en: string; ar: string }[];
  deliveryDays: number;
  revisions: number;
}

export interface ShootItem {
  id: string;
  brand: string;
  logo: string;
  campaign: { en: string; ar: string };
  date: { en: string; ar: string };
  verified?: boolean;
  category: string;
  results?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  company: string;
  logo: string;
  rating: number;
  packageUsed: { en: string; ar: string };
  price: string;
  comment: { en: string; ar: string };
  date: { en: string; ar: string };
  recommended: boolean;
}

export const CREATOR_PROFILE = {
  name: "Nour Mohamed",
  nameAr: "نور محمد",
  handle: "@nour.ugc",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  verified: true,
  tier: "Gold Creator",
  tierAr: "منشئ محتوى ذهبي",
  headline: {
    en: "UGC Creator & Content Producer",
    ar: "صانعة محتوى UGC ومنتجة إعلانات إبداعية"
  },
  location: {
    en: "Cairo, Egypt",
    ar: "القاهرة، مصر"
  },
  languages: {
    en: "Arabic, English",
    ar: "العربية، الإنجليزية"
  },
  rating: 4.9,
  reviewsCount: 128,
  aiMatchScore: 96,
  matchDescription: {
    en: "Excellent Match for E-commerce & Beauty Brands",
    ar: "مطابقة ممتازة لعلامات التجارة الإلكترونية والتجميل"
  },
  isOnline: true,
  status: {
    en: "Available • Accepting Projects",
    ar: "متاحة حالياً • استلام طلبات جديدة"
  },
  keyHighlights: [
    {
      id: "response",
      label: { en: "Avg. Response Time", ar: "متوسط وقت الرد" },
      value: "2-3 Days",
      icon: "Clock"
    },
    {
      id: "completion",
      label: { en: "Completion Rate", ar: "نسبة إتمام المشاريع" },
      value: "98%",
      icon: "CheckCircle2"
    },
    {
      id: "ontime",
      label: { en: "On-Time Delivery", ar: "التسليم في الموعد" },
      value: "100%",
      icon: "Timer"
    },
    {
      id: "availability",
      label: { en: "Accepting Projects", ar: "استقبال المشاريع" },
      value: "Available",
      icon: "Sparkles"
    }
  ],
  socials: [
    { platform: "Instagram", followers: "24.8K", url: "https://instagram.com" },
    { platform: "TikTok", followers: "8.2K", url: "https://tiktok.com" },
    { platform: "Facebook", followers: "12K", url: "https://facebook.com" },
    { platform: "Portfolio Website", followers: "Verified", url: "https://nour-ugc.studio" }
  ],
  reelThumbnails: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&q=80"
  ]
};

export const VIDEO_PORTFOLIO: VideoItem[] = [
  {
    id: "v1",
    title: { en: "Skincare Routine Review", ar: "مراجعة روتين العناية بالبشرة" },
    category: { en: "Beauty & Skincare", ar: "تجميل وعناية" },
    duration: "0:26",
    views: "125K",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    hook: "Stop scrolling if your skin feels dry by 2 PM! 💧",
    hookRate: "76%",
    brand: "Garnier SkinActive",
    aspectRatio: "9:16",
    scriptSnippet: "Problem-Agitate-Solve: demonstrating moisture barrier transformation in 7 days with macro closeups and textured swatch testing."
  },
  {
    id: "v2",
    title: { en: "Aesthetic Luxury Unboxing", ar: "فتح صندوق فاخر وسلس" },
    category: { en: "Unboxing", ar: "فتح الصندوق" },
    duration: "0:33",
    views: "89K",
    thumbnail: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80",
    hook: "This arrived in the mail today and I'm honestly obsessed... ✨",
    hookRate: "72%",
    brand: "L'Azur Official",
    aspectRatio: "9:16",
    scriptSnippet: "ASMR unboxing sounds, smooth camera transitions, highlighting premium packaging, unwrapping reveal, and first impressions."
  },
  {
    id: "v3",
    title: { en: "Serum Product Showcase", ar: "استعراض مصل الوجه الفعال" },
    category: { en: "Product Showcase", ar: "استعراض منتج" },
    duration: "0:31",
    views: "156K",
    thumbnail: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    hook: "The only active serum dermatologist-tested I actually repurchased 🧴",
    hookRate: "81%",
    brand: "L'Oréal Paris",
    aspectRatio: "9:16",
    scriptSnippet: "Before & after split screen, ingredient spotlight with pop-up badges, and seamless application over fresh skin."
  },
  {
    id: "v4",
    title: { en: "Smart Wireless Gadget Review", ar: "مراجعة جهاز تقني ذكي" },
    category: { en: "Tech & Gadgets", ar: "تقنية وأجهزة" },
    duration: "0:22",
    views: "112K",
    thumbnail: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
    hook: "If you work from cafes, this gadget changes everything 🎧",
    hookRate: "69%",
    brand: "TechStore Egypt",
    aspectRatio: "9:16",
    scriptSnippet: "Real-world desk setup test, portability showcase, battery life benchmark, and high-energy pacing."
  },
  {
    id: "v5",
    title: { en: "Healthy Gourmet Food Review", ar: "مراجعة وتجربة أطباق صحية" },
    category: { en: "Food & Beverage", ar: "أطعمة ومشروبات" },
    duration: "0:30",
    views: "97K",
    thumbnail: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    hook: "Testing Cairo's top rated meal prep service for 5 whole days! 🥗",
    hookRate: "74%",
    brand: "Gourmet Health",
    aspectRatio: "9:16",
    scriptSnippet: "Taste test reactions, macro breakdown graphics, packaging convenience, and special discount CTA."
  }
];

export const CONTENT_SPECIALTIES = [
  { id: "unboxing", label: { en: "Unboxing", ar: "فتح الصندوق" }, icon: "Package", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "product-review", label: { en: "Product Review", ar: "مراجعة منتج" }, icon: "Sparkles", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "tutorial", label: { en: "Tutorial", ar: "شرح تعليمي" }, icon: "Lightbulb", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "comparison", label: { en: "Comparison", ar: "مقارنات" }, icon: "Scale", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "lifestyle", label: { en: "Lifestyle", ar: "أسلوب حياة" }, icon: "Camera", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "beauty", label: { en: "Beauty", ar: "جمال وعناية" }, icon: "Heart", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "food", label: { en: "Food", ar: "أطعمة ومطاعم" }, icon: "Utensils", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "tech", label: { en: "Tech", ar: "تقنية" }, icon: "Laptop", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "reels", label: { en: "Reels", ar: "ريلز إنستغرام" }, icon: "Film", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "tiktok", label: { en: "TikTok", ar: "تيك توك" }, icon: "Video", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "amazon", label: { en: "Amazon Content", ar: "محتوى أمازون" }, icon: "ShoppingBag", color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  { id: "ads", label: { en: "Ads Creative", ar: "إعلانات تسويقية" }, icon: "TrendingUp", color: "bg-cyan-50 text-cyan-700 border-cyan-200" }
];

export const PERFORMANCE_METRICS: MetricItem[] = [
  {
    id: "hook-rate",
    label: { en: "Hook Rate", ar: "معدل جذب الانتباه (3s)" },
    value: "72%",
    status: { en: "Excellent", ar: "ممتاز" },
    statusType: "excellent",
    color: "#8B5CF6", // purple
    sparkline: [45, 52, 58, 63, 67, 70, 72],
    change: "+14% vs benchmark",
    description: { en: "Viewers who watch past the first 3 seconds of ad hooks.", ar: "نسبة المشاهدين الذين يتخطون أول 3 ثوانٍ من الفيديو الإعلاني." }
  },
  {
    id: "watch-rate",
    label: { en: "Watch Rate", ar: "معدل المشاهدة الكاملة" },
    value: "68%",
    status: { en: "Excellent", ar: "ممتاز" },
    statusType: "excellent",
    color: "#3B82F6", // blue
    sparkline: [50, 54, 57, 61, 64, 66, 68],
    change: "+9% vs average",
    description: { en: "Average retention across standard 30-second UGC videos.", ar: "متوسط بقاء المشاهد طوال مدة الفيديو البالغة 30 ثانية." }
  },
  {
    id: "ctr",
    label: { en: "Click Through Rate", ar: "نسبة النقر للظهور (CTR)" },
    value: "4.8%",
    status: { en: "Very Good", ar: "جيد جداً" },
    statusType: "very_good",
    color: "#10B981", // emerald
    sparkline: [2.8, 3.2, 3.6, 4.0, 4.3, 4.6, 4.8],
    change: "+1.9% industry avg",
    description: { en: "Performance on paid ad variations and call-to-actions.", ar: "أداء النقرات على الروابط الدعائية والأزرار التحفيزية." }
  },
  {
    id: "engagement",
    label: { en: "Engagement Rate", ar: "معدل التفاعل والمشاركات" },
    value: "8.2%",
    status: { en: "Excellent", ar: "ممتاز" },
    statusType: "excellent",
    color: "#F59E0B", // amber
    sparkline: [5.1, 5.8, 6.4, 7.0, 7.5, 7.9, 8.2],
    change: "+3.4% organic boost",
    description: { en: "Saves, shares, and high-intent comments on organic channels.", ar: "الحفظ والمشاركة والتعليقات الإيجابية على القنوات الرسمية." }
  },
  {
    id: "conversion",
    label: { en: "Conversion Rate", ar: "معدل التحويل والمبيعات" },
    value: "3.1%",
    status: { en: "Very Good", ar: "جيد جداً" },
    statusType: "very_good",
    color: "#06B6D4", // cyan
    sparkline: [1.8, 2.1, 2.4, 2.7, 2.9, 3.0, 3.1],
    change: "Top 10% in beauty",
    description: { en: "Direct checkout attribution in tracked affiliate/brand campaigns.", ar: "المشتريات المباشرة الناتجة عن الكوبونات والروابط التتبعية." }
  },
  {
    id: "delivery-time",
    label: { en: "Avg. Delivery Time", ar: "متوسط وقت التسليم" },
    value: "2.1 Days",
    status: { en: "Excellent", ar: "ممتاز وسريع" },
    statusType: "excellent",
    color: "#6366F1", // indigo
    sparkline: [3.5, 3.2, 2.9, 2.6, 2.4, 2.2, 2.1],
    change: "Fast Turnaround",
    description: { en: "Speed from confirmed brief to high-res raw and edited delivery.", ar: "السرعة من اعتماد السيناريو حتى تسليم الفيديوهات الجاهزة." }
  }
];

export const TOP_CONTENT_TYPES = [
  { name: { en: "Product Review", ar: "مراجعة المنتجات" }, percentage: 42, color: "#6366F1" },
  { name: { en: "Unboxing", ar: "فتح الصناديق" }, percentage: 25, color: "#3B82F6" },
  { name: { en: "Tutorial & How-To", ar: "الشروحات التعليمية" }, percentage: 18, color: "#10B981" },
  { name: { en: "Lifestyle & Vlogs", ar: "لايف ستايل" }, percentage: 10, color: "#F59E0B" },
  { name: { en: "Others & Memes", ar: "محتوى آخر" }, percentage: 5, color: "#94A3B8" }
];

export const PREVIOUS_SHOOTS: ShootItem[] = [
  {
    id: "s1",
    brand: "Nike",
    logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Training Apparel Launch Campaign", ar: "حملة إطلاق الملابس الرياضية" },
    date: { en: "May 2024", ar: "مايو ٢٠٢٤" },
    category: "Athleisure & Fitness",
    results: "+28% ROAS on TikTok Spark Ads"
  },
  {
    id: "s2",
    brand: "Garnier",
    logo: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "SkinActive Vitamin C Serum Launch", ar: "حملة مصل فيتامين سي للبشرة" },
    date: { en: "Apr 2024", ar: "أبريل ٢٠٢٤" },
    category: "Skincare",
    results: "4.8M Organic Views across creators"
  },
  {
    id: "s3",
    brand: "L'Oréal Paris",
    logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Hyaluron Pure Haircare UGC Blitz", ar: "حملة العناية بالشعر بالهيالورون" },
    date: { en: "Mar 2024", ar: "مارس ٢٠٢٤" },
    category: "Beauty & Hair",
    results: "3.4x CTR vs studio ads"
  },
  {
    id: "s4",
    brand: "Samsung",
    logo: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Galaxy Ecosystem Lifestyle Feature", ar: "استعراض بيئة هواتف جالاكسي" },
    date: { en: "Feb 2024", ar: "فبراير ٢٠٢٤" },
    category: "Consumer Tech",
    results: "Featured on official Samsung MENA"
  }
];

export const VERIFIED_TALENTS_CONTRACTS: ShootItem[] = [
  {
    id: "vt1",
    brand: "BeBold",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Summer Activewear Promo", ar: "موسم الملابس الرياضية الصيفية" },
    date: { en: "Jun 2024", ar: "يونيو ٢٠٢٤" },
    verified: true,
    category: "Fitness Wear",
    results: "100% On-Time • Paid via Escrow"
  },
  {
    id: "vt2",
    brand: "TechStore",
    logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Wireless Audio Series Review", ar: "سلسلة مراجعات الصوتيات اللاسلكية" },
    date: { en: "May 2024", ar: "مايو ٢٠٢٤" },
    verified: true,
    category: "UGC Content",
    results: "5 Star Client Rating"
  },
  {
    id: "vt3",
    brand: "L'Azur",
    logo: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=200&q=80",
    campaign: { en: "Luxury Botanical Skincare Package", ar: "باقة العناية النباتية الفاخرة" },
    date: { en: "Apr 2024", ar: "أبريل ٢٠٢٤" },
    verified: true,
    category: "Skincare Campaign",
    results: "Re-booked 2 additional batches"
  }
];

export const PACKAGES: PackageItem[] = [
  {
    id: "starter",
    name: { en: "Starter", ar: "الباقة الأساسية" },
    priceEGP: 2500,
    priceUSD: 52,
    popular: false,
    deliveryDays: 2,
    revisions: 1,
    features: [
      { en: "1 UGC Video (30 sec)", ar: "فيديو UGC واحد (٣٠ ثانية)" },
      { en: "1 Custom High-Converting Hook", ar: "خطاف إعلاني واحد قوي ومجرب" },
      { en: "Organic Social Media Usage", ar: "حقوق النشر والاستخدام العضوي" },
      { en: "2 Days Fast Delivery", ar: "تسليم سريع خلال يومين فقط" },
      { en: "1 Free Revision Round", ar: "جولة تعديل مجانية واحدة" }
    ]
  },
  {
    id: "growth",
    name: { en: "Growth", ar: "باقة النمو والتوسع" },
    priceEGP: 5500,
    priceUSD: 115,
    popular: true,
    tag: { en: "Most Popular", ar: "الأكثر طلباً" },
    deliveryDays: 3,
    revisions: 3,
    features: [
      { en: "3 UGC Videos (15-30 sec each)", ar: "٣ فيديوهات UGC احترافية (١٥-٣٠ ثانية)" },
      { en: "3 Different Hooks & Angles", ar: "٣ خطافات وزوايا إعلانية مختلفة لاختبار A/B" },
      { en: "Full Raw Footage Included", ar: "تسليم المادة الخام المصورة بالكامل" },
      { en: "Organic + Paid Ads (30 Days)", ar: "حقوق النشر والإعلانات الممولة (٣٠ يوماً)" },
      { en: "3 Days Priority Delivery", ar: "تسليم ذو أولوية خلال ٣ أيام" },
      { en: "3 Revision Rounds", ar: "٣ جولات تعديل شاملة" }
    ]
  },
  {
    id: "campaign",
    name: { en: "Campaign Bundle", ar: "باقة الحملات المتكاملة" },
    priceEGP: 12000,
    priceUSD: 250,
    popular: false,
    deliveryDays: 5,
    revisions: 5,
    features: [
      { en: "5-10 UGC High-Impact Videos", ar: "٥ إلى ١٠ فيديوهات إعلانية عالية التأثير" },
      { en: "Multiple Hooks & Dynamic CTAs", ar: "خطافات ودعوات شراء متعددة لكل منصة" },
      { en: "Full Raw B-Roll + Voiceovers", ar: "لقطات B-Roll كاملة وتسجيل صوتي احترافي" },
      { en: "Paid Ads Rights (90 Days)", ar: "حقوق الحملات الإعلانية الممولة (٩٠ يوماً)" },
      { en: "Dedicated Producer & Priority Delivery", ar: "تنسيق مباشر وتسليم فائق الأولوية" }
    ]
  }
];

export const BRANDS_WORKED_WITH = [
  "Amazon",
  "SHEIN",
  "Garnier",
  "Maybelline",
  "Noon",
  "L'Oréal Paris",
  "Samsung",
  "Talabat",
  "Temu",
  "Careem",
  "H&M",
  "Zara",
  "Bath & Body Works",
  "Jumia",
  "BeBold",
  "TechStore"
];

export const REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    author: "Nouran El-Shazly",
    company: "Glow Beauty",
    logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=100&q=80",
    rating: 5.0,
    packageUsed: { en: "Growth Package", ar: "باقة النمو" },
    price: "5,500 EGP",
    comment: {
      en: "Nour is amazing! Professional, highly creative, and delivers high-quality content that outperformed all our internal ad creatives.",
      ar: "نور مبدعة للغاية ومحترفة! المحتوى الذي أنتجته حقق أعلى نسبة تحويل ومبيعات في حملاتنا الإعلانية هذا الموسم."
    },
    date: { en: "May 2024", ar: "مايو ٢٠٢٤" },
    recommended: true
  },
  {
    id: "r2",
    author: "Karim Mostafa",
    company: "L'Oréal Paris Agency Lead",
    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    rating: 5.0,
    packageUsed: { en: "Campaign Bundle", ar: "باقة الحملات" },
    price: "12,000 EGP",
    comment: {
      en: "Great collaboration! Content performed exceptionally well in our paid ads. The hooks were spot-on and script execution was natural.",
      ar: "تعاون متميز ومتقن! الفيديوهات حققت تفاعلاً كبيراً بفضل الخطاف الطبيعي والأداء العفوي المقنع للمشاهدين."
    },
    date: { en: "Apr 2024", ar: "أبريل ٢٠٢٤" },
    recommended: true
  },
  {
    id: "r3",
    author: "Layla Ahmed",
    company: "BeBold Fitness",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    rating: 5.0,
    packageUsed: { en: "Starter Package", ar: "الباقة الأساسية" },
    price: "2,500 EGP",
    comment: {
      en: "Super fast turnaround time and excellent communication throughout. Will definitely be rebooking for our winter line!",
      ar: "سرعة استثنائية في التسليم ودقة في الالتزام بالملاحظات. بالتأكيد سنكرر التعاون في حملاتنا القادمة."
    },
    date: { en: "Mar 2024", ar: "مارس ٢٠٢٤" },
    recommended: true
  }
];

export const RECENT_ACTIVITY = [
  {
    id: "a1",
    action: { en: "Delivered 3 videos to TechStore", ar: "تم تسليم ٣ فيديوهات لصالح TechStore" },
    time: { en: "2 days ago", ar: "منذ يومين" },
    icon: "Video",
    color: "text-blue-500 bg-blue-50"
  },
  {
    id: "a2",
    action: { en: "New 5-star review from Glow Beauty", ar: "تقييم جديد ٥ نجوم من Glow Beauty" },
    time: { en: "5 days ago", ar: "منذ ٥ أيام" },
    icon: "Star",
    color: "text-amber-500 bg-amber-50"
  },
  {
    id: "a3",
    action: { en: "Booked by BeBold Fitness Wear", ar: "حجز جديد مؤكد من BeBold" },
    time: { en: "1 week ago", ar: "منذ أسبوع" },
    icon: "Calendar",
    color: "text-emerald-500 bg-emerald-50"
  },
  {
    id: "a4",
    action: { en: "Profile viewed by Nike MENA Talent Team", ar: "فريق نايكي الشرق الأوسط زار الملف الشخصي" },
    time: { en: "2 weeks ago", ar: "منذ أسبوعين" },
    icon: "Eye",
    color: "text-purple-500 bg-purple-50"
  }
];
