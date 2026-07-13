import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TALENTS = [
  // UGC (5)
  { handle: "karim-ugc",    name: "كريم سامي",    city: "القاهرة",      category: "ugc",        specialties: ["UGC Creator","ريلز","Ad Creative"],          verified: true,  rating: 4.8, price: 800  },
  { handle: "dina-ugc",     name: "دينا فاروق",   city: "الإسكندرية",  category: "ugc",        specialties: ["UGC Creator","بيوتي","سكينكير"],              verified: true,  rating: 4.6, price: 650  },
  { handle: "omar-ugc",     name: "عمر حسن",      city: "القاهرة",      category: "ugc",        specialties: ["UGC Creator","طعام","لايف ستايل"],            verified: false, rating: 4.3, price: 500  },
  { handle: "nada-ugc",     name: "ندى إبراهيم",  city: "الجيزة",       category: "ugc",        specialties: ["UGC Creator","سفر","مغامرات"],                verified: false, rating: 4.1, price: 400  },
  { handle: "tarek-ugc",    name: "طارق محمود",   city: "القاهرة",      category: "ugc",        specialties: ["UGC Creator","تيك توك","ريلز"],               verified: false, rating: 3.9, price: 350  },
  // Influencer (5) — category: ugc + keyword مؤثر in specialties
  { handle: "mona-infl",    name: "منى خالد",     city: "القاهرة",      category: "ugc", specialties: ["مؤثرة","لايف ستايل","فاشن"],                  verified: true,  rating: 4.9, price: 2000 },
  { handle: "ali-infl",     name: "علي رضا",      city: "الإسكندرية",  category: "ugc", specialties: ["مؤثر","تكنولوجيا","ريفيو"],                   verified: true,  rating: 4.7, price: 1500 },
  { handle: "hana-infl",    name: "هناء سعيد",    city: "القاهرة",      category: "ugc", specialties: ["مؤثرة","بيوتي","صحة"],                        verified: true,  rating: 4.5, price: 1200 },
  { handle: "yasser-infl",  name: "ياسر عادل",    city: "الجيزة",       category: "ugc", specialties: ["مؤثر","رياضة","فيتنس"],                       verified: false, rating: 4.2, price: 900  },
  { handle: "reem-infl",    name: "ريم عاطف",     city: "القاهرة",      category: "ugc", specialties: ["مؤثرة","طبخ","طعام"],                         verified: false, rating: 4.0, price: 700  },
  // Host / Presenter (5) — category: fashion + keyword مذيع/مقدم in specialties
  { handle: "sameh-host",   name: "سامح نبيل",    city: "القاهرة",      category: "fashion", specialties: ["مذيع","مقدم برامج","تلفزيون"],            verified: true,  rating: 4.8, price: 3000 },
  { handle: "dalia-host",   name: "داليا صالح",   city: "القاهرة",      category: "fashion", specialties: ["مقدمة","فعاليات","إعلانات"],              verified: true,  rating: 4.6, price: 2500 },
  { handle: "mostafa-host", name: "مصطفى أحمد",   city: "الإسكندرية",  category: "fashion", specialties: ["مذيع","راديو","بودكاست"],                 verified: false, rating: 4.3, price: 1800 },
  { handle: "ghada-host",   name: "غادة رامي",    city: "القاهرة",      category: "fashion", specialties: ["مقدمة","يوتيوب","فعاليات"],               verified: false, rating: 4.1, price: 1500 },
  { handle: "hany-host",    name: "هاني كمال",    city: "الجيزة",       category: "fashion", specialties: ["مقدم","رياضة","تعليق"],                   verified: false, rating: 3.8, price: 1200 },
  // Model (5) — category: fashion + keyword موديل in specialties
  { handle: "yasmin-model", name: "ياسمين طارق",  city: "القاهرة",      category: "fashion", specialties: ["موديل","أزياء","فاشن ويك"],               verified: true,  rating: 4.9, price: 4000 },
  { handle: "adel-model",   name: "عادل سمير",    city: "القاهرة",      category: "fashion", specialties: ["موديل تجاري","إعلانات","فوتوغرافي"],      verified: true,  rating: 4.7, price: 3500 },
  { handle: "salma-model",  name: "سلمى حسين",    city: "الإسكندرية",  category: "fashion", specialties: ["موديل","بيوتي","سكينكير"],                verified: false, rating: 4.4, price: 2800 },
  { handle: "khaled-model", name: "خالد وليد",    city: "الجيزة",       category: "fashion", specialties: ["موديل","رياضة","إعلانات تلفزيونية"],      verified: false, rating: 4.2, price: 2200 },
  { handle: "noha-model",   name: "نهى رفعت",     city: "القاهرة",      category: "fashion", specialties: ["موديل","لايف ستايل","يوتيوب"],            verified: false, rating: 4.0, price: 1800 },
  // Actor (5) — category: fashion + keyword ممثل in specialties
  { handle: "bassem-actor", name: "باسم جمال",    city: "القاهرة",      category: "fashion", specialties: ["ممثل","دراما","إعلانات"],                  verified: true,  rating: 4.9, price: 5000 },
  { handle: "nadia-actor",  name: "نادية عمر",    city: "القاهرة",      category: "fashion", specialties: ["ممثلة","كوميديا","تمثيل إعلاني"],         verified: true,  rating: 4.7, price: 4500 },
  { handle: "ziad-actor",   name: "زياد فتحي",    city: "الإسكندرية",  category: "fashion", specialties: ["ممثل","مسرح","دراما"],                    verified: false, rating: 4.4, price: 3500 },
  { handle: "ola-actor",    name: "علا شريف",     city: "القاهرة",      category: "fashion", specialties: ["ممثلة","تمثيل","إعلانات تلفزيونية"],      verified: false, rating: 4.1, price: 2800 },
  { handle: "magdy-actor",  name: "مجدي فهيم",    city: "الجيزة",       category: "fashion", specialties: ["ممثل","كوميديا","يوتيوب"],                verified: false, rating: 3.9, price: 2000 },
];

