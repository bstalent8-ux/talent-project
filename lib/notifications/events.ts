// ─── Business events (SERVER ONLY) ───────────────────────────────────────────
// The ONLY thing feature code should import. Routes describe *what happened*
// in domain terms; this file decides who gets notified, in which language, with
// what priority and destination.
//
// Adding a notification to a new feature = adding a function here, never
// hand-rolling an insert at the call site.

import { adminClient } from "@/lib/supabase/admin";
import {
  createNotification,
  dispatchNotification,
  notifyCategory,
  notifyRole,
  recordBroadcast,
  updateBroadcastCount,
} from "./service";
import { withI18n } from "./templates";
import type {
  NotificationAudience,
  NotificationContent,
  NotificationPriority,
  NotificationType,
} from "./types";

/** Truncate free text so a 4 000-character brief doesn't become the message. */
function snip(text: string | null | undefined, max = 120): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

/**
 * A brand published a job. Fans out to talents.
 *
 * `categoryIds` narrows the audience to talents in those marketplace
 * categories; omit it to reach every talent. This is the "future filtering"
 * hook — richer matching (city, rate band, availability) plugs in here without
 * touching the job route.
 */
export async function notifyJobCreated(input: {
  jobId:       string;
  jobTitle:    string;
  brandId:     string;
  brandName?:  string | null;
  categoryIds?: string[];
}): Promise<number> {
  const content: NotificationContent = {
    type:      "JOB_CREATED",
    senderId:  input.brandId,
    actionUrl: `/jobs/${input.jobId}`,
    ...withI18n(
      {
        title: {
          ar: "وظيفة جديدة تناسبك",
          en: "A new job for you",
        },
        message: {
          ar: `نشرت ${input.brandName || "إحدى الشركات"} وظيفة: ${snip(input.jobTitle, 70)}`,
          en: `${input.brandName || "A brand"} posted a job: ${snip(input.jobTitle, 70)}`,
        },
      },
      { job_id: input.jobId, brand_id: input.brandId }
    ),
  };

  if (input.categoryIds?.length) {
    return notifyCategory(input.categoryIds, content);
  }
  return notifyRole(["talent"], content);
}

export async function notifyJobApplicationReceived(input: {
  jobId:         string;
  jobTitle?:     string | null;
  applicationId: string;
  brandId:       string;
  talentId:      string;
  talentName?:   string | null;
  message?:      string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.brandId,
    type:        "JOB_APPLICATION_RECEIVED",
    senderId:    input.talentId,
    actionUrl:   `/jobs/${input.jobId}/applications`,
    ...withI18n(
      {
        title: {
          ar: "طلب تقديم جديد",
          en: "New application",
        },
        message: {
          ar: `تقدّم ${input.talentName || "أحد المواهب"} على ${input.jobTitle ? `وظيفة «${snip(input.jobTitle, 50)}»` : "وظيفتك"}`,
          en: `${input.talentName || "A talent"} applied to ${input.jobTitle ? `"${snip(input.jobTitle, 50)}"` : "your job"}`,
        },
      },
      { job_id: input.jobId, application_id: input.applicationId, talent_id: input.talentId }
    ),
  });
}

export async function notifyApplicationAccepted(input: {
  jobId:         string;
  jobTitle?:     string | null;
  applicationId: string;
  talentId:      string;
  brandId:       string;
  bookingId?:    string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.talentId,
    type:        "APPLICATION_ACCEPTED",
    senderId:    input.brandId,
    actionUrl:   input.bookingId ? `/bookings/${input.bookingId}` : `/jobs/${input.jobId}`,
    ...withI18n(
      {
        title: {
          ar: "تم قبول طلبك 🎉",
          en: "Your application was accepted 🎉",
        },
        message: {
          ar: `تم قبولك في ${input.jobTitle ? `وظيفة «${snip(input.jobTitle, 50)}»` : "الوظيفة"}`,
          en: `You were accepted for ${input.jobTitle ? `"${snip(input.jobTitle, 50)}"` : "the job"}`,
        },
      },
      {
        job_id:         input.jobId,
        application_id: input.applicationId,
        ...(input.bookingId ? { booking_id: input.bookingId } : {}),
      }
    ),
  });
}

