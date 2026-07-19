"use client";
import { createContext, useContext } from "react";

export type Lang = "ar" | "en";

export interface Theme {
  lang:    Lang;
  dark:    boolean;
  dir:     "rtl" | "ltr";
  BG:      string;
  CARD:    string;
  BORDER:  string;
  ELV:     string;
  TEXT:    string;
  SUB:     string;
  MUTED:   string;
  GOLD:    string;
  GOLD_BG: string;
  GOLD_GLW:string;
}

export const TX = {
  ar: {
    breadcrumb: (cat: string, name: string) => `الرئيسية › ${cat} › ${name}`,
    realResults: "📊 نتائج حقيقية تحققها",
    profileViews: "مشاهدات الملف", avgRating: "متوسط التقييم",
    campaigns: "حملة مكتملة", reviews: "تقييم",
    basedOn: (n: number) => `* بناءً على آخر ${n} حملة مكتملة`,
    topCampaign: "🏆 أفضل حملة", completed: "✓ مكتملة عبر Talents",
    noCampaigns: "لا توجد حملات مكتملة بعد",
    bookNow: "احجز الآن", message: "💬 مراسلة",
    verified: "تم التحقق", fastResponse: "⚡ استجابة سريعة", professional: "محترف",
    replyTime: (t: string) => `⚡ متوسط وقت الرد: ${t}`,
    safePay: "🛡 مدفوعات آمنة (Escrow)",
    about: (name: string) => `عن ${name}`,
    location: "الموقع", height: "الطول", weight: "الوزن",
    shoeSize: "مقاس الحذاء", hairColor: "لون الشعر", eyeColor: "لون العين",
    languages: "اللغات", ageRange: "الفئة العمرية",
    socialProof: "سوشيال ميديا", responseMetrics: "معدل الاستجابة",
    availableNow: "✅ متاح الآن",
    nextAvailable: (d: string) => `📅 أقرب موعد متاح: ${d}`,
    ratingsTitle: "التقييمات",
    viewAll: (n: number) => `عرض الكل (${n})`,
    noReviews: "لا توجد تقييمات بعد",
    ratingCount: (n: number) => `${n} تقييم`,
    brandsWorkedWith: "براندات عملت معها",
    askTalent: (name: string) => `اسأل ${name}`,
    askPlaceholder: "اكتب سؤالك هنا...", send: "إرسال",
    tabOverview: "نظرة عامة", tabPortfolio: "بورتفوليو",
    tabPackages: "الباقات", tabShoots: "تصويرات",
    tabVerified: "موثق", tabReviews: "تقييمات",
    noPortfolio: "لا يوجد بورتفوليو بعد",
    noPackages: "لا توجد باقات بعد", comingSoon: "قريباً...",
    goldBadge: "⭐ Gold Creator", memberSince: "عضو منذ يناير 2024",
    viewsLabel: "مشاهدة الملف",
    noClient: "عميل",
  },
  en: {
    breadcrumb: (cat: string, name: string) => `Home › ${cat} › ${name}`,
    realResults: "📊 Real results achieved",
    profileViews: "Profile Views", avgRating: "Avg Rating",
    campaigns: "Campaigns", reviews: "Reviews",
    basedOn: (n: number) => `* Based on last ${n} completed campaigns`,
    topCampaign: "🏆 Top Campaign", completed: "✓ Completed via Talents",
    noCampaigns: "No completed campaigns yet",
    bookNow: "Book Now", message: "💬 Message",
    verified: "Verified", fastResponse: "⚡ Fast Response", professional: "Professional",
    replyTime: (t: string) => `⚡ Avg reply time: ${t}`,
    safePay: "🛡 Secure Payments (Escrow)",
    about: (name: string) => `About ${name}`,
    location: "Location", height: "Height", weight: "Weight",
    shoeSize: "Shoe size", hairColor: "Hair color", eyeColor: "Eye color",
    languages: "Languages", ageRange: "Age range",
    socialProof: "Social Media", responseMetrics: "Response Metrics",
    availableNow: "✅ Available Now",
    nextAvailable: (d: string) => `📅 Next available: ${d}`,
    ratingsTitle: "Reviews",
    viewAll: (n: number) => `View all (${n})`,
    noReviews: "No reviews yet",
    ratingCount: (n: number) => `${n} reviews`,
    brandsWorkedWith: "Brands Worked With",
    askTalent: (name: string) => `Ask ${name}`,
    askPlaceholder: "Type your question here...", send: "Send",
    tabOverview: "Overview", tabPortfolio: "Portfolio",
    tabPackages: "Packages", tabShoots: "Shoots",
    tabVerified: "Verified", tabReviews: "Reviews",
    noPortfolio: "No portfolio items yet",
    noPackages: "No packages yet", comingSoon: "Coming soon...",
    goldBadge: "⭐ Gold Creator", memberSince: "Member since Jan 2024",
    viewsLabel: "Profile Views",
    noClient: "Client",
  },
};

export const ProfileThemeContext = createContext<Theme>({
  lang: "ar", dark: true, dir: "rtl",
  BG: "#030812", CARD: "#0d1527", BORDER: "#1e293b", ELV: "#111c35",
  TEXT: "#f1f5f9", SUB: "#94a3b8", MUTED: "#475569",
  GOLD: "#FFB800", GOLD_BG: "rgba(255,184,0,0.12)", GOLD_GLW: "rgba(255,184,0,0.35)",
});

export const useTheme = () => useContext(ProfileThemeContext);