async function seed() {
  for (const t of TALENTS) {
    const email = `${t.handle}@talents-seed.com`;

    // Create auth user
    const { data: authData, error: authErr } = await c.auth.admin.createUser({
      email,
      password: "Seed1234!",
      email_confirm: true,
      user_metadata: { full_name: t.name, handle: t.handle },
    });

    let userId = authData?.user?.id;

    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        // Get existing user id via profiles
        const { data: existing } = await c.from("profiles").select("id").eq("handle", t.handle).single();
        if (!existing) { console.log("skip (no profile):", t.handle); continue; }
        userId = existing.id;
      } else {
        console.error("Auth error:", t.handle, authErr.message);
        continue;
      }
    }

    if (!userId) { console.log("no userId for", t.handle); continue; }

    // Upsert profile
    const { error: profErr } = await c.from("profiles").upsert({
      id: userId,
      handle: t.handle,
      full_name: t.name,
      city: t.city,
      role: "talent",
    }, { onConflict: "id" });
    if (profErr) { console.error("Profile error:", t.handle, profErr.message); continue; }

    // Upsert talent_profile
    const { error: tpErr } = await c.from("talent_profiles").upsert({
      user_id: userId,
      category: t.category,
      specialties: t.specialties,
      avg_rating: t.rating,
      total_reviews: Math.floor(Math.random() * 50) + 5,
      packages: [
        {
          id: "1",
          name: "باقة أساسية",
          price: `${t.price} جنيه`,
          popular: false,
          features: ["تسليم خلال 3 أيام", "مراجعة واحدة"],
        },
      ],
      social_links: {
        verified: t.verified,
        fast_response: t.verified,
        premium: t.rating >= 4.7,
      },
    }, { onConflict: "user_id" });

    if (tpErr) { console.error("TalentProfile error:", t.handle, tpErr.message); continue; }

    console.log(`✓ ${t.handle} | ${t.category} | verified: ${t.verified} | rating: ${t.rating}`);
  }
  console.log("\nDone seeding!");
}

seed().catch(console.error);
