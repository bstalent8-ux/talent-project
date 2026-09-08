// ─── Admin health checkup — types ───────────────────────────────────────────
// Backs /admin/health-check. One "Run Checkup" click gathers four
// independent reports (Cloudinary usage, a live security checklist, a live
// performance probe, a 7-day traffic snapshot) plus an optional AI summary,
// and rolls them into one 0-100 score for the gauge.

export interface CloudinaryReport {
  configured: boolean;
  ok:         boolean;
  error?:     string;
  plan?:      string;
  storageBytes?:      number;
  bandwidthBytes?:    number;
  resourceCount?:     number;
  creditsUsedPercent?: number;
}

export interface SecurityCheckItem {
  key:     string;
  labelAr: string;
  labelEn: string;
  passed:  boolean;
  detail?: string;
}

export interface SecurityReport {
  items:       SecurityCheckItem[];
  passedCount: number;
  totalCount:  number;
}

export interface PerformanceProbe {
  label:  string;
  path:   string;
  ms:     number | null; // null = the probe request itself failed
  status: number | null;
}

export interface PerformanceReport {
  probes:  PerformanceProbe[];
  avgMs:   number | null;
  maxMs:   number | null;
  slowest: PerformanceProbe | null;
}

export interface TrafficSnapshot {
  pageViews:          number;
  signups:            number;
  clicks:             number;
  talentProfileViews: number;
}

export interface AiReport {
  configured: boolean;
  ok:         boolean;
  error?:     string;
  tips?:      string[];
}

export interface HealthCheckCategoryScores {
  cloudinary:  number | null; // null = not configured, excluded from the overall average
  security:    number;
  performance: number | null; // null = every probe failed
}

export interface HealthCheckResult {
  id?:        string;
  createdAt?: string;
  score:            number;
  categoryScores:   HealthCheckCategoryScores;
  cloudinary:  CloudinaryReport;
  security:    SecurityReport;
  performance: PerformanceReport;
  traffic:     TrafficSnapshot;
  ai:          AiReport;
}
