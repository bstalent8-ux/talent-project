"use client";

// ─── Brand page sections ──────────────────────────────────────────────────────
// Each card below renders real data when it exists. Where there is no backend
// yet (rating, response rate, collaboration gallery, talent reviews) it shows
// sample content from ./preview.ts under a visible "Preview" chip.

import { useState } from "react";
import Link from "next/link";
import {
  Leaf, Users, CalendarDays, MapPin, Wallet, CalendarClock, Briefcase, Star, MessageSquareText,
  CircleCheck, Circle, ArrowRight, ArrowLeft, UserPlus, UserCheck, Handshake, Clock, ChevronDown,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import type {
  BrandJob, BrandReviewSummary, BrandTalent, SimilarBrand,
} from "@/features/brand-page/brand-page.service";
import { PREVIEW_GALLERY, PREVIEW_REVIEWS, PREVIEW_STATS } from "./preview";
import s from "./brandPage.module.css";

const TX = {
  ar: {
    about: (n: string) => `عن ${n}`, noBio: "البراند لم يكتب نبذة بعد.",
    industry: "الصناعة", size: "حجم الشركة", founded: "سنة التأسيس", hq: "المقر الرئيسي",
    opportunities: "الفرص المتاحة", viewAll: "عرض الكل", noJobs: "لا توجد فرص مفتوحة حالياً.",
    applicants: (n: number) => `${n} متقدم`, apply: "عرض وتقديم", applyBy: "آخر موعد", isNew: "جديد",
    budgetOpen: "الميزانية حسب الاتفاق",
    collaborations: "تعاونات سابقة", reviews: "تقييمات المواهب", basedOn: (n: number) => `بناءً على ${n} تقييم`,
    communication: "التواصل", professionalism: "الاحترافية", payment: "الدفع", overall: "التجربة العامة",
    stats: "إحصائيات البراند", collabs: "تعاون مكتمل", rating: "التقييم", talentsWorked: "موهبة تعامل معها", response: "معدل الرد",
    trust: "التوثيق والثقة", email: "البريد موثّق", business: "النشاط التجاري موثّق", paymentV: "الدفع موثّق",
    completed: (n: number) => `${n} تعاون مكتمل`,
    talents: "مواهب تعامل معهم", noTalents: "لم يُكمل البراند أي تعاون بعد.", viewProfile: "عرض البروفايل",
    similar: "براندات مشابهة", noSimilar: "لا توجد براندات مشابهة بعد.", follow: "متابعة", following: "متابَع",
    preview: "معاينة", authFollow: "أنشئ حساباً لمتابعة البراندات.",
    readMore: "اقرأ المزيد", readLess: "عرض أقل", replies: (h: number) => `عادةً يرد خلال ${h} ساعات`,
  },
  en: {
    about: (n: string) => `About ${n}`, noBio: "This brand hasn't written an introduction yet.",
    industry: "Industry", size: "Company Size", founded: "Founded", hq: "Headquarters",
    opportunities: "Active Opportunities", viewAll: "View All", noJobs: "No open opportunities right now.",
    applicants: (n: number) => `${n} applicants`, apply: "View & Apply", applyBy: "Apply by", isNew: "New",
    budgetOpen: "Budget on agreement",
    collaborations: "Recent Collaborations", reviews: "Reviews from Talents", basedOn: (n: number) => `Based on ${n} reviews`,
    communication: "Communication", professionalism: "Professionalism", payment: "Payment", overall: "Overall Experience",
    stats: "Brand Stats", collabs: "Collaborations", rating: "Rating", talentsWorked: "Talents Worked With", response: "Response Rate",
    trust: "Verification & Trust", email: "Email verified", business: "Business verified", paymentV: "Payment verified",
    completed: (n: number) => `${n} completed collaborations`,
    talents: "Talents They Worked With", noTalents: "No completed collaborations yet.", viewProfile: "View Profile",
    similar: "Similar Brands", noSimilar: "No similar brands yet.", follow: "Follow", following: "Following",
    preview: "Preview", authFollow: "Create a free account to follow brands.",
    readMore: "Read More", readLess: "Show less", replies: (h: number) => `Usually replies within ${h} hours`,
  },
};

function useTx() {
  const { lang } = useSite();
  const ar = lang === "ar";
  return { ar, tx: TX[ar ? "ar" : "en"] };
}

function PreviewChip() {
  const { tx } = useTx();
  return <span className={s.previewChip} title="Sample content — not connected to data yet">{tx.preview}</span>;
}

function Avatar({ src, name, large = false }: { src: string | null; name: string; large?: boolean }) {
  return (
    <span className={`${s.avatar} ${large ? s.avatarLg : ""}`}>
      {src ? <img src={src} alt="" /> : name.charAt(0)}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className={s.stars} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill={i <= Math.round(value) ? "currentColor" : "none"} aria-hidden="true" />)}
    </span>
  );
}

