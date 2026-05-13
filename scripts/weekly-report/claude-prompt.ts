/**
 * Claude API call for the weekly report.
 *
 * Caching strategy (spec §1.9.4 D4):
 *   - System prompt is stable (§1.7 scenarios + §1.9.6 schema) and marked
 *     with `cache_control: { type: "ephemeral" }`. Note: ephemeral cache
 *     expires ~5 minutes after last use, so consecutive weekly runs do NOT
 *     hit the cache. Cost target $0.04/run therefore assumes the cache-miss
 *     path. Cache hits only happen if the script is re-run within minutes
 *     (e.g. dry-run followed by real run during a single operator session).
 *   - User prompt carries this week's aggregated GA4 numbers + the last 4
 *     ISO-week labels for trend context. Changes every run — never cached.
 *
 * Output contract: Claude must return markdown matching §1.9.6 (TL;DR +
 * 6 sections). `validateSchema` checks the structure post-hoc; on mismatch
 * `writer.ts` attaches the raw response below a sentinel for debugging.
 */

import Anthropic from "@anthropic-ai/sdk";

import type {
  ClaudeReportResult,
  ClaudeUsage,
  Ga4Result,
  IsoWeek,
} from "./types.js";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4000;

// Per Anthropic pricing for Sonnet 4.6 ($/MTok): input 3 / output 15 / cache-write 3.75 / cache-read 0.30
const PRICE_INPUT = 3 / 1_000_000;
const PRICE_OUTPUT = 15 / 1_000_000;
const PRICE_CACHE_WRITE = 3.75 / 1_000_000;
const PRICE_CACHE_READ = 0.3 / 1_000_000;

const SYSTEM_PROMPT = `당신은 1인 운영자가 매주 읽을 GA4 주간 리포트를 작성하는 데이터 애널리스트입니다.

## 측정 시나리오 (§1.7)
1. 북극성 — 코호트 리텐션 (cohort_join_week × nthWeek): join 주차별 W+1, W+4 active 비율. 가로 평탄=sticky, 가파른 감쇠=일회성.
2. 핵심 행동 도달률: checklist_item_toggle / article_read_complete / weight_log의 (행동 사용자 ÷ 전체 active users). 직전주 대비 ±%.
3. 0결과 검색 TOP 10: search_submit AND results_count=0. 콘텐츠 작성 우선순위 신호.
4. 외부 유출 TOP 도메인: external_link_click의 도메인 집계. 정부=자체화 후보, 의료=병원 비교 수요.
5. 이상치: 직전 7일 vs 그 전 7일 eventCount의 WoW 변동. 밴드: ±5% noise / ±10% hypothesis / ±20% action / ±30% incident.

## 출력 스키마 (§1.9.6) — 엄격 준수
출력은 아래 마크다운 구조 그대로. 추가 섹션 금지, 누락 금지, 순서 변경 금지.

\`\`\`
---
week: YYYY-Www
generated: ISO-8601
ga4_property: <id>
---

# Weekly Report — YYYY-Www

## TL;DR
- (3줄 이내. 변화·이상치·결정포인트 중심.)

## 1. 북극성 — 코호트 리텐션
| cohort_join_week | W+1 | W+4 |
| ... | ... | ... |
**해석**: ...

## 2. 핵심 행동 도달률
- 체크 토글: 도달률 + 직전주 대비 ±%
- 글 완독: 동일
- 체중 입력: 동일

## 3. 다음 콘텐츠 백로그 (search_submit, results_count=0)
1. "검색어" — N건
2. ...

## 4. 자체화 후보 (external_link_click TOP)
1. 도메인 — N건 (자체화 후보 여부 한 줄)
2. ...

## 5. 이상치 / 마찰점
- event_name: ±X% (밴드: action/incident 등) — 한 줄 해석
- ...

## 6. 추천 액션
- [ ] 액션 1 (근거 섹션 번호 명시)
- [ ] 액션 2
\`\`\`

## 데이터 부족 처리
- 코호트 totalCohorts < 4 또는 anomaly.comparable=false 등은 해당 섹션 상단에
  "> 데이터 누적 N주차 — 추세 판단은 4주 이후부터 유효" disclaimer를 1줄 삽입.
- rows=0인 섹션은 "데이터 없음 — N" 한 줄로 명시. 빈 표나 빈 리스트는 금지.

## 작성 원칙
- raw 검색어/도메인을 인용 부호 안에서 그대로 옮기되, PII·식별자·이메일은 절대 만들어내지 말 것.
- 추측·해석 시에는 "추정", "가설"로 표기. 단정 금지.
- 추천 액션은 측정과 직결된 1~3개로 제한. 일반론 금지.
- 마크다운 외 텍스트(설명, 사과, 메타 코멘트) 일절 금지.`;

