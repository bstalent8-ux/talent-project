"use client";

import { useSite } from "@/contexts/SiteContext";
import LegalLayout from "@/components/legal/LegalLayout";

const CONTENT = {
  ar: {
    badge:       "قانوني",
    title:       "سياسة الخصوصية",
    subtitle:    "نحن نأخذ خصوصيتك على محمل الجد. تعرّف على كيفية جمع بياناتك وحمايتها.",
    lastUpdated: "آخر تحديث: يناير 2025",
    sections: [
      {
        title:   "البيانات التي نجمعها",
        content: [
          "معلومات التسجيل: الاسم، البريد الإلكتروني، كلمة المرور (مشفّرة).",
          "معلومات الملف الشخصي: الصورة، السيرة الذاتية، المهارات، المحفظة.",
          "بيانات المعاملات: تفاصيل الطلبات والمدفوعات والعقود.",
          "بيانات التواصل: الرسائل المتبادلة بين المستخدمين على المنصة.",
          "بيانات الاستخدام: الصفحات المزارة، الوقت المستغرق، التفاعلات.",
          "بيانات الجهاز: نوع المتصفح، نظام التشغيل، عنوان IP.",
        ],
      },
      {
        title:   "كيف نستخدم بياناتك",
        content: [
          "تشغيل المنصة وتحسين تجربة المستخدم.",
          "معالجة المدفوعات والمعاملات بأمان.",
          "إرسال إشعارات تتعلق بالحساب والمشاريع.",
          "تحسين خوارزميات البحث والتوصية.",
          "الامتثال للمتطلبات القانونية والتنظيمية.",
          "منع الاحتيال وحماية أمان المنصة.",
        ],
      },
      {
        title:   "المصادقة والبيانات الأمنية",
        content: "نستخدم Supabase Auth لإدارة المصادقة بشكل آمن. كلمات المرور مشفّرة ولا يمكن الوصول إليها من قِبَل فريقنا. رموز الجلسة محمية عبر HTTPS وتنتهي تلقائياً بعد فترة من عدم النشاط.",
      },
      {
        title:   "مشاركة البيانات",
        content: [
          "لا نبيع بياناتك الشخصية لأي طرف ثالث.",
          "نشارك البيانات الضرورية فقط مع مزودي الخدمة الموثوقين (Supabase، Cloudflare).",
          "قد نفصح عن البيانات استجابةً للمتطلبات القانونية أو أوامر المحاكم.",
          "البيانات المشاركة بين البراندات والمواهب تخضع لاتفاقيات السرية.",
        ],
      },
      {
        title:   "حقوق المستخدم",
        content: [
          "الحق في الوصول: يمكنك طلب نسخة من بياناتك في أي وقت.",
          "الحق في التصحيح: تعديل بياناتك غير الدقيقة من خلال إعدادات الحساب.",
          "الحق في الحذف: طلب حذف حسابك وبياناتك عبر إعدادات الحساب.",
          "الحق في الاعتراض: رفض بعض أنواع معالجة البيانات.",
          "الحق في نقل البيانات: الحصول على بياناتك بصيغة قابلة للنقل.",
        ],
      },
      {
        title:   "الاحتفاظ بالبيانات",
        content: "نحتفظ ببيانات الحساب طوال مدة النشاط. بعد حذف الحساب، تُحذف البيانات الشخصية خلال 30 يوماً. قد تُحتفظ ببعض بيانات المعاملات لفترات أطول وفق المتطلبات القانونية.",
      },
      {
        title:   "تواصل معنا",
        content: "لأي استفسارات تتعلق بالخصوصية، تواصل معنا عبر privacy@talents.com",
      },
    ],
  },
  en: {
    badge:       "Legal",
    title:       "Privacy Policy",
    subtitle:    "We take your privacy seriously. Learn how we collect and protect your data.",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title:   "Data We Collect",
        content: [
          "Registration info: name, email, password (encrypted).",
          "Profile data: photo, bio, skills, portfolio.",
          "Transaction data: order details, payments, contracts.",
          "Communication data: messages exchanged between users on the platform.",
          "Usage data: pages visited, time spent, interactions.",
          "Device data: browser type, OS, IP address.",
        ],
      },
      {
        title:   "How We Use Your Data",
        content: [
          "Operating the platform and improving user experience.",
          "Processing payments and transactions securely.",
          "Sending notifications related to accounts and projects.",
          "Improving search and recommendation algorithms.",
          "Complying with legal and regulatory requirements.",
          "Preventing fraud and protecting platform security.",
        ],
      },
      {
        title:   "Authentication & Security Data",
        content: "We use Supabase Auth for secure authentication management. Passwords are encrypted and inaccessible to our team. Session tokens are protected via HTTPS and expire automatically after a period of inactivity.",
      },
      {
        title:   "Data Sharing",
        content: [
          "We do not sell your personal data to any third party.",
          "We share only necessary data with trusted service providers (Supabase, Cloudflare).",
          "We may disclose data in response to legal requirements or court orders.",
          "Data shared between brands and talents is subject to confidentiality agreements.",
        ],
      },
      {
        title:   "User Rights",
        content: [
          "Right to access: Request a copy of your data at any time.",
          "Right to rectification: Correct inaccurate data through account settings.",
          "Right to erasure: Request account and data deletion via account settings.",
          "Right to object: Opt out of certain types of data processing.",
          "Right to portability: Receive your data in a transferable format.",
        ],
      },
      {
        title:   "Data Retention",
        content: "We retain account data for the duration of activity. After account deletion, personal data is removed within 30 days. Some transaction data may be retained longer per legal requirements.",
      },
      {
        title:   "Contact Us",
        content: "For any privacy-related inquiries, contact us at privacy@talents.com",
      },
    ],
  },
};

export default function PrivacyClient() {
  const { lang } = useSite();
  const c = CONTENT[lang];
  return <LegalLayout {...c} />;
}
