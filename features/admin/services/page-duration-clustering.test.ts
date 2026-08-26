import { describe, it, expect } from "vitest";
import { clusterPageVisits, totalDurationByPage, type EngagementSample } from "./page-duration-clustering";

function sample(path: string, duration_ms: number, isoOffsetSec: number): EngagementSample {
  const base = new Date("2026-08-26T12:00:00.000Z").getTime();
  return { path, duration_ms, created_at: new Date(base + isoOffsetSec * 1000).toISOString() };
}

describe("clusterPageVisits", () => {
  it("collapses heartbeats for the same visit into one entry, keeping the max duration", () => {
    const samples = [
      sample("/explore", 20_000, 0),
      sample("/explore", 40_000, 20),
      sample("/explore", 62_000, 40),
    ];
    const visits = clusterPageVisits(samples);
    expect(visits).toHaveLength(1);
    expect(visits[0]).toMatchObject({ path: "/explore", durationMs: 62_000 });
  });

  it("splits into separate visits when the path changes", () => {
    const samples = [
      sample("/explore", 20_000, 0),
      sample("/home", 5_000, 20),
    ];
    const visits = clusterPageVisits(samples);
    expect(visits.map((v) => v.path)).toEqual(["/explore", "/home"]);
  });

  it("splits into separate visits when the same path recurs after a long gap (left and came back)", () => {
    const samples = [
      sample("/explore", 20_000, 0),
      sample("/explore", 8_000, 600), // 10 minutes later — a fresh visit, its own low duration
    ];
    const visits = clusterPageVisits(samples, 60_000);
    expect(visits).toHaveLength(2);
    expect(visits[0].durationMs).toBe(20_000);
    expect(visits[1].durationMs).toBe(8_000);
  });

  it("sorts out-of-order input by time before clustering", () => {
    const samples = [
      sample("/explore", 40_000, 20),
      sample("/explore", 20_000, 0),
    ];
    const visits = clusterPageVisits(samples);
    expect(visits).toHaveLength(1);
    expect(visits[0].durationMs).toBe(40_000);
  });

  it("returns an empty array for no samples", () => {
    expect(clusterPageVisits([])).toEqual([]);
  });
});

describe("totalDurationByPage", () => {
  it("sums durations across multiple visits to the same page", () => {
    const visits = clusterPageVisits([
      sample("/explore", 20_000, 0),
      sample("/home", 5_000, 20),
      sample("/explore", 10_000, 700),
    ]);
    const totals = totalDurationByPage(visits);
    const explore = totals.find((t) => t.path === "/explore");
    expect(explore).toMatchObject({ totalMs: 30_000, visitCount: 2 });
  });

  it("orders results by total time descending", () => {
    const visits = clusterPageVisits([
      sample("/home", 5_000, 0),
      sample("/explore", 60_000, 20),
    ]);
    const totals = totalDurationByPage(visits);
    expect(totals[0].path).toBe("/explore");
  });
});
