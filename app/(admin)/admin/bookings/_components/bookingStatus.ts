// Shared between AdminBookingsShell (filter tabs), BookingsTable (row pills +
// action buttons) and anything else that needs to render a booking status.

export const PIPELINE = [
  "pending",
  "changes_requested",
  "contacting", "brief_sent", "accepted",
  "payment_pending", "in_progress", "completed", "paid",
] as const;

export type PipelineStatus = typeof PIPELINE[number] | "rejected" | "cancelled";

export const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:          { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  changes_requested:{ bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  contacting:       { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  brief_sent:       { bg: "rgba(96,165,250,0.15)",  text: "#60a5fa" },
  accepted:         { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  payment_pending:  { bg: "rgba(244,183,64,0.15)",  text: "#F4B740" },
  in_progress:      { bg: "rgba(251,146,60,0.15)",  text: "#fb923c" },
  completed:        { bg: "rgba(0,210,106,0.15)",   text: "#00D26A" },
  paid:             { bg: "rgba(0,210,106,0.25)",   text: "#00D26A" },
  rejected:         { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
  cancelled:        { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
};

export const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
  pending:          { ar: "قيد المراجعة",    en: "Pending"         },
  changes_requested:{ ar: "تعديلات مطلوبة",  en: "Changes Requested" },
  contacting:       { ar: "تواصل",           en: "Contacting"      },
  brief_sent:       { ar: "إرسال البريف",    en: "Brief Sent"      },
  accepted:         { ar: "مقبول",           en: "Accepted"        },
  payment_pending:  { ar: "انتظار دفع",      en: "Payment Pending" },
  in_progress:      { ar: "جاري التنفيذ",    en: "In Progress"     },
  completed:        { ar: "مكتمل",           en: "Completed"       },
  paid:             { ar: "تم الدفع",        en: "Paid"            },
  rejected:         { ar: "مرفوض",           en: "Rejected"        },
  cancelled:        { ar: "ملغي",            en: "Cancelled"       },
};
