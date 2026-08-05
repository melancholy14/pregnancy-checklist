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
5. 이상치: 직전 7일 vs 그 전 7일 eventCount의 WoW 변동. 밴드: ±5% noise / ±10% hypothesis / ±20% action / ±30% incident. 단 previousCount<10이면 모집단 부족으로 noise 강제. 밴드는 코드가 이미 확정한 값이며 절대 상향 재판정 금지 — band=noise면 %가 아무리 커도 incident로 서술하지 말 것. audienceFloored=true(직전주 실사용자<10, dogfooding 구간)면 전 행이 noise로 강등된 상태이니 TL;DR·추천 액션에 "incident/즉각 조치" 서술을 만들지 말고 "오디언스 표본 부족으로 판단 보류"로 처리.
6. 유입 채널: sessionDefaultChannelGroup TOP 5. organic vs direct vs referral 분리 가시성.
7. 랜딩 페이지: landingPagePlusQueryString TOP 10. SEO 최적화 우선순위.

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
| 2026-W14 | N | N |
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

## 6. 유입 채널 (sessionDefaultChannelGroup TOP)
| 채널 | 세션 |
| Organic Search | N |
| Direct | N |

## 7. 랜딩 페이지 (landingPagePlusQueryString TOP)
| 랜딩 페이지 | 세션 |
| /article/foo | N |

## 8. 추천 액션
- [ ] 액션 1 (근거 섹션 번호 명시)
- [ ] 액션 2
\`\`\`

## 데이터 부족 처리
- 코호트 totalCohorts < 4 또는 anomaly.comparable=false 등은 해당 섹션 상단에
  "> 데이터 누적 N주차 — 추세 판단은 4주 이후부터 유효" disclaimer를 1줄 삽입.
- rows=0인 섹션은 "(데이터 없음)" 한 줄로 명시. 빈 표나 절대 사용 금지 (placeholder \`| ... | ... |\` 패턴 금지).
- §6·§7 처럼 신규 측정 슬롯이 active users=0 주차에 비는 경우도 동일하게 "(데이터 없음)" 명시. 헤더만 두고 본문 빈 줄 금지.
- Q2 wowDelta="new"는 신규 발현(직전주=0, 이번주>0). %를 비우지 말고 "(신규)"로 표기. wowDelta=null은 양주 모두 0 → "(데이터 없음)".

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
    `## Q5 이상치 (±5% 이상만, comparable=${result.anomaly.comparable}, audienceFloored=${result.anomaly.audienceFloored === true})`,
    result.anomaly.audienceFloored === true
      ? `- 주의: 직전주 실사용자 표본 부족(오디언스 가드 발동) → 전 행 band=noise 강등됨. incident 서술·즉각 조치 액션 생성 금지.`
      : `- 주의: (없음)`,
    "```json",
    JSON.stringify(result.anomaly.rows, null, 2),
    "```",
    ``,
    `## Q6 유입 채널 TOP`,
    "```json",
    JSON.stringify(result.channelGroup.rows, null, 2),
    "```",
    ``,
    `## Q7 랜딩 페이지 TOP`,
    "```json",
    JSON.stringify(result.landingPage.rows, null, 2),
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
  "## 6. 유입 채널",
  "## 7. 랜딩 페이지",
  "## 8. 추천 액션",
];

// Wave 2 #7: 신규 측정 슬롯(§6·§7)은 active users=0 휴면기에 행이 비어도 통과시킨다.
// 단 placeholder `| ... |` 패턴은 막아야 하므로 "(데이터 없음)" 명시 텍스트만 허용.
const ALLOW_EMPTY_SECTIONS = new Set<string>([
  "## 6. 유입 채널",
  "## 7. 랜딩 페이지",
]);
const EMPTY_SECTION_MARKER = /\(데이터 없음\)/;

// `| ... | ... |` 형태 placeholder 검출. cell 셀 안에 점 3개 이상이 단독으로 들어간
// 패턴이면 LLM 이 템플릿을 그대로 옮긴 것 — invalid. ellipsis 자체 (… `U+2026`) 는
// 본문 해석 텍스트에서 자연스럽게 등장할 수 있어 ASCII `...` 만 검출 대상.
const PLACEHOLDER_PATTERN = /\|\s*\.{3,}\s*\|/;

// Wave 1 도입 `wowDelta="new"` sentinel 화이트리스트. `(신규)` 셀이나 `wowDelta: "new"`
// 가 본문에 있으면 placeholder 검출에서 그 라인은 제외 — placeholder 가 아닌 sentinel.
const NEW_SENTINEL_PATTERN = /\(신규\)|wowDelta:\s*"new"/;

function extractSection(normalized: string, header: string): string | null {
  const startIdx = normalized.indexOf(header);
  if (startIdx === -1) return null;
  // 헤더 line 전체를 끊고 그 다음 줄부터 body 시작 — `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)`
  // 같은 부속 텍스트가 body 에 섞이지 않도록.
  const afterHeader = startIdx + header.length;
  const headerLineEnd = normalized.indexOf("\n", afterHeader);
  const bodyStart = headerLineEnd === -1 ? normalized.length : headerLineEnd + 1;
  // 다음 `## ` 헤더 직전까지가 한 섹션의 본문.
  const nextHeaderMatch = normalized.slice(bodyStart).match(/\n## /);
  const endIdx = nextHeaderMatch
    ? bodyStart + (nextHeaderMatch.index ?? 0)
    : normalized.length;
  return normalized.slice(bodyStart, endIdx);
}

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

  // Wave 2 #7: placeholder 검출. sentinel(`(신규)`/`wowDelta: "new"`) 가 있는 라인은
  // 제외하고, 그 외에 `| ... |` 패턴이 한 줄이라도 있으면 invalid.
  const lines = normalized.split("\n");
  const placeholderHit = lines.some(
    (line) => PLACEHOLDER_PATTERN.test(line) && !NEW_SENTINEL_PATTERN.test(line),
  );
  if (placeholderHit) {
    issues.push("placeholder leak detected — `| ... |` template literal remains in body");
  }

  // 신규 섹션(§6·§7) 본문 검증: "(데이터 없음)" 명시 또는 데이터 행 1개 이상 필요.
  // 헤더만 있고 본문이 비어 있는 경우 invalid (placeholder 와 동일하게 차단).
  for (const header of ALLOW_EMPTY_SECTIONS) {
    if (!normalized.includes(header)) continue;
    const body = extractSection(normalized, header);
    if (body === null) continue;
    const trimmed = body.replace(/^\s+|\s+$/g, "");
    if (trimmed === "") {
      issues.push(`section "${header}" has empty body — write "(데이터 없음)" or at least one data row`);
      continue;
    }
    if (EMPTY_SECTION_MARKER.test(body)) continue;
    // "(데이터 없음)" 이 없으면 데이터 행이 최소 1개 있어야 한다.
    // pipe(`|`) 가 들어간 본문 행 또는 `- `/`1.` 로 시작하는 리스트 행을 데이터 행으로 간주.
    const hasRow = body
      .split("\n")
      .some((line) => /^\s*\|/.test(line) || /^\s*(?:[-*]|\d+\.)\s+\S/.test(line));
    if (!hasRow) {
      issues.push(`section "${header}" has no data row — write "(데이터 없음)" or fill in rows`);
    }
  }

  return { valid: issues.length === 0, issues };
}

export function unwrapFencedMarkdown(raw: string): string {
  const fenced = raw.match(/^```(?:markdown)?\n([\s\S]+?)\n```$/);
  return (fenced ? fenced[1] : raw).trim();
}
