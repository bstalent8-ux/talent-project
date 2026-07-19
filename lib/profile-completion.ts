export interface CompletionSection {
  key: string;
  label: { ar: string; en: string };
  weight: number;
  href: string;
  done: boolean;
}

export interface CompletionResult {
  score: number;
  sections: CompletionSection[];
}

// Thresholds for locked features
export const COMPLETION_THRESHOLDS = {
  applyToJobs:    50,
  appearInSearch: 60,
  receiveBriefs:  70,
  becomeVerified: 80,
} as const;

export function calculateCompletion(
  profile: any,
  talentProfile: any,
  portfolioItems: any[],
): CompletionResult {
  const sl = talentProfile?.social_links ?? {};

  const hasSocial = ["instagram", "tiktok", "youtube", "linkedin"].some(
    (k) => sl[k] && String(sl[k]).length > 2,
  );

  const hasPackages    = talentProfile?.packages?.length > 0;
  const hasUsageAddons = (sl.usage_addons?.length ?? 0) > 0;
  const hasPhysical    = ["height","weight","hair_color","shoe_size","age","languages","dialect"]
    .some(k => sl[k] && String(sl[k]).trim().length > 0);

  const sections: CompletionSection[] = [
    {
      key:    "avatar",
      label:  { ar: "صورة الملف الشخصي", en: "Profile picture" },
      weight: 15,
      href:   "/profile/me",
      done:   !!profile?.avatar_url,
    },
    {
      key:    "personal",
      label:  { ar: "المعلومات الشخصية", en: "Personal info" },
      weight: 10,
      href:   "/profile/me",
      done:   !!(profile?.full_name && profile?.city),
    },
    {
      key:    "bio",
      label:  { ar: "النبذة الشخصية", en: "Bio" },
      weight: 5,
      href:   "/profile/me",
      done:   !!(profile?.bio || talentProfile?.bio),
    },
    {
      key:    "categories",
      label:  { ar: "التخصص والفئات", en: "Categories" },
      weight: 10,
      href:   "/profile/me",
      done:   !!(talentProfile?.category || talentProfile?.specialties?.length),
    },
    {
      key:    "social",
      label:  { ar: "مواقع التواصل الاجتماعي", en: "Social media" },
      weight: 10,
      href:   "/profile/me",
      done:   hasSocial,
    },
    {
      key:    "portfolio",
      label:  { ar: "معرض الأعمال", en: "Portfolio" },
      weight: 15,
      href:   "/profile/me",
      done:   portfolioItems?.length > 0,
    },
    {
      key:    "physical",
      label:  { ar: "البيانات الجسدية", en: "Physical details" },
      weight: 10,
      href:   "/profile/me",
      done:   hasPhysical,
    },
    {
      key:    "packages",
      label:  { ar: "الباقات والأسعار", en: "Packages & Pricing" },
      weight: 10,
      href:   "/profile/me",
      done:   hasPackages,
    },
    {
      key:    "usage_addons",
      label:  { ar: "حقوق الاستخدام", en: "Usage Rights" },
      weight: 10,
      href:   "/profile/me",
      done:   hasUsageAddons,
    },
    {
      key:    "availability",
      label:  { ar: "حالة الإتاحة", en: "Availability" },
      weight: 5,
      href:   "/profile/me",
      done:   !!talentProfile?.availability,
    },
    {
      key:    "payment",
      label:  { ar: "بيانات الدفع", en: "Payment details" },
      weight: 0, // coming soon — excluded from score so 100% is reachable
      href:   "/profile/me",
      done:   false,
    },
  ];

  const score = sections.reduce((acc, s) => acc + (s.done ? s.weight : 0), 0);

  return { score, sections };
}