function buildUserMessage(result: Ga4Result, generatedIso: string): string {
  return [
    `# 주간 GA4 집계 결과`,
    ``,
    `- week: ${result.isoWeek}`,
    `- generated: ${generatedIso}`,
    `- ga4_property: ${result.propertyId}`,
    `- range: ${result.range.startDate} → ${result.range.endDate} (직전 7일)`,
    `- trend_weeks (최근 4주 라벨, 오래된→최신): ${result.trendWeeks.join(", ")}`,
    ``,
    `## Q1 코호트 리텐션 (approach=${result.cohort.approach}, totalCohorts=${result.cohort.totalCohorts})`,
    result.cohort.note ? `- note: ${result.cohort.note}` : "- note: (없음)",
    "```json",
    JSON.stringify(result.cohort.rows, null, 2),
    "```",
    ``,
    `## Q2 핵심 행동 도달률 (totalActiveUsers=${result.coreBehavior.totalActiveUsers}, prevActive=${result.coreBehavior.previousTotalActiveUsers})`,
    "```json",
    JSON.stringify(result.coreBehavior.rows, null, 2),
    "```",
    ``,
    `## Q3 0결과 검색 TOP`,
    "```json",
    JSON.stringify(result.zeroResultSearch.rows, null, 2),
    "```",
    ``,
    `## Q4 외부 유출 TOP`,
    "```json",
    JSON.stringify(result.externalDomain.rows, null, 2),
    "```",
    ``,
    `## Q5 이상치 (±5% 이상만, comparable=${result.anomaly.comparable})`,
    "```json",
    JSON.stringify(result.anomaly.rows, null, 2),
    "```",
    ``,
    `위 데이터로 §1.9.6 스키마 마크다운을 생성하세요. 헤더 외 추가 텍스트 금지.`,
  ].join("\n");
}

const REQUIRED_HEADERS = [
  "## TL;DR",
  "## 1. 북극성",
  "## 2. 핵심 행동 도달률",
  "## 3. 다음 콘텐츠 백로그",
  "## 4. 자체화 후보",
  "## 5. 이상치",
  "## 6. 추천 액션",
];

function validateSchema(markdown: string, isoWeek: IsoWeek): { valid: boolean; issues: string[] } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const issues: string[] = [];
  if (!normalized.includes(`week: ${isoWeek}`)) {
    issues.push(`frontmatter "week: ${isoWeek}" missing`);
  }
  if (!/^---\n[\s\S]+?\n---/.test(normalized)) {
    issues.push("frontmatter delimiters missing");
  }
  for (const header of REQUIRED_HEADERS) {
    if (!normalized.includes(header)) {
      issues.push(`section "${header}" missing`);
    }
  }
  return { valid: issues.length === 0, issues };
}

function computeUsageCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}): ClaudeUsage {
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const approxUsd =
    usage.input_tokens * PRICE_INPUT +
    usage.output_tokens * PRICE_OUTPUT +
    cacheWrite * PRICE_CACHE_WRITE +
    cacheRead * PRICE_CACHE_READ;
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: cacheWrite,
    cacheReadInputTokens: cacheRead,
    approxUsd: Number(approxUsd.toFixed(4)),
  };
}

export async function generateWeeklyReport(
  result: Ga4Result,
  generatedIso: string,
): Promise<ClaudeReportResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserMessage(result, generatedIso),
      },
    ],
  });

  const raw = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();

  const fenced = raw.match(/^```(?:markdown)?\n([\s\S]+?)\n```$/);
  const markdown = (fenced ? fenced[1] : raw).trim();

  const schemaCheck = validateSchema(markdown, result.isoWeek);
  const usage = computeUsageCost(response.usage);

  return {
    markdown,
    schemaValid: schemaCheck.valid,
    schemaIssues: schemaCheck.issues,
    usage,
    raw,
  };
}