const fmtNum = (n: number) => n.toLocaleString("en-US");
const fmtDate = (iso: string, ar: boolean) =>
  new Date(iso).toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-US", { month: "short", day: "numeric", year: "numeric" });

// ─── About ───────────────────────────────────────────────────────────────────

export function AboutCard({ name, bio, industry, companySize, foundedYear, city }: {
  name: string; bio: string | null; industry: string | null;
  companySize: string | null; foundedYear: number | null; city: string | null;
}) {
  const { tx } = useTx();
  const facts = [
    { icon: Leaf, label: tx.industry, value: industry },
    { icon: Users, label: tx.size, value: companySize },
    { icon: CalendarDays, label: tx.founded, value: foundedYear ? String(foundedYear) : null },
    { icon: MapPin, label: tx.hq, value: city },
  ];
  const [open, setOpen] = useState(false);
  const text = bio?.trim() || tx.noBio;
  // Phones clamp the bio to four lines (CSS); the toggle only exists there.
  const long = text.length > 160;
  return (
    <section className={s.card} data-sec="about">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.about(name)}</h2></div>
      <p className={`${s.about} ${long && !open ? s.aboutClamp : ""}`}>{text}</p>
      {long && (
        <button type="button" className={s.readMore} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? tx.readLess : tx.readMore}
          <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} aria-hidden="true" />
        </button>
      )}
      <div className={s.facts}>
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className={s.fact}>
            <Icon className={s.factIcon} size={26} strokeWidth={1.6} aria-hidden="true" />
            <div><strong>{label}</strong><span>{value || "—"}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export function OpportunitiesCard({ jobs, total, city }: { jobs: BrandJob[]; total: number; city: string | null }) {
  const { ar, tx } = useTx();
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const weekAgo = Date.now() - 7 * 864e5;
  return (
    <section className={s.card} id="opportunities" data-sec="opps">
      <div className={s.cardHead}>
        <h2 className={s.cardTitle}>{tx.opportunities} ({total})</h2>
        {total > jobs.length && <Link className={s.viewAll} href="/community">{tx.viewAll}<Arrow size={14} /></Link>}
      </div>
      {jobs.length === 0 ? <p className={s.empty}>{tx.noJobs}</p> : (
        <div className={s.jobs}>
          {jobs.map((j) => {
            const budget = j.budgetMin || j.budgetMax
              ? `${j.budgetMin ? fmtNum(j.budgetMin) : ""}${j.budgetMin && j.budgetMax ? " – " : ""}${j.budgetMax ? fmtNum(j.budgetMax) : ""} ${j.currency}`
              : tx.budgetOpen;
            return (
              <article key={j.id} className={s.job}>
                <div className={s.jobArt}>
                  <Briefcase size={30} strokeWidth={1.5} aria-hidden="true" />
                  {new Date(j.createdAt).getTime() > weekAgo && <span className={s.newBadge}>{tx.isNew}</span>}
                </div>
                <div className={s.jobBody}>
                  <h3 className={s.jobTitle}>{j.title}</h3>
                  {j.category && <div className={s.tags} style={{ marginTop: 0 }}><span className={s.tag}>{j.category}</span></div>}
                  {city && <span className={s.jobMeta}><MapPin size={13} />{city}</span>}
                  <span className={s.jobMeta}><Wallet size={13} />{budget}</span>
                  {j.applyBy && <span className={s.jobMeta}><CalendarClock size={13} />{tx.applyBy} {fmtDate(j.applyBy, ar)}</span>}
                  <div className={s.jobFoot}>
                    <span className={s.applicants}>{tx.applicants(j.applicants)}</span>
                    <Link href={`/jobs/${j.id}`} className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>{tx.apply}</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Collaborations gallery (preview only) ───────────────────────────────────

export function CollaborationsCard() {
  const { tx } = useTx();
  return (
    <section className={s.card} data-sec="collabs">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.collaborations} <PreviewChip /></h2></div>
      <div className={s.gallery}>
        {PREVIEW_GALLERY.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
      </div>
    </section>
  );
}

// ─── Reviews (real when brand_reviews has approved rows, else preview) ───────

export function ReviewsCard({ reviews }: { reviews: BrandReviewSummary | null }) {
  const { ar, tx } = useTx();
  const real = reviews && reviews.count > 0;
  const average = real ? reviews.average : PREVIEW_REVIEWS.average;
  const count = real ? reviews.count : PREVIEW_REVIEWS.count;
  const bars = real
    ? [
        [tx.communication, reviews.communication], [tx.professionalism, reviews.professionalism],
        [tx.payment, reviews.payment], [tx.overall, reviews.average],
      ] as Array<[string, number | null]>
    : [
        [tx.communication, PREVIEW_REVIEWS.bars.communication], [tx.professionalism, PREVIEW_REVIEWS.bars.professionalism],
        [tx.payment, PREVIEW_REVIEWS.bars.payment], [tx.overall, PREVIEW_REVIEWS.bars.overall],
      ] as Array<[string, number | null]>;
  const items = real
    ? reviews.latest.map((r) => ({ id: r.id, name: r.author.name, avatar: r.author.avatar, rating: r.rating, ago: fmtDate(r.createdAt, ar), text: r.comment ?? "" }))
    : PREVIEW_REVIEWS.items.map((r) => ({ id: r.id, name: r.name, avatar: null, rating: r.rating, ago: r.ago[ar ? "ar" : "en"], text: r.text[ar ? "ar" : "en"] }));

  return (
    <section className={s.card} data-sec="reviews">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.reviews} {!real && <PreviewChip />}</h2></div>
      <div className={s.reviews}>
        <div>
          <div className={s.score}>
            <span className={s.scoreNum}>{average.toFixed(1)}</span>
            <div><Stars value={average} /><div className={s.scoreCount}>{tx.basedOn(count)}</div></div>
          </div>
          <div className={s.bars}>
            {bars.map(([label, v]) => (
              <div key={label} className={s.bar}>
                <span>{label}</span>
                <span className={s.barTrack}><span className={s.barFill} style={{ width: `${((v ?? 0) / 5) * 100}%` }} /></span>
                <span>{v != null ? v.toFixed(1) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
        {items.map((r) => (
          <article key={r.id} className={s.review}>
            <div className={s.reviewHead}>
              <Avatar src={r.avatar} name={r.name} />
              <div><strong>{r.name}</strong><span className={s.reviewMeta}><Stars value={r.rating} /><small>{r.ago}</small></span></div>
            </div>
            <p className={s.reviewText}>{r.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Rail: Stats ─────────────────────────────────────────────────────────────

export function StatsCard({ collaborations, talentsWorkedWith, reviews }: {
  collaborations: number; talentsWorkedWith: number; reviews: BrandReviewSummary | null;
}) {
  const { tx } = useTx();
  const hasRating = !!reviews && reviews.count > 0;
  return (
    <section className={s.card} data-sec="stats">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.stats}</h2></div>
      <div className={s.stats}>
        <div className={s.stat}><Handshake size={26} strokeWidth={1.6} aria-hidden="true" /><div><strong>{fmtNum(collaborations)}</strong><span>{tx.collabs}</span></div></div>
        <div className={`${s.stat} ${hasRating ? "" : s.statPreview}`} title={hasRating ? undefined : tx.preview}>
          <Star size={26} strokeWidth={1.6} aria-hidden="true" />
          <div><strong>{(hasRating ? reviews!.average : PREVIEW_STATS.rating).toFixed(1)}</strong><span>{tx.rating}{hasRating ? "" : ` · ${tx.preview}`}</span></div>
        </div>
        <div className={s.stat}><Users size={26} strokeWidth={1.6} aria-hidden="true" /><div><strong>{fmtNum(talentsWorkedWith)}</strong><span>{tx.talentsWorked}</span></div></div>
        <div className={`${s.stat} ${s.statPreview}`} title={tx.preview}>
          <MessageSquareText size={26} strokeWidth={1.6} aria-hidden="true" />
          <div><strong>{PREVIEW_STATS.responseRate}%</strong><span>{tx.response} · {tx.preview}</span></div>
        </div>
      </div>
      <div className={s.replyRow}>
        <Clock size={17} aria-hidden="true" />
        <span>{tx.replies(PREVIEW_STATS.replyHours)}</span>
        <PreviewChip />
      </div>
    </section>
  );
}

// ─── Rail: Trust ─────────────────────────────────────────────────────────────

export function TrustCard({ verification, collaborations }: {
  verification: { email: boolean; business: boolean; payment: boolean }; collaborations: number;
}) {
  const { tx } = useTx();
  const rows: Array<[string, boolean]> = [
    [tx.email, verification.email],
    [tx.business, verification.business],
    [tx.paymentV, verification.payment],
    [tx.completed(collaborations), collaborations > 0],
  ];
  return (
    <section className={s.card} data-sec="trust">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.trust}</h2></div>
      <ul className={s.trust}>
        {rows.map(([label, on]) => (
          <li key={label}>
            {on
              ? <CircleCheck className={s.trustOn} size={20} aria-hidden="true" />
              : <Circle className={s.trustOff} size={20} aria-hidden="true" />}
            <span style={{ opacity: on ? 1 : 0.6 }}>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Rail: Talents worked with ───────────────────────────────────────────────

export function TalentsCard({ talents, total }: { talents: BrandTalent[]; total: number }) {
  const { tx } = useTx();
  return (
    <section className={s.card} data-sec="talents">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.talents}</h2>{total > talents.length && <span className={s.viewAll}>{total}</span>}</div>
      {talents.length === 0 ? <p className={s.empty}>{tx.noTalents}</p> : (
        <div className={s.people}>
          {talents.map((t) => (
            <div key={t.id} className={s.person}>
              <Link className={s.personLink} href={`/talent/${t.handle}`}>
                <Avatar src={t.avatar} name={t.name} large />
                <span className={s.personText}>
                  <strong>{t.name}</strong>
                  {t.category && <span>{t.category}</span>}
                  {t.rating != null && <span className={s.personRating}><Star size={12} fill="currentColor" aria-hidden="true" />{t.rating.toFixed(1)}</span>}
                </span>
              </Link>
              <Link className={s.pill} href={`/talent/${t.handle}`}>{tx.viewProfile}</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Rail: Similar brands ────────────────────────────────────────────────────

function FollowPill({ brandId }: { brandId: string }) {
  const { tx } = useTx();
  const { user, requestAuth } = useGuestGuard();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (!user?.id) { requestAuth("start_conversation", tx.authFollow); return; }
    setBusy(true);
    const next = !on;
    setOn(next);
    const res = next
      ? await fetch("/api/community/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followeeId: brandId }) })
      : await fetch(`/api/community/follow?followeeId=${brandId}`, { method: "DELETE" });
    if (!res.ok) setOn(!next);
    setBusy(false);
  }
  return (
    <button type="button" className={`${s.pill} ${s.pillAccent} ${on ? s.pillActive : ""}`} onClick={toggle} disabled={busy} aria-pressed={on}>
      {on ? <UserCheck size={13} /> : <UserPlus size={13} />}&nbsp;{on ? tx.following : tx.follow}
    </button>
  );
}

export function SimilarCard({ brands }: { brands: SimilarBrand[] }) {
  const { tx } = useTx();
  return (
    <section className={s.card} data-sec="similar">
      <div className={s.cardHead}><h2 className={s.cardTitle}>{tx.similar}</h2></div>
      {brands.length === 0 ? <p className={s.empty}>{tx.noSimilar}</p> : (
        <div className={s.people}>
          {brands.map((b) => (
            <div key={b.userId} className={s.person}>
              <Link className={s.personLink} href={`/brand/${b.handle ?? b.userId}`}>
                <Avatar src={b.avatar} name={b.name} large />
                <span className={s.personText}><strong>{b.name}</strong>{b.industry && <span>{b.industry}</span>}</span>
              </Link>
              <FollowPill brandId={b.userId} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
