export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Users } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeHandle = /^[a-z0-9-]{1,80}$/i.test(id) ? id : null;

  const query = adminClient
    .from("profiles")
    .select("id, handle, full_name, avatar_url, city, bio, brand_category, brand_status, account_status, is_verified")
    .eq("role", "brand");

  const { data: brand } = UUID_RE.test(id)
    ? await query.eq("id", id).maybeSingle()
    : safeHandle
      ? await query.eq("handle", safeHandle).maybeSingle()
      : { data: null };

  if (!brand) notFound();
  if (brand.account_status && ["blocked", "suspended", "rejected"].includes(brand.account_status)) notFound();
  if (brand.brand_status && brand.brand_status !== "approved") notFound();

  const { data: bookings } = await adminClient
    .from("bookings")
    .select("id")
    .eq("brand_id", brand.id)
    .eq("status", "completed");

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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={14} color="#00D26A" />{bookings?.length ?? 0} collaborations</span>
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
