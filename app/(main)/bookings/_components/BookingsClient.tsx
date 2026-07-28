"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, SearchX, WalletCards } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "./BookingsClient.module.css";

type TabKey = "pending" | "accepted" | "rejected" | "completed";

interface Party {
  full_name: string | null;
  avatar_url: string | null;
}

interface Booking {
  id: string;
  status: string;
  amount: number | null;
  budget_type?: string | null;
  budget_amount?: number | null;
  start_date?: string | null;
  duration?: number | null;
  deadline?: string | null;
  negotiation_message?: string | null;
  created_at: string;
  service_type: string | null;
  brand: Party | null;
  talent: Party | null;
  job: { title: string } | null;
  brief: { title?: string | null; status: string; deadline?: string | null } | null;
}

interface Props {
  bookings: Booking[];
  myRole: string;
  myId: string;
}

const TAB_STATUSES: Record<TabKey, string[]> = {
  pending: ["pending", "changes_requested", "brief_sent", "contacting"],
  accepted: ["accepted", "payment_pending", "in_progress"],
  rejected: ["rejected", "cancelled"],
  completed: ["completed", "paid"],
};

const STATUS_META: Record<string, { ar: string; en: string; tone: string }> = {
  pending:           { ar: "قيد المراجعة", en: "Pending", tone: "pending" },
  changes_requested: { ar: "تعديلات مطلوبة", en: "Changes requested", tone: "warning" },
  contacting:        { ar: "تواصل", en: "Contacting", tone: "muted" },
  brief_sent:        { ar: "تم إرسال البريف", en: "Brief sent", tone: "pending" },
  accepted:          { ar: "مقبول", en: "Accepted", tone: "accepted" },
  payment_pending:   { ar: "بانتظار الدفع", en: "Payment pending", tone: "warning" },
  in_progress:       { ar: "قيد التنفيذ", en: "In progress", tone: "warning" },
  rejected:          { ar: "مرفوض", en: "Rejected", tone: "rejected" },
  completed:         { ar: "مكتمل", en: "Completed", tone: "completed" },
  paid:              { ar: "مدفوع", en: "Paid", tone: "completed" },
  cancelled:         { ar: "ملغي", en: "Cancelled", tone: "rejected" },
};

const TX = {
  ar: {
    title: "طلبات الحجز",
    subtitle: "تابع طلبات الحجز والاتفاقات الجارية في مكان واحد.",
    pending: "قيد المراجعة",
    accepted: "مقبولة",
    rejected: "مرفوضة",
    completed: "مكتملة",
    view: "عرض التفاصيل",
    budget: "الميزانية",
    start: "البداية",
    deadline: "التسليم",
    duration: "المدة",
    hours: "ساعة",
    days: "يوم",
    emptyTitle: "لا توجد طلبات هنا",
    emptyText: "عندما يتغير وضع طلبات الحجز ستظهر في هذا التبويب.",
    directProject: "طلب حجز مباشر",
    quote: "عرض سعر",
  },
  en: {
    title: "Booking Requests",
    subtitle: "Track booking requests and active agreements in one place.",
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    completed: "Completed",
    view: "View details",
    budget: "Budget",
    start: "Start",
    deadline: "Deadline",
    duration: "Duration",
    hours: "hours",
    days: "days",
    emptyTitle: "No requests here",
    emptyText: "Booking requests will appear in this tab as their status changes.",
    directProject: "Direct booking request",
    quote: "Get quote",
  },
} as const;

function formatDate(value: string | null | undefined, ar: boolean) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(ar ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatService(value: string | null | undefined, ar: boolean) {
  if (value === "hourly") return ar ? "بالساعة" : "Hourly";
  if (value === "daily") return ar ? "باليوم" : "Daily";
  if (value === "fixed_project") return ar ? "مشروع ثابت" : "Fixed project";
  return ar ? "طلب مباشر" : "Direct";
}

export default function BookingsClient({ bookings, myRole }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const t = TX[lang];
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const counts = useMemo(() => {
    return Object.fromEntries(
      (Object.keys(TAB_STATUSES) as TabKey[]).map((key) => [
        key,
        bookings.filter((booking) => TAB_STATUSES[key].includes(booking.status)).length,
      ]),
    ) as Record<TabKey, number>;
  }, [bookings]);

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => TAB_STATUSES[activeTab].includes(booking.status)),
    [bookings, activeTab],
  );

  const isBrand = myRole === "brand";

  return (
    <main className={`${styles.page} ${dark ? styles.dark : styles.light}`} dir={ar ? "rtl" : "ltr"}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </header>

        <nav className={styles.tabs} aria-label={t.title}>
          {(Object.keys(TAB_STATUSES) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {t[key]}
              <span>{counts[key]}</span>
            </button>
          ))}
        </nav>

        {visibleBookings.length === 0 ? (
          <div className={styles.empty}>
            <SearchX size={30} />
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {visibleBookings.map((booking) => {
              const other = isBrand ? booking.talent : booking.brand;
              const status = STATUS_META[booking.status] ?? { ar: booking.status, en: booking.status, tone: "muted" };
              const amount = booking.budget_amount ?? booking.amount;
              const durationUnit = booking.service_type === "hourly" ? t.hours : t.days;
              const title = booking.brief?.title || booking.job?.title || t.directProject;

              return (
                <article className={styles.card} key={booking.id}>
                  <div className={styles.identity}>
                    <span className={styles.avatar}>
                      {other?.avatar_url ? <img src={other.avatar_url} alt="" /> : (other?.full_name ?? "?").charAt(0)}
                    </span>
                    <div>
                      <h2>{title}</h2>
                      <p>{other?.full_name ?? "—"}</p>
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <span>
                      <WalletLabel />
                      <b>{t.budget}</b>
                      {amount ? `${amount.toLocaleString()} EGP` : t.quote}
                    </span>
                    <span>
                      <CalendarDays size={14} />
                      <b>{t.start}</b>
                      {formatDate(booking.start_date, ar)}
                    </span>
                    <span>
                      <Clock size={14} />
                      <b>{t.duration}</b>
                      {booking.duration ? `${booking.duration} ${durationUnit}` : formatDate(booking.deadline ?? booking.brief?.deadline, ar)}
                    </span>
                  </div>

                  {booking.negotiation_message ? (
                    <p className={styles.proposal}>{booking.negotiation_message}</p>
                  ) : null}

                  <footer className={styles.cardFooter}>
                    <span className={`${styles.badge} ${styles[status.tone]}`}>{ar ? status.ar : status.en}</span>
                    <span className={styles.service}>{formatService(booking.service_type, ar)}</span>
                    <Link className={styles.linkButton} href={`/bookings/${booking.id}`}>{t.view}</Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function WalletLabel() {
  return <WalletCards size={14} />;
}
