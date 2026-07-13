import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const JOBS_POOL = [
  // UGC
  {
    title_ar: "مبدع محتوى UGC لحملة رمضان",
    title_en: "UGC Creator for Ramadan Campaign",
    desc_ar: "نبحث عن مبدع محتوى لإنتاج 5 فيديوهات قصيرة لمنتجاتنا خلال شهر رمضان. يجب أن يكون المحتوى أصيلاً ويعكس روح الشهر الكريم.",
    desc_en: "Looking for a UGC creator to produce 5 short videos for our products during Ramadan. Content must be authentic and reflect the spirit of the holy month.",
    category: "ugc", budget_min: 1500, budget_max: 3000, slots: 2,
    start_offset: 5, duration: 20,
  },
  {
    title_ar: "فيديو ريفيو منتج جمال",
    title_en: "Beauty Product Review Video",
    desc_ar: "مطلوب مبدع محتوى لعمل فيديو ريفيو صادق لمنتج عناية جديد. الفيديو يكون بين 60-90 ثانية مناسب لإنستقرام ريلز وتيك توك.",
    desc_en: "Need a content creator for an authentic review video of a new skincare product. 60-90 seconds, suitable for Instagram Reels and TikTok.",
    category: "ugc", budget_min: 800, budget_max: 1500, slots: 1,
    start_offset: 10, duration: 7,
  },
  // Influencer
  {
    title_ar: "مؤثر لإطلاق منتج جديد",
    title_en: "Influencer for Product Launch",
    desc_ar: "نريد مؤثراً لديه قاعدة جماهيرية من 50K+ متابع للترويج لمنتجنا الجديد. يشمل: 2 ريلز + 3 ستوريز + منشور.",
    desc_en: "Looking for an influencer with 50K+ followers to promote our new product. Includes: 2 Reels + 3 Stories + 1 Post.",
    category: "influencer", budget_min: 5000, budget_max: 12000, slots: 1,
    start_offset: 14, duration: 30,
  },
  {
    title_ar: "تعاون مع مؤثر طعام",
    title_en: "Food Influencer Collaboration",
    desc_ar: "نبحث عن مؤثر متخصص في محتوى الطعام والمطاعم لزيارة فرعنا الجديد وإنتاج محتوى إبداعي يجذب الجمهور.",
    desc_en: "Seeking a food influencer to visit our new branch and create engaging content that attracts the audience.",
    category: "influencer", budget_min: 3000, budget_max: 7000, slots: 2,
    start_offset: 7, duration: 14,
  },
  // Model
  {
    title_ar: "موديل لجلسة تصوير أزياء",
    title_en: "Fashion Model for Photo Shoot",
    desc_ar: "مطلوب موديل محترف لجلسة تصوير مجموعة الصيف الجديدة. التصوير سيكون في استوديو بالقاهرة، مدة الجلسة 6 ساعات.",
    desc_en: "Professional model needed for summer collection photo shoot. Studio in Cairo, 6-hour session.",
    category: "model", budget_min: 2000, budget_max: 4000, slots: 3,
    start_offset: 3, duration: 1,
  },
  {
    title_ar: "موديل إعلان تلفزيوني",
    title_en: "Model for TV Commercial",
    desc_ar: "نبحث عن موديل للمشاركة في إعلان تلفزيوني لمنتج عائلي. يشترط الخبرة السابقة في التمثيل أو التصوير التجاري.",
    desc_en: "Looking for a model for a TV commercial for a family product. Prior experience in acting or commercial shoots required.",
    category: "model", budget_min: 8000, budget_max: 20000, slots: 2,
    start_offset: 21, duration: 3,
  },
  // Actor
  {
    title_ar: "ممثل لإعلان كوميدي",
    title_en: "Actor for Comedy Ad",
    desc_ar: "مطلوب ممثل كوميدي موهوب لتصوير مسلسل إعلاني قصير من 4 حلقات. كل حلقة 2 دقيقة.",
    desc_en: "Talented comedian needed for a 4-episode mini ad-series. Each episode 2 minutes long.",
    category: "actor", budget_min: 6000, budget_max: 15000, slots: 1,
    start_offset: 14, duration: 5,
  },
  // Host
  {
    title_ar: "مقدم برنامج يوتيوب",
    title_en: "YouTube Show Host",
    desc_ar: "مطلوب مقدم أو مقدمة برنامج لقناة يوتيوب متخصصة في الطعام. التسجيل أسبوعي، مقابل شهري ثابت.",
    desc_en: "Host needed for a food-focused YouTube channel. Weekly recording, fixed monthly rate.",
    category: "host", budget_min: 4000, budget_max: 8000, slots: 1,
    start_offset: 1, duration: 90,
  },
  // Photographer
  {
    title_ar: "مصور منتجات تجاري",
    title_en: "Commercial Product Photographer",
    desc_ar: "نبحث عن مصور محترف لتصوير 50 منتج لمتجرنا الإلكتروني. خلفية بيضاء + صور إبداعية لكل منتج.",
    desc_en: "Professional photographer needed to shoot 50 products for our online store. White background + lifestyle shots.",
    category: "photographer", budget_min: 3000, budget_max: 6000, slots: 1,
    start_offset: 2, duration: 3,
  },
];

export async function GET() {
  // Get all brands
  const { data: brands, error: brandsErr } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .eq("role", "brand")
    .not("handle", "is", null);

  if (brandsErr) return NextResponse.json({ error: brandsErr.message }, { status: 500 });

  const results: Record<string, unknown> = {};
  let totalCreated = 0;

  for (const brand of brands ?? []) {
    // Pick 3 different jobs for this brand (rotate through the pool)
    const brandIdx = (brands ?? []).indexOf(brand);
    const picks = [
      JOBS_POOL[(brandIdx * 3) % JOBS_POOL.length],
      JOBS_POOL[(brandIdx * 3 + 1) % JOBS_POOL.length],
      JOBS_POOL[(brandIdx * 3 + 2) % JOBS_POOL.length],
    ];

    const toInsert = picks.map((job) => {
      const start = new Date();
      start.setDate(start.getDate() + job.start_offset);
      const end = new Date(start);
      end.setDate(end.getDate() + job.duration);

      return {
        brand_id: brand.id,
        title: job.title_ar,
        description: job.desc_ar,
        category: job.category,
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        currency: "EGP",
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        slots: job.slots,
        status: "open",
      };
    });

    const { data, error } = await adminClient
      .from("jobs")
      .insert(toInsert)
      .select("id, title");

    if (error) {
      results[brand.full_name ?? brand.id] = `error: ${error.message}`;
    } else {
      results[brand.full_name ?? brand.id] = `✓ ${data?.length ?? 0} jobs created`;
      totalCreated += data?.length ?? 0;
    }
  }

  return NextResponse.json({ total_created: totalCreated, brands_count: brands?.length ?? 0, results });
}
