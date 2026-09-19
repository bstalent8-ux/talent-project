"use client";

// ─── Content Specialties ───────────────────────────────────────────────────
// Card matching the approved reference: "Content Specialties" + "View All"
// header and lavender pills, each with its own coloured icon. The pills are the
// talent's real specialties; the icon is picked from the name (unknown names get
// a generic tag). No specialties → the card stays and says "No content".

import { useState, type ComponentType } from "react";
import {
  Package, BadgeCheck, GraduationCap, GitCompare, Heart, Sparkles, Utensils, Cpu, Film, Music2,
  ShoppingCart, Megaphone, Tag, Shirt, Plane, Dumbbell, Home, Gamepad2, Camera,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const PURPLE = "#6C4DFF";
const INITIAL_COUNT = 12;

// Shown when the talent hasn't listed specialties of their own, so the card matches
// the reference instead of sitting empty. A talent's real specialties always win.
const DEFAULT_TYPES = ["Unboxing", "Product Review", "Tutorial", "Comparison", "Lifestyle", "Beauty", "Food", "Tech", "Reels", "TikTok", "Amazon Content", "Ads Creative"];

type IconSpec = { Icon: ComponentType<{ size?: number; color?: string }>; color: string };

// First matching keyword wins; matched against the lower-cased specialty, so
// both English names and the common Arabic spellings resolve.
const ICON_RULES: Array<[RegExp, IconSpec]> = [
  [/unbox|فتح|أنبوكس|انبوكس/, { Icon: Package, color: "#7C5CFF" }],
  [/review|ريفيو|مراجع|تقييم/, { Icon: BadgeCheck, color: "#EC4899" }],
  [/tutorial|شرح|تعليم|how.?to/, { Icon: GraduationCap, color: "#3B82F6" }],
  [/compar|مقارن/, { Icon: GitCompare, color: "#8B5CF6" }],
  [/life|لايف|أسلوب|اسلوب/, { Icon: Heart, color: "#F472B6" }],
  [/beauty|makeup|skin|جمال|مكياج|بشرة/, { Icon: Sparkles, color: "#EC4899" }],
  [/food|cook|recipe|أكل|اكل|طعام|طبخ/, { Icon: Utensils, color: "#F97316" }],
  [/tech|gadget|تقني|تكنولوج/, { Icon: Cpu, color: "#10B981" }],
  [/reel|ريلز|ريل/, { Icon: Film, color: "#EF4444" }],
  [/tiktok|تيك/, { Icon: Music2, color: "#0F172A" }],
  [/amazon|shop|ecom|متجر|تسوق/, { Icon: ShoppingCart, color: "#F59E0B" }],
  [/ad|إعلان|اعلان|creative|حملة|campaign/, { Icon: Megaphone, color: "#7C5CFF" }],
  [/fashion|style|ملابس|موضة|أزياء|ازياء/, { Icon: Shirt, color: "#EC4899" }],
  [/travel|سفر|سياحة/, { Icon: Plane, color: "#0EA5E9" }],
  [/fit|sport|gym|رياضة|لياقة/, { Icon: Dumbbell, color: "#14B8A6" }],
  [/home|منزل|ديكور|decor/, { Icon: Home, color: "#A16207" }],
  [/game|gaming|جيمنج|ألعاب|العاب/, { Icon: Gamepad2, color: "#6366F1" }],
  [/photo|تصوير|vlog|فلوج/, { Icon: Camera, color: "#0EA5E9" }],
];

function iconFor(name: string): IconSpec {
  const key = name.toLowerCase();
  for (const [re, spec] of ICON_RULES) if (re.test(key)) return spec;
  return { Icon: Tag, color: PURPLE };
}

export default function UgcContentSpecialties({ specialties: own }: { specialties: string[] }) {
  const specialties = own.length > 0 ? own : DEFAULT_TYPES;
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E5E7EB";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const PILL_BG = dark ? "rgba(124,92,255,0.14)" : "#F3F0FF";
  const PILL_BORDER = dark ? "rgba(124,92,255,0.30)" : "#E4DDFF";
  const [expanded, setExpanded] = useState(false);

  const canExpand = specialties.length > INITIAL_COUNT;
  const visible = expanded ? specialties : specialties.slice(0, INITIAL_COUNT);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h3 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>{ar ? "مجالات المحتوى" : "Content Specialties"}</h3>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{ background: "none", border: "none", padding: 0, color: PURPLE, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
          >
            {expanded ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل" : "View All")}
          </button>
        )}
      </div>

      {specialties.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>
          {ar ? "لا يوجد محتوى" : "No content"}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {visible.map((s) => {
            const { Icon, color } = iconFor(s);
            return (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 10, backgroundColor: PILL_BG, border: `1px solid ${PILL_BORDER}`, color: TEXT, fontSize: 13, fontWeight: 600 }}>
                <Icon size={14} color={color} />{s}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
