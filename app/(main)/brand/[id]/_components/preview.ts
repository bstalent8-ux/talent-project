// ─── Illustrative content for blocks that have no backend yet ────────────────
// Every value here is SAMPLE content, shown only where the real source does
// not exist, and always under a visible "Preview" chip (see PreviewChip in
// BrandSections.tsx). Delete an entry once its block is wired:
//   • rating / responseRate → brand_reviews has no rows yet; response rate has
//     no computation anywhere (would need message timestamps per conversation).
//   • reviews → brand_reviews (migration 20260926) exists but nothing writes it.
//   • gallery → there is no public "collaboration media" source; deliverables
//     are private between brand and talent.

export const PREVIEW_STATS = { rating: 4.8, responseRate: 96, replyHours: 3 };

export const PREVIEW_REVIEWS = {
  average: 4.8,
  count: 89,
  bars: { communication: 4.9, professionalism: 4.8, payment: 4.7, overall: 4.8 },
  items: [
    {
      id: "p1",
      name: "Yara M.",
      rating: 5,
      ago: { ar: "منذ شهرين", en: "2 months ago" },
      text: {
        ar: "تجربة رائعة: بريف واضح، تواصل سريع، ودفع في ميعاده.",
        en: "Great experience: clear brief, quick communication and on-time payment.",
      },
    },
    {
      id: "p2",
      name: "Omar K.",
      rating: 5,
      ago: { ar: "منذ 3 أشهر", en: "3 months ago" },
      text: {
        ar: "فريق محترم وبيقدّر الإبداع. أكيد هشتغل معاهم تاني.",
        en: "A respectful team that values creativity. Would work with them again.",
      },
    },
  ],
};

const U = "https://images.unsplash.com/";
export const PREVIEW_GALLERY = [
  `${U}photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&h=300&q=60`,
  `${U}photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&h=300&q=60`,
  `${U}photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&h=300&q=60`,
  `${U}photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&h=300&q=60`,
  `${U}photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=400&h=300&q=60`,
];
