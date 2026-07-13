import { adminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "message"
  | "job_application"
  | "brief"
  | "booking"
  | "payment"
  | "review"
  | "system";

export type NotificationReferenceType =
  | "chat"
  | "job"
  | "brief"
  | "booking"
  | "payment"
  | "review";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string | null;
  referenceType?: NotificationReferenceType | null;
}

/**
 * Insert a notification via the service-role client (bypasses RLS).
 * Errors are logged and swallowed — never breaks the calling flow.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const { error } = await adminClient.from("notifications").insert({
    user_id:        input.userId,
    type:           input.type,
    title:          input.title,
    message:        input.message,
    reference_id:   input.referenceId   ?? null,
    reference_type: input.referenceType ?? null,
    is_read:        false,
  });
  if (error) {
    console.error("[createNotification] failed:", error.message);
  }
}
