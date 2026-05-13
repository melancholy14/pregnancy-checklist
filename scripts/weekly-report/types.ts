/**
 * Shared types for the weekly report pipeline.
 *
 * Mapping to spec §1.9 / ga4.md Q1~Q5:
 *   Q1 → CohortRetention
 *   Q2 → CoreBehaviorReach
 *   Q3 → ZeroResultSearch
 *   Q4 → ExternalDomainOutflow
 *   Q5 → WeekOverWeekAnomaly
 */

export type IsoWeek = `${number}-W${number}`;

export type WeeklyDateRange = {
  startDate: string; // YYYY-MM-DD inclusive (ISO week starts Monday)
  endDate: string;   // YYYY-MM-DD inclusive (Monday → Sunday window)
};

// ── Q1. Cohort retention ─────────────────────────────────────────────
export type CohortRow = {
  cohortJoinWeek: string; // e.g. "2026-W14"
  nthWeek: number;        // 0, 1, 2, 3, 4 ...
  activeUsers: number;
};

export type CohortRetention = {
  approach: "cohortSpec" | "manual" | "unavailable";
  rows: CohortRow[];
  totalCohorts: number;
  note?: string;
};

// ── Q2. Core behavior reach ──────────────────────────────────────────
export type CoreBehaviorRow = {
  eventName: string;
  eventCount: number;
  totalUsers: number;
  previousEventCount: number;
  previousTotalUsers: number;
  wowDelta: number | null; // percent, e.g. +12.5 or -3.1; null when previous=0
};

export type CoreBehaviorReach = {
  totalActiveUsers: number;
  previousTotalActiveUsers: number;
  rows: CoreBehaviorRow[];
};

// ── Q3. Zero-result search TOP 10 ────────────────────────────────────
export type ZeroResultSearchRow = {
  query: string;     // normalized via PageviewTracker / SearchModal
  eventCount: number;
};

export type ZeroResultSearch = {
  rows: ZeroResultSearchRow[];
};

// ── Q4. External link outflow TOP 10 ─────────────────────────────────
export type ExternalDomainRow = {
  domain: string;
  eventCount: number;
};

export type ExternalDomainOutflow = {
  rows: ExternalDomainRow[];
};

// ── Q5. Week-over-week anomaly ───────────────────────────────────────
export type AnomalyRow = {
  eventName: string;
  currentCount: number;
  previousCount: number;
  deltaPercent: number | null; // null when previous=0
  band: "noise" | "hypothesis" | "action" | "incident"; // ±5/10/20/30
};

export type WeekOverWeekAnomaly = {
  rows: AnomalyRow[];
  comparable: boolean; // false when no previous week data
};

// ── Aggregate GA4 result ─────────────────────────────────────────────
export type Ga4Result = {
  propertyId: string;
  isoWeek: IsoWeek;
  range: WeeklyDateRange;
  cohort: CohortRetention;
  coreBehavior: CoreBehaviorReach;
  zeroResultSearch: ZeroResultSearch;
  externalDomain: ExternalDomainOutflow;
  anomaly: WeekOverWeekAnomaly;
  // Last 4 ISO-week labels (oldest → current) for trend hint to Claude.
  trendWeeks: IsoWeek[];
};

// ── LLM provider abstraction ─────────────────────────────────────────
export type LlmProvider = "claude" | "openai";

export type LlmUsage = {
  provider: LlmProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number; // 0 for providers without explicit cache write
  cacheReadInputTokens: number;     // 0 for providers without cache read accounting
  approxUsd: number;
};

export type ReportResult = {
  provider: LlmProvider;
  markdown: string;
  schemaValid: boolean;
  schemaIssues: string[];
  usage: LlmUsage;
  raw: string;
};

// Legacy aliases — kept so older imports compile until callers migrate.
export type ClaudeUsage = LlmUsage;
export type ClaudeReportResult = ReportResult;