export async function notifyApplicationRejected(input: {
  jobId:         string;
  jobTitle?:     string | null;
  applicationId: string;
  talentId:      string;
  brandId:       string;
  reason?:       string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.talentId,
    type:        "APPLICATION_REJECTED",
    senderId:    input.brandId,
    actionUrl:   `/jobs/${input.jobId}`,
    ...withI18n(
      {
        title: {
          ar: "لم يتم قبول طلبك",
          en: "Application not accepted",
        },
        message: {
          ar: input.reason
            ? snip(input.reason, 120)
            : `لم يتم قبول طلبك على ${input.jobTitle ? `وظيفة «${snip(input.jobTitle, 50)}»` : "الوظيفة"} هذه المرة`,
          en: input.reason
            ? snip(input.reason, 120)
            : `Your application for ${input.jobTitle ? `"${snip(input.jobTitle, 50)}"` : "the job"} wasn't selected this time`,
        },
      },
      { job_id: input.jobId, application_id: input.applicationId }
    ),
  });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function notifyBookingRequest(input: {
  bookingId:   string;
  recipientId: string;
  senderId:    string;
  senderName?: string | null;
  title?:      string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "BOOKING_REQUEST",
    senderId:    input.senderId,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "طلب حجز جديد",
          en: "New booking request",
        },
        message: {
          ar: `أرسلت ${input.senderName || "إحدى الشركات"} طلب حجز${input.title ? `: ${snip(input.title, 60)}` : ""}`,
          en: `${input.senderName || "A brand"} sent a booking request${input.title ? `: ${snip(input.title, 60)}` : ""}`,
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

export async function notifyBookingAccepted(input: {
  bookingId:   string;
  recipientId: string;
  senderId:    string;
  senderName?: string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "BOOKING_ACCEPTED",
    senderId:    input.senderId,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "تم قبول الطلب ✅",
          en: "Request accepted ✅",
        },
        message: {
          ar: `قبل ${input.senderName || "الطرف الآخر"} طلبك. يمكنك المتابعة للدفع.`,
          en: `${input.senderName || "The other party"} accepted your request. You can proceed to payment.`,
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

export async function notifyBookingDeclined(input: {
  bookingId:   string;
  recipientId: string;
  senderId:    string;
  senderName?: string | null;
  reason?:     string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "BOOKING_DECLINED",
    senderId:    input.senderId,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "تم رفض الطلب",
          en: "Request declined",
        },
        message: {
          ar: input.reason
            ? snip(input.reason, 120)
            : `رفض ${input.senderName || "الطرف الآخر"} طلب الحجز`,
          en: input.reason
            ? snip(input.reason, 120)
            : `${input.senderName || "The other party"} declined the booking request`,
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

/** Generic pipeline movement that isn't accept/decline (e.g. brief updated). */
export async function notifyBookingUpdated(input: {
  bookingId:   string;
  recipientId: string;
  senderId?:   string | null;
  titleAr:     string;
  titleEn:     string;
  messageAr:   string;
  messageEn:   string;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "BOOKING_UPDATED",
    senderId:    input.senderId ?? null,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title:   { ar: input.titleAr,   en: input.titleEn },
        message: { ar: input.messageAr, en: input.messageEn },
      },
      { booking_id: input.bookingId }
    ),
  });
}

export async function notifyDeliverableSubmitted(input: {
  bookingId:   string;
  recipientId: string;
  senderId:    string;
  senderName?: string | null;
  count?:      number;
}): Promise<void> {
  const n = input.count ?? 1;
  await createNotification({
    recipientId: input.recipientId,
    type:        "DELIVERABLE_SUBMITTED",
    senderId:    input.senderId,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "تسليم جديد",
          en: "New deliverable",
        },
        message: {
          ar: `سلّم ${input.senderName || "الموهبة"} ${n} ${n === 1 ? "ملف" : "ملفات"} للمراجعة`,
          en: `${input.senderName || "The talent"} submitted ${n} file${n === 1 ? "" : "s"} for review`,
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function notifyPaymentSuccess(input: {
  bookingId:   string;
  recipientId: string;
  senderId?:   string | null;
  amount?:     number | null;
}): Promise<void> {
  const amount = input.amount != null ? `${input.amount} ` : "";
  await createNotification({
    recipientId: input.recipientId,
    type:        "PAYMENT_SUCCESS",
    senderId:    input.senderId ?? null,
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "تم تأكيد الدفع 💳",
          en: "Payment confirmed 💳",
        },
        message: {
          ar: `تم تأكيد دفع ${amount}جنيه. يمكنك بدء العمل الآن.`,
          en: `Payment of ${amount}EGP confirmed. You can start work now.`,
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

export async function notifyPaymentFailed(input: {
  bookingId:   string;
  recipientId: string;
  reason?:     string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "PAYMENT_FAILED",
    priority:    "urgent",
    actionUrl:   `/bookings/${input.bookingId}`,
    ...withI18n(
      {
        title: {
          ar: "فشلت عملية الدفع",
          en: "Payment failed",
        },
        message: {
          ar: input.reason ? snip(input.reason, 120) : "لم تكتمل عملية الدفع. برجاء المحاولة مرة أخرى.",
          en: input.reason ? snip(input.reason, 120) : "The payment did not go through. Please try again.",
        },
      },
      { booking_id: input.bookingId }
    ),
  });
}

// ─── Chat ────────────────────────────────────────────────────────────────────

/** Receiver counts as "in the conversation" if seen within this window. */
const PRESENCE_WINDOW_MS = 45_000;

/**
 * Notify the receiver of a chat message — unless they are currently reading
 * that thread.
 *
 * Repeat messages in the same thread COLLAPSE onto the existing unread
 * notification instead of stacking: a 20-message burst produces one bell entry,
 * not twenty.
 */
export async function notifyChatMessage(input: {
  conversationId: string;
  recipientId:    string;
  senderId:       string;
  senderName?:    string | null;
  preview:        string;
}): Promise<void> {
  // 1. Presence check
  const { data: presence } = await adminClient
    .from("conversation_presence")
    .select("last_seen_at")
    .eq("conversation_id", input.conversationId)
    .eq("user_id", input.recipientId)
    .maybeSingle();

  if (presence?.last_seen_at) {
    const age = Date.now() - new Date(presence.last_seen_at).getTime();
    if (age < PRESENCE_WINDOW_MS) return;
  }

  const body = withI18n(
    {
      title: {
        ar: input.senderName ? `رسالة من ${input.senderName}` : "رسالة جديدة",
        en: input.senderName ? `Message from ${input.senderName}` : "New message",
      },
      message: {
        ar: snip(input.preview, 90),
        en: snip(input.preview, 90),
      },
    },
    { conversation_id: input.conversationId }
  );

  // 2. Collapse onto an existing unread notification for the same thread
  const { data: existing } = await adminClient
    .from("notifications")
    .select("id")
    .eq("recipient_id", input.recipientId)
    .eq("type", "CHAT_MESSAGE")
    .eq("is_read", false)
    .contains("metadata", { conversation_id: input.conversationId })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await adminClient
      .from("notifications")
      .update({
        title:      body.title,
        message:    body.message,
        metadata:   body.metadata,
        sender_id:  input.senderId,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) console.error("[notifications] chat collapse failed:", error.message);
    return;
  }

  await createNotification({
    recipientId: input.recipientId,
    type:        "CHAT_MESSAGE",
    senderId:    input.senderId,
    actionUrl:   `/chat/${input.conversationId}`,
    ...body,
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function notifyNewReview(input: {
  reviewId:    string;
  recipientId: string;
  senderId?:   string | null;
  brandName?:  string | null;
  rating?:     number | null;
  comment?:    string | null;
}): Promise<void> {
  const stars = input.rating != null ? `${input.rating}/5` : "";
  await createNotification({
    recipientId: input.recipientId,
    type:        "NEW_REVIEW",
    senderId:    input.senderId ?? null,
    actionUrl:   "/profile/me",
    ...withI18n(
      {
        title: {
          ar: "تقييم جديد ⭐",
          en: "New review ⭐",
        },
        message: {
          ar: `قيّمتك ${input.brandName || "إحدى الشركات"} ${stars}${input.comment ? ` — ${snip(input.comment, 70)}` : ""}`,
          en: `${input.brandName || "A brand"} rated you ${stars}${input.comment ? ` — ${snip(input.comment, 70)}` : ""}`,
        },
      },
      { review_id: input.reviewId }
    ),
  });
}

// ─── Profile moderation ──────────────────────────────────────────────────────

export async function notifyProfileApproved(input: {
  recipientId: string;
  adminId?:    string | null;
  kind?:       "talent" | "brand" | "verification";
}): Promise<void> {
  const kind = input.kind ?? "talent";
  const labelAr = kind === "verification" ? "طلب التوثيق" : "ملفك";
  const labelEn = kind === "verification" ? "Your verification" : "Your profile";

  await createNotification({
    recipientId: input.recipientId,
    type:        "PROFILE_APPROVED",
    senderId:    input.adminId ?? null,
    actionUrl:   "/profile/me",
    ...withI18n(
      {
        title: {
          ar: "تمت الموافقة 🎉",
          en: "Approved 🎉",
        },
        message: {
          ar: `${labelAr} أصبح معتمدًا وظاهرًا على المنصة.`,
          en: `${labelEn} is approved and now live on the platform.`,
        },
      },
      { kind }
    ),
  });
}

export async function notifyProfileRejected(input: {
  recipientId: string;
  adminId?:    string | null;
  reason?:     string | null;
  kind?:       "talent" | "brand" | "verification";
}): Promise<void> {
  const kind = input.kind ?? "talent";
  await createNotification({
    recipientId: input.recipientId,
    type:        "PROFILE_REJECTED",
    senderId:    input.adminId ?? null,
    actionUrl:   "/profile/me",
    ...withI18n(
      {
        title: {
          ar: "يحتاج ملفك إلى تعديل",
          en: "Your profile needs changes",
        },
        message: {
          ar: input.reason ? snip(input.reason, 140) : "برجاء مراجعة بيانات ملفك وإعادة الإرسال.",
          en: input.reason ? snip(input.reason, 140) : "Please review your profile details and resubmit.",
        },
      },
      { kind }
    ),
  });
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export async function notifySubscriptionUpdated(input: {
  recipientId:   string;
  packageName?:  string | null;
  status?:       string | null;
  subscriptionId?: string | null;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type:        "SUBSCRIPTION_UPDATED",
    actionUrl:   "/packages",
    ...withI18n(
      {
        title: {
          ar: "تم تحديث اشتراكك",
          en: "Subscription updated",
        },
        message: {
          ar: input.packageName
            ? `اشتراكك الحالي: ${input.packageName}${input.status ? ` (${input.status})` : ""}`
            : "تم تحديث تفاصيل اشتراكك.",
          en: input.packageName
            ? `Your current plan: ${input.packageName}${input.status ? ` (${input.status})` : ""}`
            : "Your subscription details were updated.",
        },
      },
      input.subscriptionId ? { subscription_id: input.subscriptionId } : {}
    ),
  });
}

// ─── Admin announcements ─────────────────────────────────────────────────────

/**
 * Admin-authored blast. Copy is typed by a human, so it is used verbatim for
 * both languages unless the composer supplied a translation.
 */
export async function sendAdminAnnouncement(input: {
  audience:   NotificationAudience;
  adminId:    string;
  type?:      NotificationType;
  title:      string;
  message:    string;
  titleEn?:   string | null;
  messageEn?: string | null;
  actionUrl?: string | null;
  priority?:  NotificationPriority;
  expiresAt?: string | null;
}): Promise<{ broadcastId: string | null; recipientCount: number }> {
  const content: NotificationContent = {
    type:      input.type ?? "ADMIN_MESSAGE",
    senderId:  input.adminId,
    actionUrl: input.actionUrl ?? null,
    priority:  input.priority,
    expiresAt: input.expiresAt ?? null,
    ...withI18n({
      title: {
        ar: input.title,
        en: input.titleEn?.trim() || input.title,
      },
      message: {
        ar: input.message,
        en: input.messageEn?.trim() || input.message,
      },
    }),
  };

  const broadcastId    = await recordBroadcast({ senderId: input.adminId, audience: input.audience, content });
  const recipientCount = await dispatchNotification(input.audience, content, broadcastId);

  // `fan_out_notification` writes the count itself; the explicit-list paths
  // (single / multiple) do not, so backfill it here.
  if (broadcastId && (input.audience.mode === "single" || input.audience.mode === "multiple")) {
    await updateBroadcastCount(broadcastId, recipientCount);
  }

  return { broadcastId, recipientCount };
}

// ─── Landing submissions ─────────────────────────────────────────────────────

/** A brand/talent submitted a testimonial for the home page. Fans out to admins. */
export async function notifyAdminNewTestimonial(input: {
  submitterId:   string;
  submitterName: string;
}): Promise<number> {
  return notifyRole(["admin"], {
    type:      "TESTIMONIAL_SUBMITTED",
    senderId:  input.submitterId,
    actionUrl: "/admin/testimonials",
    ...withI18n({
      title: {
        ar: "رأي جديد بانتظار المراجعة",
        en: "New testimonial awaiting review",
      },
      message: {
        ar: `${input.submitterName} أرسل رأيًا جديدًا للموافقة عليه قبل ظهوره في الصفحة الرئيسية.`,
        en: `${input.submitterName} submitted a testimonial for review before it goes live on the home page.`,
      },
    }),
  });
}

/** A brand/talent submitted a campaign photo for the home page. Fans out to admins. */
export async function notifyAdminNewBrandMoment(input: {
  submitterId:   string;
  submitterName: string;
}): Promise<number> {
  return notifyRole(["admin"], {
    type:      "BRAND_MOMENT_SUBMITTED",
    senderId:  input.submitterId,
    actionUrl: "/admin/brand-moments",
    ...withI18n({
      title: {
        ar: "لحظة براند جديدة بانتظار المراجعة",
        en: "New brand moment awaiting review",
      },
      message: {
        ar: `${input.submitterName} أرسل صورة حملة جديدة للموافقة عليها قبل ظهورها في الصفحة الرئيسية.`,
        en: `${input.submitterName} submitted a campaign photo for review before it goes live on the home page.`,
      },
    }),
  });
}

/** An unauthenticated visitor filed a support ticket (register/login page,
 * or the full Contact Us form). No senderId — the submitter has no session,
 * that's usually why they're filing the ticket. Fans out to admins. */
export async function notifyAdminNewSupportTicket(input: {
  email: string;
  page:  string | null;
}): Promise<number> {
  return notifyRole(["admin"], {
    type:      "SUPPORT_TICKET_SUBMITTED",
    actionUrl: "/admin/support",
    ...withI18n({
      title: {
        ar: "تذكرة دعم جديدة",
        en: "New support ticket",
      },
      message: {
        ar: `${input.email} محتاج مساعدة${input.page ? ` (صفحة ${input.page})` : ""}.`,
        en: `${input.email} needs help${input.page ? ` (${input.page} page)` : ""}.`,
      },
    }),
  });
}

// Re-exported so feature code never needs two imports.
export { createBulkNotifications, createNotification, notifyEveryone, notifyRole } from "./service";
