export type UserRole = "guest" | "talent" | "brand" | "admin" | "client" | "freelancer" | "ugc";

export type PermissionAction =
  | "apply_job"
  | "create_job"
  | "create_booking"
  | "send_message"
  | "start_conversation"
  | "favorite_talent"
  | "upload_portfolio"
  | "edit_profile"
  | "submit_review"
  | "create_community_question"
  | "create_community_answer"
  | "subscribe"
  | "access_dashboard"
  | "access_profile_management"
  | "access_notifications"
  | "access_payments"
  | "manage_applications"
  | "admin";

export interface PermissionUser {
  id?: string | null;
  role?: string | null;
  account_status?: string | null;
  brand_status?: string | null;
  talent_status?: string | null;
  is_suspended?: boolean | null;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: "guest" | "inactive" | "role" | "approval";
}

const INACTIVE_STATUSES = new Set(["blocked", "suspended", "rejected"]);
const TALENT_ROLES = new Set(["talent", "freelancer", "ugc"]);
const BRAND_ROLES = new Set(["brand", "client"]);

function roleOf(user: PermissionUser | null | undefined): UserRole {
  return (user?.role || "guest") as UserRole;
}

export function isGuestUser(user: PermissionUser | null | undefined): boolean {
  return !user?.id;
}

export function isActiveAccount(user: PermissionUser | null | undefined): boolean {
  if (!user?.id) return false;
  if (user.is_suspended) return false;
  return !INACTIVE_STATUSES.has(user.account_status ?? "active");
}

export function isTalent(user: PermissionUser | null | undefined): boolean {
  return TALENT_ROLES.has(roleOf(user));
}

export function isBrand(user: PermissionUser | null | undefined): boolean {
  return BRAND_ROLES.has(roleOf(user));
}

export function isAdmin(user: PermissionUser | null | undefined): boolean {
  return roleOf(user) === "admin";
}

function brandIsApproved(user: PermissionUser | null | undefined): boolean {
  const status = user?.brand_status;
  return !status || status === "approved";
}

function talentIsApproved(user: PermissionUser | null | undefined): boolean {
  const status = user?.talent_status;
  return !status || status === "approved";
}

function allowIfAuthenticated(user: PermissionUser | null | undefined): PermissionResult {
  if (isGuestUser(user)) return { allowed: false, reason: "guest" };
  if (!isActiveAccount(user)) return { allowed: false, reason: "inactive" };
  return { allowed: true };
}

function allowTalent(user: PermissionUser | null | undefined, requireApproval = false): PermissionResult {
  const auth = allowIfAuthenticated(user);
  if (!auth.allowed) return auth;
  if (isAdmin(user)) return { allowed: true };
  if (!isTalent(user)) return { allowed: false, reason: "role" };
  if (requireApproval && !talentIsApproved(user)) return { allowed: false, reason: "approval" };
  return { allowed: true };
}

function allowBrand(user: PermissionUser | null | undefined, requireApproval = false): PermissionResult {
  const auth = allowIfAuthenticated(user);
  if (!auth.allowed) return auth;
  if (isAdmin(user)) return { allowed: true };
  if (!isBrand(user)) return { allowed: false, reason: "role" };
  if (requireApproval && !brandIsApproved(user)) return { allowed: false, reason: "approval" };
  return { allowed: true };
}

export function canViewPublicContent(): PermissionResult {
  return { allowed: true };
}

export function canApplyJob(user: PermissionUser | null | undefined): PermissionResult {
  return allowTalent(user, true);
}

export function canCreateJob(user: PermissionUser | null | undefined): PermissionResult {
  return allowBrand(user, true);
}

export function canCreateBooking(user: PermissionUser | null | undefined): PermissionResult {
  return allowBrand(user, true);
}

export function canSendMessage(user: PermissionUser | null | undefined): PermissionResult {
  return allowIfAuthenticated(user);
}

export function canAccessDashboard(user: PermissionUser | null | undefined): PermissionResult {
  return allowIfAuthenticated(user);
}

