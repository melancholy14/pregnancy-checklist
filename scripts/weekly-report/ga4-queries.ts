/**
 * GA4 Data API queries — 5 scenarios mapped 1:1 to ga4.md Q1~Q5.
 *
 * Auth: `BetaAnalyticsDataClient` reads credentials from the file at
 * `GOOGLE_APPLICATION_CREDENTIALS`, which `index.ts` sets from
 * `GA4_SA_KEY_PATH` before invoking these queries.
 *
 * Schema discipline (spec §3 "won't"): we never write GA4 events, never edit
 * the catalog. These queries are read-only aggregations.
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  addDays,
  differenceInCalendarISOWeeks,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
} from "date-fns";

import type {
  AnomalyRow,
  CohortRetention,
  CohortRow,
  CoreBehaviorReach,
  CoreBehaviorRow,
  ExternalDomainOutflow,
  Ga4Result,
  IsoWeek,
  WeekOverWeekAnomaly,
  WeeklyDateRange,
  ZeroResultSearch,
} from "./types.js";

// Events tracked in src/lib/analytics.ts callsites that participate in the
// weekly report. Keep this list in sync with src/components and src/lib hooks
// that call sendGAEvent — adding events here is read-only and additive.
const CORE_BEHAVIOR_EVENTS = [
  "checklist_item_toggle",
  "article_read_complete",
  "weight_log",
] as const;

const ANOMALY_EVENTS = [
  "page_view",
  "checklist_item_toggle",
  "article_read_complete",
  "weight_log",
  "search_submit",
  "external_link_click",
  "empty_state_view",
  "scroll_without_action",
  "axis_enter",
  "axis_cross_link",
] as const;

const COHORT_LOOKBACK_WEEKS = 8;
const TOP_N = 10;

export function createGa4Client(): BetaAnalyticsDataClient {
  return new BetaAnalyticsDataClient();
}

export function isoWeekLabel(date: Date): IsoWeek {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}` as IsoWeek;
}

export function lastCompletedIsoWeek(now: Date): { range: WeeklyDateRange; previous: WeeklyDateRange; isoWeek: IsoWeek } {
  const lastWeekAnchor = addDays(now, -7);
  const start = startOfISOWeek(lastWeekAnchor); // Monday
  const end = addDays(start, 6); // Sunday
  const prevStart = addDays(start, -7);
  const prevEnd = addDays(prevStart, 6);
  return {
    range: { startDate: format(start, "yyyy-MM-dd"), endDate: format(end, "yyyy-MM-dd") },
    previous: { startDate: format(prevStart, "yyyy-MM-dd"), endDate: format(prevEnd, "yyyy-MM-dd") },
    isoWeek: isoWeekLabel(start),
  };
}

export function trendWeekLabels(referenceWeekStart: Date, weeks: number = 4): IsoWeek[] {
  // Returns oldest → newest, ending with the week immediately before referenceWeekStart.
  const labels: IsoWeek[] = [];
  for (let i = weeks; i >= 1; i -= 1) {
    labels.push(isoWeekLabel(addDays(referenceWeekStart, -7 * i)));
  }
  return labels;
}

function readNumber(value: unknown): number {
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function readString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function propertyPath(propertyId: string): string {
  return `properties/${propertyId}`;
}

// ── Q1. Cohort retention ─────────────────────────────────────────────
async function runCohortViaSpec(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<CohortRow[]> {
  const cohortStart = addDays(parseISO(range.endDate), -7 * COHORT_LOOKBACK_WEEKS + 1);
  type CohortBlock = { name: string; dateRange: { startDate: string; endDate: string } };
  const cohorts: CohortBlock[] = [];
  for (let i = 0; i < COHORT_LOOKBACK_WEEKS; i += 1) {
    const start = addDays(cohortStart, i * 7);
    const end = addDays(start, 6);
    cohorts.push({
      name: isoWeekLabel(start),
      dateRange: {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      },
    });
  }

  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    cohortSpec: {
      cohorts,
      cohortsRange: {
        granularity: "WEEKLY",
        startOffset: 0,
        endOffset: COHORT_LOOKBACK_WEEKS - 1,
      },
    },
    dimensions: [{ name: "cohort" }, { name: "cohortNthWeek" }],
    metrics: [{ name: "cohortActiveUsers" }],
  });

  return (response.rows ?? []).map((row) => ({
    cohortJoinWeek: readString(row.dimensionValues?.[0]?.value),
    nthWeek: readNumber(row.dimensionValues?.[1]?.value),
    activeUsers: readNumber(row.metricValues?.[0]?.value),
  }));
}

function parseCohortJoinWeek(label: string): Date | null {
  // PageviewTracker가 vault에 적는 cohort_join_week 라벨은 "YYYY-Www" ISO 주차.
  const match = label.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // ISO 8601: 1월 4일은 항상 주차 1에 속한다 → 거기서 (week-1)주를 더해 해당 주의 월요일을 얻는다.
  return startOfISOWeek(addDays(new Date(Date.UTC(year, 0, 4)), (week - 1) * 7));
}

async function runCohortViaManual(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<CohortRow[]> {
  const lookbackStart = format(
    addDays(parseISO(range.endDate), -7 * COHORT_LOOKBACK_WEEKS + 1),
    "yyyy-MM-dd",
  );
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "customUser:cohort_join_week" }, { name: "isoWeek" }, { name: "isoYear" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: lookbackStart, endDate: range.endDate }],
  });

  return (response.rows ?? [])
    .map((row) => {
      const cohortJoinWeek = readString(row.dimensionValues?.[0]?.value);
      const isoWeek = readNumber(row.dimensionValues?.[1]?.value);
      const isoYear = readNumber(row.dimensionValues?.[2]?.value);
      const activeUsers = readNumber(row.metricValues?.[0]?.value);
      const joinMonday = parseCohortJoinWeek(cohortJoinWeek);
      const activeMonday =
        isoWeek > 0 && isoYear > 0
          ? startOfISOWeek(addDays(new Date(Date.UTC(isoYear, 0, 4)), (isoWeek - 1) * 7))
          : null;
      const nthWeek =
        joinMonday && activeMonday
          ? differenceInCalendarISOWeeks(activeMonday, joinMonday)
          : -1;
      return { cohortJoinWeek, nthWeek, activeUsers };
    })
    .filter((r) => r.cohortJoinWeek !== "" && r.nthWeek >= 0);
}

export async function queryCohortRetention(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<CohortRetention> {
  try {
    const rows = await runCohortViaSpec(client, propertyId, range);
    const totalCohorts = new Set(rows.map((r) => r.cohortJoinWeek)).size;
    return { approach: "cohortSpec", rows, totalCohorts };
  } catch (specError) {
    const specMessage = specError instanceof Error ? specError.message : String(specError);
    try {
      const rows = await runCohortViaManual(client, propertyId, range);
      const totalCohorts = new Set(rows.map((r) => r.cohortJoinWeek)).size;
      return {
        approach: "manual",
        rows,
        totalCohorts,
        note: `cohortSpec unavailable — fell back to manual aggregation (${specMessage})`,
      };
    } catch (manualError) {
      const manualMessage = manualError instanceof Error ? manualError.message : String(manualError);
      return {
        approach: "unavailable",
        rows: [],
        totalCohorts: 0,
        note: `cohort retrieval failed (spec: ${specMessage}; manual: ${manualMessage})`,
      };
    }
  }
}

// ── Q2. Core behavior reach ──────────────────────────────────────────
async function queryEventReach(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<Map<string, { eventCount: number; totalUsers: number }>> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...CORE_BEHAVIOR_EVENTS] },
      },
    },
  });

  const map = new Map<string, { eventCount: number; totalUsers: number }>();
  for (const row of response.rows ?? []) {
    const name = readString(row.dimensionValues?.[0]?.value);
    map.set(name, {
      eventCount: readNumber(row.metricValues?.[0]?.value),
      totalUsers: readNumber(row.metricValues?.[1]?.value),
    });
  }
  return map;
}

async function queryTotalActiveUsers(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<number> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
  });
  return readNumber(response.rows?.[0]?.metricValues?.[0]?.value);
}

export async function queryCoreBehaviorReach(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
  previous: WeeklyDateRange,
): Promise<CoreBehaviorReach> {
  const [currentMap, previousMap, currentActive, previousActive] = await Promise.all([
    queryEventReach(client, propertyId, range),
    queryEventReach(client, propertyId, previous),
    queryTotalActiveUsers(client, propertyId, range),
    queryTotalActiveUsers(client, propertyId, previous),
  ]);

  const rows: CoreBehaviorRow[] = CORE_BEHAVIOR_EVENTS.map((eventName) => {
    const cur = currentMap.get(eventName) ?? { eventCount: 0, totalUsers: 0 };
    const prev = previousMap.get(eventName) ?? { eventCount: 0, totalUsers: 0 };
    const wowDelta =
      prev.eventCount > 0
        ? Number((((cur.eventCount - prev.eventCount) / prev.eventCount) * 100).toFixed(1))
        : null;
    return {
      eventName,
      eventCount: cur.eventCount,
      totalUsers: cur.totalUsers,
      previousEventCount: prev.eventCount,
      previousTotalUsers: prev.totalUsers,
      wowDelta,
    };
  });

  return {
    totalActiveUsers: currentActive,
    previousTotalActiveUsers: previousActive,
    rows,
  };
}

// ── Q3. Zero-result search TOP 10 ────────────────────────────────────
export async function queryZeroResultSearch(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<ZeroResultSearch> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "customEvent:query" }],
    metrics: [{ name: "eventCount" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: "eventName", stringFilter: { value: "search_submit" } } },
          { filter: { fieldName: "customEvent:results_count", stringFilter: { value: "0" } } },
        ],
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: TOP_N,
  });

  const rows = (response.rows ?? [])
    .map((row) => ({
      query: readString(row.dimensionValues?.[0]?.value),
      eventCount: readNumber(row.metricValues?.[0]?.value),
    }))
    .filter((r) => r.query !== "");

  return { rows };
}

// ── Q4. External link outflow TOP 10 ─────────────────────────────────
// GA4 Enhanced Measurement가 자동 수집하는 `click` (outbound=true) 이벤트의 표준
// dimension `linkDomain`을 사용. custom dimension 등록 불필요.
// 우리가 별도로 발사하는 `external_link_click` 커스텀 이벤트는 Q5 이상치 추적용으로
// 그대로 유지되며, Q4 도메인 분포는 GA4 표준에 위임한다.
export async function queryExternalDomainOutflow(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<ExternalDomainOutflow> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "linkDomain" }],
    metrics: [{ name: "eventCount" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensionFilter: {
      filter: { fieldName: "outbound", stringFilter: { value: "true" } },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: TOP_N,
  });

  const rows = (response.rows ?? [])
    .map((row) => ({
      domain: readString(row.dimensionValues?.[0]?.value),
      eventCount: readNumber(row.metricValues?.[0]?.value),
    }))
    .filter((r) => r.domain !== "" && r.domain !== "(not set)");

  return { rows };
}

// ── Q5. Week-over-week anomaly (±5/10/20/30 bands) ──────────────────
function bandForDelta(deltaPercent: number | null): AnomalyRow["band"] {
  if (deltaPercent === null) return "hypothesis";
  const abs = Math.abs(deltaPercent);
  if (abs >= 30) return "incident";
  if (abs >= 20) return "action";
  if (abs >= 10) return "hypothesis";
  return "noise";
}

async function queryAnomalyWindow(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<Map<string, number>> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...ANOMALY_EVENTS] },
      },
    },
  });

  const map = new Map<string, number>();
  for (const row of response.rows ?? []) {
    map.set(readString(row.dimensionValues?.[0]?.value), readNumber(row.metricValues?.[0]?.value));
  }
  return map;
}

export async function queryWeekOverWeekAnomaly(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
  previous: WeeklyDateRange,
): Promise<WeekOverWeekAnomaly> {
  const [currentMap, previousMap] = await Promise.all([
    queryAnomalyWindow(client, propertyId, range),
    queryAnomalyWindow(client, propertyId, previous),
  ]);

  const previousTotal = [...previousMap.values()].reduce((a, b) => a + b, 0);
  const comparable = previousTotal > 0;

  const rows: AnomalyRow[] = ANOMALY_EVENTS.map((eventName) => {
    const cur = currentMap.get(eventName) ?? 0;
    const prev = previousMap.get(eventName) ?? 0;
    const deltaPercent =
      prev > 0 ? Number((((cur - prev) / prev) * 100).toFixed(1)) : null;
    return {
      eventName,
      currentCount: cur,
      previousCount: prev,
      deltaPercent,
      band: bandForDelta(deltaPercent),
    };
  })
    .filter((r) => {
      // 양주 모두 0인 이벤트는 신호 없음 — 거짓 양성 제거.
      if (r.currentCount === 0 && r.previousCount === 0) return false;
      // 신규 발현(prev=0 cur>0) 또는 ±5% 이상만 유지 (spec §1.7).
      return r.deltaPercent === null || Math.abs(r.deltaPercent) >= 5;
    });

  return { rows, comparable };
}

// ── Aggregator ───────────────────────────────────────────────────────
function describeGoogleError(error: unknown): string {
  // GA4 Data API의 INVALID_ARGUMENT는 .message가 비고 detail은 다른 키에 들어간다.
  // 진단을 위해 가능한 키를 모두 직렬화.
  if (typeof error !== "object" || error === null) return String(error);
  const e = error as Record<string, unknown> & { message?: string };
  const fields: string[] = [];
  if (e.message) fields.push(`message=${e.message}`);
  if (typeof e.code === "number") fields.push(`grpc_code=${e.code}`);
  if (e.details) fields.push(`details=${JSON.stringify(e.details)}`);
  if (e.note) fields.push(`note=${e.note}`);
  if (e.statusDetails) fields.push(`statusDetails=${JSON.stringify(e.statusDetails)}`);
  if (e.metadata && typeof (e.metadata as { getMap?: () => unknown }).getMap === "function") {
    try {
      const map = (e.metadata as { getMap: () => unknown }).getMap();
      fields.push(`metadata=${JSON.stringify(map)}`);
    } catch {
      // 메타데이터 직렬화 실패는 무시.
    }
  }
  return fields.length > 0 ? fields.join(" | ") : String(error);
}

async function labelQuery<T>(label: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const detail = describeGoogleError(error);
    const wrapped = new Error(`[${label}] ${detail}`);
    // 원본 stack 보존.
    if (error instanceof Error && error.stack) wrapped.stack = error.stack;
    throw wrapped;
  }
}

export async function collectGa4Result(params: {
  client: BetaAnalyticsDataClient;
  propertyId: string;
  range: WeeklyDateRange;
  previous: WeeklyDateRange;
  isoWeek: IsoWeek;
  trendWeeks: IsoWeek[];
}): Promise<Ga4Result> {
  const { client, propertyId, range, previous, isoWeek, trendWeeks } = params;

  // 5개 쿼리를 동시 발사 — 하나가 실패해도 나머지 결과를 모두 수집해서 진단이 1회로 끝나도록 한다.
  const settled = await Promise.allSettled([
    labelQuery("Q1 cohort_retention", () => queryCohortRetention(client, propertyId, range)),
    labelQuery("Q2 core_behavior_reach", () =>
      queryCoreBehaviorReach(client, propertyId, range, previous),
    ),
    labelQuery("Q3 zero_result_search", () => queryZeroResultSearch(client, propertyId, range)),
    labelQuery("Q4 external_domain_outflow", () =>
      queryExternalDomainOutflow(client, propertyId, range),
    ),
    labelQuery("Q5 anomaly", () =>
      queryWeekOverWeekAnomaly(client, propertyId, range, previous),
    ),
  ]);

  const failures = settled
    .map((r, i) => (r.status === "rejected" ? { index: i, reason: r.reason } : null))
    .filter((f): f is { index: number; reason: unknown } => f !== null);
  if (failures.length > 0) {
    const messages = failures.map((f) => {
      const m = f.reason instanceof Error ? f.reason.message : String(f.reason);
      return m;
    });
    throw new Error(`GA4 queries failed (${failures.length}/5):\n  - ${messages.join("\n  - ")}`);
  }

  const [cohort, coreBehavior, zeroResultSearch, externalDomain, anomaly] = settled.map(
    (r) => (r as PromiseFulfilledResult<unknown>).value,
  ) as [
    CohortRetention,
    CoreBehaviorReach,
    ZeroResultSearch,
    ExternalDomainOutflow,
    WeekOverWeekAnomaly,
  ];

  return {
    propertyId,
    isoWeek,
    range,
    cohort,
    coreBehavior,
    zeroResultSearch,
    externalDomain,
    anomaly,
    trendWeeks,
  };
}
