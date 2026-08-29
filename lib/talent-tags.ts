// "ugc"/"model" are stored lowercase in talent_profiles.specialties so they
// stay matchable against ExploreClient's matchesType() (a talent whose real
// category is e.g. "model" can list "ugc" as an extra specialty to also
// show up under the UGC Explore tab, without a fake second category). That
// same lowercase value renders as a bare, unstyled-looking chip wherever
// specialties are shown as tags — this gives those two a real label. Any
// other specialty a talent typed in themselves is returned exactly as
// written.
export function formatTalentTag(tag: string, lang: "ar" | "en"): string {
  if (tag === "ugc") return "UGC";
  if (tag === "model") return lang === "ar" ? "موديل" : "Model";
  return tag;
}
