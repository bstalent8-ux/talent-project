"use client";
export const runtime = "edge";

// ─── Brand onboarding ────────────────────────────────────────────────────────
// One-time orientation right after a brand signs up (register/page.tsx's
// post-signup redirect). Explains how hiring works on Talents, then hands off
// to the brand profile wizard at /profile/brand-setup.

import {
  Sparkles, Search, Send, CheckCircle2, Wallet, PackageCheck, Star,
  Store, ShieldCheck, Image as ImageIcon, Users, Briefcase, MessageCircle, Lightbulb, FileText,
} from "lucide-react";
import OnboardingTour, { type TourCopy } from "../OnboardingTour";

const TX: TourCopy = {
  ar: {
    skip: "تخطي",
    lang: "تغيير اللغة",
    theme: "تغيير الوضع",
    stepOf: (n, total) => `الخطوة ${n} من ${total}`,
    back: "رجوع",
    next: "التالي",
    done: "جهّز صفحة البراند ←",
    steps: [
      {
        icon: Sparkles,
        heading: "أهلاً بيك في Talents 🎉",
        sub: "هنا بتلاقي صنّاع محتوى UGC وموديلز جاهزين يشتغلوا على حملاتك في مصر والمنطقة. خلينا نوريك إزاي تستفيد من المنصة.",
      },
      {
        icon: Briefcase,
        heading: "إزاي بتشغّل موهبة؟",
        sub: "أربع خطوات من أول ما تلاقي الموهبة لحد ما تستلم الشغل.",
        list: [
          { icon: Search, title: "اكتشف وقارن", text: "فلتر بالتصنيف والسعر والتقييم، وشوف البورتفوليو." },
          { icon: Send, title: "ابعت بريف", text: "تفاصيل الحملة والميزانية والميعاد في طلب واحد." },
          { icon: Wallet, title: "ادفع للمنصة", text: "فلوسك محفوظة عندنا لحد ما توافق على الشغل." },
          { icon: PackageCheck, title: "استلم ووافق", text: "الموهبة تسلّم، إنت توافق، وبعدها تقيّم." },
        ],
      },
      {
        icon: Store,
        heading: "صفحة البراند بتاعتك",
        sub: "المواهب بتشوف صفحتك قبل ما تقبل أي بريف أو تقدّم على فرصة. صفحة كاملة معناها:",
        list: [
          { icon: ImageIcon, title: "لوجو وغلاف", text: "أول انطباع عن هوية البراند." },
          { icon: FileText, title: "نبذة ومعلومات الشركة", text: "مجالك، حجمك، سنة التأسيس، ومكانك." },
          { icon: Users, title: "ثقة أعلى", text: "المواهب بتتحمس أكتر لبراند واضح ومعروف." },
        ],
      },
      {
        icon: ShieldCheck,
        heading: "التوثيق والفرص",
        sub: "بعد ما صفحتك تجهز:",
        list: [
          { icon: ShieldCheck, title: "وثّق نشاطك", text: "ارفع السجل أو البطاقة الضريبية من الإعدادات عشان تاخد علامة التوثيق." },
          { icon: Briefcase, title: "انشر فرصة", text: "الفرص المفتوحة بتظهر في صفحتك والمواهب تقدّم عليها." },
          { icon: MessageCircle, title: "كلّم المواهب", text: "الشات جوه المنصة لكل تفاصيل الحملة." },
        ],
      },
      {
        icon: Lightbulb,
        heading: "نصايح سريعة",
        sub: "أكتر حاجات بتجيب لك نتايج أحسن:",
        list: [
          { icon: FileText, title: "بريف واضح", text: "المطلوب، عدد الفيديوهات، والميعاد بالظبط." },
          { icon: Wallet, title: "ميزانية واقعية", text: "المواهب الأقوى بترد أسرع على الميزانيات المناسبة." },
          { icon: Star, title: "قيّم بعد كل تعاون", text: "التقييمات بتبني سمعتك قدام المواهب." },
          { icon: CheckCircle2, title: "رد سريع", text: "كل ما ترد أسرع، كل ما الشغل يخلص أسرع." },
        ],
      },
    ],
  },
  en: {
    skip: "Skip",
    lang: "Toggle language",
    theme: "Toggle theme",
    stepOf: (n, total) => `Step ${n} of ${total}`,
    back: "Back",
    next: "Next",
    done: "Set up your brand page →",
    steps: [
      {
        icon: Sparkles,
        heading: "Welcome to Talents 🎉",
        sub: "UGC creators and models ready to work on your campaigns across Egypt and the region. Here's how to get the most out of it.",
      },
      {
        icon: Briefcase,
        heading: "How hiring works",
        sub: "Four steps from finding a talent to receiving the work.",
        list: [
          { icon: Search, title: "Discover & compare", text: "Filter by category, price and rating; browse portfolios." },
          { icon: Send, title: "Send a brief", text: "Campaign details, budget and deadline in one request." },
          { icon: Wallet, title: "Pay the platform", text: "Your money is held safely until you approve the work." },
          { icon: PackageCheck, title: "Receive & approve", text: "The talent delivers, you approve, then you review." },
        ],
      },
      {
        icon: Store,
        heading: "Your brand page",
        sub: "Talents look at your page before accepting a brief or applying to an opportunity. A complete page means:",
        list: [
          { icon: ImageIcon, title: "Logo & cover", text: "The first impression of your brand identity." },
          { icon: FileText, title: "About & company facts", text: "Your industry, size, founding year and location." },
          { icon: Users, title: "More trust", text: "Talents are more eager to work with a clear, credible brand." },
        ],
      },
      {
        icon: ShieldCheck,
        heading: "Verification & opportunities",
        sub: "Once your page is ready:",
        list: [
          { icon: ShieldCheck, title: "Verify your business", text: "Upload your commercial register or tax card in Settings to get the verified badge." },
          { icon: Briefcase, title: "Post an opportunity", text: "Open opportunities show on your page and talents apply." },
          { icon: MessageCircle, title: "Talk to talents", text: "In-platform chat for every campaign detail." },
        ],
      },
      {
        icon: Lightbulb,
        heading: "Quick tips",
        sub: "What gets brands the best results:",
        list: [
          { icon: FileText, title: "A clear brief", text: "Exactly what you need, how many videos, and when." },
          { icon: Wallet, title: "A realistic budget", text: "Stronger talents reply faster to fair budgets." },
          { icon: Star, title: "Review every collaboration", text: "Reviews build your reputation with talents." },
          { icon: CheckCircle2, title: "Reply fast", text: "The faster you reply, the faster the work ships." },
        ],
      },
    ],
  },
};

export default function BrandOnboardingPage() {
  return <OnboardingTour tx={TX} finishHref="/profile/brand-setup" />;
}
