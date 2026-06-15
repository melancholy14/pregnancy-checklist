/**
 * Provider-agnostic prompt pieces shared by claude-prompt.ts and openai-prompt.ts.
 *
 * Both providers consume the same SYSTEM_PROMPT + user message + schema check —
 * only the SDK call and pricing differ. Keeping these in one module ensures
 * Claude and OpenAI emit reports that are interchangeable (§1.9.6 schema lock).
 */

import type { Ga4Result, IsoWeek } from "./types.js";

export const SYSTEM_PROMPT = `당신은 1인 운영자가 매주 읽을 GA4 주간 리포트를 작성하는 데이터 애널리스트입니다.

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
- Q2 wowDelta="new"는 신규 발현(직전주=0, 이번주>0). %를 비우지 말고 "(신규)"로 표기. wowDelta=null은 양주 모두 0 → "데이터 없음".

## 작성 원칙
- raw 검색어/도메인을 인용 부호 안에서 그대로 옮기되, PII·식별자·이메일은 절대 만들어내지 말 것.
- 추측·해석 시에는 "추정", "가설"로 표기. 단정 금지.
- 추천 액션은 측정과 직결된 1~3개로 제한. 일반론 금지.
- 마크다운 외 텍스트(설명, 사과, 메타 코멘트) 일절 금지.`;

export const MAX_OUTPUT_TOKENS = 4000;

export function buildUserMessage(result: Ga4Result, generatedIso: string): string {
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

export function validateSchema(
  markdown: string,
  isoWeek: IsoWeek,
): { valid: boolean; issues: string[] } {
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

export function unwrapFencedMarkdown(raw: string): string {
  const fenced = raw.match(/^```(?:markdown)?\n([\s\S]+?)\n```$/);
  return (fenced ? fenced[1] : raw).trim();
}
