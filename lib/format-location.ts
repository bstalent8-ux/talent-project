// ─── Talent location display ───────────────────────────────────────────────
// `profiles.city` is free text in whatever language the talent typed, and the
// country isn't stored (the platform is Egypt-only). This turns it into
// "Cairo, Egypt" / "القاهرة، مصر" in the viewer's language: well-known Egyptian
// cities are translated, anything else is kept as typed. No city at all falls
// back to Cairo so the hero row keeps its shape.

// [English, Arabic, ...extra aliases (matched after normalisation)]
const CITIES: Array<[string, string, ...string[]]> = [
  ["Cairo", "القاهرة"],
  ["New Cairo", "القاهرة الجديدة", "التجمع الخامس", "التجمع"],
  ["Giza", "الجيزة", "الجيزه"],
  ["6th of October", "السادس من أكتوبر", "6 أكتوبر", "6 october", "october city", "6th october"],
  ["Sheikh Zayed", "الشيخ زايد"],
  ["Alexandria", "الإسكندرية", "اسكندريه", "الاسكندريه", "الاسكندرية"],
  ["Mansoura", "المنصورة", "المنصوره"],
  ["Tanta", "طنطا"],
  ["Zagazig", "الزقازيق"],
  ["Port Said", "بورسعيد"],
  ["Suez", "السويس"],
  ["Ismailia", "الإسماعيلية", "الاسماعيليه", "الاسماعيلية"],
  ["Damietta", "دمياط"],
  ["Fayoum", "الفيوم", "faiyum"],
  ["Beni Suef", "بني سويف", "بنى سويف"],
  ["Minya", "المنيا", "المنيه"],
  ["Assiut", "أسيوط", "اسيوط", "asyut"],
  ["Sohag", "سوهاج"],
  ["Qena", "قنا"],
  ["Luxor", "الأقصر", "الاقصر"],
  ["Aswan", "أسوان", "اسوان"],
  ["Hurghada", "الغردقة", "الغردقه"],
  ["Sharm El Sheikh", "شرم الشيخ", "sharm el-sheikh"],
  ["Kafr El Sheikh", "كفر الشيخ"],
  ["Damanhour", "دمنهور"],
  ["Shebin El Kom", "شبين الكوم"],
  ["Banha", "بنها"],
  ["Madinaty", "مدينتي", "madinty"],
  ["Obour", "العبور", "elobour", "el obour"],
  ["Shorouk", "الشروق", "el shorouk"],
  ["Rehab", "الرحاب", "el rehab"],
  ["Nasr City", "مدينة نصر"],
  ["Maadi", "المعادي", "المعادى"],
  ["Heliopolis", "مصر الجديدة"],
];

const DEFAULT_CITY: [string, string] = ["Cairo", "القاهرة"];

function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")   // latin diacritics
    .replace(/[ً-ٰٟ]/g, "")              // arabic tashkeel
    .replace(/[أإآٱ]/g, "ا")    // أ إ آ ٱ -> ا
    .replace(/ى/g, "ي")                         // ى -> ي
    .replace(/ة/g, "ه")                         // ة -> ه
    .replace(/[^a-z0-9؀-ۿ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LOOKUP = new Map<string, [string, string]>();
for (const [en, ar, ...aliases] of CITIES) {
  for (const key of [en, ar, ...aliases]) LOOKUP.set(norm(key), [en, ar]);
}

const COUNTRY_WORDS = new Set(["egypt", "مصر"]);

/** City part of whatever is stored ("Giza، مصر", "Cairo, Egypt", "Tanta"), or "" if none. */
function cityPart(raw: string | null | undefined): string {
  const parts = String(raw ?? "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
  const city = parts.find((p) => !COUNTRY_WORDS.has(norm(p))) ?? "";
  return city;
}

/** Just the city, translated when it is a known Egyptian city. */
export function formatCity(raw: string | null | undefined, lang: "ar" | "en" | string): string {
  const city = cityPart(raw);
  const hit = city ? LOOKUP.get(norm(city)) : undefined;
  const [en, ar] = hit ?? (city ? [city, city] : DEFAULT_CITY);
  return lang === "en" ? en : ar;
}

/** "Cairo, Egypt" in English, "القاهرة، مصر" in Arabic. */
export function formatLocation(raw: string | null | undefined, lang: "ar" | "en" | string): string {
  const city = formatCity(raw, lang);
  return lang === "en" ? `${city}, Egypt` : `${city}، مصر`;
}
