// Pure validation + error-mapping logic for the registration form, split out
// of page.tsx so it can be unit tested without mounting the client component
// or mocking Supabase/network calls.

export type Role = "talent" | "brand";

export interface RegisterFormData {
  fullName:        string;
  email:           string;
  phoneNumber:     string;
  password:        string;
  confirmPassword: string;
  role:            Role;
  talentType:      string;
  otherTypeText:   string;
  brandCategory:   string;
  agreeToTerms:    boolean;
}

// Every field the form validates independently. "category" covers both the
// talent-type and brand-category selects — only one of the two is visible at
// a time, so they share one slot in the error/focus model.
export type FieldKey = "category" | "otherTypeText" | "fullName" | "email" | "phone" | "password" | "confirmPassword" | "terms";

// Visual top-to-bottom order, used to decide which field gets focus when more
// than one is invalid at once.
export const FIELD_ORDER: FieldKey[] = ["category", "otherTypeText", "fullName", "email", "phone", "password", "confirmPassword", "terms"];

export const FIELD_IDS: Record<FieldKey, string> = {
  category:        "register-category",
  otherTypeText:   "register-other-type",
  fullName:        "register-name",
  email:           "register-email",
  phone:           "register-phone",
  password:        "register-password",
  confirmPassword: "register-confirm",
  terms:           "register-terms",
};

// Maps a RegisterFormData key back to the FieldKey whose error should clear
// once the user edits that input — "remove an error when the user corrects
// that field".
export const FORM_TO_FIELD: Partial<Record<keyof RegisterFormData, FieldKey>> = {
  fullName:        "fullName",
  email:           "email",
  phoneNumber:     "phone",
  password:        "password",
  confirmPassword: "confirmPassword",
  talentType:      "category",
  otherTypeText:   "otherTypeText",
  brandCategory:   "category",
  role:            "category",
  agreeToTerms:    "terms",
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The subset of TX[lang] that validation/error-mapping actually reads. `Tx`
// in page.tsx satisfies this structurally.
export interface RegisterCopy {
  errFullNameRequired: string;
  errEmailRequired:    string;
  errEmailInvalid:     string;
  errPhoneRequired:    string;
  errPhoneInvalid:     string;
  errPasswordRequired: string;
  errPasswordWeak:     string;
  errConfirmRequired:  string;
  errPassMismatch:     string;
  errTerms:            string;
  errCategoryTalent:   string;
  errCategoryBrand:    string;
  errOtherTypeRequired: string;
  errExisting:         string;
  errNetwork:          string;
  errRateLimit:        string;
  errProfileFailure:   string;
  errUnknown:          string;
}

export function validateRegisterForm(form: RegisterFormData, tx: RegisterCopy): Partial<Record<FieldKey, string>> {
  const errs: Partial<Record<FieldKey, string>> = {};

  if (!form.fullName.trim()) errs.fullName = tx.errFullNameRequired;

  if (!form.email.trim()) errs.email = tx.errEmailRequired;
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = tx.errEmailInvalid;

  if (!form.phoneNumber.trim()) errs.phone = tx.errPhoneRequired;
  else if (form.phoneNumber.replace(/\D/g, "").length < 9) errs.phone = tx.errPhoneInvalid;

  if (form.role === "talent" && !form.talentType) errs.category = tx.errCategoryTalent;
  if (form.role === "brand" && !form.brandCategory) errs.category = tx.errCategoryBrand;
  if (form.role === "talent" && form.talentType === "other" && !form.otherTypeText.trim()) {
    errs.otherTypeText = tx.errOtherTypeRequired;
  }

  if (!form.password) errs.password = tx.errPasswordRequired;
  else if (form.password.length < 8) errs.password = tx.errPasswordWeak;

  if (!form.confirmPassword) errs.confirmPassword = tx.errConfirmRequired;
  else if (form.password !== form.confirmPassword) errs.confirmPassword = tx.errPassMismatch;

  if (!form.agreeToTerms) errs.terms = tx.errTerms;

  return errs;
}

export interface SupabaseAuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

export interface MappedAuthError {
  message: string;
  field?: FieldKey;
  action?: "signin";
}

// Maps a Supabase signUp() failure onto the copy the user actually needs.
// Never let a raw GoTrue message (e.g. "User already registered") reach the
// screen — that's the actual bug this maps around.
export function mapSignUpError(
  err: SupabaseAuthErrorLike | null | undefined,
  tx: RegisterCopy,
  onUnmapped?: (err: SupabaseAuthErrorLike) => void,
): MappedAuthError {
  const code = err?.code;
  const status = err?.status;
  const rawMessage = err?.message ?? "";

  if (code === "user_already_exists" || code === "email_exists" || /already registered|already exists/i.test(rawMessage)) {
    return { message: tx.errExisting, field: "email", action: "signin" };
  }
  if (code === "email_address_invalid" || /invalid.*email/i.test(rawMessage)) {
    return { message: tx.errEmailInvalid, field: "email" };
  }
  if (code === "weak_password") {
    return { message: tx.errPasswordWeak, field: "password" };
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || status === 429) {
    return { message: tx.errRateLimit };
  }
  // No HTTP status at all means the request never reached GoTrue — a local
  // network failure, not anything about the account.
  if (status === undefined && /fetch|network/i.test(rawMessage)) {
    return { message: tx.errNetwork };
  }

  onUnmapped?.({ code, status, message: rawMessage });
  return { message: tx.errUnknown };
}
