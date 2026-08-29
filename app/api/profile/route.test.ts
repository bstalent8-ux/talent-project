import { describe, it, expect } from "vitest";
import { profileDataSchema } from "./route";

describe("profileDataSchema", () => {
  it("accepts a normal registration/edit payload", () => {
    const body = {
      handle: "sara-ugc",
      full_name: "Sara Ahmed",
      avatar_url: "https://res.cloudinary.com/demo/a.jpg",
      city: "Cairo",
      bio: "UGC creator specializing in beauty content.",
      phone_number: "+201001234567",
    };
    expect(profileDataSchema.parse(body)).toEqual(body);
  });

  it("accepts an empty object (no profileData sent)", () => {
    expect(profileDataSchema.parse({})).toEqual({});
  });

  it("accepts explicit nulls for the nullable fields", () => {
    const body = { avatar_url: null, city: null, bio: null, phone_number: null, phone: null };
    expect(profileDataSchema.parse(body)).toEqual(body);
  });

  it("rejects a handle over 40 chars", () => {
    expect(() => profileDataSchema.parse({ handle: "a".repeat(41) })).toThrow();
  });

  it("rejects a 1-char handle", () => {
    expect(() => profileDataSchema.parse({ handle: "a" })).toThrow();
  });

  it("rejects an empty full_name", () => {
    expect(() => profileDataSchema.parse({ full_name: "" })).toThrow();
  });

  it("rejects a full_name over 100 chars", () => {
    expect(() => profileDataSchema.parse({ full_name: "a".repeat(101) })).toThrow();
  });

  it("rejects a bio over 1000 chars (previously unbounded)", () => {
    expect(() => profileDataSchema.parse({ bio: "a".repeat(1001) })).toThrow();
  });

  it("rejects a non-string handle (the old pick() would have copied it as-is)", () => {
    expect(() => profileDataSchema.parse({ handle: 12345 })).toThrow();
  });

  it("rejects a phone_number over 20 chars", () => {
    expect(() => profileDataSchema.parse({ phone_number: "1".repeat(21) })).toThrow();
  });
});
