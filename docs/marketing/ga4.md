# GA4 이벤트 정의 및 분석 가이드

> 출산 준비 체크리스트 서비스에서 사용하는 GA4 이벤트의 단일 진실 원천(Single Source of Truth).
> 신규 이벤트는 코드 추가 **전에** 이 문서에 등재 — 이름·파라미터 락인 방지.
> 운영 결정 문서는 [docs/phase-4.5/plan.md §1](../phase-4.5/plan.md), 이 문서는 **레퍼런스**.
> 마케팅 페르소나·룰: [persona.md](persona.md)
> 최초 작성: 2026-05-03

---

## 0. 이 문서 사용법

| 상황 | 어디를 보나 |
|---|---|
| 신규 기능에 이벤트 추가 시 | §3 이벤트 카탈로그 → 비슷한 이벤트 찾고 명명·파라미터 일관성 맞추기 |
| 주간 리포트 해석 시 | §5 분석 방법론 |
| "이 지표 왜 빠졌지?" 디버깅 시 | §4 상관관계 → 어느 이벤트가 같이 빠졌나 확인 |
| 신규 토픽/카테고리 enum 확장 | §6 Enum 정의 |
| 락인 의사결정 근거 찾을 때 | §7 변경 정책 |

---

## 1. 측정 모델 요약

3층 지표 트리. **모든 이벤트는 이 중 한 층에 매핑**된다(매핑 안 되면 추가 보류).

| 층 | 답하는 질문 | 핵심 지표 | 관련 이벤트 |
|---|---|---|---|
| **북극성** | "임산부가 매주 돌아오는가?" | 임신 주차 코호트 W+1·W+4 리텐션 | `session_start` + `cohort_join_week` user_property |
| **보조** | "방문해서 가치를 얻는가?" | 핵심 행동 도달률(체크/완독/체중 입력) | `checklist_item_toggle`, `article_read_complete`, `weight_log` |
| **진단** | "다음에 무엇을 만들어야 하는가?" | 0-결과 검색·이탈·외부 유출 | `search_submit`, `external_link_click`, `empty_state_view`, `scroll_without_action` |

> **유저 수명이 임신 주차로 고정**(보통 ~40주)되는 게 일반 SaaS와의 본질적 차이. MAU/DAU보다 **임신 주차 코호트**가 항상 우선.

---

## 2. User Properties (코호트 분석 축)

이벤트 슬라이싱의 모든 축. **GA4 admin에서 custom dimension으로 등록까지 해야 보고서에 노출**된다.

| 이름 | 타입 | 값 예시 | set 시점 | 용도 |
|---|---|---|---|---|
| `due_date_set` | bool | true / false | 출산예정일 입력 직후 | 핵심 등록 funnel 완료 여부 |
| `current_pregnancy_week` | int | 0~42 | **매 방문**(앱 진입 시) | 이벤트 시점 주차 슬라이싱 |
| `cohort_join_week` | int | 18 | **첫 방문 1회만** (이후 불변) | "초기 등록자 vs 후기 등록자" 행동 차이 |
| `is_first_pregnancy` | bool | true / false | 온보딩 입력 시 | 페르소나 분리 |
| `notification_opt_in` | bool | true / false | 동의/철회 시 | 푸시 가치 검증 (Phase 5) |

### 주의사항

- `current_pregnancy_week`는 **user_property 동시에 이벤트 파라미터로도** 보낸다. 시점 주차로 슬라이싱이 가능해야 함.
- `cohort_join_week`는 **재계산 금지**. 사용자가 출산예정일을 수정해도 첫 방문 주차로 고정.
- user_property 변경 후 GA4 admin에서 **custom dimension 등록**까지 해야 보고서에 노출.
- 5개 이상 추가하기 전에 user_property 25개 한도(무료 GA4) 확인.

---

## 3. 이벤트 카탈로그

> 각 이벤트는: 목적 / 트리거 조건 / 파라미터 / 매핑 층 / 발사 위치(파일) / 분석 시 보는 법 / 주의사항.

### 3.A 자동 (GA4 기본) — 손대지 않음

| 이벤트 | 출처 |
|---|---|
| `session_start`, `first_visit`, `user_engagement` | GA4 자동 |
| `scroll` (90% 도달) | enhanced measurement |
| `page_view` | [PageviewTracker.tsx](../../src/components/analytics/PageviewTracker.tsx) 수동 발사 (`send_page_view:false`) |

