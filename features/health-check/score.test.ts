import { describe, expect, it } from "vitest";
import { scoreSecurity, scorePerformance, scoreCloudinary, computeOverallScore, ratingLabel } from "./score";
import type { CloudinaryReport } from "./types";

describe("scoreSecurity", () => {
  it("scores 100 when every check passes", () => {
    expect(scoreSecurity(5, 5)).toBe(100);
  });
  it("scores proportionally on a partial pass", () => {
    expect(scoreSecurity(3, 4)).toBe(75);
  });
  it("returns 0 for zero total checks (not a division by zero)", () => {
    expect(scoreSecurity(0, 0)).toBe(0);
  });
});

describe("scorePerformance", () => {
  it("returns null when every probe failed", () => {
    expect(scorePerformance(null)).toBeNull();
  });
  it("scores fast responses near 100", () => {
    expect(scorePerformance(200)).toBe(100);
  });
  it("scores slow responses low", () => {
    expect(scorePerformance(5000)).toBe(10);
  });
  it("is monotonically non-increasing as latency grows", () => {
    const points = [100, 400, 800, 1500, 3000, 6000].map((ms) => scorePerformance(ms) as number);
    for (let i = 1; i < points.length; i++) expect(points[i]).toBeLessThanOrEqual(points[i - 1]);
  });
});

describe("scoreCloudinary", () => {
  const base: CloudinaryReport = { configured: true, ok: true };

  it("returns null when not configured — excluded, not penalized", () => {
    expect(scoreCloudinary({ configured: false, ok: false })).toBeNull();
  });
  it("scores low when configured but the API call failed", () => {
    expect(scoreCloudinary({ ...base, ok: false })).toBe(20);
  });
  it("scores high with plenty of credit left", () => {
    expect(scoreCloudinary({ ...base, creditsUsedPercent: 40 })).toBe(100);
  });
  it("scores low near plan exhaustion", () => {
    expect(scoreCloudinary({ ...base, creditsUsedPercent: 95 })).toBe(40);
  });
});

describe("computeOverallScore", () => {
  it("averages all three categories when every category is present", () => {
    const score = computeOverallScore({ security: 100, performance: 100, cloudinary: 100 });
    expect(score).toBe(100);
  });

  it("excludes a null category from the weighted average instead of penalizing it", () => {
    // security=100, cloudinary=100, performance unset — should still be 100,
    // not dragged down by treating the missing category as 0.
    const score = computeOverallScore({ security: 100, performance: null, cloudinary: 100 });
    expect(score).toBe(100);
  });

  it("weighs security most heavily among the three", () => {
    const securityHeavy = computeOverallScore({ security: 100, performance: 0, cloudinary: 0 });
    const performanceHeavy = computeOverallScore({ security: 0, performance: 100, cloudinary: 0 });
    expect(securityHeavy).toBeGreaterThan(performanceHeavy);
  });
});

describe("ratingLabel", () => {
  it("converts to a /10 rating", () => {
    expect(ratingLabel(85).outOf10).toBe(9);
    expect(ratingLabel(42).outOf10).toBe(4);
  });

  it("bands 90+ as excellent", () => {
    expect(ratingLabel(95).band).toBe("excellent");
    expect(ratingLabel(90).band).toBe("excellent");
  });

  it("bands 70-89 as good", () => {
    expect(ratingLabel(89).band).toBe("good");
    expect(ratingLabel(70).band).toBe("good");
  });

  it("bands 50-69 as medium", () => {
    expect(ratingLabel(69).band).toBe("medium");
    expect(ratingLabel(50).band).toBe("medium");
  });

  it("bands below 50 as low", () => {
    expect(ratingLabel(49).band).toBe("low");
    expect(ratingLabel(0).band).toBe("low");
  });

  it("clamps out-of-range input", () => {
    expect(ratingLabel(150).band).toBe("excellent");
    expect(ratingLabel(-10).band).toBe("low");
  });
});
