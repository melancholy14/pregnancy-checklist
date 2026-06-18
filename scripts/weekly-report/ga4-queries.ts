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
  ChannelGroupAcquisition,
  CohortRetention,
  CohortRow,
  CoreBehaviorReach,
  CoreBehaviorRow,
  ExternalDomainOutflow,
  Ga4Result,
  IsoWeek,
  LandingPageEntry,
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

// Q6/Q7 (Wave 2) 모집단 가드 기본값. spec §3.1: previousCount < threshold → noise.
// 임계값 10은 W22~W24 실데이터 관찰 후 조정 가능. config 상수 한 줄 수정으로 끝나는 구조.
const POPULATION_GUARD_THRESHOLD = 10;
const CHANNEL_GROUP_TOP_N = 5;
const LANDING_PAGE_TOP_N = 10;

// Q4 자체 도메인 거짓 양성 제거 — pregnancy-checklist.com 변종을 자체화 후보에서 제외.
// CNAME은 `pregnancy-checklist.com` 단일이지만 enhanced measurement의 linkDomain은
// www 서브도메인 형태로도 들어올 수 있어 두 변종을 모두 차단.
const SELF_DOMAINS = new Set<string>([
  "pregnancy-checklist.com",
  "www.pregnancy-checklist.com",
]);

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
  // GA4 Data API: 각 cohort 블록에 `dimension: "firstSessionDate"` 필수.
  // 누락 시 `INVALID_ARGUMENT: The dimension field in cohortSpec.cohorts.dimension
  // is required and must be the string "firstSessionDate"` 가 떨어진다 (W22 raw 기록).
  type CohortBlock = {
    name: string;
    dimension: "firstSessionDate";
    dateRange: { startDate: string; endDate: string };
  };
  const cohorts: CohortBlock[] = [];
  for (let i = 0; i < COHORT_LOOKBACK_WEEKS; i += 1) {
    const start = addDays(cohortStart, i * 7);
    const end = addDays(start, 6);
    cohorts.push({
      name: isoWeekLabel(start),
      dimension: "firstSessionDate",
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

function firstSessionDateToMonday(yyyymmdd: string): Date | null {
  // GA4 표준 dimension `firstSessionDate`는 "YYYYMMDD" 문자열.
  // 운영자가 `cohort_join_week` user-scoped custom dimension을 GA4 콘솔에 등록하지
  // 않아도 동작하도록, 사용자의 첫 세션 날짜를 ISO 주차의 월요일로 환원해서
  // cohort_join_week 라벨을 유도한다.
  if (!/^\d{8}$/.test(yyyymmdd)) return null;
  const year = Number(yyyymmdd.slice(0, 4));
  const month = Number(yyyymmdd.slice(4, 6));
  const day = Number(yyyymmdd.slice(6, 8));
  return startOfISOWeek(new Date(Date.UTC(year, month - 1, day)));
}

async function runCohortViaManual(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<CohortRow[]> {
  // cohortStartMonday는 lookback 윈도의 첫 ISO 월요일 — cohortSpec 경로와 동일한
  // "지난 8주에 첫 세션을 가진 사용자" 집합으로 좁히기 위한 기준점.
  const cohortStartMonday = startOfISOWeek(
    addDays(parseISO(range.endDate), -7 * COHORT_LOOKBACK_WEEKS + 1),
  );
  const lookbackStart = format(cohortStartMonday, "yyyy-MM-dd");
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "firstSessionDate" }, { name: "isoWeek" }, { name: "isoYear" }],
    metrics: [{ name: "activeUsers" }],
    dateRanges: [{ startDate: lookbackStart, endDate: range.endDate }],
  });

  // firstSessionDate별로 여러 행이 나올 수 있으므로 (cohortJoinWeek, nthWeek) 키로 합산.
  const aggregated = new Map<string, { cohortJoinWeek: string; nthWeek: number; activeUsers: number }>();
  for (const row of response.rows ?? []) {
    const firstSessionDate = readString(row.dimensionValues?.[0]?.value);
    const isoWeek = readNumber(row.dimensionValues?.[1]?.value);
    const isoYear = readNumber(row.dimensionValues?.[2]?.value);
    const activeUsers = readNumber(row.metricValues?.[0]?.value);

    const joinMonday = firstSessionDateToMonday(firstSessionDate);
    const activeMonday =
      isoWeek > 0 && isoYear > 0
        ? startOfISOWeek(addDays(new Date(Date.UTC(isoYear, 0, 4)), (isoWeek - 1) * 7))
        : null;
    if (!joinMonday || !activeMonday) continue;
    // dateRanges는 active 세션 날짜만 제한하므로, 오래 전 join한 사용자가
    // 이번 lookback 안에서 활성이면 결과에 섞여 들어온다. cohortSpec와 같은
    // 8주 cohort 집합으로 맞추기 위해 joinMonday를 명시적으로 컷오프.
    if (joinMonday < cohortStartMonday) continue;

    const cohortJoinWeek = isoWeekLabel(joinMonday);
    const nthWeek = differenceInCalendarISOWeeks(activeMonday, joinMonday);
    if (nthWeek < 0) continue;

    const key = `${cohortJoinWeek}::${nthWeek}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.activeUsers += activeUsers;
    } else {
      aggregated.set(key, { cohortJoinWeek, nthWeek, activeUsers });
    }
  }
  return [...aggregated.values()];
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
    // 3-way: prev>0 → 숫자 %; prev=0 && cur>0 → "new" (신규 발현);
    // 양주 모두 0 → null (비교 의미 없음 — 본문에서 "데이터 없음" 처리).
    let wowDelta: number | "new" | null;
    if (prev.eventCount > 0) {
      wowDelta = Number((((cur.eventCount - prev.eventCount) / prev.eventCount) * 100).toFixed(1));
    } else if (cur.eventCount > 0) {
      wowDelta = "new";
    } else {
      wowDelta = null;
    }
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
    .filter((r) => r.domain !== "" && r.domain !== "(not set)" && !SELF_DOMAINS.has(r.domain));

  return { rows };
}

// ── Q5. Week-over-week anomaly (±5/10/20/30 bands) ──────────────────
// Wave 2 #6: 모집단 가드 — previousCount < threshold 인 이벤트는 큰 WoW가 잡혀도
// 모집단 자체가 너무 작아 통계적 신호가 아니므로 "noise" 로 강제 다운그레이드한다.
// W24(active users=0) 같은 휴면기 incident 도배 시나리오를 차단.
// 단 previousCount === 0 && currentCount > 0 인 "new 발현" 케이스는 §2 핵심 행동의
// wowDelta="new" 경로에서 별도 처리되므로 본 함수 책임 밖. 본 함수에 들어오는 prev=0
// 케이스는 anomaly 쿼리가 deltaPercent=null 로 넘긴 것 → noise (모집단 0).
export function bandForDelta(
  deltaPercent: number | null,
  opts: { previousCount: number; threshold?: number },
): AnomalyRow["band"] {
  const threshold = opts.threshold ?? POPULATION_GUARD_THRESHOLD;
  if (opts.previousCount < threshold) return "noise";
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
      band: bandForDelta(deltaPercent, { previousCount: prev }),
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

// ── Q6. Acquisition channel groups (Wave 2 M1) ───────────────────────
// GA4 표준 차원 `sessionDefaultChannelGroup` 기반. organic vs direct vs referral
// 분리 가시성을 위해 TOP N 세션 집계. `(not set)` 은 §4 외부 유출 필터와 동일 패턴 제외.
export async function queryChannelGroupAcquisition(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<ChannelGroupAcquisition> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: CHANNEL_GROUP_TOP_N,
  });

  const rows = (response.rows ?? [])
    .map((row) => ({
      channelGroup: readString(row.dimensionValues?.[0]?.value),
      sessions: readNumber(row.metricValues?.[0]?.value),
    }))
    .filter((r) => r.channelGroup !== "" && r.channelGroup !== "(not set)");

  return { rows };
}

// ── Q7. Landing page entry (Wave 2 M2) ───────────────────────────────
// GA4 표준 차원 `landingPagePlusQueryString`. 첫 진입점 = SEO 우선순위 신호.
// 본문 표 노출 시 query string 의 raw 검색어/내부 입력값 PII 마스킹은 fixture 생성
// (anonymize.ts) 단계에서 처리되며, 라이브 GA4 응답은 운영자 단독 vault 에만 저장된다.
export async function queryLandingPageEntry(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  range: WeeklyDateRange,
): Promise<LandingPageEntry> {
  const [response] = await client.runReport({
    property: propertyPath(propertyId),
    dimensions: [{ name: "landingPagePlusQueryString" }],
    metrics: [{ name: "sessions" }],
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: LANDING_PAGE_TOP_N,
  });

  const rows = (response.rows ?? [])
    .map((row) => ({
      landingPage: readString(row.dimensionValues?.[0]?.value),
      sessions: readNumber(row.metricValues?.[0]?.value),
    }))
    .filter((r) => r.landingPage !== "" && r.landingPage !== "(not set)");

  return { rows };
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

  // 7개 쿼리를 동시 발사 — 하나가 실패해도 나머지 결과를 모두 수집해서 진단이 1회로 끝나도록 한다.
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
    labelQuery("Q6 channel_group_acquisition", () =>
      queryChannelGroupAcquisition(client, propertyId, range),
    ),
    labelQuery("Q7 landing_page_entry", () => queryLandingPageEntry(client, propertyId, range)),
  ]);

  const failures = settled
    .map((r, i) => (r.status === "rejected" ? { index: i, reason: r.reason } : null))
    .filter((f): f is { index: number; reason: unknown } => f !== null);
  if (failures.length > 0) {
    const messages = failures.map((f) => {
      const m = f.reason instanceof Error ? f.reason.message : String(f.reason);
      return m;
    });
    throw new Error(`GA4 queries failed (${failures.length}/7):\n  - ${messages.join("\n  - ")}`);
  }

  const [cohort, coreBehavior, zeroResultSearch, externalDomain, anomaly, channelGroup, landingPage] =
    settled.map((r) => (r as PromiseFulfilledResult<unknown>).value) as [
      CohortRetention,
      CoreBehaviorReach,
      ZeroResultSearch,
      ExternalDomainOutflow,
      WeekOverWeekAnomaly,
      ChannelGroupAcquisition,
      LandingPageEntry,
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
    channelGroup,
    landingPage,
    trendWeeks,
  };
}