체류시간·세션 수는 GA4 자동 수집으로 충분. 추가 정의 불필요.

---

### 3.B 핵심 기능 — 체크리스트

#### `checklist_view`
- **목적**: 어느 주차/카테고리 체크리스트가 가장 자주 열리는가
- **트리거**: 체크리스트 페이지(또는 허브 카드) 진입 시 1회
- **파라미터**:
  - `week` (int) — 사용자 현재 주차
  - `category` (string, enum §6.1) — `hospital-bag` / `husband` / `pregnancy-prep`
- **층**: 보조
- **발사 예정 위치**: [src/components/checklist/ChecklistPage.tsx](../../src/components/checklist/ChecklistPage.tsx) 마운트 시
- **분석**: 카테고리별 view 비중을 주차 코호트로 분리 → 어느 주차가 어떤 체크리스트에 진입하는지 매핑
- **주의**: 같은 세션 내 재진입은 **별 이벤트로 카운트** (탐색 패턴 보존). 중복 제거하지 않는다.

#### `checklist_item_toggle` ⭐ 핵심 보조 지표
- **목적**: 체크 행위 = **재방문의 가장 강한 신호**, 행동적 리텐션
- **트리거**: 체크박스 토글 시
- **파라미터**:
  - `item_id` (string) — 항목 고유 ID
  - `action` (string enum) — `check` / `uncheck`
  - `week` (int) — 토글 시점 주차
  - `category` (string, §6.1)
  - `is_custom` (bool) — 사용자가 추가한 항목인지
- **층**: 보조 (북극성 직결)
- **발사 위치 예정**: [ChecklistItemRow.tsx](../../src/components/checklist/ChecklistItemRow.tsx) onToggle 핸들러
- **분석**:
  - 주간 토글 발생 사용자 수 = WAU의 **행동 기반 정의** (단순 방문 WAU보다 신뢰도↑)
  - `uncheck`/`check` 비율 — 0.2 초과 시 사용자 혼란/실수 (UX 문제)
  - `is_custom=true` 비율 — 기본 항목으로 안 채워지는 영역 신호
- **주의**: 빠른 더블 토글(체크→언체크) 디바운스. 200ms 내 반복은 마지막만 발사.

#### `checklist_week_complete`
- **목적**: 주차별 완주율 — 어느 주차에서 포기가 시작되나
- **트리거**: 한 카테고리의 모든 항목이 체크된 시점 1회 (이후 다시 체크/언체크 반복해도 재발사 X, 세션당 1회)
- **파라미터**:
  - `category` (string, §6.1)
  - `week` (int) — 완료 시점 주차
  - `total_items` (int)
  - `time_to_complete_days` (int) — 첫 항목 체크 ~ 완료까지 경과일
- **층**: 보조
- **분석**: completion funnel — 카테고리 view → 첫 토글 → 50% → 완료. 각 단계 dropoff율.
- **주의**: 사용자가 항목을 다시 unche해서 미완 상태로 만든 후 재완료해도 **첫 완료만** 카운트.

#### `checklist_filter`
- **목적**: 필터 기능(예: "미체크만 보기")이 실제 쓰이나
- **트리거**: 필터 변경 시
- **파라미터**:
  - `filter_type` (string) — `unchecked_only` / `priority` / `category`
  - `value` (string) — 필터 값
- **층**: 진단
- **분석**: 필터 사용률 < 5% → 기능 가치 재검토. > 30% → 기본값 변경 검토.

---

### 3.C 콘텐츠 — 아티클 / 영상 / 가이드

#### `article_view`
- **목적**: 어떤 토픽이 잘 읽히나 (basic CTR과 다름, 진입만 잡음)
- **트리거**: 아티클 페이지 진입 시 1회
- **파라미터**:
  - `slug` (string)
  - `topic` (string, enum §6.2) — `nutrition` / `exercise` / `medical` / `product` / `policy` / `lifestyle`
  - `format` (string enum) — `article` / `guide` (영상은 detail 페이지가 없어 `article_view` 미발사 — §3.E `external_link_click(context=video)` 참조)
  - `week_relevance` (int, optional) — 콘텐츠가 권장하는 주차 (있으면)
- **층**: 보조 (article_read_complete와 짝)
- **분석**: view 단독 해석 금지. **`article_read_complete` 비율**과 항상 같이 본다.

