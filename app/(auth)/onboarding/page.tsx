// "use client";

// import { useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/lib/supabase/client";
// import Image from "next/image";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type TalentType = "ugc" | "influencer" | "model" | "host" | "";
// type Step = 1 | 2 | 3 | 4 | 5 | 6;

// interface FormData {
//   // Step 1
//   talentType: TalentType;
//   // Step 2
//   fullName: string;
//   handle: string;
//   city: string;
//   gender: string;
//   // Step 3
//   bio: string;
//   category: string;
//   specialties: string[];
//   // Step 4 - physical
//   ageRange: string;
//   height: string;
//   weight: string;
//   shoeSize: string;
//   hairColor: string;
//   eyeColor: string;
//   languages: string;
//   // Step 5 - social
//   instagram: string;
//   instagramFollowers: string;
//   tiktok: string;
//   tiktokFollowers: string;
//   youtube: string;
//   youtubeFollowers: string;
//   linkedin: string;
//   linkedinFollowers: string;
//   avgReplyTime: string;
//   // Step 6 - photo
//   avatarUrl: string;
// }

// const INITIAL: FormData = {
//   talentType: "",
//   fullName: "", handle: "", city: "", gender: "",
//   bio: "", category: "", specialties: [],
//   ageRange: "", height: "", weight: "", shoeSize: "",
//   hairColor: "", eyeColor: "", languages: "",
//   instagram: "", instagramFollowers: "",
//   tiktok: "", tiktokFollowers: "",
//   youtube: "", youtubeFollowers: "",
//   linkedin: "", linkedinFollowers: "",
//   avgReplyTime: "",
//   avatarUrl: "",
// };

// const TALENT_TYPES = [
//   { id: "ugc",        label: "UGC Creator",  icon: "🎬", desc: "بتعمل محتوى للبراندات" },
//   { id: "influencer", label: "Influencer",   icon: "📱", desc: "عندك جمهور على السوشيال ميديا" },
//   { id: "model",      label: "Model",        icon: "✨", desc: "تصوير وفاشون وإعلانات" },
//   { id: "host",       label: "Host / MC",    icon: "🎙️", desc: "فعاليات وتقديم وبودكاست" },
// ];

// const CATEGORIES = [
//   "فاشون وموضة", "جمال وسكين كير", "طعام ومطبخ", "رياضة وفيتنس",
//   "تكنولوجيا", "سفر وسياحة", "ترفيه وكوميديا", "لايف ستايل",
//   "تعليم", "أطفال وعائلة", "ألعاب فيديو", "موسيقى وفن",
// ];

// const SPECIALTIES_MAP: Record<string, string[]> = {
//   ugc:        ["Unboxing", "Review", "Tutorial", "Story", "Reel", "Ad Creative", "Testimonial", "Demo"],
//   influencer: ["Stories", "Reels", "Static Post", "TikTok Video", "YouTube Integration", "Live", "Collab"],
//   model:      ["Photo Shoot", "E-commerce", "Runway", "Lookbook", "Campaign", "Editorial", "Commercial"],
//   host:       ["Event Hosting", "Podcast", "Corporate MC", "Wedding", "Conference", "Virtual Event", "Live Stream"],
// };

// const AGE_RANGES   = ["18-22", "23-27", "28-32", "33-38", "39-45", "45+"];
// const GENDERS      = [{ v: "male", l: "ذكر" }, { v: "female", l: "أنثى" }, { v: "other", l: "أخرى" }];
// const HAIR_COLORS  = ["أسود", "بني", "بلوند", "أحمر", "رمادي", "أشقر"];
// const EYE_COLORS   = ["بني", "أخضر", "أزرق", "رمادي", "أسود", "عسلي"];
// const REPLY_TIMES  = ["خلال ساعة", "خلال 3 ساعات", "خلال 24 ساعة", "خلال 48 ساعة"];

