"use client";
export const runtime = "edge";

// ─── Talent onboarding (UGC / Model) ───────────────────────────────────────
// One-time orientation shown right after a fresh talent signup (see
// register/page.tsx's post-signup redirect) — never re-shown on later
// logins, since the only entry point is that redirect. Explanatory, not a
// data-collection step: profile fields are still filled on /profile/me via
// CompleteProfileShell. Skippable at every step, always ends at /profile/me.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, CheckCircle2, Wallet, PackageCheck,
  TrendingUp, Search, Send, Lightbulb, Zap, DollarSign, Film,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "./onboarding.module.css";

const TX = {
  ar: {
    skip: "تخطي",
    back: "رجوع",
    next: "التالي",
    done: "كمّل بروفايلك الآن ←",
    steps: [
      {
        icon: Sparkles,
        heading: "أهلاً بيك في Talents 🎉",
        sub: "منصة المواهب العربية اللي بتوصل صنّاع المحتوى (UGC) والموديلز بأفضل البراندات في مصر والمنطقة. خلينا نوريك إزاي تشتغل المنصة قبل ما تبدأ.",
      },
      {
        icon: FileText,
        heading: "إزاي شغل الحجوزات بيتم؟",
        sub: "أربع خطوات بسيطة من أول ما البراند يتواصل معاك لحد ما تاخد فلوسك.",
        list: [
          { icon: FileText, title: "البراند يبعتلك بريف", text: "تفاصيل الحملة، الميزانية، والديدلاين." },
          { icon: CheckCircle2, title: "ترد بقبول أو رفض", text: "شوف التفاصيل وقرر لو مناسب ليك." },
          { icon: Wallet, title: "البراند يأكد الدفع", text: "فلوسك محجوزة وآمنة قبل ما تبدأ الشغل." },
          { icon: PackageCheck, title: "تسلم الشغل وتاخد فلوسك", text: "ترفع التسليم، البراند يوافق، وتستلم." },
        ],
      },
      {
        icon: TrendingUp,
        heading: "ليه تكمل بروفايلك دلوقتي؟",
        sub: "بروفايلك هو أول حاجة البراند بيشوفها. كل ما يكون أكمل، كل ما فرصتك تزيد في:",
        list: [
          { icon: Search, title: "الظهور في نتائج البحث", text: "البراندات بتفلتر بالتصنيف والتخصص والسعر." },
          { icon: Send, title: "استقبال بريفات مباشرة", text: "براندات ممكن تبعتلك عرض على بروفايلك مباشرة." },
          { icon: CheckCircle2, title: "علامة التوثيق", text: "بروفايل كامل + هوية موثقة = ثقة أعلى مع البراندات." },
        ],
      },
      {
        icon: Search,
        heading: "هيتم استهدافك من براندات إزاي؟",
        sub: "في الفترة الجايه هنركز على استهداف براندات في مجالك تحديداً، وبروفايلك هيبقى قدامهم من خلال:",
        list: [
          { icon: Search, title: "البحث والفلاتر", text: "براندات بتدور بالتصنيف (UGC / موديل)، السعر، والتقييم." },
          { icon: Sparkles, title: "الأقسام المميزة", text: "أفضل البروفايلات بتظهر في الصفحة الرئيسية وصفحة الاستكشاف." },
          { icon: Send, title: "بريفات مباشرة", text: "براندات بتتواصل معاك مباشرة على بروفايلك." },
        ],
      },
      {
        icon: Lightbulb,
        heading: "نصايح سريعة قبل ما تبدأ",
        sub: "أهم 3 حاجات بتفرق في قبول البراندات ليك:",
        list: [
          { icon: Film, title: "بورتفوليو قوي", text: "ارفع نماذج حقيقية بجودة عالية — ده أول حاجة بتقنع البراند." },
          { icon: Zap, title: "رد سريع", text: "كل ما ردك على البريفات أسرع، كل ما ثقة البراند فيك أعلى." },
          { icon: DollarSign, title: "سعر واقعي", text: "سعّر باقاتك بما يناسب مستواك وسوقك — مش لازم الأرخص." },
        ],
      },
    ],
  },
  en: {
    skip: "Skip",
    back: "Back",
    next: "Next",
    done: "Complete your profile now →",
    steps: [
      {
        icon: Sparkles,
        heading: "Welcome to Talents 🎉",
        sub: "The Arab talent marketplace connecting UGC creators and models with the best brands in Egypt and the region. Let's show you how it works first.",
      },
      {
        icon: FileText,
        heading: "How do bookings work?",
        sub: "Four simple steps from the first message to getting paid.",
        list: [
          { icon: FileText, title: "Brand sends you a brief", text: "Campaign details, budget, and deadline." },
          { icon: CheckCircle2, title: "You accept or decline", text: "Review the details and decide if it fits." },
          { icon: Wallet, title: "Brand confirms payment", text: "Your payment is secured before you start." },
          { icon: PackageCheck, title: "Deliver and get paid", text: "Upload your delivery, brand approves, you get paid." },
        ],
      },
      {
        icon: TrendingUp,
        heading: "Why complete your profile now?",
        sub: "Your profile is the first thing a brand sees. The more complete it is, the better your chances of:",
        list: [
          { icon: Search, title: "Showing up in search", text: "Brands filter by category, specialty, and price." },
          { icon: Send, title: "Getting direct briefs", text: "Brands can send an offer straight to your profile." },
          { icon: CheckCircle2, title: "The verified badge", text: "A complete profile + verified identity builds trust." },
        ],
      },
      {
        icon: Search,
        heading: "How will brands find you?",
        sub: "In the coming period we're focused on targeting brands in your exact niche — your profile will be in front of them through:",
        list: [
          { icon: Search, title: "Search & filters", text: "Brands search by category (UGC/Model), price, and rating." },
          { icon: Sparkles, title: "Featured sections", text: "Top profiles get featured on the home and explore pages." },
          { icon: Send, title: "Direct briefs", text: "Brands can reach out straight to your profile." },
        ],
      },
      {
        icon: Lightbulb,
        heading: "Quick tips before you start",
        sub: "The top 3 things that make brands pick you:",
        list: [
          { icon: Film, title: "A strong portfolio", text: "Upload real, high-quality samples — it's what convinces a brand first." },
          { icon: Zap, title: "Fast responses", text: "The faster you reply to briefs, the more brands trust you." },
          { icon: DollarSign, title: "Realistic pricing", text: "Price your packages for your level and market — not just the cheapest." },
        ],
      },
    ],
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useSite();
  const t = TX[lang];
  const [stepIndex, setStepIndex] = useState(0);

  const step = t.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === t.steps.length - 1;
  const Icon = step.icon;

  function finish() {
    router.push("/profile/me");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <button type="button" className={styles.skip} onClick={finish}>
          {t.skip}
        </button>

        <div className={styles.progress}>
          {t.steps.map((_, i) => (
            <div key={i} className={`${styles.progressDot} ${i <= stepIndex ? styles.progressDotActive : ""}`} />
          ))}
        </div>

        <div className={styles.iconWrap}>
          <Icon size={26} />
        </div>

        <h1 className={styles.heading}>{step.heading}</h1>
        <p className={styles.sub}>{step.sub}</p>

        {step.list && (
          <div className={styles.list}>
            {step.list.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div className={styles.listItem} key={item.title}>
                  <div className={styles.listIcon}>
                    <ItemIcon size={16} />
                  </div>
                  <div>
                    <p className={styles.listTitle}>{item.title}</p>
                    <p className={styles.listText}>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.back} ${isFirst ? styles.backHidden : ""}`}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            {t.back}
          </button>
          <button
            type="button"
            className={styles.next}
            onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
          >
            {isLast ? t.done : t.next}
          </button>
        </div>
      </div>
    </div>
  );
}
