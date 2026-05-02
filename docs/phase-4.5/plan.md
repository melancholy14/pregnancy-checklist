# Phase 4.5: 기존 기능 개선 (Pre-Phase 5)

> Phase 4 기록: [../phase-4/plan.md](../phase-4/plan.md)
> Date: 2026-05-02
> 목표 완료: TBD
> Status: 📝 기획 단계

## Overview

Phase 5(체중 차트 BMI 강화·채널 디렉토리 등)로 넘어가기 전에, **현재까지 만들어둔 기능을 마케팅/디자인/기획/개발 4개 축에서 한 번 정돈**한다. 신규 기능을 더하지 않고, **이미 깔린 자산의 완성도와 일관성**을 끌어올리는 단계.

핵심 대상은 Phase 4에서 확장된 **출산 준비 체크리스트(허브 + 3종 + 타임라인 연동)** 영역이며, 분석 결과 5-pastel role discipline·접근성 마크업·정보 위계가 가장 우선순위 높은 손볼 거리로 식별됨.

### 4축 개선 프레임

| 축 | 무엇을 정돈하는가 |
|----|------------------|
| **마케팅** | GA4 측정 모델 정립 — 리텐션/체류/기능 수요 신호를 잡는 이벤트 설계 — 본 문서 §1 |
| **디자인 (UI/UX)** | DESIGN.md 토큰 디시플린 정렬, 접근성, 인터랙션 마감 — 본 문서 §2 |
| **기획** | 데이터 모델·미사용 UX 부활 여부 등 **의사결정 필요 항목** — 본 문서 §3 |
| **개발** | (TBD) — 코드 정리, 미사용 컴포넌트 제거, 테스트 보강 |

---

## Scope

**In scope:**

- GA4 측정 모델 정립 + 1단계 이벤트 도입 (마케팅 §1)
- 체크리스트 영역 UI/UX 마감 (디자인 §2)
- 추가/편집 폼 데이터 모델 결정 (기획 §3)
- 미사용 UX 부활/삭제 결정 (기획 §3)
- 개발 축은 별도 라운드에서 합류 (TBD)

**Out of scope (Phase 5로 이동):**

- 체중 차트 BMI 강화
- 영상 채널 디렉토리·sub-category 필터 부활
- 회원가입 / 로그인 / PWA / 푸시
- 신규 체크리스트 종류 추가

---

## 1. 마케팅 개선 — GA4 측정 모델

> 분석 대상: 사이트 전반 (체크리스트 + 아티클 + 타임라인 + 체중/영상 트래커)
> 분석 시점: 2026-05-02
> 분석 기준: 10년차 SaaS 마케터 관점, GA4 모범사례, 임신 주차 코호트 특성

### 1.1 종합 평가

GA4 인프라(consent 게이팅 + 수동 page_view + `sendGAEvent` 헬퍼)는 이미 깔려 있어 **이벤트 정의만 하면 즉시 발사 가능한 상태**. 다만 현재는 page_view 외에는 아무것도 안 잡혀서 **"방문자가 무엇을 했는가"를 데이터로 답할 수 없음**.

기능 추가 의사결정에 활용하려면 단순 이벤트 나열이 아니라 **북극성 → 보조 → 진단 3층 모델**과 **임신 주차 코호트** 축을 같이 설계해야 한다. 이 서비스는 일반 SaaS와 달리 **유저 수명이 임신 주차로 정해져 있어**(보통 ~40주), 표준 MAU/DAU보다 **"등록 주차 → 출산까지의 주간 활성률 곡선(코호트 리텐션)"** 이 훨씬 본질적인 지표.

### 1.2 잘된 부분 (유지)