// // ─── Step Labels ──────────────────────────────────────────────────────────────
// const STEPS = [
//   { n: 1, label: "نوعك" },
//   { n: 2, label: "بياناتك" },
//   { n: 3, label: "تخصصك" },
//   { n: 4, label: "مظهرك" },
//   { n: 5, label: "سوشيال" },
//   { n: 6, label: "صورتك" },
// ];

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function OnboardingPage() {
//   const router = useRouter();
//   const [step, setStep]     = useState<Step>(1);
//   const [form, setForm]     = useState<FormData>(INITIAL);
//   const [loading, setLoading] = useState(false);
//   const [error, setError]   = useState("");
//   const [uploading, setUploading] = useState(false);
//   const fileRef = useRef<HTMLInputElement>(null);

//   const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

//   const toggleSpecialty = (s: string) => {
//     set("specialties", form.specialties.includes(s)
//       ? form.specialties.filter(x => x !== s)
//       : [...form.specialties, s]);
//   };

//   // ── Cloudinary Upload ─────────────────────────────────────────────────────
//   const handlePhotoUpload = async (file: File) => {
//     setUploading(true);
//     try {
//       const fd = new FormData();
//       fd.append("file", file);
//       fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
//       fd.append("folder", process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER!);
//       const res = await fetch(
//         `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
//         { method: "POST", body: fd }
//       );
//       const data = await res.json();
//       set("avatarUrl", data.secure_url);
//     } catch { setError("فشل رفع الصورة، حاول مرة أخرى"); }
//     setUploading(false);
//   };

//   // ── Validation per step ───────────────────────────────────────────────────
//   const canProceed = () => {
//     if (step === 1) return !!form.talentType;
//     if (step === 2) return form.fullName.trim().length > 1 && form.handle.trim().length > 2 && !!form.gender;
//     if (step === 3) return !!form.category;
//     return true;
//   };

//   // ── Final Submit ──────────────────────────────────────────────────────────
//   const handleSubmit = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const supabase = createClient();
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) { router.push("/login"); return; }

//       const social_links: Record<string, string> = {};
//       if (form.height)             social_links.height            = form.height;
//       if (form.weight)             social_links.weight            = form.weight;
//       if (form.shoeSize)           social_links.shoe_size         = form.shoeSize;
//       if (form.hairColor)          social_links.hair_color        = form.hairColor;
//       if (form.eyeColor)           social_links.eye_color         = form.eyeColor;
//       if (form.languages)          social_links.languages         = form.languages;
//       if (form.ageRange)           social_links.age_range         = form.ageRange;
//       if (form.instagram)          social_links.instagram         = form.instagram;
//       if (form.instagramFollowers) social_links.instagram_followers = form.instagramFollowers;
//       if (form.tiktok)             social_links.tiktok            = form.tiktok;
//       if (form.tiktokFollowers)    social_links.tiktok_followers  = form.tiktokFollowers;
//       if (form.youtube)            social_links.youtube           = form.youtube;
//       if (form.youtubeFollowers)   social_links.youtube_followers = form.youtubeFollowers;
//       if (form.linkedin)           social_links.linkedin          = form.linkedin;
//       if (form.linkedinFollowers)  social_links.linkedin_followers = form.linkedinFollowers;
//       if (form.avgReplyTime)       social_links.avg_reply_time    = form.avgReplyTime;

//       // Upsert profile
//       const { error: profileErr } = await supabase.from("profiles").upsert({
//         id:          user.id,
//         handle:      form.handle.toLowerCase().replace(/\s+/g, "-"),
//         full_name:   form.fullName,
//         avatar_url:  form.avatarUrl || null,
//         role:        "talent",
//         city:        form.city || null,
//         bio:         form.bio || null,
//         category:    form.category,
//         specialties: form.specialties,
//         social_links,
//         gender:      form.gender || null,
//       });

//       if (profileErr) throw profileErr;

//       // Create talent_profile row if not exists
//       await supabase.from("talent_profiles").upsert({
//         user_id:       user.id,
//         talent_type:   form.talentType,
//         packages:      [],
//         availability:  "available",
//         profile_views: 0,
//       });

