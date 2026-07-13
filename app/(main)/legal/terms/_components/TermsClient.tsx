"use client";

import { useSite } from "@/contexts/SiteContext";
import LegalLayout from "@/components/legal/LegalLayout";

const CONTENT = {
  ar: {
    badge:       "قانوني",
    title:       "الشروط والأحكام",
    subtitle:    "يرجى قراءة هذه الشروط بعناية قبل استخدام منصة Talents.",
    lastUpdated: "آخر تحديث: يناير 2025",
    sections: [
      {
        title:   "قبول الشروط",
        content: "باستخدامك لمنصة Talents، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة. نحتفظ بالحق في تعديل هذه الشروط في أي وقت مع إخطار المستخدمين.",
      },
      {
        title:   "قواعد المنصة",
        content: [
          "يجب أن يكون المستخدم بالغاً (18 سنة فأكثر) لإنشاء حساب.",
          "يُمنع منعاً باتاً نشر محتوى مسيء أو غير لائق أو مضلل.",
          "يُمنع انتحال شخصية أفراد أو شركات أخرى.",
          "يجب الحفاظ على سرية بيانات الحساب وعدم مشاركتها مع الغير.",
          "يُمنع استخدام المنصة لأغراض غير قانونية.",
          "يجب الامتثال لجميع القوانين المعمول بها في بلد المستخدم.",
        ],
      },
      {
        title:   "مسؤوليات البراندات",
        content: [
          "تقديم معلومات دقيقة وصحيحة عن الشركة والمشروع.",
          "الالتزام بالمواعيد والمتطلبات المتفق عليها مع الموهبة.",
          "الدفع الكامل وفي الوقت المحدد وفق شروط العقد.",
          "توفير التعليمات والمراجعات خلال إطار زمني معقول.",
          "عدم استخدام محتوى الموهبة خارج نطاق الاتفاقية.",
          "الاحترام والتعامل المهني مع جميع المواهب.",
        ],
      },
      {
        title:   "مسؤوليات المواهب",
        content: [
          "تقديم معلومات صادقة وحقيقية في الملف الشخصي.",
          "تسليم العمل في الوقت المحدد وبالمستوى المتفق عليه.",
          "الحفاظ على حقوق الملكية الفكرية وعدم انتهاكها.",
          "إبلاغ البراند فوراً عن أي تأخير أو مشكلة محتملة.",
          "الحفاظ على سرية معلومات البراند والمشروع.",
          "عدم العمل مع منافسي البراند خلال فترة العقد إلا بموافقة صريحة.",
        ],
      },
      {
        title:   "قواعد المدفوعات",
        content: [
          "تُحتجز المبالغ في نظام الضمان (Escrow) حتى إتمام العمل.",
          "تُحرَّر المدفوعات للموهبة بعد موافقة البراند على العمل.",
          "تُطبَّق رسوم خدمة على كل معاملة (راجع صفحة الأسعار).",
          "في حال النزاع، يتولى فريق Talents الفصل وفق سياسة النزاعات.",
          "يُمنع التعامل المالي خارج المنصة لتفادي فقدان الضمانات.",
          "تتم المدفوعات بالعملات المدعومة فقط.",
        ],
      },
      {
        title:   "حقوق الاستخدام والملكية الفكرية",
        content: [
          "تنتقل حقوق الاستخدام للبراند عند اكتمال الدفع وفق الاتفاقية.",
          "تحتفظ الموهبة بحق الاستخدام في محفظتها ما لم تُتفق على غير ذلك.",
          "Talents لا تمتلك حقوق المحتوى المنشور من قِبَل المستخدمين.",
          "يجب الحصول على الترخيص المناسب عند استخدام موسيقى أو صور خارجية.",
        ],
      },
      {
        title:   "إنهاء الحساب",
        content: "تحتفظ Talents بحق إيقاف أو إنهاء أي حساب يُخالف هذه الشروط، مع الإشعار المسبق عند الإمكان. يحق للمستخدم حذف حسابه في أي وقت من إعدادات الحساب.",
      },
    ],
  },
  en: {
    badge:       "Legal",
    title:       "Terms of Service",
    subtitle:    "Please read these terms carefully before using the Talents platform.",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title:   "Acceptance of Terms",
        content: "By using Talents, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. We reserve the right to modify these terms at any time with notice to users.",
      },
      {
        title:   "Platform Rules",
        content: [
          "Users must be 18 years or older to create an account.",
          "Publishing offensive, inappropriate, or misleading content is strictly prohibited.",
          "Impersonating individuals or other companies is prohibited.",
          "Maintain the confidentiality of your account credentials.",
          "Using the platform for illegal purposes is prohibited.",
          "You must comply with all applicable laws in your country.",
        ],
      },
      {
        title:   "Brand Responsibilities",
        content: [
          "Provide accurate and truthful information about your company and project.",
          "Honor agreed timelines and requirements with talents.",
          "Pay in full and on time according to contract terms.",
          "Provide instructions and feedback within a reasonable timeframe.",
          "Do not use talent content beyond the scope of the agreement.",
          "Treat all talents with respect and professionalism.",
        ],
      },
      {
        title:   "Talent Responsibilities",
        content: [
          "Provide honest and accurate information in your profile.",
          "Deliver work on time and at the agreed quality level.",
          "Respect intellectual property rights.",
          "Immediately notify the brand of any delay or potential issue.",
          "Maintain confidentiality of brand and project information.",
          "Do not work with the brand's competitors during the contract period without explicit consent.",
        ],
      },
      {
        title:   "Payment Rules",
        content: [
          "Funds are held in escrow until work is completed.",
          "Payment is released to the talent after brand approval.",
          "Service fees apply to each transaction (see pricing page).",
          "In case of disputes, Talents team mediates per the dispute policy.",
          "Financial transactions outside the platform are prohibited to preserve guarantees.",
          "Payments are made in supported currencies only.",
        ],
      },
      {
        title:   "Usage Rights & Intellectual Property",
        content: [
          "Usage rights transfer to the brand upon completed payment per agreement.",
          "The talent retains portfolio rights unless otherwise agreed.",
          "Talents does not own content posted by users.",
          "Proper licensing must be obtained when using third-party music or images.",
        ],
      },
      {
        title:   "Account Termination",
        content: "Talents reserves the right to suspend or terminate any account that violates these terms, with prior notice when possible. Users may delete their account at any time from account settings.",
      },
    ],
  },
};

export default function TermsClient() {
  const { lang } = useSite();
  const c = CONTENT[lang];
  return <LegalLayout {...c} />;
}