- **Consent 기반 GA4 로딩** — [ConsentGatedScripts.tsx](../../src/components/consent/ConsentGatedScripts.tsx) GDPR/PIPA 호환 구조. 이벤트 추가 시 별도 동의 처리 불필요.
- **수동 page_view (`send_page_view:false`)** — App Router SPA 전환 시 자동 page_view가 부정확해지는 문제를 [PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx)가 선제 해결.
- **타입 안전 헬퍼** — [analytics.ts:5-14](../../src/lib/analytics.ts#L5-L14) `sendGAEvent`가 SSR/미주입 상황 모두 noop 처리. 호출부에서 분기 안 해도 됨.

### 1.3 측정 모델 — 무엇을 보고 결정할 건가

기능 추가 의사결정에 쓰려면 이벤트가 아니라 **3층 지표 트리**로 묶어야 분석할 때 안 헤맨다.

| 층 | 지표 | 답할 수 있는 질문 |
|---|---|---|
| **북극성** | 주차별 코호트 리텐션 (W+1, W+4) | "임산부가 매주 돌아오는가?" |
| **보조** | 핵심행동 도달률 (체크 1개+, 글 완독, 체중 입력) | "방문해서 *가치*를 얻는가?" |
| **진단** | 이탈 지점, 0-결과 검색, scroll-without-click | "다음에 뭘 만들어야 하는가?" |

### 1.4 User Properties (sticky, 코호트 분석 축)

모든 이벤트 슬라이싱의 기준. 등록 단계와 주차 갱신 시점에 set.

| 이름 | 값 예시 | 용도 |
|---|---|---|
| `due_date_set` | true/false | 핵심 등록 funnel 완료 여부 |
| `current_pregnancy_week` | 24 | 코호트 (매 방문 갱신) |
| `cohort_join_week` | 18 | 첫 방문 주차 (고정) — "초기 등록자 vs 후기 등록자" 행동 차이 |
| `is_first_pregnancy` | true/false | 페르소나 분리 |
| `notification_opt_in` | true/false | 푸시/이메일 동의 (Phase 5 대비) |

> 💡 `current_pregnancy_week`는 user property면서 동시에 **이벤트 파라미터로도** 같이 보낸다. 이벤트 시점 주차로 슬라이싱이 가능해야 "20주차는 영양 글, 32주차는 출산 가방 글에 머문다" 같은 인사이트가 나옴.

### 1.5 이벤트 카탈로그

#### A. 자동 (GA4 기본) — 손대지 않음

`session_start`, `first_visit`, `user_engagement`, `scroll`(90%, enhanced measurement) — 체류시간/세션은 GA4 자동 수집으로 충분.

#### B. 핵심 기능 — 체크리스트 (이 서비스의 본질)

| 이벤트 | 주요 파라미터 | 왜 필요한가 |
|---|---|---|
| `checklist_view` | `week`, `category` | 어느 주차/카테고리가 가장 자주 열리나 |
| `checklist_item_toggle` | `item_id`, `action`(check/uncheck), `week`, `is_custom` | **재방문의 가장 강한 신호.** 체크 행위 = 행동적 리텐션 |
| `checklist_week_complete` | `week`, `completion_rate` | 완주율 — 어느 주차에서 포기가 시작되는가 |
| `checklist_filter` | `filter_type`, `value` | "미체크만 보기"(§2.6 #1) 같은 필터가 실제 쓰이나 |

#### C. 콘텐츠 — 아티클 / 영상 / 가이드

| 이벤트 | 파라미터 | 인사이트 |
|---|---|---|
| `article_view` | `slug`, `topic`, `format`(article/guide), `week_relevance` | 어떤 토픽이 잘 읽히나 |
| `article_read_complete` | `slug`, `read_time_sec` | scroll 75%↑ + dwell 60s↑ — **진짜 읽힌 글** (GA4 기본 scroll 단독으로는 부족) |
| `related_article_click` | `from_slug`, `to_slug`, `position` | 최근 만든 추천 기능([commit 0c25e04](../../scripts/generate-crosslinks.ts)) 효과 측정 |
| `share_click` | `slug`, `method`(share/copy) | Web Share([commit ba15a41](../../src/components/share/ShareButton.tsx)) 전환율 |

> 📌 영상은 자체 임베드가 아니라 [VideoCard.tsx](../../src/components/videos/VideoCard.tsx)에서 youtube.com으로 외부 이동. 시청 진행률(`video_progress`)은 우리 도메인에서 측정 불가 → §E `external_link_click`에 `video_id`·`channel_id` 파라미터로 흡수해 한 곳에서 본다. YouTube Studio 분석은 별도.

#### D. 개인화 트래커 — 체중 · 타임라인

| 이벤트 | 파라미터 | 인사이트 |
|---|---|---|
| `weight_log` | `week`, `delta_from_last` | 재방문 트리거 (가장 sticky한 행동 중 하나) |
| `timeline_view` | `week`, `milestone_clicked` | 주차별 마일스톤 소비 패턴 |
| `pregnancy_week_set` | `week`, `source`(onboarding/manual_update) | **핵심 등록 이벤트 — `conversion`으로 마킹** |

#### E. 신호 (Signals) — "다음에 뭘 만들지" 답하는 이벤트 👈 가장 중요

이 카테고리는 보통 빠뜨리는데, **기능 추가 의사결정에 직결**된다.

| 이벤트 | 파라미터 | 어떤 의사결정에 쓰나 |
|---|---|---|
| `search_submit` | `query`, `results_count` | **0-결과 검색**이 곧 다음 콘텐츠 백로그 |
| `cta_click` | `cta_id`, `location`, `destination` | 어떤 자리·문구가 먹히나 |
| `external_link_click` | `domain`, `context` | 정부24·병원 사이트로 새는 양 = 자체화 후보 |
| `scroll_without_action` | `page_type`, `dwell_sec` | 머물지만 클릭 안 하는 페이지 = 디자인/CTA 문제 |
| `feature_request_signal` | `trigger` (예: 빈 상태 도달, 미존재 기능 영역 클릭) | 아직 없는 기능에 대한 수요 |
| `error_view` / `empty_state_view` | `page`, `reason` | 마찰점 |

### 1.6 명명 규칙

- **snake_case** + **object_action** 형태 (`article_view`, `checklist_item_toggle`)
- 같은 의미 파라미터는 **동일 키 이름** 통일 (`week`, `slug`, `topic` 등)
- 파라미터 25개 제한 → 묶을 수 있는 건 묶고, **카테고리는 user_property로**
- 결제·이메일 등 **PII는 절대 파라미터로 넣지 않음**
- 이벤트 함수는 [analytics.ts](../../src/lib/analytics.ts)에 타입 안전 wrapper로 추가 (예: `trackChecklistToggle({ itemId, action, week })`) — 호출부에서 raw `sendGAEvent` 사용 지양

### 1.7 분석 시나리오 — 수집된 데이터로 실제 이렇게 본다

| 보고 싶은 것 | GA4에서 보는 법 |
|---|---|
| **얼마나 자주 오나** | Cohort exploration: `cohort_join_week` 기준 weekly retention |
| **얼마나 머무나** | 평균 engagement time per session × 페이지 타입(체크리스트/아티클) 분리 |
| **이탈 지점** | Path exploration: `session_start` → ... → exit, 직전 step 빈도순 |
| **다음 기능 후보** | `search_submit` where `results_count=0` top 50 / 주차별 TOP `external_link_click` |
| **추천 기능 효과** | `related_article_click` CTR + 클릭 후 `article_read_complete` 비율 |
| **푸시 가치 검증 (Phase 5)** | `notification_opt_in=true` vs `false` 코호트 W+4 리텐션 차이 |

### 1.8 작업 묶음 (실행 단위)

한 번에 다 넣지 않고 **단계적으로** — 각 단계 후 1주 데이터를 보고 다음 단계 결정.

| 묶음 | 내용 | 난이도 | 임팩트 |
|---|---|---|---|
| **G** | User properties 3종(`due_date_set`, `current_pregnancy_week`, `cohort_join_week`) + `pregnancy_week_set` 이벤트 (북극성 측정 기반) | S | 큼 |
| **H** | 핵심 4개 이벤트 — `checklist_item_toggle`, `article_read_complete`, `weight_log`, `search_submit` (1단계, B·C·D·E 핵심) | M | 큼 |
| **I** | 콘텐츠 보조 이벤트 — `related_article_click`, `share_click`, `cta_click` | S | 중 |
| **J** | Signals 그룹 — `scroll_without_action`, `external_link_click`, `empty_state_view`, `feature_request_signal` | M | 중 |
| **L** | 자동 주간 리포트 스크립트 — GA4 Data API + Claude API + Obsidian vault MD 출력 (§1.9) | M | 큼 |
| **M** | launchd 등록 + 1차 수동 실행 검증 + 2주 안정화 (§1.9) | S | 중 |

권장 실행 순서: **G → H → (1주 관찰) → I → J → L → M**
(G·H 없이 I 먼저 가면 코호트 슬라이싱이 안 돼서 데이터가 평면적. L·M은 G~J가 1~2주 누적된 뒤 의미 있는 리포트가 나옴.)

> 📌 §2(디자인) 작업 묶음 A~F와는 독립 진행 가능. 단 §2.6의 "미체크만 보기" 토글이 들어가면 묶음 H 정의에 `checklist_filter` 이벤트 1개 추가.

> 📌 Looker Studio 대시보드는 §1.9의 자동 리포트와 기능 중복(정형 주간 보고). 인터랙티브 탐색이 필요해지면 그때 별도 묶음으로 추가.

---

## 1.9 자동 주간 리포트 운영 — Pattern C

> 결정: GA4 Data API + Claude API를 직접 호출하는 Node 스크립트로 매주 마크다운 리포트를 Obsidian vault에 떨어뜨린다. SaaS 의존(Drive/Notion) 없이 로컬 파일 기반.

### 1.9.1 아키텍처

```
[launchd cron]
   │ 매주 월요일 09:00
   ▼
[scripts/weekly-report/index.ts (tsx)]
   ├─▶ GA4 Data API runReport ×N개 쿼리 (§1.7 시나리오 1:1 매핑)
   │      · 코호트 리텐션
   │      · 핵심 행동 도달률
   │      · search_submit (results_count=0) TOP
   │      · external_link_click TOP 도메인
   │      · 직전주 대비 ±5% 변동 항목
   │
   ├─▶ Claude API (claude-sonnet-4-6 + prompt caching)
   │      · system: §1.7 시나리오 정의 + 직전 4주 추세 (cacheable)
   │      · user: 이번주 raw 집계 데이터
   │      · output: 정형 마크다운 (헤더·표·인사이트·다음 액션)
   │
   └─▶ ~/Documents/pregnancy-checklist/60-analytics/weekly/YYYY-Www.md
```

### 1.9.2 출력 위치 — Obsidian vault

vault 루트의 Johnny Decimal 패턴(10-project, 20-content, 30-domain, 40-sources, 50-reviews) 연장으로 **`60-analytics/`** 신설.

```
~/Documents/pregnancy-checklist/
└─ 60-analytics/
   ├─ README.md            # 지표 정의 / 읽는 법 / Pattern C 운영 안내
   ├─ weekly/
   │  ├─ 2026-W18.md       # ISO week
   │  ├─ 2026-W19.md
   │  └─ ...
   └─ monthly/             # 4주차마다 monthly 롤업 (선택, Phase 5)
      └─ 2026-05.md
```

ISO 주차(`YYYY-Www`) 명명 → Obsidian 그래프뷰에서 시계열 추적 자연스럽게.

### 1.9.3 디렉토리 구조 (코드)

```
scripts/weekly-report/
├─ index.ts          # entrypoint — orchestration only
├─ ga4-queries.ts    # GA4 Data API 쿼리 정의 (§1.7과 1:1)
├─ claude-prompt.ts  # 시스템 프롬프트 + caching breakpoint
├─ writer.ts         # 마크다운 포매터 + 파일 출력
└─ types.ts

config/
└─ ga4-service-account.json   # gitignored, 600 권한
```

> [analytics.ts](../../src/lib/analytics.ts)와는 **완전히 분리**. 런타임이 다르고(브라우저 vs Node), 의존성 충돌 위험 → 같은 모듈로 묶지 않음.

### 1.9.4 결정 필요 항목

#### D1. GA4 Property ID + Service Account 발급
- [ ] GA4 콘솔에서 Property ID 확인 (Measurement ID `G-XXX`와 다름)
- [ ] GCP 콘솔에서 Service Account 생성 → JSON 키 다운로드
- [ ] GA4 Property에 Service Account 이메일을 **Viewer 권한**으로 추가
- **보관 위치**: `~/.config/pregnancy-checklist/ga4-sa.json` (홈 밖, repo 밖). 환경변수 `GA4_SA_KEY_PATH`로 참조.

#### D2. 스케줄러 — launchd 채택
- macOS launchd `.plist`로 매주 월요일 09:00 실행
- cron 대비 장점: **부팅 후 누락된 실행을 자동 catch-up**(`StartCalendarInterval` + 재부팅 복구)
- 대안: GitHub Actions는 vault가 로컬이라 부적합 (vault 미러 + push 흐름 추가하면 가능하지만 복잡도↑)

#### D3. 호스트 슬립 중 처리
- 노트북이 월요일 09:00에 닫혀 있으면? → launchd가 깨어난 직후 실행 (RunAtLoad + StartCalendarInterval 조합)
- **수용**: 정확한 09:00이 아니라 "월요일 중 첫 부팅 후"로 충분.

#### D4. 비용
- Claude API: Sonnet 4.6 + prompt caching, 주 1회 입력 ~5K tok / 출력 ~2K tok 가정 → **회당 약 $0.04 (캐시 적중 시 $0.02)**. 월 ~$0.2. 무시 가능.
- GA4 Data API: 무료 (할당량 내).

#### D5. 실패 처리
- API 실패 시 **`60-analytics/weekly/_failed/YYYY-Www.log`** 에 에러 기록 + macOS 알림(osascript). 조용한 실패 금지.
- Claude 응답이 마크다운 스키마 어긋나면 raw JSON도 함께 첨부 (디버깅용).

### 1.9.5 보안

- Service account JSON은 **repo 밖 + 600 권한**.
- `.env` 또는 Keychain에 `ANTHROPIC_API_KEY` 보관 (커밋 금지).
- `scripts/weekly-report/` 내부에서 절대 절대경로 하드코딩 금지 — 모든 비밀은 환경변수 경유.
- vault 자체가 로컬이므로 출력물은 외부 노출 없음. 단, Obsidian Sync를 켤 경우 **민감 raw 쿼리는 마크다운에 인라인 노출 금지** (요약·집계만).

### 1.9.6 마크다운 리포트 스키마 (Claude 출력 계약)

Claude가 매주 동일 구조로 출력하도록 프롬프트에서 강제:

```markdown
---
week: 2026-W18
generated: 2026-05-04T09:01:00+09:00
ga4_property: <id>
---

# Weekly Report — 2026-W18

## TL;DR
- (3줄 이내, 변화·이상치·결정포인트)

## 1. 북극성 — 코호트 리텐션
| cohort_join_week | W+1 | W+4 |
| ... | ... | ... |
**해석**: ...

## 2. 핵심 행동 도달률
- 체크 토글: ... (직전주 대비 +X%)
- 글 완독: ...
- 체중 입력: ...

## 3. 다음 콘텐츠 백로그 (search_submit, results_count=0)
1. "임신성 당뇨 식단" — 14건
2. ...

## 4. 자체화 후보 (external_link_click TOP)
1. gov24.go.kr — 38건 (정부 지원금 안내 자체 페이지화 검토)
2. ...

## 5. 이상치 / 마찰점
- empty_state_view 급증: ...

## 6. 추천 액션
- [ ] ...
- [ ] ...
```

### 1.9.7 작업 묶음 L·M 상세

#### L. 스크립트 작성
1. `pnpm add -D @google-analytics/data @anthropic-ai/sdk tsx date-fns`
2. `scripts/weekly-report/ga4-queries.ts` — §1.7 시나리오 5건을 `runReport` 호출로 구현
3. `scripts/weekly-report/claude-prompt.ts` — system 프롬프트(§1.7 정의 + 직전 4주 요약)에 `cache_control` 마킹
4. `scripts/weekly-report/writer.ts` — vault 절대경로(`~/Documents/pregnancy-checklist/60-analytics/weekly/`) 안전 보장 후 쓰기. 폴더 없으면 mkdir.
5. `scripts/weekly-report/index.ts` — 위 3개를 직렬 호출 + 실패 시 `_failed/` 로그
6. `package.json` 스크립트: `"report:weekly": "tsx scripts/weekly-report/index.ts"`
7. **수동 1회 실행 검증** — 출력 MD가 §1.9.6 스키마 그대로인지 확인.

#### M. launchd 등록
1. `~/Library/LaunchAgents/com.melancholy14.pregnancy-checklist.weekly-report.plist` 작성
2. `StartCalendarInterval`: Weekday=2(Monday), Hour=9, Minute=0
3. `WorkingDirectory`: 프로젝트 루트
4. `StandardOutPath` / `StandardErrorPath`: `~/Library/Logs/pregnancy-checklist-report.log`
5. `launchctl load` → 다음 월요일 자동 실행 확인
6. **2주 관찰**: 누락/실패 0건이면 안정화 완료.

### 1.9.8 회귀 안전장치

- 첫 8주는 Claude 출력 + raw 쿼리 결과(JSON)를 둘 다 저장(`weekly/_raw/YYYY-Www.json`). LLM 해석 오류 시 사람이 raw로 검증 가능.
- 8주 이후 raw 보관은 4주 롤링 윈도우로 축소.

## 2. 디자인 (UI/UX) 개선

> 분석 대상: 출산 준비 체크리스트 (허브 + 출산가방·남편준비·임신준비 3종 + 타임라인 연동)
> 분석 시점: 2026-05-02
> 분석 기준: [DESIGN.md](../../DESIGN.md), 모바일 우선 SaaS UX 기준

### 2.1 종합 평가

체크리스트 자체는 정보 구조가 깔끔하고 진행률·관련 콘텐츠·커스텀 추가까지 갖춘 단단한 기능. 다만 **DESIGN.md의 5-pastel role discipline이 서너 군데에서 어긋나 있고**, 위계와 인터랙션에서 다듬을 거리가 있다. 큰 리팩터 없이 **토큰 정렬 · 우선순위 시각화 · 접근성 마크업** 세 줄기만 손대도 체감 품질이 한 단계 올라가는 상태.

### 2.2 잘된 부분 (유지)

- **허브 → 상세 → 항목** 3단 IA가 명확하고, 허브의 진행률 미리보기가 "어디부터 손댈지" 결정하게 도와줌 ([ChecklistHub.tsx:54-58](../../src/components/checklist/ChecklistHub.tsx#L54-L58))
- 진행률 카드의 **서브카테고리 분해 + 25/50/75/100 마이크로카피**는 게이미피케이션을 과하지 않게 잘 녹였음 ([ChecklistProgress.tsx:51-61](../../src/components/checklist/ChecklistProgress.tsx#L51-L61))
- 체크 시 `bg-pastel-mint/20 + line-through` — mint=success 토큰을 정확히 사용 ([ChecklistItemRow.tsx:83](../../src/components/checklist/ChecklistItemRow.tsx#L83))
- 관련 콘텐츠 영역에서 `text-accent-purple` 링크 톤이 DESIGN.md 4.4 (`--prose-accent`)와 일관됨

### 2.3 Critical — DESIGN.md 위반 / 시스템 일관성

#### C1. 우선순위 배지가 5-pastel role을 깨고 있음

[ChecklistItemRow.tsx:10-14](../../src/components/checklist/ChecklistItemRow.tsx#L10-L14)

```
high   → bg-pastel-pink/60   (DESIGN.md: pink = Primary CTA)
medium → bg-pastel-yellow/60 (DESIGN.md: yellow = Info/Tip)
low    → bg-pastel-mint/60   (DESIGN.md: mint = Success)
```

- **"낮음 = mint(성공)"는 의미적으로 오독을 유발**. 사용자는 mint 배지를 보면 "완료된 항목"이라고 읽을 가능성이 높음 — 실제로 체크된 행도 `bg-pastel-mint/20`이라 **같은 색이 두 가지 의미로 쓰임**.
- **"높음 = pink"는 브랜드의 primary CTA 색을 데이터 라벨로 소비**해버려서, 페이지 안에서 pink가 더 이상 "여기 누르세요" 신호로 안 읽힘.
- **권장 매핑**: high=`accent-red`(편집적 강조), medium=중립 muted, low=outline-only. 또는 우선순위를 색이 아닌 **아이콘+텍스트(`!` / `·` / 생략)** 로 다운그레이드.

#### C2. 페이지 배경이 cream canvas를 무너뜨림

[ChecklistHub.tsx:164](../../src/components/checklist/ChecklistHub.tsx#L164), [ChecklistPage.tsx:83](../../src/components/checklist/ChecklistPage.tsx#L83)

```tsx
bg-linear-to-b from-background to-white
```

DESIGN.md 1·10항 — "Don't use pure white as the page background. The cream is the brand differentiator." 그라디언트 끝점이 white라서 **스크롤 하단이 클리니컬한 느낌**으로 빠짐. `bg-background` 단색으로 통일하거나, 그라디언트라면 `to-pastel-pink/5` 같이 같은 패밀리 안에서.

#### C3. 카드 radius가 토큰 디시플린에서 벗어남

[ChecklistPage.tsx:121](../../src/components/checklist/ChecklistPage.tsx#L121) — 항목 그룹 카드가 `rounded-xl`. DESIGN.md 5.1: "page-level cards prefer `rounded-2xl`". 진행률 카드(rounded-2xl)와 항목 카드(rounded-xl)가 한 화면에 있어서 **리듬이 미세하게 어긋남**. 둘 다 `rounded-2xl`로 통일.

#### C4. h2 글로벌 위계를 인라인으로 덮어씀

[ChecklistHub.tsx:69](../../src/components/checklist/ChecklistHub.tsx#L69), [ChecklistPage.tsx:116](../../src/components/checklist/ChecklistPage.tsx#L116) — `<h2 className="text-[15px] font-medium">`. DESIGN.md 3.2: "Don't restate them with inline classes." 시맨틱이 h2인데 시각은 h4(`text-base/600`). 결과적으로 카드 타이틀과 "엄마 가방" 섹션 헤더가 동일 사이즈라 **"이게 카드인가 섹션인가" 모호**.

→ 카드 타이틀은 `<h3>` (글로벌 `text-lg/600`)로, 섹션 헤더는 `<h3>` 같은 레벨이지만 시각만 살짝 다르게(좌측 보더라인 등) — **시각·시맨틱 정렬**.

### 2.4 Major — 인터랙션 / 접근성

#### M1. 행(row) 자체에 `role="button"` + 내부에 진짜 버튼들이 들어감

[ChecklistItemRow.tsx:80-94](../../src/components/checklist/ChecklistItemRow.tsx#L80-L94)

```tsx
<div role="button" tabIndex={0} aria-pressed={isChecked} onClick={onToggle}>
  <Checkbox ... />          {/* 진짜 인터랙티브 */}
  <Pencil button />          {/* 진짜 인터랙티브 */}
  <DeleteConfirmDialog />    {/* 진짜 인터랙티브 */}
</div>
```

- WCAG 4.1.2 위반 — **interactive 요소를 interactive 요소가 감쌀 수 없음**. 스크린리더가 "버튼, 체크박스, 버튼, 버튼"을 어떻게 읽어줄지 환경마다 갈리고, `aria-pressed`도 토글 단일 의미가 아니라 혼란을 더함.
- 매 항목에서 `e.stopPropagation()`으로 막고 있는데, **잘못된 마크업을 JS로 봉합**하는 패턴.
- **권장**: row를 `<label>`로 감싸고 안에 native `<input type="checkbox">` 또는 Radix `<Checkbox>` + 텍스트 `<span>`만. 편집/삭제는 호버/포커스 시 노출되는 actions 슬롯으로 분리. **행 클릭 = 체크 토글**은 label의 자연스러운 동작으로 얻음.

#### M2. FAB가 secondary 색(lavender)인데 페이지의 primary action

[ChecklistPage.tsx:163](../../src/components/checklist/ChecklistPage.tsx#L163) — `bg-pastel-lavender shadow-lg`. "항목 추가"는 이 페이지의 가장 잦은 액션. DESIGN.md 7.1에서 pink가 primary CTA.

- **결정 필요**: 이 lavender FAB가 "커스텀 추가는 secondary 액션"이라는 의도된 시스템 컨벤션인지(타임라인 등 다른 페이지도 같은 패턴이면 OK), 아니면 단순 누락인지 확인.
- 의도라면 DESIGN.md에 "커스텀 추가 액션은 lavender" 규칙 명시. 누락이라면 pink로 승격.

#### M3. 우선순위 배지 + 노트 + 액션 버튼이 한 행에 다 붙음

[ChecklistItemRow.tsx:117-138](../../src/components/checklist/ChecklistItemRow.tsx#L117-L138) — 모바일 320px에서 긴 항목명(예: "산모 패드 1~2팩 (병원 제공 여부 전화 확인)") + "높음" 배지 + (custom일 경우) 편집/삭제 아이콘이 한 행에 걸리면 **타이틀이 2~3줄로 꺾이고 우측에 작은 글씨 덩어리**가 생김. 우선순위 표시를 시각적으로 더 작게(점 1개) 만들면 행이 차분해짐.

#### M4. 노트가 체크 시 사라짐

[ChecklistItemRow.tsx:110](../../src/components/checklist/ChecklistItemRow.tsx#L110) — `{item.note && !isChecked && ...}`. "병원마다 제공량이 다르므로 확인 필요" 같은 **체크 후에도 다시 확인하고 싶은 정보**를 잃음. 체크 시 노트는 살리고 line-through만 적용하는 쪽이 정보 보존성 면에서 나음.

#### M5. 허브 카드의 아이콘 처리가 제각각

[ChecklistHub.tsx:64](../../src/components/checklist/ChecklistHub.tsx#L64) — 다른 카드: 큰 이모지 단독(`text-3xl`).
[ChecklistHub.tsx:115](../../src/components/checklist/ChecklistHub.tsx#L115) — 타임라인 카드: `w-12 h-12 rounded-2xl bg-pastel-pink/40` 컨테이너 + Calendar 아이콘.

**4장 중 1장만 시각 패턴이 다름.** 의도(타임라인 부각)는 알겠지만, 그러려면 **3장도 같은 컨테이너 + 이모지** 또는 **타임라인도 이모지** 둘 중 하나로 정렬해야 균형이 잡힘.

#### M6. "37주차" 핀이 pink — 과한 어텐션

[ChecklistHub.tsx:128](../../src/components/checklist/ChecklistHub.tsx#L128) — `bg-pastel-pink/40`. 단순 라벨인데 pink로 칠해져 있어서 화면에서 **타임라인 카드만 시각적으로 가장 강하게 튐**. 다른 카드의 lavender 칩과 같은 톤(또는 mint)로 맞추는 게 자연스러움.

### 2.5 Minor — 마감 디테일

- **shadow-md를 "정보 카드"(Progress, RelatedContent)에 사용** — DESIGN.md 6.1·6.2 기준 shadow-md는 input-bearing 카드용. 정보 카드는 shadow-sm이 정석. ([ChecklistProgress.tsx:17](../../src/components/checklist/ChecklistProgress.tsx#L17), [ChecklistRelatedContent.tsx:25](../../src/components/checklist/ChecklistRelatedContent.tsx#L25))
- **`text-red-400` 하드코딩** — [ChecklistAddForm.tsx:72](../../src/components/checklist/ChecklistAddForm.tsx#L72). 토큰 외 컬러. `text-destructive`로.
- **ShareButton이 페이지 우상단에 외롭게 떠 있음** — [ChecklistPage.tsx:91-99](../../src/components/checklist/ChecklistPage.tsx#L91-L99). 섹션 묶음 없이 `flex justify-end mb-4`. 진행률 카드 우상단에 작은 아이콘 버튼으로 통합하거나 h1/description 옆 메타 행에 합치는 편이 정돈됨.
- **링크 텍스트의 "→"** — [ChecklistRelatedContent.tsx:42](../../src/components/checklist/ChecklistRelatedContent.tsx#L42). 텍스트 노드로 들어가서 스크린리더가 "오른쪽 화살표"라고 읽음. `aria-hidden="true"` ChevronRight 아이콘으로 교체.

### 2.6 UX 기회 (기능 레벨)

1. **"미체크만 보기" 토글** — 32개 항목 중 8개 남았을 때 매번 스크롤하며 빈 체크박스 찾는 부담을 한 번에 해결. ROI 가장 큼.
2. **D-day / 임신 주차 연동** — 사용자가 24주차인데 hospital-bag 카드는 "32~36주에 준비"라고 설명만. 카드에 "D-XX 일까지 준비 권장" 같은 컨텍스트 라벨을 깔면 허브가 단순 메뉴가 아니라 **개인화된 다음 액션 제시기**로 전환.
3. **체크 후 잔잔한 컨페티 또는 진행률 점프 애니메이션** — 현재 25/50/75 마이크로카피만 있음. 진행률 막대 width 트랜지션이 instant라 성취감 약함.
4. **삭제 후 undo 토스트** — 커스텀 항목 실수로 지우면 복구 불가.
5. **출산가방 항목 "병원 제공 여부 확인" 메모 → 액션 항목 자동 생성** — 데이터 note에 들어있는 "전화 확인"을 "병원에 전화하기" 한 항목으로 자동 생성하면 액션 가능성↑.

### 2.7 작업 묶음 (실행 단위)

| 묶음 | 내용 | 난이도 | 임팩트 |
|---|---|---|---|
| **A** | 우선순위 색 재매핑 + cream canvas 복원 + radius 통일 (C1·C2·C3) | S | 큼 |
| **B** | ChecklistItemRow를 label 기반으로 마크업 정리 + role="button" 제거 (M1) | M | 큼 |
| **C** | h2 인라인 오버라이드 정리 + 위계 재설계 (C4) | S | 중 |
| **D** | "미체크만 보기" + 임신 주차 컨텍스트 라벨 (UX 기회 1·2) | M | 큼 |
| **E** | shadow / 배지 / 링크 화살표 / 노트 항상 노출 등 마감 (Minor·M3·M4) | S | 중 |
| **F** | 허브 카드 아이콘 패턴 통일 + "37주차" 핀 톤 정렬 (M5·M6) | S | 중 |

권장 실행 순서: **A → C → E → F → B → D**
(토큰 정렬을 먼저 끝내야 B/D 작업 시 새 마크업이 이미 정렬된 시스템 위에 올라감)

---

## 3. 기획 개선

> 분석 시점: 2026-05-03
> 분석 기준: 10년차 SaaS 기획자 + 임신·출산 도메인 콘텐츠 전문가 관점
> 페르소나·사고 프레임: [docs/content/persona.md](../content/persona.md)

### 3.0 종합 평가

§1(마케팅)·§2(디자인) 분석은 자기 영역에서 닫혀 있어 보이지만, **사실 기획 결정 없이는 실행이 막히는 상위 결정**이 누락돼 있다. 이 섹션은 그 상위 결정을 명시화하고, 추가로 데이터 모델 정합성·콘텐츠 전략·운영 정책을 보강한다.

핵심 통찰: **§1.4 user properties와 §2.6 D-day 컨텍스트, §3 P2 isHighlighted가 모두 "사용자의 현재 주차 입력값" 하나에 의존한다**. 그런데 현재 사이트는 사용자가 due date·주차를 명시 입력할 곳이 없다 → 이 결정 하나가 풀리면 세 곳이 동시에 풀린다.

### 3.1 결정 필요 항목 (체크리스트)

#### P1. 편집 모드에서 priority/note 수정 허용 여부

- [ ] **결정**: 허용 / 미허용
- **현황**: [ChecklistItemRow.tsx:42-73](../../src/components/checklist/ChecklistItemRow.tsx#L42-L73) 편집 모드는 **title만** 수정 가능. 추가 폼([ChecklistAddForm.tsx:43](../../src/components/checklist/ChecklistAddForm.tsx#L43))도 priority를 받지 않고 `medium` 하드코딩.
- **고려할 트레이드오프**:
  - 허용 → 사용자 자율성↑ (커스텀 항목을 "꼭 챙길 것 = high"로 표시 가능). 폼 복잡도·유효성 처리 증가.
  - 미허용 → 폼 단순. 단, "내가 추가한 항목"과 "기본 항목"의 priority 의미가 둘 다 의미를 가지면서 사용자만 못 바꾸는 비대칭 발생.
- **연결되는 다른 결정**: §2.3 C1에서 우선순위 시각 표현을 "색"에서 "아이콘/약식"으로 다운그레이드한다면, 사용자가 priority를 직접 고르는 가치도 같이 낮아짐 → 두 결정을 묶어서 판단.

#### P2. ChecklistItem.tsx의 `isHighlighted` ("이번 주차 추천") UX 부활 여부

- [ ] **결정**: 부활 / 삭제
- **현황**: [ChecklistItem.tsx:68-72](../../src/components/checklist/ChecklistItem.tsx#L68-L72)에 `isHighlighted` prop과 "이번 주차에 추천하는 항목이에요" 문구가 정의돼 있으나, 현재 사용처가 없음(허브·상세 모두 [ChecklistItemRow.tsx](../../src/components/checklist/ChecklistItemRow.tsx)만 사용). **잠재 가치 있는 UX가 사장된 상태**.
- **고려할 트레이드오프**:
  - 부활 → §2.6 #2(임신 주차 연동)와 강하게 시너지. 사용자의 현재 주차 ↔ 항목의 `recommendedWeek` 매칭으로 "지금 챙길 것"을 강조. ChecklistItemRow로 이식 + store에 현재 주차 의존성 필요.
  - 삭제 → 코드 단순. 다만 데이터(`recommendedWeek` 필드)는 이미 모든 항목에 존재하므로, 활용 안 하면 데이터 자체가 dead weight.
- **연결되는 다른 결정**: 부활 결정 시 §2.6 #2(D-day 컨텍스트 라벨)와 묶어서 한 번에 진행하는 것이 자연스러움.

#### P3. 임신 주차 입력(onboarding) UX의 형태 ⭐ Critical

- [ ] **결정**: (a) 입력 방식 — 예정일 직접 입력 / 주차 직접 입력 / 둘 다
- [ ] **결정**: (b) 입력 시점 — 첫 방문 풀스크린 onboarding / 홈 상단 카드 / 헤더 고정 위젯 / 체크리스트 진입 시 모달
- [ ] **결정**: (c) 미입력자 사용 허용 여부 — "입력 없이도 둘러보기 가능" vs "필수"
- **현황**: 사이트 어디에도 사용자가 due date·주차를 명시 입력할 곳이 없음. ChecklistHub의 "37주차" 핀도 하드코딩 ([ChecklistHub.tsx:128](../../src/components/checklist/ChecklistHub.tsx#L128)).
- **차단되는 다른 작업**:
  - §1.8 묶음 G — user properties(`due_date_set`, `current_pregnancy_week`, `cohort_join_week`) 작동 불가
  - §1.5 `pregnancy_week_set` 이벤트 정의 불가 (소스 미정)
  - §2.6 UX 기회 #2 D-day 컨텍스트 라벨
  - P2 isHighlighted "부활" 결정 시 매칭 기준 부재
- **고려할 트레이드오프**:
  - 풀스크린 onboarding → 입력 전환율 ↑, 첫 방문 이탈 위험. Phase 2.5 온보딩과 통합 가능 (이미 3단계 존재)
  - 홈 상단 카드 → 입력 부담 ↓, 익명 사용자 비율 늘어 코호트 분석 약화
  - 헤더 고정 위젯 → 갱신 편하나 시각적 점유 부담
- **연결**: Phase 2.5 온보딩 플로우([phase-2.5/plan.md](../phase-2.5/plan.md) §Step 1)와 통합하면 새 화면 추가 없이 해소 가능

#### P4. `current_pregnancy_week` 영속성·갱신 정책

- [ ] **결정**: (a) 입력 단위 — 예정일(자동 계산) / 주차 직접
- [ ] **결정**: (b) 갱신 주기 — 자동 매주 / 사용자 명시 갱신만
- [ ] **결정**: (c) GA4 user property set 시점 — 매 페이지뷰 / 변경 시만
- **현황**: P3 결정에 종속. due date 입력 시 주차 자동 산출이 가장 안전하다는 게 일반론(매일 자동 갱신 가능)
- **고려할 트레이드오프**: 주차 직접 입력은 "정확하지 않은 사용자 입력값"으로 코호트 데이터 오염 가능성. 예정일 단일 입력 + 자동 산출 권장

#### P5. localStorage schema versioning 도입

- [ ] **결정**: (a) version 필드 도입 시점 — Phase 4.5 일괄 vs P1 결정 시 함께
- [ ] **결정**: (b) 마이그레이션 함수 위치 — zustand `persist`의 `migrate` 옵션 / 별도 helper
- [ ] **결정**: (c) 버전 충돌 시 사용자 데이터 처리 — 보존 / 초기화 + 알림 / 자동 백업 후 초기화
- **현황**: zustand `persist`에 schema version 필드 없음. P1(priority 편집 허용) 결정 시 customItems 스키마가 바뀌면 기존 사용자의 체크 상태 호환성 문제
- **연결**: P1 결정 직후 즉시 도입. 향후 "공유된 체크 상태 복원"(Phase 5+) 기능 도입 시에도 동일 인프라 활용

#### P6. `recommendedWeek: 0`의 의미 정의

- [ ] **결정**: 0의 시맨틱 — "추천 주차 미정/시점 무관" / "항상 추천" / "잘못된 데이터" 중 하나
- [ ] **결정**: 의미 분리 필요 시 — `recommendedWeek: null` 도입 vs 별도 필드(`alwaysRecommended: true`)
- **현황**: hospital_bag, partner_prep, pregnancy_prep 항목 다수가 `recommendedWeek: 0`. P2가 "부활"로 결정되면 모든 0번 항목이 매주 추천되는 잠재 버그
- **연결**: P2 결정 직후 또는 그 전에 정의

#### P7. `note` 필드 콘텐츠 타입 분류

- [ ] **결정**: `note_type` 필드 도입 여부 — `action` / `context` / `legal` / 단순 string 유지
- **현황**: "병원 전화 확인" / "도로교통법 제50조" / "제왕절개 시" 등 성격 다른 노트가 한 필드에 섞여 있음
- **연결**: §2.4 M4(체크 후에도 노트 보존) + §2.6 UX 기회 #5(노트 → 자동 액션 분리) 진행 시 필수. 단순 보존 결정이면 도입 불필요
- **고려할 트레이드오프**: 도입 시 데이터 마이그레이션 필요 (운영자가 기존 노트 분류). 미도입 시 노트 자동화 UX 불가

#### P8. 카테고리 두 체계 공존 방향

- [ ] **결정**: (a) 통합 카테고리 어휘로 정렬 / (b) 체크리스트별 로컬 분류 유지
- [ ] **결정**: (c) Phase 4.5에서 결정만 vs 작업도 / Phase 5 통합 검색 시 결정
- **현황**: 기존 `checklist_items.json`은 6개 글로벌 카테고리(`hospital`, `hospital_bag`, `baby_items`, `postpartum`, `admin`, `health`). 신규 3종은 자체 `subcategories` 키
- **연결**: Phase 5 통합 검색·필터 만들 때 결정 안 하면 부채로 누적. 다만 단기 영향은 작음
- **권장**: Phase 4.5에서 **결정만**, 작업은 Phase 5

#### P9. 빈 상태(empty state) 카피·CTA 명세

- [ ] **결정**: 케이스별 카피·CTA — 첫 방문(체크 0개) / 모두 체크 완료 / 마이그레이션 후 데이터 사라진 경우 / 커스텀만 있고 기본 0개일 때
- **현황**: §1.5 `empty_state_view`가 측정 항목인데, 정작 빈 상태가 어떤 페이지에 어떤 형태로 보이는지 미정의
- **연결**: §1.8 묶음 J(신호 이벤트) 도입 시 같이 정의해야 측정 의미 있음

#### P10. 운영자 가이드 — 체크리스트 데이터 변경 룰

- [ ] **결정**: ID 변경 금지 규칙 명문화 (추가 자유, 삭제는 deprecated 플래그 후 N주)
- [ ] **결정**: 가이드 문서 위치 — `docs/content/` / `AGENTS.md` / 별도
- **현황**: Phase 4 Step 5의 운영 절차는 자동 크로스링크 영역만 다룸. 체크리스트 항목 ID 변경/삭제 시 사용자 localStorage에 dangling reference 발생하지만 가이드 부재
- **연결**: P5 schema versioning과 함께 도입하면 일관

### 3.2 콘텐츠 전략 결정 사항 (콘텐츠 전문가 관점)

#### P11. 콘텐츠 ↔ 체크리스트 매트릭스 1차 산출

- [ ] **결정**: (a) 산출물 보관 위치 — Obsidian vault `30-domain/` / `60-analytics/` 신설
- [ ] **결정**: (b) 첫 그리기 Phase 4.5 포함 vs Phase 5
- **배경**: Phase 4 Step 5 자동 크로스링크는 "있는 콘텐츠끼리 잘 연결됐는지"만 보장. **"있어야 할 콘텐츠가 있는지"는 모름**. timeline_items.json을 보면 초기 주차에 동일 글 2~3개 반복 매핑됨
- **연결**: §1.5 `search_submit` (results_count=0) 데이터가 1~2주 누적되기 전, 운영자가 한 번 수동으로 "주차 × 토픽" 빈칸을 그리면 콘텐츠 백로그가 미리 잡힘

#### P12. 양방향 크로스링크 정책 — 아티클 → 체크리스트 CTA

- [ ] **결정**: (a) 아티클 본문 끝에 별도 "관련 체크리스트" 블록 신설 vs 기존 §관련 콘텐츠 카드에 흡수
- [ ] **결정**: (b) 자동화 범위 포함 vs 수동 유지
- **배경**: 체크리스트는 재방문 트리거, 아티클은 유입 트리거. 아티클 → 체크리스트 CTA가 약하면 SEO 트래픽이 본질 도구로 못 흘러감
- **연결**: persona §4.4 "콘텐츠 ↔ 도구 연결 의무" 룰과 정합. 자동화에 포함하면 운영 부담 ↓

#### P13. 외부 링크 인벤토리 1회 수집

- [ ] **결정**: §1.8 묶음 J(신호 이벤트) 도입 전 1회 수행 vs 측정 데이터로 대체
- **배경**: §1.5 `external_link_click`이 "자체화 후보"라고 명시. 측정 시작 전 운영자가 grep으로 TOP 10 도메인 + 빈도 미리 뽑아두면 데이터 1주만에 자체화 우선순위 잡힘
- **고려할 트레이드오프**: 1회 수집 작업 30분~1시간 vs 측정 데이터 누적 1~2주

### 3.3 작업 묶음 (실행 단위)

§3 결정을 묶음으로 정리하면:

| 묶음 | 내용 | 의존성 / 트리거 | 임팩트 |
|---|---|---|---|
| **N** | P3·P4 — 임신 주차 입력 onboarding UX 결정 + 와이어프레임 | §1 G·H, §2.6 #2, P2 모두의 선결조건 | 큼 ⭐ |
| **O** | P5 — localStorage schema versioning 도입 | P1 결정 후 | 중 |
| **P** | P11 — 콘텐츠 매트릭스 1차 산출 (운영자 직접) | §1.9 자동 리포트와 정합 | 중 |
| **Q** | P13 — 외부 링크 인벤토리 1회 수집 | §1.8 묶음 J 전 | 작음 |
| **R** | P6·P7 — 데이터 모델 정합성 결정 (recommendedWeek / note_type) | P2 부활 결정 시 필수 | 중 |
| **S** | P9·P10 — 빈 상태 명세 + 운영자 가이드 작성 | 독립 | 작음 |
| **T** | P8 — 카테고리 체계 결정 (작업은 Phase 5) | Phase 4.5 결정만 | 작음 |
| **U** | P12 — 양방향 크로스링크 정책 결정 + 자동화 확장 | Step 5 스크립트 확장 | 중 |

권장 실행 순서: **N → (G·H 실행 unblock) → R → O → P / Q / S / T / U 병렬**.

> 📌 N묶음(P3·P4)이 §1·§2의 미결 종속성을 **세 군데 동시 해소**하므로 가장 시급. 다른 모든 결정은 N 이후로 미뤄도 된다.

### 3.4 P1~P13 결정 매트릭스 (운영자 결정용)

> 운영자가 결정 시 빠르게 훑을 수 있도록 한 표로 요약. 결정 후 위 §3.1·§3.2의 체크박스 채움.

| ID | 결정 항목 | 시급도 | 차단되는 작업 |
|----|---------|-------|--------------|
| P1 | priority/note 수정 허용 | 보통 | O묶음(versioning), 폼 작업 |
| P2 | isHighlighted 부활 | 낮음 | R·N 결정 후 |
| **P3** | **주차 입력 UX 형태** | **높음 ⭐** | **G·H, P2, §2.6 #2** |
| **P4** | **주차 영속성·갱신 정책** | **높음 ⭐** | **G·H** |
| P5 | schema versioning | 보통 | O묶음 |
| P6 | recommendedWeek 0 의미 | 보통 | P2 부활 시 필수 |
| P7 | note_type 필드 | 낮음 | UX #5 진행 시 |
| P8 | 카테고리 체계 | 낮음 | Phase 5 통합 검색 |
| P9 | 빈 상태 명세 | 보통 | 묶음 J 측정 의미 |
| P10 | 운영자 가이드 | 낮음 | 데이터 변경 사고 예방 |
| P11 | 콘텐츠 매트릭스 | 보통 | 콘텐츠 백로그 사전 정리 |
| P12 | 양방향 크로스링크 | 보통 | 유입→도구 흐름 |
| P13 | 외부 링크 인벤토리 | 낮음 | 묶음 J 사전 작업 |

---

## 4. 개발 개선

> TBD — 별도 라운드에서 채워질 섹션. 미사용 코드 제거(예: §3 P2가 "삭제"로 결정될 경우 ChecklistItem.tsx 자체 제거), 테스트 커버리지 보강, 타입 정리 등이 후보.

---

## 일정 계획

> 디자인·기획 결정이 끝난 뒤 마케팅·개발 라운드와 합쳐서 확정.

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | 디자인 §2 분석 합의 + 기획 §3 결정 | ⏳ 대기 |
| 2 | 마케팅·개발 섹션 채우기 | ⏳ 대기 |
| 3 | 작업 묶음 A~F 실행 | ⏳ 대기 |
| 4 | QA · 회귀 테스트 | ⏳ 대기 |

---

## QA 체크리스트

> 작업 묶음 실행 시 단계별로 채워질 섹션. 최소 항목:

- [ ] 5-pastel role 매핑 위반 0건 (DESIGN.md grep 기반 검증)
- [ ] axe-core 접근성 검증 — 체크리스트 페이지 0 critical
- [ ] 모바일 320px·375px·414px 레이아웃 깨짐 없음
- [ ] 기존 e2e 회귀 통과
- [ ] localStorage 마이그레이션 필요 여부 확인 (priority/note 데이터 모델 변경 시)
