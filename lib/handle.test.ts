import { describe, expect, it } from "vitest";
import { deriveHandle } from "./handle";

describe("deriveHandle", () => {
  it("slugifies a Latin full name", () => {
    expect(deriveHandle("Dalia Hassan", "2102622@student.edu.eg")).toBe("dalia-hassan");
  });

  it("falls back to the email local-part when the name has no Latin letters", () => {
    expect(deriveHandle("داليا حسن", "sara.k@gmail.com")).toBe("sara-k");
  });

  it("never returns a bare number — prefixes when neither source has a letter", () => {
    const handle = deriveHandle("داليا حسن", "2102622@student.edu.eg");
    expect(handle).toBe("user-2102622");
    expect(/[a-z]/.test(handle)).toBe(true);
  });

  it("handles a missing/empty name by using the email", () => {
    expect(deriveHandle(null, "ahmed.mostafa@example.com")).toBe("ahmed-mostafa");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(deriveHandle("Jean-Paul  O'Neil!!", "x@example.com")).toBe("jean-paul-o-neil");
  });
});