//       router.push("/");
//     } catch (e: any) {
//       setError(e.message ?? "حدث خطأ، حاول مرة أخرى");
//     }
//     setLoading(false);
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // Styles
//   const card: React.CSSProperties = {
//     backgroundColor: "var(--bg-card)",
//     border: "1px solid var(--bg-border)",
//     borderRadius: "12px",
//     padding: "16px",
//     marginBottom: "12px",
//   };

//   return (
//     <div style={{
//       minHeight: "100vh",
//       backgroundColor: "var(--bg-base)",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       padding: "40px 16px",
//       fontFamily: "'Cairo', sans-serif",
//       direction: "rtl",
//     }}>
//       {/* Logo */}
//       <div style={{ marginBottom: "32px" }}>
//         <Image src="/assets/logo.png" alt="Talents" width={120} height={36} style={{ objectFit: "contain" }} />
//       </div>

//       {/* Progress bar */}
//       <div style={{ width: "100%", maxWidth: "600px", marginBottom: "32px" }}>
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
//           {STEPS.map(s => (
//             <div key={s.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
//               <div style={{
//                 width: "32px", height: "32px", borderRadius: "50%",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: "13px", fontWeight: 700,
//                 backgroundColor: step >= s.n ? "var(--color-teal)" : "var(--bg-elevated)",
//                 color: step >= s.n ? "#000" : "var(--text-muted)",
//                 border: step === s.n ? "2px solid var(--color-teal)" : "2px solid transparent",
//                 transition: "all 0.3s",
//               }}>
//                 {step > s.n ? "✓" : s.n}
//               </div>
//               <span style={{ fontSize: "10px", color: step >= s.n ? "var(--color-teal)" : "var(--text-muted)", fontWeight: 600 }}>
//                 {s.label}
//               </span>
//             </div>
//           ))}
//         </div>
//         {/* Line */}
//         <div style={{ position: "relative", height: "3px", backgroundColor: "var(--bg-border)", borderRadius: "2px", marginTop: "-28px", zIndex: 0 }}>
//           <div style={{
//             height: "100%", borderRadius: "2px",
//             backgroundColor: "var(--color-teal)",
//             width: `${((step - 1) / 5) * 100}%`,
//             transition: "width 0.4s ease",
//           }} />
//         </div>
//       </div>

//       {/* Card */}
//       <div style={{
//         width: "100%", maxWidth: "600px",
//         backgroundColor: "var(--bg-surface)",
//         border: "1px solid var(--bg-border)",
//         borderRadius: "20px",
//         padding: "40px 36px",
//       }}>
//         {error && (
//           <div style={{
//             backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
//             borderRadius: "8px", padding: "10px 14px",
//             color: "#ef4444", fontSize: "13px", marginBottom: "20px",
//           }}>
//             {error}
//           </div>
//         )}

//         {/* ── STEP 1: Type ── */}
//         {step === 1 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               إنت مين؟ 🎯
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               اختار النوع الأقرب لشغلك
//             </p>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
//               {TALENT_TYPES.map(t => (
//                 <button key={t.id} onClick={() => set("talentType", t.id as TalentType)} style={{
//                   backgroundColor: form.talentType === t.id ? "rgba(0,201,177,0.1)" : "var(--bg-card)",
//                   border: `2px solid ${form.talentType === t.id ? "var(--color-teal)" : "var(--bg-border)"}`,
//                   borderRadius: "14px", padding: "20px 16px",
//                   cursor: "pointer", textAlign: "right", transition: "all 0.2s",
//                 }}>
//                   <div style={{ fontSize: "32px", marginBottom: "8px" }}>{t.icon}</div>
//                   <p style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>
//                     {t.label}
//                   </p>
//                   <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>{t.desc}</p>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── STEP 2: Basic Info ── */}
//         {step === 2 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               معلوماتك الأساسية 📝
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               دي البيانات اللي هتتعرف بيها على المنصة
//             </p>

