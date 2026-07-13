import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

const PASSWORD = "Test1234!";

const TALENTS: {
  email: string; full_name: string; handle: string; city: string; bio: string;
  category: string; specialties: string[]; availability: string;
  avg_rating: number; total_reviews: number; profile_views: number; total_bookings: number;
  packages: { id: string; name: string; price: number; features: string[]; popular?: boolean }[];
  social_links: Record<string, unknown>;
}[] = [
  {
    email: "maya.khaled@talents-test.com",
    full_name: "Maya Khaled",
    handle: "maya-khaled",
    city: "القاهرة",
    bio: "موديل أزياء محترفة ومؤثرة رقمية بخبرة 6 سنوات في التصوير الإعلاني والكوميرشال. عملت مع كبرى العلامات التجارية في مصر والمنطقة العربية.",
    category: "Fashion Model",
    specialties: ["أزياء", "كوميرشال", "UGC", "ريلز"],
    availability: "available",
    avg_rating: 4.9,
    total_reviews: 86,
    profile_views: 18400,
    total_bookings: 42,
    packages: [
      { id: "starter", name: "Starter", price: 1500, features: ["ساعة تصوير", "حتى 30 صورة", "مراجعة واحدة", "تسليم 3 أيام"] },
      { id: "growth",  name: "Growth",  price: 4000, features: ["3 ساعات تصوير", "حتى 3 ريلز", "مراجعتان", "تسليم 5 أيام"], popular: true },
      { id: "premium", name: "Premium", price: 7000, features: ["يوم كامل", "حتى 5 ريلز", "3 مراجعات", "تسليم 7 أيام"] },
    ],
    social_links: {
      instagram: "@mayakhaled.model", tiktok: "@maya.khaled",
      height: "174", weight: "57", hair_color: "بني", eye_color: "أخضر",
      languages: "العربية، الإنجليزية، الفرنسية", age_range: "22-28",
      verified: true, fast_response: true, premium: true, views_display: "18K",
      campaign_stats: { views: "2.1M+", ctr: "4.8%", sales_increase: "+176%", repeat: "98%" },
      featured_campaign: { name: "Summer Collection 2024", ctr_before: "1.2%", ctr_after: "4.8%", growth: "+300%" },
      performance: { reach: "2.1M", engagement: "4.8%", impact: "+176%", repeat_clients: "98%" },
      brands: ["Noon", "Samsung", "H&M", "L'Oréal", "Adidas", "Shein"],
      experience: [
        { name: "Fashion Show Cairo 2023", year: "2023", verified: true },
        { name: "Editorial Vogue Arabia 2023", year: "2023", verified: true },
        { name: "Brand Campaign Noon 2022", year: "2022", verified: false },
        { name: "Lookbook H&M Egypt 2022", year: "2022", verified: false },
      ],
      reviews: [
        { author: "أحمد الشامي", brand: "Noon", rating: 5, text: "تعاون رائع! Maya أبدعت في تصوير حملتنا وزادت مبيعاتنا بشكل ملحوظ.", date: "مارس 2024" },
        { author: "سارة التميمي", brand: "Samsung", rating: 5, text: "احترافية عالية وإبداع لافت. نتوقع التعاون معها مجدداً.", date: "فبراير 2024" },
        { author: "محمد العمري", brand: "H&M", rating: 5, text: "النتائج فاقت توقعاتنا. أفضل موديل تعاملنا معها.", date: "يناير 2024" },
      ],
    },
  },
  {
    email: "nour.hassan@talents-test.com",
    full_name: "نور حسن",
    handle: "nour-hassan",
    city: "الإسكندرية",
    bio: "UGC Creator ومؤثرة في مجال الجمال والعناية بالبشرة. أنتج محتوى أصيلاً يتصل بالجمهور ويحقق نتائج قابلة للقياس.",
    category: "UGC Creator",
    specialties: ["UGC", "بيوتي", "سكينكير", "ريفيوز"],
    availability: "available",
    avg_rating: 4.8,
    total_reviews: 54,
    profile_views: 12000,
    total_bookings: 31,
    packages: [
      { id: "starter", name: "Basic UGC",  price: 800,  features: ["3 فيديوهات UGC", "حقوق 30 يوم", "تسليم 3 أيام"] },
      { id: "growth",  name: "Pro UGC",    price: 2200, features: ["8 فيديوهات", "حقوق 90 يوم", "Hook مخصص", "تسليم 5 أيام"], popular: true },
      { id: "premium", name: "Bundle UGC", price: 4500, features: ["15 فيديو", "حقوق غير محدودة", "سكريبت + تصوير", "أولوية"] },
    ],
    social_links: {
      instagram: "@nour.hassan.ugc", tiktok: "@nourhassan",
      height: "168", weight: "55", hair_color: "أسود", eye_color: "بني",
      languages: "العربية، الإنجليزية", age_range: "20-26",
      verified: true, fast_response: true, premium: false, views_display: "12K",
      campaign_stats: { views: "950K+", ctr: "6.2%", sales_increase: "+89%", repeat: "94%" },
      featured_campaign: { name: "Skincare Ramadan Campaign", ctr_before: "2.1%", ctr_after: "6.2%", growth: "+195%" },
      performance: { reach: "950K", engagement: "6.2%", impact: "+89%", repeat_clients: "94%" },
      brands: ["L'Oréal", "Dove", "Nivea", "Garnier", "Maybelline"],
      experience: [
        { name: "L'Oréal Egypt Campaign 2023", year: "2023", verified: true },
        { name: "Dove Body Care 2023", year: "2023", verified: false },
        { name: "Nivea Summer 2022", year: "2022", verified: false },
      ],
      reviews: [
        { author: "رنا خالد", brand: "L'Oréal", rating: 5, text: "Nour تفهم جمهورها بشكل مذهل. المحتوى كان authentic جداً.", date: "أبريل 2024" },
        { author: "دينا مصطفى", brand: "Dove", rating: 5, text: "تسليم سريع واحترافية عالية. سنتعاون معها مجدداً.", date: "مارس 2024" },
      ],
    },
  },
  {
    email: "layla.ahmed@talents-test.com",
    full_name: "ليلى أحمد",
    handle: "layla-ahmed",
    city: "القاهرة",
    bio: "مؤثرة لايف ستايل وسفر بخبرة 4 سنوات. أشارك يومياتي وتجاربي مع أكثر من 200K متابع.",
    category: "Lifestyle Influencer",
    specialties: ["لايف ستايل", "سفر", "فود", "فاشن"],
    availability: "available",
    avg_rating: 4.7,
    total_reviews: 38,
    profile_views: 25000,
    total_bookings: 22,
    packages: [
      { id: "starter", name: "Story Pack",   price: 1200, features: ["3 ستوريز", "لينك سوايب أب", "تسليم 2 أيام"] },
      { id: "growth",  name: "Reel + Story", price: 3500, features: ["ريل + 5 ستوريز", "كابشن مخصص", "تسليم 4 أيام"], popular: true },
      { id: "premium", name: "Full Package", price: 6000, features: ["ريل + ستوريز + بوست", "كفر مميز", "تقرير أداء", "تسليم 7 أيام"] },
    ],
    social_links: {
      instagram: "@layla.lifestyle", tiktok: "@laylaahmedd",
      height: "170", weight: "58", hair_color: "بني فاتح", eye_color: "عسلي",
      languages: "العربية، الإنجليزية", age_range: "24-30",
      verified: true, fast_response: false, premium: true, views_display: "25K",
      campaign_stats: { views: "1.4M+", ctr: "3.9%", sales_increase: "+112%", repeat: "91%" },
      featured_campaign: { name: "Summer Travel Series", ctr_before: "1.8%", ctr_after: "3.9%", growth: "+117%" },
      performance: { reach: "1.4M", engagement: "3.9%", impact: "+112%", repeat_clients: "91%" },
      brands: ["Airbnb", "Emirates", "Sephora", "Zara", "Costa Coffee"],
      experience: [
        { name: "Emirates Travel Campaign 2023", year: "2023", verified: true },
        { name: "Sephora Beauty Edit 2023", year: "2023", verified: false },
        { name: "Zara Egypt Launch 2022", year: "2022", verified: false },
      ],
      reviews: [
        { author: "خالد مبارك", brand: "Emirates", rating: 5, text: "محتوى السفر رفع مبيعات باقاتنا السياحية 112%.", date: "مايو 2024" },
        { author: "نهى سعد", brand: "Sephora", rating: 4, text: "إبداع وأسلوب مميز. نتمنى التسليم أسرع قليلاً.", date: "مارس 2024" },
      ],
    },
  },
  {
    email: "sara.mostafa@talents-test.com",
    full_name: "سارة مصطفى",
    handle: "sara-mostafa",
    city: "الجيزة",
    bio: "موديل كوميرشال بخبرة في إعلانات التليفزيون والرقمي. ظهرت في أكثر من 30 إعلاناً لكبرى العلامات التجارية.",
    category: "Commercial Model",
    specialties: ["كوميرشال", "تليفزيون", "مطبوعات", "بيوتي"],
    availability: "unavailable",
    avg_rating: 4.6,
    total_reviews: 29,
    profile_views: 8500,
    total_bookings: 35,
    packages: [
      { id: "starter", name: "Half Day", price: 2500, features: ["4 ساعات تصوير", "مطبوعات أو رقمي", "تسليم 5 أيام"] },
      { id: "growth",  name: "Full Day", price: 5000, features: ["8 ساعات", "تليفزيون + رقمي", "مراجعتان", "تسليم 7 أيام"], popular: true },
      { id: "premium", name: "Campaign", price: 9000, features: ["حملة متكاملة", "أيام متعددة", "حقوق كاملة", "أولوية"] },
    ],
    social_links: {
      instagram: "@saramostafa.model",
      height: "172", weight: "59", hair_color: "أسود", eye_color: "بني",
      languages: "العربية، الإنجليزية", age_range: "25-32",
      verified: true, fast_response: false, premium: false, views_display: "8.5K",
      campaign_stats: { views: "800K+", ctr: "2.8%", sales_increase: "+65%", repeat: "88%" },
      featured_campaign: { name: "Pepsi Ramadan 2024", ctr_before: "0.9%", ctr_after: "2.8%", growth: "+211%" },
      performance: { reach: "800K", engagement: "2.8%", impact: "+65%", repeat_clients: "88%" },
      brands: ["Pepsi", "Vodafone", "Banque Misr", "Juhayna", "Cleopatra"],
      experience: [
        { name: "Pepsi Ramadan Campaign 2024", year: "2024", verified: true },
        { name: "Vodafone 5G Launch 2023", year: "2023", verified: true },
        { name: "Banque Misr 2023", year: "2023", verified: false },
        { name: "Juhayna Summer 2022", year: "2022", verified: false },
      ],
      reviews: [
        { author: "تامر حسين", brand: "Pepsi", rating: 5, text: "Sara تقدم أداءً احترافياً. إعلاننا حقق أفضل معدل مشاركة في تاريخ الشركة.", date: "أبريل 2024" },
        { author: "إيمان ربيع", brand: "Vodafone", rating: 4, text: "تعاون ممتاز وحضور قوي أمام الكاميرا. سنتعاون معها مجدداً.", date: "فبراير 2024" },
      ],
    },
  },
  {
    email: "rana.tarek@talents-test.com",
    full_name: "رنا طارق",
    handle: "rana-tarek",
    city: "القاهرة",
    bio: "كونتنت كريتور متخصصة في الإنتاج الرقمي والتسويق المؤثر. أقدم محتوى تعليمياً وترفيهياً عالي الجودة.",
    category: "Content Creator",
    specialties: ["كونتنت", "تعليمي", "ريلز", "فلوجز"],
    availability: "available",
    avg_rating: 4.8,
    total_reviews: 61,
    profile_views: 31000,
    total_bookings: 28,
    packages: [
      { id: "starter", name: "Mini Reel",   price: 900,  features: ["ريل واحد 30-60 ثانية", "سكريبت", "تسليم 3 أيام"] },
      { id: "growth",  name: "Reel Pack",   price: 2800, features: ["3 ريلز", "سكريبتات", "كابشن", "تسليم 5 أيام"], popular: true },
      { id: "premium", name: "Full Series", price: 5500, features: ["6 ريلز + ستوريز", "إستراتيجية محتوى", "تقرير أداء", "أولوية"] },
    ],
    social_links: {
      instagram: "@ranatarek.creator", tiktok: "@rana.tarek", youtube: "youtube.com/ranatarek",
      height: "165", weight: "53", hair_color: "بني داكن", eye_color: "أسود",
      languages: "العربية، الإنجليزية", age_range: "21-27",
      verified: true, fast_response: true, premium: true, views_display: "31K",
      campaign_stats: { views: "3.5M+", ctr: "7.1%", sales_increase: "+203%", repeat: "96%" },
      featured_campaign: { name: "Educational Tech Series", ctr_before: "1.5%", ctr_after: "7.1%", growth: "+373%" },
      performance: { reach: "3.5M", engagement: "7.1%", impact: "+203%", repeat_clients: "96%" },
      brands: ["Amazon", "Uber Eats", "Careem", "Talabat", "Noon"],
      experience: [
        { name: "Amazon Egypt Launch 2024", year: "2024", verified: true },
        { name: "Uber Eats Summer 2023", year: "2023", verified: true },
        { name: "Careem Campaign 2023", year: "2023", verified: false },
        { name: "Talabat Ramadan 2022", year: "2022", verified: false },
      ],
      reviews: [
        { author: "وليد فاروق", brand: "Amazon", rating: 5, text: "Rana تملك موهبة نادرة في سرد القصص الرقمية. حملة الإطلاق تجاوزت كل التوقعات.", date: "يونيو 2024" },
        { author: "هبة منصور", brand: "Uber Eats", rating: 5, text: "أعلى معدل تفاعل حققناه على الإطلاق. ننصح بها بشدة.", date: "أغسطس 2023" },
        { author: "كريم السيد", brand: "Careem", rating: 5, text: "محترفة ومبدعة وتسلم في الوقت المحدد دائماً.", date: "يوليو 2023" },
      ],
    },
  },
];

