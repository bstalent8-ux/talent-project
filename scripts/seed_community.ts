import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);

async function seedCommunity() {
  console.log("Seeding community data...");

  // 1. Get some existing profiles
  const { data: profiles, error: pError } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .limit(5);

  if (pError || !profiles || profiles.length < 2) {
    console.error("Could not find enough profiles to seed data.");
    return;
  }

  const user1 = profiles[0].id;
  const user2 = profiles[1].id;

  // 2. Insert Questions
  const questions = [
    {
      user_id: user1,
      title: "كيف أبدأ كمصمم جرافيك فريلانسر؟",
      content: "أنا لسه متخرج ومحتاج أعرف إيه هي الخطوات الأولى عشان ألاقي عملاء وأبني بورتفوليو قوي؟",
      tags: ["تصميم", "فريلانس", "بداية"],
      status: "open",
      views: 150
    },
    {
      user_id: user2,
      title: "أفضل كاميرا لتصوير الـ UGC بميزانية محدودة؟",
      content: "عايز أبدأ أعمل فيديوهات UGC بس الميزانية مش كبيرة، هل الموبايل كفاية ولا لازم كاميرا احترافية؟",
      tags: ["UGC", "تصوير", "معدات"],
      status: "pinned",
      views: 240
    }
  ];

  const { data: insertedQuestions, error: qError } = await adminClient
    .from("community_questions")
    .upsert(questions, { onConflict: "title" })
    .select();

  if (qError) {
    console.error("Error seeding questions:", qError.message);
    return;
  }

  console.log(`Seeded ${insertedQuestions.length} questions.`);

  // 3. Insert Answers
  const answers = [
    {
      question_id: insertedQuestions[0].id,
      user_id: user2,
      content: "أهم حاجة تبدأ بيها هي إنك تعمل بروفايل على بيهانس (Behance) وترفع عليه شغلك حتى لو كان مشاريع وهمية عشان تثبت مستواك."
    },
    {
      question_id: insertedQuestions[1].id,
      user_id: user1,
      content: "الموبايلات الحديثة كافية جداً للـ UGC، أهم حاجة هي الإضاءة الطبيعية والصوت الواضح. ممكن تشتري مايك بويا رخيص وهتلاحظ فرق كبير."
    }
  ];

  const { error: aError } = await adminClient
    .from("community_answers")
    .insert(answers);

  if (aError) {
    console.error("Error seeding answers:", aError.message);
  } else {
    console.log("Seeded answers successfully.");
  }

  console.log("Community seeding finished!");
}

seedCommunity();