//             <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//               <Input label="الاسم الكامل *" placeholder="مثلاً: مايا خالد" value={form.fullName}
//                 onChange={v => set("fullName", v)} />
//               <Input label="الـ Handle (اسم المستخدم) *" placeholder="مثلاً: maya-khaled"
//                 value={form.handle} dir="ltr"
//                 onChange={v => set("handle", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
//                 hint="هيبقى رابطك: talents.com/maya-khaled" />
//               <Input label="المدينة" placeholder="مثلاً: القاهرة" value={form.city}
//                 onChange={v => set("city", v)} />

//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   النوع *
//                 </label>
//                 <div style={{ display: "flex", gap: "8px" }}>
//                   {GENDERS.map(g => (
//                     <button key={g.v} onClick={() => set("gender", g.v)} style={{
//                       flex: 1, padding: "10px",
//                       backgroundColor: form.gender === g.v ? "var(--color-teal)" : "var(--bg-card)",
//                       color: form.gender === g.v ? "#000" : "var(--text-secondary)",
//                       border: `1px solid ${form.gender === g.v ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {g.l}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── STEP 3: Bio & Specialties ── */}
//         {step === 3 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               تخصصك وبيوك ✍️
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               قول للبراندات إيه اللي بتعمله
//             </p>

//             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//               {/* Bio */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "6px" }}>
//                   البيو (عن نفسك)
//                 </label>
//                 <textarea
//                   placeholder="عرّف نفسك في جملتين... مثلاً: كريتور متخصص في محتوى الطعام، عندي 3 سنين خبرة مع أكبر البراندات المصرية"
//                   value={form.bio}
//                   onChange={e => set("bio", e.target.value)}
//                   rows={4}
//                   style={{
//                     width: "100%", padding: "12px 14px",
//                     backgroundColor: "var(--bg-card)",
//                     border: "1px solid var(--bg-border)",
//                     borderRadius: "8px", color: "var(--text-primary)",
//                     fontSize: "14px", resize: "vertical",
//                     outline: "none", boxSizing: "border-box",
//                     fontFamily: "'Cairo', sans-serif", lineHeight: 1.7,
//                   }}
//                 />
//               </div>