const CLIENTS: { email: string; full_name: string; handle: string; city: string }[] = [
  { email: "ahmed.brands@talents-test.com",   full_name: "أحمد براندز",    handle: "ahmed-brands",   city: "القاهرة" },
  { email: "sara.marketing@talents-test.com", full_name: "سارة للتسويق",  handle: "sara-marketing", city: "القاهرة" },
  { email: "omar.digital@talents-test.com",   full_name: "عمر ديجيتال",   handle: "omar-digital",   city: "الإسكندرية" },
  { email: "mona.agency@talents-test.com",    full_name: "منى للإبداع",   handle: "mona-agency",    city: "الجيزة" },
  { email: "youssef.corp@talents-test.com",   full_name: "يوسف كوربوريشن",handle: "youssef-corp",   city: "القاهرة" },
];

export async function GET() {
  const results: Record<string, string> = {};

  for (const t of TALENTS) {
    try {
      let userId: string;
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: t.email, password: PASSWORD, email_confirm: true,
      });
      if (authErr) {
        const { data: list } = await adminClient.auth.admin.listUsers();
        const existing = (list?.users as Array<{ email: string; id: string }> | undefined)?.find(u => u.email === t.email);
        if (!existing) { results[t.handle] = `skip: ${authErr.message}`; continue; }
        userId = existing.id;
      } else {
        userId = authData.user.id;
      }

      await adminClient.from("profiles").upsert(
        { id: userId, handle: t.handle, full_name: t.full_name, city: t.city, bio: t.bio, role: "talent" },
        { onConflict: "id" }
      );

      const { data: tp } = await adminClient.from("talent_profiles").upsert({
        user_id: userId,
        category: t.category, specialties: t.specialties, bio: t.bio,
        availability: t.availability, packages: t.packages, social_links: t.social_links,
        profile_views: t.profile_views, avg_rating: t.avg_rating,
        total_reviews: t.total_reviews, total_bookings: t.total_bookings,
      }, { onConflict: "user_id" }).select("id").single();

      results[t.handle] = tp ? `✓ talent (tp=${tp.id})` : "✓ talent upserted";
    } catch (e: unknown) {
      results[t.handle] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  for (const c of CLIENTS) {
    try {
      let userId: string;
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: c.email, password: PASSWORD, email_confirm: true,
      });
      if (authErr) {
        const { data: list } = await adminClient.auth.admin.listUsers();
        const existing = (list?.users as Array<{ email: string; id: string }> | undefined)?.find(u => u.email === c.email);
        if (!existing) { results[c.handle] = `skip: ${authErr.message}`; continue; }
        userId = existing.id;
      } else {
        userId = authData.user.id;
      }

      await adminClient.from("profiles").upsert(
        { id: userId, handle: c.handle, full_name: c.full_name, city: c.city, role: "brand" },
        { onConflict: "id" }
      );

      results[c.handle] = "✓ client created";
    } catch (e: unknown) {
      results[c.handle] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ success: true, results });
}
