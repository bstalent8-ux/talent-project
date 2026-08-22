import { describe, it, expect, vi } from "vitest";
import {
  validateRegisterForm,
  mapSignUpError,
  type RegisterFormData,
  type RegisterCopy,
} from "./registerValidation";

// Mirrors TX.en in page.tsx closely enough to exercise every branch — the
// exact copy lives in the component, this only needs distinct, stable values
// per key so tests can assert on identity.
const tx: RegisterCopy = {
  errFullNameRequired: "Full name is required.",
  errEmailRequired:    "Email address is required.",
  errEmailInvalid:     "Enter a valid email address, for example: name@example.com.",
  errPhoneRequired:    "Phone number is required.",
  errPhoneInvalid:     "Enter a valid phone number.",
  errPasswordRequired: "Password is required.",
  errPasswordWeak:     "Password must be at least 8 characters.",
  errConfirmRequired:  "Please confirm your password.",
  errPassMismatch:     "Passwords do not match.",
  errTerms:            "You must agree to the Terms of Service and Privacy Policy.",
  errCategoryTalent:   "Choose whether you are registering as a UGC Creator or Model.",
  errCategoryBrand:    "Please choose a brand category.",
  errOtherTypeRequired: "Please tell us what type of talent you are.",
  errExisting:         "An account with this email already exists. Sign in instead or use a different email.",
  errNetwork:          "We couldn't connect to the server. Check your connection and try again.",
  errRateLimit:        "Too many registration attempts. Please wait a moment and try again.",
  errProfileFailure:   "Your account could not be completed. Please try again.",
  errUnknown:          "We couldn't create your account. Check your information and try again.",
};

function validForm(overrides: Partial<RegisterFormData> = {}): RegisterFormData {
  return {
    fullName:        "Ahmed Mohamed",
    email:           "ahmed@example.com",
    phoneNumber:     "512345678",
    password:        "TestPass123!",
    confirmPassword: "TestPass123!",
    role:            "talent",
    talentType:      "ugc",
    otherTypeText:   "",
    brandCategory:   "brand_fashion",
    agreeToTerms:    true,
    ...overrides,
  };
}

describe("validateRegisterForm", () => {
  it("1: passes a valid UGC form with no errors", () => {
    expect(validateRegisterForm(validForm({ talentType: "ugc" }), tx)).toEqual({});
  });

  it("2: passes a valid Model form with no errors", () => {
    expect(validateRegisterForm(validForm({ talentType: "model" }), tx)).toEqual({});
  });

  it("4: flags an invalid email on the email field", () => {
    const errs = validateRegisterForm(validForm({ email: "not-an-email" }), tx);
    expect(errs).toEqual({ email: tx.errEmailInvalid });
  });

  it("5: flags each missing required field independently", () => {
    const errs = validateRegisterForm(
      validForm({ fullName: "", email: "", phoneNumber: "", password: "", confirmPassword: "", agreeToTerms: false }),
      tx,
    );
    expect(errs).toEqual({
      fullName:        tx.errFullNameRequired,
      email:           tx.errEmailRequired,
      phone:           tx.errPhoneRequired,
      password:        tx.errPasswordRequired,
      confirmPassword: tx.errConfirmRequired,
      terms:           tx.errTerms,
    });
  });

  it("6: flags password confirmation mismatch on the confirm field only", () => {
    const errs = validateRegisterForm(validForm({ confirmPassword: "SomethingElse123!" }), tx);
    expect(errs).toEqual({ confirmPassword: tx.errPassMismatch });
  });

  it("7: flags a weak (too short) password with the real 8-character policy message", () => {
    const errs = validateRegisterForm(validForm({ password: "abc123", confirmPassword: "abc123" }), tx);
    expect(errs).toEqual({ password: tx.errPasswordWeak });
  });

  it("flags a missing talent category with the UGC/Model choice message", () => {
    const errs = validateRegisterForm(validForm({ talentType: "" }), tx);
    expect(errs).toEqual({ category: tx.errCategoryTalent });
  });

  it("flags a missing brand category for brand role", () => {
    const errs = validateRegisterForm(validForm({ role: "brand", brandCategory: "" }), tx);
    expect(errs).toEqual({ category: tx.errCategoryBrand });
  });
});

describe("mapSignUpError", () => {
  it("3: maps a duplicate-email signUp error to the existing-account message with a Sign In action, never the raw GoTrue string", () => {
    const mapped = mapSignUpError({ code: "user_already_exists", status: 422, message: "User already registered" }, tx);
    expect(mapped.message).toBe(tx.errExisting);
    expect(mapped.message).not.toMatch(/user already registered/i);
    expect(mapped.field).toBe("email");
    expect(mapped.action).toBe("signin");
  });

  it("maps email_exists the same way as user_already_exists (SDK/version variance)", () => {
    const mapped = mapSignUpError({ code: "email_exists", status: 422, message: "Email exists" }, tx);
    expect(mapped.message).toBe(tx.errExisting);
    expect(mapped.action).toBe("signin");
  });

  it("maps an invalid-email GoTrue error onto the email field", () => {
    const mapped = mapSignUpError({ code: "email_address_invalid", status: 400, message: "Invalid email" }, tx);
    expect(mapped).toEqual({ message: tx.errEmailInvalid, field: "email" });
  });

  it("maps a weak_password GoTrue error onto the password field", () => {
    const mapped = mapSignUpError({ code: "weak_password", status: 422, message: "Password is too weak" }, tx);
    expect(mapped).toEqual({ message: tx.errPasswordWeak, field: "password" });
  });

  it("maps a rate-limit error (by code) to the rate-limit message with no field", () => {
    const mapped = mapSignUpError({ code: "over_request_rate_limit", status: 429, message: "rate limited" }, tx);
    expect(mapped).toEqual({ message: tx.errRateLimit });
  });

  it("maps a rate-limit error (by HTTP status alone) to the rate-limit message", () => {
    const mapped = mapSignUpError({ status: 429, message: "Too many requests" }, tx);
    expect(mapped).toEqual({ message: tx.errRateLimit });
  });

  it("8: maps a statusless fetch failure to the network message, NOT the duplicate-user message", () => {
    const mapped = mapSignUpError({ message: "Failed to fetch" }, tx);
    expect(mapped.message).toBe(tx.errNetwork);
    expect(mapped.message).not.toBe(tx.errExisting);
  });

  it("9: falls back to the generic unknown-account message for an unrecognized error, and reports it for logging (never a raw duplicate-user message)", () => {
    const onUnmapped = vi.fn();
    const mapped = mapSignUpError({ code: "some_new_code", status: 500, message: "Unexpected server error" }, tx, onUnmapped);
    expect(mapped).toEqual({ message: tx.errUnknown });
    expect(onUnmapped).toHaveBeenCalledWith({ code: "some_new_code", status: 500, message: "Unexpected server error" });
  });

  it("treats a null/undefined error as unknown rather than throwing", () => {
    expect(mapSignUpError(null, tx)).toEqual({ message: tx.errUnknown });
    expect(mapSignUpError(undefined, tx)).toEqual({ message: tx.errUnknown });
  });
});
