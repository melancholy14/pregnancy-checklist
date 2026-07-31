/**
 * Shared types for the weekly report pipeline.
 *
 * Mapping to spec §1.9 / ga4.md Q1~Q7:
 *   Q1 → CohortRetention
 *   Q2 → CoreBehaviorReach
 *   Q3 → ZeroResultSearch
 *   Q4 → ExternalDomainOutflow
 *   Q5 → WeekOverWeekAnomaly
 *   Q6 → ChannelGroupAcquisition (Wave 2 M1)
 *   Q7 → LandingPageEntry (Wave 2 M2)
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
  // percent (e.g. +12.5 / -3.1) when previous>0;
  // "new" when previous=0 && current>0 (신규 발현 — % 비교 불가);
  // null when previous=0 && current=0 (양주 모두 0 — 신호 없음).
  wowDelta: number | "new" | null;
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
  // true when 직전주 실사용자 수(previousTotalActiveUsers) < AUDIENCE_GUARD_THRESHOLD.
  // 이 경우 baseline 오디언스가 dogfooding 수준(1~3명)이라 모든 WoW %가 통계적
  // 신호가 아니므로 전 행 band 를 noise 로 강등한 상태. LLM 에 incident 서술 금지 신호.
  audienceFloored?: boolean;
};

// ── Q6. Acquisition channel groups (Wave 2 M1) ───────────────────────
export type ChannelGroupRow = {
  channelGroup: string; // GA4 표준 차원 sessionDefaultChannelGroup 값 (e.g. "Organic Search")
  sessions: number;
};

export type ChannelGroupAcquisition = {
  rows: ChannelGroupRow[];
};

// ── Q7. Landing page entry (Wave 2 M2) ───────────────────────────────
export type LandingPageRow = {
  landingPage: string; // landingPagePlusQueryString — query string PII는 anonymize.ts에서 마스킹.
  sessions: number;
};

export type LandingPageEntry = {
  rows: LandingPageRow[];
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
  channelGroup: ChannelGroupAcquisition;
  landingPage: LandingPageEntry;
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
