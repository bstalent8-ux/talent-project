// ─── DEPRECATED — v1 compatibility shim ──────────────────────────────────────
// The v1 API (`userId` + `reference_id`/`reference_type` + lowercase types) is
// kept alive only so an un-migrated call site cannot break a business flow.
//
// New code MUST import a business event from `@/lib/notifications/events`.
// This file will be deleted once nothing imports it.

import { createNotification as createNotificationV2 } from "./service";
import type { NotificationMetadata, NotificationType } from "./types";

/** @deprecated use the union in `@/lib/notifications/types` */
export type LegacyNotificationType =
  | "message"
  | "job_application"
  | "brief"
  | "booking"
  | "booking_request"
  | "payment"
  | "review"
  | "system";

/** @deprecated metadata replaced reference_type */
export type NotificationReferenceType =
  | "chat" | "job" | "brief" | "booking" | "payment" | "review";

const LEGACY_TYPE_MAP: Record<LegacyNotificationType, NotificationType> = {
  message:         "CHAT_MESSAGE",
  job_application: "JOB_APPLICATION_RECEIVED",
  brief:           "BOOKING_REQUEST",
  booking_request: "BOOKING_REQUEST",
  booking:         "BOOKING_UPDATED",
  payment:         "PAYMENT_SUCCESS",
  review:          "NEW_REVIEW",
  system:          "SYSTEM",
};

const REF_TO_METADATA_KEY: Record<NotificationReferenceType, string> = {
  chat:    "conversation_id",
  job:     "job_id",
  brief:   "booking_id",
  booking: "booking_id",
  payment: "booking_id",
  review:  "review_id",
};

interface LegacyInput {
  userId:         string;
  type:           LegacyNotificationType | NotificationType;
  title:          string;
  message:        string;
  referenceId?:   string | null;
  referenceType?: NotificationReferenceType | null;
}

/** @deprecated */
export async function createNotification(input: LegacyInput): Promise<void> {
  const type =
    (LEGACY_TYPE_MAP as Record<string, NotificationType>)[input.type] ??
    (input.type as NotificationType);

  const metadata: NotificationMetadata = {};
  if (input.referenceId) {
    metadata.reference_id = input.referenceId;
    if (input.referenceType) {
      metadata.reference_type = input.referenceType;
      metadata[REF_TO_METADATA_KEY[input.referenceType]] = input.referenceId;
    }
  }

  await createNotificationV2({
    recipientId: input.userId,
    type,
    title:       input.title,
    message:     input.message,
    metadata,
  });
}
