export const runtime = 'edge';

import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Users } from "lucide-react";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { adminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicBrand = {
  id: string;
  handle: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  brand_category?: string | null;
  brand_status?: string | null;
  account_status?: string | null;
  is_verified?: boolean | null;
};

async function fetchPublicBrand(id: string, safeHandle: string | null): Promise<PublicBrand | null> {
  const attempts = [
    "id, handle, full_name, avatar_url, city, bio, brand_category, brand_status, account_status, is_verified",
    "id, handle, full_name, avatar_url, city, bio, brand_category, brand_status, is_verified",
    "id, handle, full_name, avatar_url, city, bio, brand_status, is_verified",
  ];

  for (const select of attempts) {
    const query = adminClient
      .from("profiles")
      .select(select)
      .eq("role", "brand");

    const { data, error } = UUID_RE.test(id)
      ? await query.eq("id", id).maybeSingle()
      : safeHandle
        ? await query.eq("handle", safeHandle).maybeSingle()
        : { data: null, error: null };

    if (!error) return data as unknown as PublicBrand | null;
    if (error.code !== "42703") break;
  }

  return null;
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeHandle = /^[a-z0-9-]{1,80}$/i.test(id) ? id : null;

  const payload = await cachedPublic(
    ["brand-detail", id],
    [CACHE_TAGS.brands.detail(id), CACHE_TAGS.brands.list],
    CACHE_SECONDS.tenMinutes,
    async () => {
      const brand = await fetchPublicBrand(id, safeHandle);
      if (!brand) return null;
      if (brand.account_status && ["blocked", "suspended", "rejected"].includes(brand.account_status)) return null;
      if (brand.brand_status && brand.brand_status !== "approved") return null;

      const { data: bookings } = await adminClient
        .from("bookings")
        .select("id")
        .eq("brand_id", brand.id)
        .eq("status", "completed");

      return { brand, completedBookings: bookings?.length ?? 0 };
    },
  );

  if (!payload) notFound();
  const { brand, completedBookings } = payload;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#050B12", padding: "48px 24px 88px", fontFamily: "'Cairo',sans-serif", direction: "rtl" }}>
      <article style={{ maxWidth: 860, margin: "0 auto", backgroundColor: "#0D1623", border: "1px solid #1E293B", borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ width: 88, height: 88, borderRadius: 14, overflow: "hidden", backgroundColor: "#0A121C", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D26A", fontSize: 34, fontWeight: 900 }}>
            {brand.avatar_url ? <img src={brand.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (brand.full_name ?? "?").charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ color: "#F8FAFC", fontSize: 28, fontWeight: 900, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              {brand.full_name ?? "Brand"}
              {brand.is_verified && <BadgeCheck size={20} color="#00D26A" />}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", color: "#A8B3C2", fontSize: 13 }}>
              {brand.city && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={14} color="#00D26A" />{brand.city}</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={14} color="#00D26A" />{completedBookings} collaborations</span>
            </div>
          </div>
        </div>

        {brand.brand_category && (
          <p style={{ margin: "26px 0 10px", color: "#00D26A", fontSize: 13, fontWeight: 800 }}>{brand.brand_category}</p>
        )}
        <p style={{ color: "#F8FAFC", fontSize: 15, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
          {brand.bio || "Public brand profile"}
        </p>
      </article>
    </main>
  );
}