//               {/* Category */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   الكاتيجوري الرئيسية *
//                 </label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {CATEGORIES.map(c => (
//                     <button key={c} onClick={() => set("category", c)} style={{
//                       padding: "6px 14px",
//                       backgroundColor: form.category === c ? "var(--color-teal)" : "var(--bg-card)",
//                       color: form.category === c ? "#000" : "var(--text-secondary)",
//                       border: `1px solid ${form.category === c ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "20px", cursor: "pointer",
//                       fontSize: "12px", fontWeight: 600,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {c}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Specialties */}
//               {form.talentType && (
//                 <div>
//                   <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                     نوع الشغل اللي بتعمله (اختار أكتر من واحد)
//                   </label>
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                     {(SPECIALTIES_MAP[form.talentType] ?? []).map(s => (
//                       <button key={s} onClick={() => toggleSpecialty(s)} style={{
//                         padding: "6px 14px",
//                         backgroundColor: form.specialties.includes(s) ? "rgba(0,201,177,0.15)" : "var(--bg-card)",
//                         color: form.specialties.includes(s) ? "var(--color-teal)" : "var(--text-secondary)",
//                         border: `1px solid ${form.specialties.includes(s) ? "var(--color-teal)" : "var(--bg-border)"}`,
//                         borderRadius: "20px", cursor: "pointer",
//                         fontSize: "12px", fontWeight: 600,
//                         fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                       }}>
//                         {form.specialties.includes(s) ? "✓ " : ""}{s}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ── STEP 4: Physical ── */}
//         {step === 4 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               بياناتك الشخصية 📋
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               بتساعد البراندات يلاقوا التالنت المناسب (اختياري)
//             </p>

//             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
//               {/* Age range */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   الفئة العمرية
//                 </label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {AGE_RANGES.map(a => (
//                     <button key={a} onClick={() => set("ageRange", a)} style={{
//                       padding: "6px 16px",
//                       backgroundColor: form.ageRange === a ? "var(--color-teal)" : "var(--bg-card)",
//                       color: form.ageRange === a ? "#000" : "var(--text-secondary)",
//                       border: `1px solid ${form.ageRange === a ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {a}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Physical grid */}
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
//                 <Input label="الطول (سم)" placeholder="مثلاً: 170" value={form.height}
//                   onChange={v => set("height", v)} dir="ltr" />
//                 <Input label="الوزن (كجم)" placeholder="مثلاً: 60" value={form.weight}
//                   onChange={v => set("weight", v)} dir="ltr" />
//                 <Input label="مقاس الحذاء" placeholder="مثلاً: 39" value={form.shoeSize}
//                   onChange={v => set("shoeSize", v)} dir="ltr" />
//                 <Input label="اللغات" placeholder="مثلاً: عربي، إنجليزي" value={form.languages}
//                   onChange={v => set("languages", v)} />
//               </div>

//               {/* Hair color */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   لون الشعر
//                 </label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {HAIR_COLORS.map(c => (
//                     <button key={c} onClick={() => set("hairColor", c)} style={{
//                       padding: "6px 14px",
//                       backgroundColor: form.hairColor === c ? "rgba(0,201,177,0.15)" : "var(--bg-card)",
//                       color: form.hairColor === c ? "var(--color-teal)" : "var(--text-secondary)",
//                       border: `1px solid ${form.hairColor === c ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {c}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Eye color */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   لون العين
//                 </label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {EYE_COLORS.map(c => (
//                     <button key={c} onClick={() => set("eyeColor", c)} style={{
//                       padding: "6px 14px",
//                       backgroundColor: form.eyeColor === c ? "rgba(0,201,177,0.15)" : "var(--bg-card)",
//                       color: form.eyeColor === c ? "var(--color-teal)" : "var(--text-secondary)",
//                       border: `1px solid ${form.eyeColor === c ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {c}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── STEP 5: Social Media ── */}
//         {step === 5 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               سوشيال ميديا 📱
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               حط لينكاتك وعدد الفولورز (اختياري بس بيزود فرصك)
//             </p>

//             <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//               {[
//                 { platform: "Instagram", icon: "📸", urlKey: "instagram" as keyof FormData, followKey: "instagramFollowers" as keyof FormData, ph: "instagram.com/username" },
//                 { platform: "TikTok",    icon: "🎵", urlKey: "tiktok"    as keyof FormData, followKey: "tiktokFollowers"    as keyof FormData, ph: "tiktok.com/@username" },
//                 { platform: "YouTube",   icon: "▶️", urlKey: "youtube"   as keyof FormData, followKey: "youtubeFollowers"   as keyof FormData, ph: "youtube.com/@channel" },
//                 { platform: "LinkedIn",  icon: "💼", urlKey: "linkedin"  as keyof FormData, followKey: "linkedinFollowers"  as keyof FormData, ph: "linkedin.com/in/username" },
//               ].map(s => (
//                 <div key={s.platform} style={{
//                   backgroundColor: "var(--bg-card)",
//                   border: "1px solid var(--bg-border)",
//                   borderRadius: "12px", padding: "14px",
//                 }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
//                     <span style={{ fontSize: "18px" }}>{s.icon}</span>
//                     <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 700 }}>{s.platform}</span>
//                   </div>
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
//                     <input
//                       placeholder={s.ph}
//                       value={form[s.urlKey] as string}
//                       onChange={e => set(s.urlKey, e.target.value)}
//                       dir="ltr"
//                       style={inputStyle}
//                     />
//                     <input
//                       placeholder="الفولورز"
//                       value={form[s.followKey] as string}
//                       onChange={e => set(s.followKey, e.target.value)}
//                       dir="ltr"
//                       style={{ ...inputStyle, width: "110px" }}
//                     />
//                   </div>
//                 </div>
//               ))}

//               {/* Avg reply time */}
//               <div>
//                 <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "8px" }}>
//                   وقت الرد المعتاد
//                 </label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
//                   {REPLY_TIMES.map(r => (
//                     <button key={r} onClick={() => set("avgReplyTime", r)} style={{
//                       padding: "6px 14px",
//                       backgroundColor: form.avgReplyTime === r ? "rgba(0,201,177,0.15)" : "var(--bg-card)",
//                       color: form.avgReplyTime === r ? "var(--color-teal)" : "var(--text-secondary)",
//                       border: `1px solid ${form.avgReplyTime === r ? "var(--color-teal)" : "var(--bg-border)"}`,
//                       borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
//                       fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//                     }}>
//                       {r}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── STEP 6: Photo ── */}
//         {step === 6 && (
//           <div>
//             <h2 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
//               صورتك الشخصية 📸
//             </h2>
//             <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
//               صورة واضحة لوشك بتزود فرصك x3 عند البراندات
//             </p>

//             <div style={{ textAlign: "center" }}>
//               {/* Preview */}
//               <div
//                 onClick={() => fileRef.current?.click()}
//                 style={{
//                   width: "160px", height: "160px",
//                   borderRadius: "50%",
//                   border: `2px dashed ${form.avatarUrl ? "var(--color-teal)" : "var(--bg-border)"}`,
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   margin: "0 auto 20px",
//                   cursor: "pointer", overflow: "hidden",
//                   backgroundColor: "var(--bg-card)",
//                   transition: "border-color 0.2s",
//                 }}
//               >
//                 {form.avatarUrl ? (
//                   <img src={form.avatarUrl} alt="avatar"
//                     style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                 ) : uploading ? (
//                   <div style={{ color: "var(--color-teal)", fontSize: "13px" }}>جاري الرفع...</div>
//                 ) : (
//                   <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "16px" }}>
//                     <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
//                     <p style={{ margin: 0, fontSize: "12px" }}>اضغط لرفع صورة</p>
//                   </div>
//                 )}
//               </div>

//               <input
//                 ref={fileRef}
//                 type="file"
//                 accept="image/*"
//                 style={{ display: "none" }}
//                 onChange={e => {
//                   const file = e.target.files?.[0];
//                   if (file) handlePhotoUpload(file);
//                 }}
//               />

//               <button
//                 onClick={() => fileRef.current?.click()}
//                 disabled={uploading}
//                 style={{
//                   padding: "10px 24px",
//                   backgroundColor: "var(--bg-card)",
//                   border: "1px solid var(--bg-border)",
//                   borderRadius: "8px", cursor: "pointer",
//                   color: "var(--text-secondary)", fontSize: "13px",
//                   fontFamily: "'Cairo', sans-serif", marginBottom: "24px",
//                 }}
//               >
//                 {uploading ? "جاري الرفع..." : form.avatarUrl ? "تغيير الصورة" : "اختار صورة"}
//               </button>

//               {/* Summary card */}
//               <div style={{
//                 backgroundColor: "var(--bg-card)",
//                 border: "1px solid var(--color-teal)",
//                 borderRadius: "14px", padding: "20px",
//                 textAlign: "right",
//               }}>
//                 <p style={{ color: "var(--color-teal)", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", marginBottom: "12px" }}>
//                   ملخص بياناتك
//                 </p>
//                 <SummaryRow label="النوع" value={TALENT_TYPES.find(t => t.id === form.talentType)?.label ?? ""} />
//                 <SummaryRow label="الاسم" value={form.fullName} />
//                 <SummaryRow label="الـ Handle" value={`@${form.handle}`} />
//                 {form.city && <SummaryRow label="المدينة" value={form.city} />}
//                 {form.category && <SummaryRow label="الكاتيجوري" value={form.category} />}
//                 {form.specialties.length > 0 && <SummaryRow label="التخصصات" value={form.specialties.slice(0, 3).join("، ")} />}
//                 {form.instagram && <SummaryRow label="Instagram" value={form.instagram} />}
//                 {form.tiktok && <SummaryRow label="TikTok" value={form.tiktok} />}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── Navigation buttons ── */}
//         <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", gap: "12px" }}>
//           {step > 1 && (
//             <button
//               onClick={() => setStep((step - 1) as Step)}
//               style={{
//                 flex: 1, padding: "12px",
//                 backgroundColor: "var(--bg-card)",
//                 border: "1px solid var(--bg-border)",
//                 borderRadius: "10px", cursor: "pointer",
//                 color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600,
//                 fontFamily: "'Cairo', sans-serif",
//               }}
//             >
//               ← رجوع
//             </button>
//           )}

//           {step < 6 ? (
//             <button
//               onClick={() => { if (canProceed()) { setError(""); setStep((step + 1) as Step); } else setError("الرجاء إكمال الحقول المطلوبة *"); }}
//               style={{
//                 flex: 2, padding: "12px",
//                 backgroundColor: canProceed() ? "var(--color-teal)" : "var(--bg-elevated)",
//                 border: "none", borderRadius: "10px",
//                 cursor: canProceed() ? "pointer" : "not-allowed",
//                 color: canProceed() ? "#000" : "var(--text-muted)",
//                 fontSize: "15px", fontWeight: 800,
//                 fontFamily: "'Cairo', sans-serif", transition: "all 0.2s",
//               }}
//             >
//               التالي →
//             </button>
//           ) : (
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               style={{
//                 flex: 2, padding: "14px",
//                 backgroundColor: "var(--color-teal)",
//                 border: "none", borderRadius: "10px",
//                 cursor: loading ? "wait" : "pointer",
//                 color: "#000", fontSize: "15px", fontWeight: 800,
//                 fontFamily: "'Cairo', sans-serif",
//               }}
//             >
//               {loading ? "جاري الحفظ..." : "🚀 ابدأ رحلتك على Talents"}
//             </button>
//           )}
//         </div>

//         {/* Skip optional steps */}
//         {(step === 4 || step === 5 || step === 6) && (
//           <button
//             onClick={() => step < 6 ? setStep((step + 1) as Step) : handleSubmit()}
//             style={{
//               width: "100%", marginTop: "12px", padding: "8px",
//               background: "none", border: "none",
//               color: "var(--text-muted)", fontSize: "12px",
//               cursor: "pointer", fontFamily: "'Cairo', sans-serif",
//             }}
//           >
//             تخطي هذه الخطوة →
//           </button>
//         )}
//       </div>

//       {/* Step counter */}
//       <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "16px" }}>
//         خطوة {step} من 6
//       </p>
//     </div>
//   );
// }

// // ─── Reusable Input ────────────────────────────────────────────────────────────
// const inputStyle: React.CSSProperties = {
//   width: "100%", padding: "10px 14px",
//   backgroundColor: "var(--bg-card)",
//   border: "1px solid var(--bg-border)",
//   borderRadius: "8px", color: "var(--text-primary)",
//   fontSize: "14px", outline: "none",
//   boxSizing: "border-box",
//   fontFamily: "'Cairo', sans-serif",
// };

// function Input({ label, placeholder, value, onChange, hint, dir }: {
//   label: string; placeholder: string; value: string;
//   onChange: (v: string) => void; hint?: string; dir?: string;
// }) {
//   return (
//     <div>
//       <label style={{ color: "var(--text-muted)", fontSize: "13px", display: "block", marginBottom: "6px" }}>
//         {label}
//       </label>
//       <input
//         placeholder={placeholder}
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         dir={dir ?? "rtl"}
//         style={inputStyle}
//       />
//       {hint && (
//         <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 0" }}>{hint}</p>
//       )}
//     </div>
//   );
// }

// function SummaryRow({ label, value }: { label: string; value: string }) {
//   if (!value) return null;
//   return (
//     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--bg-border)" }}>
//       <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{label}</span>
//       <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, direction: "ltr" }}>{value}</span>
//     </div>
//   );
// }
