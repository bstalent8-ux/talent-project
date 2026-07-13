"use client";

import { useSite } from "@/contexts/SiteContext";
import LegalLayout from "@/components/legal/LegalLayout";

const CONTENT = {
  ar: {
    badge:       "قانوني",
    title:       "سياسة الكوكيز",
    subtitle:    "تعرّف على كيفية استخدامنا لملفات الكوكيز وتقنيات التتبع.",
    lastUpdated: "آخر تحديث: يناير 2025",
    sections: [
      {
        title:   "ما هي الكوكيز؟",
        content: "الكوكيز (Cookies) هي ملفات نصية صغيرة تُخزَّن على جهازك عند زيارتك لمنصة Talents. تساعدنا في تذكّر تفضيلاتك وتحسين تجربتك على المنصة.",
      },
      {
        title:   "الكوكيز الضرورية",
        content: [
          "كوكيز الجلسة: تحافظ على تسجيل دخولك طوال فترة الاستخدام.",
          "كوكيز الأمان: تحمي حسابك من الوصول غير المصرح به.",
          "كوكيز التفضيلات: تحفظ اختياراتك (اللغة، الوضع المظلم/الفاتح).",
          "هذه الكوكيز ضرورية لعمل المنصة ولا يمكن تعطيلها.",
        ],
      },
      {
        title:   "كوكيز الأداء والتحليل",
        content: [
          "نستخدم أدوات تحليل لفهم كيفية استخدام المنصة.",
          "تساعدنا في تحديد المشكلات وتحسين الأداء.",
          "البيانات مُجمَّعة وغير مرتبطة بهويتك الشخصية.",
          "يمكنك إلغاء الاشتراك في هذه الكوكيز من إعدادات المتصفح.",
        ],
      },
      {
        title:   "كوكيز التخصيص",
        content: [
          "تذكّر تفضيلات اللغة (العربية/الإنجليزية).",
          "الحفاظ على إعداد الوضع المظلم أو الفاتح.",
          "تخزين إعدادات البحث والفلاتر المفضلة.",
          "تحسين توصيات المواهب والمحتوى بناءً على سلوك الاستخدام.",
        ],
      },
      {
        title:   "الكوكيز الخارجية",
        content: [
          "Cloudflare: لتحسين الأداء والحماية من الهجمات.",
          "Supabase: لإدارة المصادقة والجلسات.",
          "هذه الخدمات لها سياسات خصوصية مستقلة.",
          "نحرص على اختيار شركاء يلتزمون بأعلى معايير الخصوصية.",
        ],
      },
      {
        title:   "إدارة الكوكيز",
        content: [
          "يمكنك حذف الكوكيز من إعدادات متصفحك في أي وقت.",
          "تعطيل الكوكيز الضرورية قد يؤثر على وظائف المنصة.",
          "معظم المتصفحات توفر خياراً لإخطارك قبل قبول الكوكيز.",
          "يمكنك ضبط إعدادات المتصفح لرفض الكوكيز تلقائياً.",
        ],
      },
      {
        title:   "تحديثات السياسة",
        content: "نحتفظ بحق تحديث هذه السياسة من وقت لآخر. سيُعلَم المستخدمون بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.",
      },
    ],
  },
  en: {
    badge:       "Legal",
    title:       "Cookie Policy",
    subtitle:    "Learn how Talents uses cookies and tracking technologies.",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title:   "What Are Cookies?",
        content: "Cookies are small text files stored on your device when you visit the Talents platform. They help us remember your preferences and improve your experience.",
      },
      {
        title:   "Essential Cookies",
        content: [
          "Session cookies: Keep you logged in during your session.",
          "Security cookies: Protect your account from unauthorized access.",
          "Preference cookies: Save your choices (language, dark/light mode).",
          "These cookies are necessary for the platform to work and cannot be disabled.",
        ],
      },
      {
        title:   "Performance & Analytics Cookies",
        content: [
          "We use analytics tools to understand how the platform is used.",
          "They help us identify issues and improve performance.",
          "Data is aggregated and not linked to your personal identity.",
          "You can opt out of these cookies from your browser settings.",
        ],
      },
      {
        title:   "Personalization Cookies",
        content: [
          "Remember language preferences (Arabic/English).",
          "Maintain dark/light mode settings.",
          "Store preferred search settings and filters.",
          "Improve talent and content recommendations based on usage behavior.",
        ],
      },
      {
        title:   "Third-Party Cookies",
        content: [
          "Cloudflare: For performance optimization and attack protection.",
          "Supabase: For authentication and session management.",
          "These services have their own independent privacy policies.",
          "We carefully select partners who maintain the highest privacy standards.",
        ],
      },
      {
        title:   "Managing Cookies",
        content: [
          "You can delete cookies from your browser settings at any time.",
          "Disabling essential cookies may affect platform functionality.",
          "Most browsers offer an option to notify you before accepting cookies.",
          "You can configure your browser to automatically reject cookies.",
        ],
      },
      {
        title:   "Policy Updates",
        content: "We reserve the right to update this policy from time to time. Users will be notified of any material changes via email or a notice on the platform.",
      },
    ],
  },
};

export default function CookiesClient() {
  const { lang } = useSite();
  const c = CONTENT[lang];
  return <LegalLayout {...c} />;
}