#### `article_read_complete` ⭐ 콘텐츠 가치 지표
- **목적**: **진짜 읽힌 글** 식별 (GA4 기본 scroll 90%만으론 부족)
- **트리거**: 동시 만족 시 1회 — `scroll 75% 이상` AND `dwell time ≥ 60s` AND `tab visible`
- **파라미터**:
  - `slug` (string)
  - `read_time_sec` (int)
  - `scroll_depth_pct` (int, 보통 75/100)
- **층**: 보조
- **분석**:
  - 완독률 = `article_read_complete` / `article_view` (slug 단위)
  - 완독률 < 20% → 도입부/길이 재검토
  - 완독률 > 60% + view 적음 → 유입 부족 (SEO/내부링크 강화)
- **주의**: 백그라운드 탭에서 자동 발사 안 되도록 **visibilityState=visible** 조건 필수.

#### `related_article_click`
- **목적**: 관련 콘텐츠 추천([커밋 0c25e04](#)) 효과 측정
- **트리거**: 아티클 하단 추천 카드 클릭 시
- **파라미터**:
  - `from_slug` (string)
  - `to_slug` (string)
  - `position` (int, 1~N) — 추천 카드 순서
  - `recommendation_type` (string enum) — `manual` / `auto-crosslink`
- **층**: 보조
- **분석**:
  - CTR by position — position 1 vs 4 차이 < 2배면 추천 알고리즘 약함
  - `manual` vs `auto-crosslink` CTR 비교 — 자동이 수동보다 낮으면 알고리즘 튜닝 필요
  - 추천 클릭 후 `article_read_complete` 도달율 = **추천 품질**

#### `share_click`
- **목적**: Web Share([커밋 ba15a41](#)) 전환율
- **트리거**: 공유 버튼 클릭 시 (실제 공유 완료 여부 무관)
- **파라미터**:
  - `slug` (string)
  - `method` (string enum) — `web-share` / `copy-link`
  - `location` (string enum) — `article-bottom` / `header`
- **층**: 보조
- **분석**: 공유율 0.5% 미만이면 버튼 시각/위치 문제일 가능성. 콘텐츠 품질 문제는 보통 **재방문**에서 먼저 보임.

> 📌 **`video_progress` 미사용** — 영상은 [VideoCard.tsx:17-18](../../src/components/videos/VideoCard.tsx#L17-L18)에서 youtube.com으로 `target="_blank"` 외부 이동. 자체 임베드/iframe API 없음 → 시청 진행률은 우리 도메인에서 측정 불가능. 클릭 행동만 §3.E `external_link_click(context=video)` 으로 흡수해 한 곳에서 관리. 시청률 분석은 YouTube Studio 별도.

---

### 3.D 개인화 트래커

#### `weight_log` ⭐ sticky 행동
- **목적**: 체중 기록은 가장 sticky한 재방문 트리거
- **트리거**: 체중 입력 저장 시
- **파라미터**:
  - `week` (int)
  - `delta_from_last` (float, kg) — 직전 기록과의 차이
  - `is_first_log` (bool)
- **층**: 보조 (북극성 직결)
- **분석**: 주간 `weight_log` 발생 사용자 = 가장 충성도 높은 코호트. W+4 리텐션이 비기록자 대비 2~3배 예상.
- **주의**: `delta_from_last`는 **±15kg 클램핑** (비정상 입력 노이즈 차단).

#### `timeline_view`
- **목적**: 주차별 마일스톤 콘텐츠 소비 패턴
- **트리거**: 타임라인 페이지 진입
- **파라미터**:
  - `week` (int)
  - `milestone_clicked` (string, optional) — 클릭한 마일스톤 ID
- **층**: 보조

#### `pregnancy_week_set` ⭐ 핵심 등록 이벤트
- **목적**: 출산예정일 등록/수정 — **GA4에서 `conversion`으로 마킹**
- **트리거**: 출산예정일 입력/수정 저장 시
- **파라미터**:
  - `week` (int) — 계산된 현재 주차
  - `source` (string enum) — `onboarding` / `manual_update` / `correction`
- **층**: 보조 (북극성 코호트의 출발점)
- **분석**: 첫 방문 → `pregnancy_week_set` 도달율이 **온보딩 전환율**. 60% 미만이면 온보딩 마찰점 진단.
- **주의**: GA4 admin에서 **이 이벤트를 conversion(주요 이벤트)으로 표시**.

---

### 3.E 신호 (Signals) — 다음 기능 결정용

#### `search_submit` ⭐ 콘텐츠 백로그 직결
- **목적**: 0-결과 검색이 **다음 콘텐츠 백로그**
- **트리거**: 검색 제출 시 (results render 후)
- **파라미터**:
  - `query` (string) — **lowercase + trim + 100자 제한** (PII 위험 완화)
  - `results_count` (int)
- **층**: 진단
- **분석**:
  - `WHERE results_count = 0` 쿼리 TOP 50 → 주간 리포트 §3 자동 노출 → 콘텐츠 우선순위
  - `query` 길이 평균 > 20자 → 검색이 아니라 **질문**으로 쓰임 → FAQ 또는 챗 기능 수요
- **주의**: query 그대로 raw 저장 시 PII 가능. **항상 정규화 후 발사**.

#### `cta_click`
- **목적**: 어떤 자리·문구의 CTA가 먹히나
- **트리거**: 명시적으로 CTA로 분류된 버튼/링크 클릭 시
- **파라미터**:
  - `cta_id` (string) — 의미적 ID (예: `start_checklist`, `try_weight_tracker`)
  - `location` (string enum) — `home_hero` / `article_bottom` / `floating` / `nav`
  - `destination` (string) — 목적지 path
- **층**: 진단
- **분석**: location × cta_id 매트릭스로 CTR 비교. 같은 카피가 위치 따라 5배 차이 나는 경우 흔함.

#### `external_link_click` ⭐ 자체화 후보 식별 + YouTube 클릭 추적
- **목적**: 정부24·병원 사이트로 새는 양 = 자체 페이지화 후보. **YouTube 영상 클릭도 이 이벤트로 통합 추적**.
- **트리거**: 외부 도메인 링크 클릭 시 (`<a target="_blank">` 또는 `rel*=external`)
- **파라미터**:
  - `domain` (string) — 호스트만 (path 제외)
  - `context` (string enum) — `article` / `checklist` / `policy_guide` / **`video`**
  - `from_slug` (string, optional) — 진입 출처 페이지 slug
  - `video_id` (string, optional) — `context=video`일 때만. YouTube ID
  - `channel_id` (string, optional) — `context=video`일 때만. 채널 식별자
- **층**: 진단
- **분석**:
  - 도메인별 클릭 수 TOP 10 → 자체 콘텐츠 흡수 후보. 정부 사이트 비중 높으면 정책 가이드 강화.
  - `context=video` 슬라이스: 어떤 채널/영상이 가장 클릭되나. 채널 디렉토리 큐레이션(Phase 5) 우선순위.
  - 시청률(완시청·평균 시청시간)은 GA4 데이터로 답할 수 없음 → **YouTube Studio에서 별도 확인** 후 주간 리포트에 수기 종합.

#### `scroll_without_action`
- **목적**: 머물지만 클릭 안 하는 페이지 진단
- **트리거**: scroll 50% 이상 + dwell ≥ 30s + 같은 페이지 내 클릭 0
- **파라미터**:
  - `page_type` (string enum) — `article` / `checklist` / `home` / `timeline`
  - `dwell_sec` (int)
- **층**: 진단
- **분석**: page_type별 scroll_without_action 비율 — 30% 초과 시 CTA 누락 또는 디자인 문제.

#### `feature_request_signal`
- **목적**: 아직 없는 기능에 대한 수요 식별
- **트리거**: 정해진 신호 (예: 빈 댓글창 클릭, 비활성 메뉴 클릭, 미존재 카테고리 진입 시도)
- **파라미터**:
  - `trigger` (string enum) — `comment_attempt` / `disabled_menu_click` / `missing_category`
  - `context` (string)
- **층**: 진단

#### `error_view` / `empty_state_view`
- **목적**: 마찰점 식별
- **트리거**: 에러/빈상태 컴포넌트 마운트 시
- **파라미터**:
  - `page` (string)
  - `reason` (string enum) — `network` / `validation` / `not_found` / `permission` / `expected_empty`
- **층**: 진단
- **분석**: `reason=expected_empty`(예: 첫 방문이라 데이터 없음)은 정상. 그 외 비율이 1% 초과면 사고 신호.

---

## 4. 이벤트 간 상관관계

지표를 단독으로 읽지 않는다. **묶어서** 보면 가설이 또렷해진다.

### 4.1 강한 양의 상관 (같이 움직여야 정상)

| 이벤트 A | 이벤트 B | 정상 패턴 | 어긋날 때 의미 |
|---|---|---|---|
| `article_view` | `article_read_complete` | 비율 25~45% | <20%: 도입부/길이 문제. >60%: SEO 부족 |
| `pregnancy_week_set` | `checklist_view` | 등록 후 7일 내 80%+ | 낮으면 온보딩→체크리스트 동선 마찰 |
| `weight_log` (주간) | W+4 리텐션 | 기록자가 비기록자의 2~3배 | 차이 작으면 트래커 기능 가치 재검토 |
| `related_article_click` | `article_read_complete`(to_slug) | 30%+ | 낮으면 추천 정확도 문제 |
| `checklist_item_toggle` | `session_start`(주간) | 토글 사용자 = WAU의 50%+ | 낮으면 단순 방문만 늘고 가치 행동 정체 |

### 4.2 강한 음의 상관 (한쪽 늘면 다른쪽 줄어야)

| 이벤트 A | 이벤트 B | 정상 | 어긋날 때 |
|---|---|---|---|
| `search_submit`(results_count=0) | `article_view` | 콘텐츠 충실해질수록 0-결과 비율↓ | 0-결과 비율 정체 = 콘텐츠 추가가 수요 못 따라감 |
| `external_link_click` | `article_view`(같은 토픽) | 자체 글 늘면 외부 클릭↓ | 자체 글 늘려도 외부 유출 유지 = 신뢰/접근성 문제 |
| `error_view` | `session_start` | 트래픽 증가해도 에러 비율 일정 | 에러율 급증 = 인프라/배포 사고 |

### 4.3 코호트 단위 상관

`cohort_join_week` × 행동 매트릭스로 봐야 의미 있는 상관:

- **초기 등록자(8~16주)**: `nutrition` 토픽 article 비중↑, `weight_log` 주기적
- **중기 등록자(20~28주)**: `checklist_view`(hospital-bag) 비중↑
- **후기 등록자(30주+)**: 즉시 체크리스트로 직행, 아티클 비중↓ — 이 코호트는 **속도가 가치**, 검색·필터 기능 우선순위↑

### 4.4 한 이벤트 빠질 때 같이 의심할 것

| 빠진 이벤트 | 같이 확인 | 가능 원인 |
|---|---|---|
| `pregnancy_week_set` | consent 동의율 | consent 거부 시 모든 이벤트 미발사 |
| `article_read_complete` | `article_view`, scroll 자동 이벤트 | scroll 트래커 코드 회귀 |
| 모든 이벤트 일제히 | GA4 로딩, ConsentGatedScripts | tagId 환경변수, 동의 모달 버그 |

---

## 5. 분석 방법론

### 5.1 단주 노이즈 vs 추세

**모든 지표를 4주 이동평균으로** 본다. 직전주 ±5%는 노이즈, 4주 추세가 ±10%이면 의미 있는 변화.

| 변동 폭 (4주 추세) | 해석 |
|---|---|
| ±5% | 노이즈, 액션 보류 |
| ±10% | 가설 수립 단계, 원인 후보 3개 |
| ±20% | 액션 실행 단계, A/B 또는 직접 수정 |
| ±30%+ | 사고 또는 마일스톤 — 즉시 진단 |

### 5.2 코호트 분석 우선순위

대시보드 첫 화면이 항상 **`cohort_join_week` × 주간 리텐션** 매트릭스. 다른 모든 지표는 이 매트릭스 슬라이스로 본다.

```
              W+1   W+2   W+3   W+4
join_week=18  85%   62%   48%   42%
join_week=20  82%   60%   45%   38%
join_week=24  78%   55%   40%   33%
...
```

위에서 아래로 갈수록 리텐션이 떨어지는 게 정상(임신 후기일수록 짧은 사용기간). **가로 방향**(W+N)이 평탄해지면 sticky 기능이 작동, 가파르면 일회성 사용.

### 5.3 funnel 정의 (고정)

매주 같은 funnel을 본다. 정의 바뀌면 전주 비교 무의미.

**온보딩 funnel**:
1. `first_visit`
2. `pregnancy_week_set` (목표 60%)
3. `checklist_view` 또는 `article_view` (목표 80%)
4. `checklist_item_toggle` 또는 `article_read_complete` (목표 50%)
5. 다음주 `session_start` (W+1 리텐션, 목표 70%)

**콘텐츠 funnel**:
1. `article_view`
2. `article_read_complete` (목표 30%)
3. `related_article_click` 또는 `share_click` (목표 15%)
4. 다른 article view (목표 50%) — 깊이

### 5.4 0-결과 검색 → 콘텐츠 백로그 자동화

매주 자동 리포트(§1.9 Pattern C)에서 `search_submit WHERE results_count=0` TOP 50을 추출한다. 이 리스트가 곧 콘텐츠 작성 우선순위. **임의로 우선순위를 흔들지 말 것** — 데이터가 정한다.

### 5.5 외부 유출 분석 → 자체화 의사결정

월 1회 `external_link_click.domain` TOP 10 검토. 정부 도메인이 상위 3 안에 있으면 해당 정책의 자체 가이드 콘텐츠 작성. 의료기관 도메인이 상위면 병원 비교 기능 수요.

### 5.6 "기능 추가" 판단 기준

다음 중 **2개 이상** 충족 시에만 신규 기능 추가:
1. 직접적 신호 — `feature_request_signal`, `empty_state_view(reason=missing)`, 0-결과 검색 클러스터
2. 마찰 신호 — `scroll_without_action` 30%+, error_view 비율 1%+
3. 외부 유출 — 같은 도메인 `external_link_click` 월 100회+
4. 코호트 격차 — 특정 코호트의 W+4 리텐션이 평균 50% 미만

단일 신호로는 추가 보류. 노이즈일 가능성 높음.

---

## 6. Enum 정의 (확장 시 이 섹션부터 갱신)

### 6.1 `category` (체크리스트)
- `hospital-bag` — 출산 가방
- `husband` — 남편 준비
- `pregnancy-prep` — 임신 준비
- (추가 시 [src/components/checklist/](../../src/components/checklist/) 데이터 모델과 동기)

### 6.2 `topic` (아티클)
- `nutrition` — 영양/식단
- `exercise` — 운동
- `medical` — 의학/검진
- `product` — 제품 리뷰
- `policy` — 정부 지원/정책
- `lifestyle` — 생활/심리
- (추가 시 [src/content/](../../src/content/) frontmatter `topic` 필드와 동기)

### 6.3 `format` (`article_view`)
- `article` / `guide`
- (영상은 detail 페이지 없음 → `article_view` 미발사. `external_link_click(context=video)`로만 추적)

### 6.4 `source` (`pregnancy_week_set`)
- `onboarding` / `manual_update` / `correction`

### 6.5 `method` (`share_click`)
- `web-share` (Web Share API) / `copy-link`

### 6.6 `cta_id` 명명 규칙
- `verb_object` 형식 (snake_case): `start_checklist`, `try_weight_tracker`, `view_article`
- 동사 → `start` / `try` / `view` / `add` / `share` / `save` 우선

---

## 7. 변경 정책

GA4는 한번 쌓이면 이름 변경 시 **과거 데이터와 단절**된다. 그래서 락인 비용을 명시한 변경 룰:

| 변경 종류 | 절차 | 영향 |
|---|---|---|
| **신규 이벤트 추가** | 본 문서 등재 → PR(코드+측정 계획 1줄) → DebugView 검증 | 없음 (안전) |
| **기존 이벤트 파라미터 추가** | 본 문서에 optional 명시 → 코드 추가 | 과거 데이터: 해당 파라미터 null. 보고서 필터 시 주의. |
| **기존 이벤트 파라미터 삭제** | **금지**. 새 이벤트로 대체. | — |
| **기존 이벤트 이름 변경** | **금지에 가까움**. 정말 필요하면 신/구 병행 발사 4주 → 신만 유지 | 과거 데이터 사실상 단절 |
| **enum 값 추가** | §6 갱신 → 코드. 라벨 변경 시 주의 | 안전 |
| **enum 값 삭제** | 4주 grace period 후 제거 | 과거 데이터의 해당 값은 그대로 보존됨 |

---

## 8. 도입 단계 (현황 추적)

[phase-4.5/plan.md §1.8](../phase-4.5/plan.md) 작업 묶음과 동기. 발사 시작 시 체크.

- [ ] **G** — User properties 3종 + `pregnancy_week_set`
- [ ] **H** — `checklist_item_toggle`, `article_read_complete`, `weight_log`, `search_submit`
- [ ] **I** — `related_article_click`, `share_click`, `cta_click`
- [ ] **J** — `scroll_without_action`, `external_link_click`, `empty_state_view`, `feature_request_signal`
- [ ] **L** — 자동 주간 리포트 스크립트
- [ ] **M** — launchd 등록 + 안정화

---

## 9. 변경 이력

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-03 | 최초 작성 | 이벤트 카탈로그·상관관계·분석 방법론 초기 정의 |
