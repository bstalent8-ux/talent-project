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
  pending:          { bg: "rgba(231,165,138,0.15)",  text: "#E7A58A" },
  changes_requested:{ bg: "rgba(231,165,138,0.15)",  text: "#E7A58A" },
  contacting:       { bg: "rgba(169,155,142,0.15)", text: "#A99B8E" },
  brief_sent:       { bg: "rgba(79,167,163,0.15)",  text: "#4FA7A3" },
  accepted:         { bg: "rgba(201,138,112,0.15)", text: "#C98A70" },
  payment_pending:  { bg: "rgba(231,165,138,0.15)",  text: "#E7A58A" },
  in_progress:      { bg: "rgba(251,146,60,0.15)",  text: "#fb923c" },
  completed:        { bg: "rgba(8,127,131,0.15)",   text: "#087F83" },
  paid:             { bg: "rgba(8,127,131,0.25)",   text: "#087F83" },
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