export function canPerformAction(
  action: PermissionAction,
  user: PermissionUser | null | undefined,
): PermissionResult {
  if (action === "admin") {
    const auth = allowIfAuthenticated(user);
    if (!auth.allowed) return auth;
    return isAdmin(user) ? { allowed: true } : { allowed: false, reason: "role" };
  }

  switch (action) {
    case "apply_job":
      return canApplyJob(user);
    case "create_job":
    case "manage_applications":
      return canCreateJob(user);
    case "create_booking":
    case "access_payments":
      return canCreateBooking(user);
    case "upload_portfolio":
      return allowTalent(user);
    case "edit_profile":
    case "access_profile_management":
      return allowTalent(user);
    case "submit_review":
      return allowBrand(user);
    case "send_message":
    case "start_conversation":
    case "create_community_question":
    case "create_community_answer":
    case "subscribe":
    case "access_dashboard":
    case "access_notifications":
      return allowIfAuthenticated(user);
    case "favorite_talent":
      return allowIfAuthenticated(user);
    default:
      return { allowed: false, reason: "role" };
  }
}

export const AUTH_MODAL_COPY: Record<PermissionAction, { ar: string; en: string }> = {
  apply_job: {
    ar: "تحتاج إلى حساب موهبة قبل التقديم.",
    en: "You need a Talent account before applying.",
  },
  create_job: {
    ar: "تحتاج إلى حساب براند لنشر وظيفة.",
    en: "You need a Brand account before posting a job.",
  },
  create_booking: {
    ar: "سجل كبراند لإرسال طلب حجز.",
    en: "Sign up as a brand to send booking requests.",
  },
  send_message: {
    ar: "سجل الدخول لإرسال الرسائل.",
    en: "Sign in to send messages.",
  },
  start_conversation: {
    ar: "سجل للتواصل مع المواهب.",
    en: "Sign up to contact talents.",
  },
  favorite_talent: {
    ar: "أنشئ حساباً لحفظ المواهب.",
    en: "Create an account to save talents.",
  },
  upload_portfolio: {
    ar: "تحتاج إلى حساب موهبة لإضافة أعمالك.",
    en: "You need a Talent account to upload portfolio work.",
  },
  edit_profile: {
    ar: "سجل الدخول لإدارة ملفك الشخصي.",
    en: "Sign in to manage your profile.",
  },
  submit_review: {
    ar: "سجل كبراند لإضافة تقييم.",
    en: "Sign up as a brand to submit reviews.",
  },
  create_community_question: {
    ar: "أنشئ حساباً لطرح سؤال في المجتمع.",
    en: "Create an account to ask the community.",
  },
  create_community_answer: {
    ar: "سجل الدخول لإضافة تعليق.",
    en: "Sign in to add a comment.",
  },
  subscribe: {
    ar: "أنشئ حساباً لتفعيل الاشتراك.",
    en: "Create an account to activate a subscription.",
  },
  access_dashboard: {
    ar: "سجل الدخول للوصول إلى لوحة التحكم.",
    en: "Sign in to access your dashboard.",
  },
  access_profile_management: {
    ar: "سجل الدخول لإدارة ملفك الشخصي.",
    en: "Sign in to manage your profile.",
  },
  access_notifications: {
    ar: "سجل الدخول لعرض الإشعارات.",
    en: "Sign in to view notifications.",
  },
  access_payments: {
    ar: "سجل كبراند لإدارة المدفوعات.",
    en: "Sign up as a brand to manage payments.",
  },
  manage_applications: {
    ar: "تحتاج إلى حساب براند لإدارة الطلبات.",
    en: "You need a Brand account to manage applications.",
  },
  admin: {
    ar: "تحتاج إلى صلاحيات مسؤول.",
    en: "Admin permission is required.",
  },
};

export function getAuthModalMessage(action: PermissionAction, lang: "ar" | "en"): string {
  return AUTH_MODAL_COPY[action]?.[lang] ?? AUTH_MODAL_COPY.access_dashboard[lang];
}
