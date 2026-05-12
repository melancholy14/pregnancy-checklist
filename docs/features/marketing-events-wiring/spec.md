# marketing-events-wiring 기획서

> 작성일: 2026-05-10  size: L  phase_mode: all
> 관련 리뷰: [review.md](./review.md)  관련 측정: [ga4.md](./ga4.md)
> 대상 phase: [phase-4.5.md §1.8](../../plan/phase-4.5.md) 마케팅 묶음 G·H·I·J
> 카탈로그 SoT: [docs/marketing/ga4.md](../../marketing/ga4.md)

## review.md 결정사항 참조

본 spec은 [review.md §5](./review.md#5-결정) 결정 6건을 따른다. 어긋나는 항목 발견 시 작성 중단 + review.md 먼저 갱신.

- **결정 1 (옵션 A)**: 카탈로그 이름 정렬 4건은 **신/구 병행 4주 grace** — 새 이름 발사 코드 추가, 구 이름 발사 4주 유지, 별도 cleanup 라운드(2026-06-07 이후)에서 구 이름 제거.
- **결정 2 (옵션 A)**: scroll progress hook은 **공용 `useScrollSignals` hook** — 한 곳에서 `article_read_complete`(article만)·`scroll_without_action`(page_type 4종) 둘 다 발사.
- **결정 3 (옵션 C)**: `article_read_complete` 임계치는 **카탈로그 §3.C 그대로** (scroll 75% + dwell 60s + visibility). `scroll_without_action` 트리거에 **"AND `article_read_complete` 미발사"** 추가 — 동시 발사 시 후자 억제.
- **결정 4 (옵션 A)**: `due_date_set` 이벤트 발사는 **본 라운드 추가하지 않음 + 4주 cleanup 라운드에서 제거**. user_property는 PageviewTracker에서 set 유지.
- **결정 5 (옵션 A)**: 카탈로그 외 운영 이벤트 7그룹은 **본 라운드 ga4.md §3 신규 등재**. 코드 변경 없이 카탈로그만 정합화.
- **결정 6 (옵션 A)**: `external_link_click` rel 처리는 **묶음 O로 분리**. 본 라운드는 wiring(이름 정렬 + `domain`/`context` 파라미터)만.

## 0. 카탈로그 정렬 표 (현재 코드 ↔ ga4.md 카탈로그 ↔ 액션)

> grep 기준일: 2026-05-10. `sendGAEvent` 호출부 16곳, `setUserProperties` 1곳.
> 액션 분류: **rename(병행)** = 결정 1 신/구 병행 / **align** = 파라미터·enum 정정 / **add** = 신규 발사 추가 / **catalog** = 코드 변경 0, ga4.md만 갱신 / **remove(4주 후)** = cleanup 라운드 / **keep** = 정합 / **defer** = 묶음 O 분리.

| # | 코드 이벤트 | 발사 위치 | 카탈로그 매핑 | 드리프트 | 액션 (본 라운드) | 묶음 |
|---|---|---|---|---|---|---|
| 1 | `setUserProperties({due_date_set, current_pregnancy_week, cohort_join_week})` | [PageviewTracker.tsx:16](../../../src/components/analytics/PageviewTracker.tsx#L16) | §2 user_properties | ✅ 정합 | keep | G |
| 2 | `pregnancy_week_set` | [DueDateInput.tsx:49](../../../src/components/home/DueDateInput.tsx#L49), [DueDateStep.tsx:35](../../../src/components/onboarding/DueDateStep.tsx#L35) | §3.D `pregnancy_week_set` | ✅ 정합 | keep | G |
| 3 | `due_date_set` (이벤트) | [DueDateInput.tsx:48](../../../src/components/home/DueDateInput.tsx#L48), [DueDateStep.tsx:34](../../../src/components/onboarding/DueDateStep.tsx#L34) | user_property와 동명 | ⚠️ 중복 (결정 4) | remove(4주 후 cleanup) — 본 라운드 추가 작업 0 | G |
| 4 | `checklist_check` (parameters: note_type, week, slug, item_id 추정) | [ChecklistPage.tsx:177](../../../src/components/checklist/ChecklistPage.tsx#L177), [WeekChecklistSection.tsx:71](../../../src/components/timeline/WeekChecklistSection.tsx#L71) | §3.B `checklist_item_toggle` | ⚠️ 이름 불일치 | rename(병행): 새 이름 `checklist_item_toggle` 발사 추가 + `checklist_check` 4주 유지 | H |
| 5 | `article_read_complete` | (미발사) | §3.C `article_read_complete` | ⚠️ 미구현 | add: `useScrollSignals` hook + ArticleContent 마운트 (결정 2·3) | H |
| 6 | `weight_log` (no params) | [WeightForm.tsx:29](../../../src/components/weight/WeightForm.tsx#L29) | §3.D `weight_log` (week, delta_from_last, is_first_log) | ⚠️ 파라미터 누락 | align: `week`/`delta_from_last`/`is_first_log` 파라미터 추가 발사 | H |
| 7 | `search_submit` | (미발사) | §3.E `search_submit` (query, results_count) | ⚠️ 미구현 | add: 검색 위치 파악 후 wiring (구현 라운드에서 결정) | H |
| 8 | `related_article_click` | (미발사 — 추천 자리에 `content_click(type=article)` 사용 중) | §3.C `related_article_click` (from_slug, to_slug, position, recommendation_type) | ⚠️ 의미 분리 필요 | rename(병행) + add: ArticleCard 사용 위치 중 RelatedArticles 자리만 새 이벤트 발사 + `content_click` 4주 유지 | I |
| 9 | `share` (parameters: method, content_type, item_id) | [share.ts:37](../../../src/lib/share.ts#L37), [share.ts:60](../../../src/lib/share.ts#L60) | §3.C `share_click` (slug, method, location). enum: `web_share_api`/`clipboard` 코드 vs `web-share`/`copy-link` 카탈로그 | ⚠️ 이름 + enum + 파라미터 불일치 | rename(병행) + align: 새 이름 `share_click` 발사 추가 (`slug`/`method=web-share\|copy-link`/`location`) + `share` 4주 유지 | I |
| 10 | `cta_click` | (미발사) | §3.E `cta_click` (cta_id, location, destination) | ⚠️ 미구현 | add: 명시 CTA 자리 식별 후 wiring + ArticleCard 일반 자리(추천 외) 흡수 | I |
| 11 | `outbound_click` (parameters: url, event_name) | [BabyfairCard.tsx:51](../../../src/components/babyfair/BabyfairCard.tsx#L51) | §3.E `external_link_click` (domain, context, from_slug, video_id, channel_id) | ⚠️ 이름 + 파라미터 불일치 | rename(병행) + align: 새 이름 `external_link_click(domain, context=babyfair)` 발사 추가 + `outbound_click` 4주 유지. `rel` 처리는 결정 6에 따라 defer (묶음 O) | J |
| 12 | `content_click` (type=video) | [VideoCard.tsx:21](../../../src/components/videos/VideoCard.tsx#L21), [VideoCardCompact.tsx:23](../../../src/components/videos/VideoCardCompact.tsx#L23) | §3.E `external_link_click(context=video, video_id, channel_id)` | ⚠️ 의미 흡수 (catalog §3.C 📌 노트) | rename(병행) + align: 새 이벤트 `external_link_click(context=video, video_id, channel_id, domain="youtube.com")` 발사 추가 + `content_click(type=video)` 4주 유지 | J |
| 13 | `content_click` (type=channel) | [ChannelCard.tsx:27](../../../src/components/videos/ChannelCard.tsx#L27) | §3.E `external_link_click(context=channel, channel_id, domain)` | ⚠️ 의미 흡수 | rename(병행) + align: 새 이벤트 발사 추가 + 구 4주 유지 | J |
| 14 | `scroll_without_action` | (미발사) | §3.E `scroll_without_action` (page_type, dwell_sec) | ⚠️ 미구현 | add: `useScrollSignals` hook (결정 2). 트리거 조건에 "AND `article_read_complete` 미발사" 추가 (결정 3) | J |
| 15 | `empty_state_view` | (미발사 — p9-empty-state 컴포넌트 마운트 hook은 박힘) | §3.E `empty_state_view` (page, reason) | ⚠️ 발사만 추가 | add: 기존 마운트 hook에 `sendGAEvent` 한 줄 추가. 컴포넌트 재구현 금지 | J |
| 16 | `feature_request_signal` | (미발사) | §3.E `feature_request_signal` (trigger, context) | ⚠️ 미구현 | add: 신호 포인트 식별 후 wiring (구현 라운드 결정). 본 spec은 후보 위치만 §3.J에 명시 | J |
| 17 | `checklist_filter` | [ChecklistPage.tsx:221](../../../src/components/checklist/ChecklistPage.tsx#L221) | §3.B `checklist_filter` | ✅ 정합 | keep | (사후) |
| 18 | `recommended_item_view`/`recommended_item_check` | [TimelineContainer.tsx:71](../../../src/components/timeline/TimelineContainer.tsx#L71), [WeekChecklistSection.tsx:83](../../../src/components/timeline/WeekChecklistSection.tsx#L83), [ChecklistPage.tsx:112](../../../src/components/checklist/ChecklistPage.tsx#L112), [ChecklistPage.tsx:190](../../../src/components/checklist/ChecklistPage.tsx#L190) | (카탈로그 외) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.B 신규 등재 | (사후) |
| 19 | `upcoming_item_view`/`upcoming_item_check` | [ChecklistItemRow.tsx:64](../../../src/components/checklist/ChecklistItemRow.tsx#L64), [ChecklistPage.tsx:203](../../../src/components/checklist/ChecklistPage.tsx#L203) | (카탈로그 외) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.B 신규 등재 | (사후) |
| 20 | `custom_item_add` | [ChecklistAddForm.tsx:47](../../../src/components/checklist/ChecklistAddForm.tsx#L47), [UnifiedAddForm.tsx:70](../../../src/components/timeline/UnifiedAddForm.tsx#L70), [UnifiedAddForm.tsx:95](../../../src/components/timeline/UnifiedAddForm.tsx#L95) | (카탈로그 외) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.B 신규 등재 | (사후) |
| 21 | `category_tab_switch` | [CategoryFilter.tsx:21](../../../src/components/timeline/CategoryFilter.tsx#L21) | (카탈로그 외, `checklist_filter`와 의미 유사) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.B 신규 등재. `checklist_filter`와 별개 이벤트로 명시 (대상 컨테이너 다름) | (사후) |
| 22 | `timeline_scroll_depth` | [TimelineContainer.tsx:180](../../../src/components/timeline/TimelineContainer.tsx#L180) | (카탈로그 외) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.D 신규 등재 | (사후) |
| 23 | `timeline_week_view` | [TimelineAccordionCard.tsx:82](../../../src/components/timeline/TimelineAccordionCard.tsx#L82) | (카탈로그 §3.D `timeline_view`와 부분 중복) | ⚠️ 이름 정합 검토 | catalog (결정 5): ga4.md §3.D 등재 + `timeline_view` SoT와 관계 명시. **이름 변경은 본 라운드 작업 아님** (catalog 등재만) | (사후) |
| 24 | `onboarding_complete`, `onboarding_due_date_set`, `onboarding_due_date_skip` | [OnboardingFlow.tsx:24](../../../src/components/onboarding/OnboardingFlow.tsx#L24), [DueDateStep.tsx:33,42](../../../src/components/onboarding/DueDateStep.tsx) | (카탈로그 외, `pregnancy_week_set` funnel 보조) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.D 신규 등재. funnel 단계 명시 (§5.3 온보딩 funnel과 정합) | (사후) |
| 25 | `onboarding_banner_view`/`onboarding_banner_click`/`onboarding_banner_dismiss` | [OnboardingBannerProvider.tsx:97,106,113](../../../src/components/providers/OnboardingBannerProvider.tsx) | (카탈로그 외) | ⚠️ 미등재 | catalog (결정 5): ga4.md §3.E 신규 등재 (진단 신호) | (사후) |
| 26 | `page_view` | [PageviewTracker.tsx:22](../../../src/components/analytics/PageviewTracker.tsx#L22) | §3.A 자동 | ✅ 정합 | keep | (자동) |

## 1. 배경·목적

- **운영자 관점**: phase-4.5에서 마케팅 측정 모델(3층 지표 트리·코호트 리텐션)을 정립했고 G 묶음 부분 wiring(user_properties + `pregnancy_week_set` + `weight_log`·`recommended_*`·`checklist_filter` 등)이 이미 머지됨. 그러나 **카탈로그 ↔ 코드 드리프트 4건 + 미발사 7개 + 미등재 운영 이벤트 7그룹**으로 이대로 phase-4.6(자동 주간 리포트 L·M)에 진입하면 GA4 Data API 쿼리가 깨진 데이터를 끌어옴.
- **사용자 관점**: 본 라운드는 사용자 가시 변경 0. 측정 인프라 정합성만 끌어올리는 라운드.
- **측정 관점**: 이번 wiring으로 **카탈로그 §3 전체가 코드와 정합**(외 운영 이벤트는 §3 등재 + 4건은 4주 병행 후 cleanup) → 4주 후 phase-4.6 D1(GA4 Data API service account) 발급과 함께 자동 주간 리포트 진입 가능.

## 2. 사용자 시나리오

본 라운드는 측정 wiring이라 사용자 시나리오는 **분석가(=운영자) 관점**으로 정의.

- **시나리오 1 — 코호트 리텐션 슬라이싱**: 운영자가 GA4 cohort exploration에서 `cohort_join_week` 기준 W+1·W+4 리텐션을 본다 → 모든 이벤트가 user_properties 3종으로 슬라이싱 가능. (G keep)
- **시나리오 2 — 콘텐츠 가치 판정**: 운영자가 아티클 slug별 `article_view` ↔ `article_read_complete` 비율을 본다 → 새로 wired된 `article_read_complete`(scroll 75% + dwell 60s + visibility) 발사로 완독률 측정. (H add)
- **시나리오 3 — 다음 콘텐츠 백로그 추출**: 운영자가 `search_submit WHERE results_count=0` TOP 50을 본다 → 검색 위치 wiring 후 자동 리포트 §3 자동 노출. (H add)
- **시나리오 4 — 핵심 행동 토글 분석**: 운영자가 `checklist_item_toggle.action=check/uncheck` 비율 + `is_custom=true` 비중을 본다 → 새 이름 발사 + 4주 후 구 이름 cleanup. (H rename)
- **시나리오 5 — 추천 카드 효과 측정**: 운영자가 `related_article_click.position` × CTR + 클릭 후 `article_read_complete` 비율을 본다 → ArticleCard 중 RelatedArticles 자리만 새 이벤트 발사. (I rename + add)
- **시나리오 6 — 자체화 후보 식별**: 운영자가 `external_link_click.domain` TOP 10 + `context=video` 슬라이스(채널·영상)를 본다 → BabyfairCard·VideoCard·VideoCardCompact·ChannelCard에 새 이벤트 발사. (J rename + align)
- **시나리오 7 — 마찰점 진단**: 운영자가 `scroll_without_action.page_type` 4종(article/checklist/home/timeline)별 발사율을 본다 → `useScrollSignals` 공용 hook 4종 page wrapper 마운트. `article_read_complete` 발사된 페이지뷰는 발사 억제. (J add)
- **시나리오 8 — 빈 상태·기능 수요 신호**: 운영자가 `empty_state_view.reason` × `feature_request_signal.trigger`를 본다 → 기존 마운트 hook에 발사 한 줄 추가. (J add)

## 3. 기능 요구사항

### 3.G 묶음 G — User properties 3종 + 핵심 등록 이벤트

#### must (G)

- (이미 wired) PageviewTracker.tsx에서 `setUserProperties({due_date_set, current_pregnancy_week, cohort_join_week})` 매 방문 호출 — 본 라운드 변경 0.
- (이미 wired) `pregnancy_week_set` 발사 (DueDateInput·DueDateStep) — 본 라운드 변경 0. 단 spec 작성 시 `source` enum 점검 (DueDateInput에서 `source` 파라미터 누락된 경우 `source: "manual_update"` 추가).
- ga4.md §8 G 항목 [x] 체크 (본 라운드 종료 시 patch 제시).

#### should (G)

- ga4.md §2 user_properties 표에 `is_first_pregnancy`/`notification_opt_in` 미구현 상태 명시 (Phase 5 대기). 본 라운드 코드 변경 0.

#### won't (G)

- `due_date_set` 이벤트 발사 (결정 4, 본 라운드 추가 작업 0 + 4주 후 cleanup 라운드에서 두 줄 제거).
- GA4 admin 작업 (custom dimension 등록·conversion 마킹)은 운영자 작업 — spec 범위 밖.
- D1(GA4 Data API service account) 발급 — phase-4.6 선결조건, 사용자 명시 동결.

#### G 카탈로그 정렬 (현재 코드 ↔ 카탈로그 ↔ 액션)

| # | 항목 | 코드 현황 | 카탈로그 | 액션 |
|---|---|---|---|---|
| G1 | user_properties 3종 | PageviewTracker:16~20 wired | §2 정의 일치 | keep |
| G2 | `pregnancy_week_set` | DueDateInput:49, DueDateStep:35 wired | §3.D 정의 일치 | keep + DueDateInput의 `source` 파라미터 점검 |
| G3 | `due_date_set` (이벤트) | DueDateInput:48, DueDateStep:34 발사 중 | user_property와 동명 | won't (4주 후 cleanup) |

#### G 영향 파일

- 코드 변경 없음 (검증·source 파라미터 점검 outside this round).
- 본체 갱신: ga4.md §8 G 체크 + §9 변경 이력.

### 3.H 묶음 H — 핵심 4개 이벤트

#### must (H)

- **H1 `checklist_item_toggle`** (rename 병행 4주):
  - 새 이벤트 `checklist_item_toggle` 발사 추가 — 파라미터: `item_id`(string), `action`(enum: `check`/`uncheck`), `week`(int), `category`(enum §6.1), `is_custom`(bool).
  - 발사 위치: ChecklistPage.tsx:177, WeekChecklistSection.tsx:71 — 기존 `checklist_check` 발사 한 줄 옆에 `sendGAEvent("checklist_item_toggle", {...})` 추가.
  - 200ms 디바운스 (catalog §3.B 주의사항).
  - 구 `checklist_check` 발사 4주 유지 → 2026-06-07 이후 cleanup 라운드에서 제거.
- **H2 `article_read_complete`** (add):
  - 신규 hook `useScrollSignals(page_type)` 도입 (결정 2). 본 hook은 `article_read_complete`(article만)·`scroll_without_action`(4종) 둘 다 담당.
  - 트리거: scroll 75% AND dwell ≥ 60s AND `document.visibilityState === "visible"` (catalog §3.C, 결정 3 — 임계치 그대로).
  - 파라미터: `slug`(string), `read_time_sec`(int), `scroll_depth_pct`(int).
  - 마운트 위치: ArticleContent 컴포넌트 — `/articles/[slug]/page.tsx`가 렌더하는 본문 컨테이너.
  - 한 페이지뷰당 1회만 발사 (재진입 = 새 페이지뷰).
- **H3 `weight_log`** (align):
  - 발사 위치: WeightForm.tsx:29 그대로. 파라미터 추가 — `week`(int, store에서 파생), `delta_from_last`(float, ±15kg 클램핑), `is_first_log`(bool, store에서 파생).
- **H4 `search_submit`** (add):
  - 발사 위치는 본 spec에서 결정하지 않음 — 검색 컴포넌트 식별 + wiring은 구현 라운드에서. **spec.md §6 영향 파일 목록에 후보 위치만 명시**.
  - 파라미터: `query`(string, **lowercase + trim + 100자 제한** — catalog §3.E 주의사항), `results_count`(int).
  - PII 보호 룰 (마케터 §3.1·디자이너 N3): `query`는 raw 저장 금지. 정규화 후 발사.

#### should (H)

- `checklist_item_toggle` 발사 시 catalog §3.B 분석 의도(`uncheck/check` 비율 0.2 초과 시 UX 문제 신호)에 맞춰 `action` enum 정확히 발사.
- `article_read_complete`의 `scroll_depth_pct`는 75% 임계치 도달 시점의 실제 스크롤 비율 기록 (75 또는 100). 카탈로그 §3.C 보통 75/100.

#### won't (H)

- `checklist_week_complete`(catalog §3.B) — 본 라운드 범위 밖 (별도 라운드 또는 phase-4.6).
- `checklist_view`(catalog §3.B) — 본 라운드 범위 밖. 단 `recommended_item_view` 등이 부분 대체 (결정 5에서 §3.B 등재).
- 한국어 모바일 임산부 dwell time 임계치 조정 — 4주 실측 후 별도 라운드 (review.md §4 항목 3 결정 C 부수 조건).
- `search_submit` 검색 컴포넌트 자체 wiring — 구현 라운드 작업 (spec은 후보만 명시).

#### H 카탈로그 정렬 (현재 코드 ↔ 카탈로그 ↔ 액션)

| # | 카탈로그 이벤트 | 코드 현황 | 액션 |
|---|---|---|---|
| H1 | `checklist_item_toggle` | `checklist_check` 발사 중 | rename(병행) |
| H2 | `article_read_complete` | 미구현 | add (`useScrollSignals` hook + ArticleContent 마운트) |
| H3 | `weight_log` | WeightForm.tsx:29 발사 (파라미터 0) | align (week/delta_from_last/is_first_log 추가) |
| H4 | `search_submit` | 미구현 | add (구현 라운드, 후보 위치 §6에 명시) |

#### H 영향 파일

**수정**:
- `src/components/checklist/ChecklistPage.tsx:177` — `checklist_item_toggle` 발사 한 줄 추가 (구 `checklist_check` 옆).
- `src/components/timeline/WeekChecklistSection.tsx:71` — 동일.
- `src/components/weight/WeightForm.tsx:29` — `week`/`delta_from_last`/`is_first_log` 파라미터 추가.
- `src/components/articles/ArticleContent.tsx` (또는 `/articles/[slug]/page.tsx`의 본문 컨테이너) — `useScrollSignals("article", { slug })` 마운트.

**신규**:
- `src/lib/use-scroll-signals.ts` (또는 `src/hooks/useScrollSignals.ts`) — page_type 파라미터로 분기, `article_read_complete`·`scroll_without_action` 둘 다 담당.

**검색 위치 후보 (search_submit wiring 결정 라운드)**: `src/components/search/`, `src/app/search/page.tsx` 또는 헤더 검색바 — **현재 검색 UI 미존재 가능성** (구현 라운드에서 식별).

### 3.I 묶음 I — 콘텐츠 보조 이벤트

#### must (I)

- **I1 `related_article_click`** (rename 병행 + add):
  - 새 이벤트 발사 추가 — 파라미터: `from_slug`(string, 현재 article slug), `to_slug`(string), `position`(int 1-N), `recommendation_type`(enum: `manual`/`auto-crosslink`).
  - 발사 위치: ArticleCard.tsx 사용 위치 중 **RelatedArticles 컴포넌트가 렌더하는 자리**만 (article 하단 추천 카드). 그 외 ArticleCard 사용 자리(ArticleHub 리스트, 홈 카드 등)는 `cta_click(cta_id=view_article)`.
  - 구 `content_click(type=article)` 발사 4주 유지 → cleanup 라운드에서 제거.
- **I2 `share_click`** (rename 병행 + align):
  - 새 이벤트 `share_click` 발사 추가 — 파라미터: `slug`(string), `method`(enum: `web-share`/`copy-link` — catalog §6.5), `location`(enum: `article-bottom`/`header`).
  - 발사 위치: share.ts:37, share.ts:60 — 기존 `share` 발사 옆.
  - 구 `share` 발사 4주 유지 → cleanup 라운드 제거.
  - enum align: 코드의 `web_share_api`/`clipboard` → 카탈로그의 `web-share`/`copy-link`로 새 이벤트는 카탈로그 표기 사용.
  - `slug`는 share.ts `ShareContext.itemId`에서 파생 (contentType 따라 의미 다름 — article/checklist/timeline → `slug` 또는 별도 `content_type` 파라미터). **content_type을 함께 발사**해 catalog §3.C `share_click`을 확장 (review-md §5 결정 1 신/구 병행 룰 따라 ga4.md §3.C 파라미터 추가).
- **I3 `cta_click`** (add):
  - 발사 위치: ArticleCard 사용 자리 중 RelatedArticles 외(ArticleHub, 홈 미니카드, 인포 카드 등) — `cta_id=view_article`, `location` 파라미터.
  - 파라미터: `cta_id`(string, snake_case verb_object — catalog §6.6), `location`(enum: `home_hero`/`article_bottom`/`floating`/`nav` 등 — catalog §3.E), `destination`(string path).
  - **카탈로그에 명시된 cta 자리만**: 본 라운드는 ArticleCard 일반 자리 흡수만 처리. 다른 명시 CTA(예: 온보딩 시작, 체크리스트 진입) wiring은 구현 라운드에서 추가.

#### should (I)

- `related_article_click`의 `recommendation_type` 분기: `src/lib/unified-tags.ts`의 `*_manual: true` 플래그 확인 후 manual/auto-crosslink 결정.
- `share_click.location` enum 추가 시 ga4.md §6.5 갱신 동반 (`location` enum 명시 — catalog 본체에 미정의).

#### won't (I)

- `cta_click` 자리 일괄 식별 — 본 라운드는 ArticleCard 일반 자리만. 나머지 CTA(온보딩·체크리스트 진입·체중 입력 시작 등)는 별도 cta-id 정의 라운드.
- `share_click`의 모든 발사 위치 일괄 점검 — 본 라운드는 share.ts 두 곳만.
- ShareButton 컴포넌트의 location 컨벤션 통일 — 디자인 영역 (designer §6 2026-05-03 메모: "ShareButton 위치 컨벤션 부재").

#### I 카탈로그 정렬 (현재 코드 ↔ 카탈로그 ↔ 액션)

| # | 카탈로그 이벤트 | 코드 현황 | 액션 |
|---|---|---|---|
| I1 | `related_article_click` | 미발사 (`content_click(type=article)`로 모든 article 클릭 수집) | rename(병행) + add — RelatedArticles 자리만 |
| I2 | `share_click` | `share` 발사 (share.ts) — enum/파라미터 불일치 | rename(병행) + align |
| I3 | `cta_click` | 미발사 (ArticleCard 일반 자리는 `content_click`) | add — ArticleCard 일반 자리만 |

#### I 영향 파일

**수정**:
- `src/lib/share.ts:37` — `share_click` 발사 추가 (구 `share` 옆), `slug`/`method=web-share`/`location` 파라미터.
- `src/lib/share.ts:60` — 동일, `method=copy-link`.
- `src/components/articles/ArticleCard.tsx:13` — onClick에 `cta_click` 또는 `related_article_click` 분기 발사 추가. 분기 기준: prop으로 `variant: "related" | "cta"` 받거나, 부모 컴포넌트에서 `onClick` 오버라이드.
- `src/components/articles/RelatedArticles.tsx` (있다면) — `related_article_click` 발사 책임. ArticleCard `variant="related"` 전달 또는 onClick 오버라이드.

**신규**: 없음 (기존 컴포넌트 수정).

### 3.J 묶음 J — Signals 그룹

#### must (J)

- **J1 `scroll_without_action`** (add):
  - `useScrollSignals(page_type)` hook의 두 번째 책임 (H2와 같은 hook).
  - 트리거: scroll ≥ 50% AND dwell ≥ 30s AND 페이지 내 클릭 0 AND **`article_read_complete` 미발사** (결정 3 — 트리거 조건 추가).
  - 파라미터: `page_type`(enum §6.7 신규: `article`/`checklist`/`home`/`timeline`), `dwell_sec`(int).
  - 마운트 위치: 4종 page wrapper — `/articles/[slug]/page.tsx`(article), `/checklist/[slug]/page.tsx`(checklist), `/`(home), `/timeline/page.tsx`(timeline).
- **J2 `external_link_click`** (rename 병행 + align + 흡수):
  - 새 이벤트 `external_link_click` 발사 추가 — 파라미터: `domain`(string, host만), `context`(enum §6.8 신규: `article`/`checklist`/`policy_guide`/`video`/`channel`/`babyfair`), `from_slug`(string optional), `video_id`(string optional, context=video일 때만), `channel_id`(string optional, context=video|channel일 때만).
  - 발사 위치 3그룹:
    - BabyfairCard.tsx:51 — `context=babyfair`. 구 `outbound_click` 4주 유지.
    - VideoCard.tsx:21, VideoCardCompact.tsx:23 — `context=video`, `video_id`(`video.id`), `channel_id`(`video.channelId` 가용 시), `domain="youtube.com"`. 구 `content_click(type=video)` 4주 유지.
    - ChannelCard.tsx:27 — `context=channel`, `channel_id`(`channel.id`), `domain="youtube.com"`. 구 `content_click(type=channel)` 4주 유지.
  - **rel 처리는 본 라운드 작업 아님** (결정 6 — 묶음 O로 분리). 코드 주석으로 placeholder TODO만 명시: `// TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드`.
- **J3 `empty_state_view`** (add — 발사만):
  - p9-empty-state 라운드에서 박힌 컴포넌트 마운트 hook에 `sendGAEvent("empty_state_view", { page, reason })` 한 줄 추가.
  - 파라미터: `page`(string, pathname), `reason`(enum §3.E: `network`/`validation`/`not_found`/`permission`/`expected_empty`).
  - **컴포넌트 재구현 금지** — 사용자 명시.
- **J4 `feature_request_signal`** (add — 신호 포인트 식별 라운드 분리):
  - 본 라운드는 후보 위치만 spec.md §6에 명시. 구현은 별도 라운드.
  - 후보: 빈 댓글창 클릭(현재 댓글 기능 미존재 → defer), 비활성 메뉴 클릭, 미존재 카테고리 진입 시도 (catalog §3.E `trigger` enum: `comment_attempt`/`disabled_menu_click`/`missing_category`).

#### should (J)

- `useScrollSignals`의 4종 page_type 마운트 위치는 phase-4.6 자동 리포트 §1.7 `scroll_without_action.page_type`별 슬라이싱과 직접 연결 — 누락 시 리포트 빈 슬라이스 생성.

#### won't (J)

- `external_link_click` rel 처리 (결정 6 — 묶음 O로 분리).
- `feature_request_signal` 신호 포인트 wiring (별도 라운드).
- `error_view`(catalog §3.E `error_view`/`empty_state_view` 페어) — empty_state_view만 본 라운드 처리, error_view는 별도 라운드.

#### J 카탈로그 정렬 (현재 코드 ↔ 카탈로그 ↔ 액션)

| # | 카탈로그 이벤트 | 코드 현황 | 액션 |
|---|---|---|---|
| J1 | `scroll_without_action` | 미구현 | add (`useScrollSignals` hook, page_type 4종) |
| J2 | `external_link_click` | `outbound_click` (BabyfairCard) + `content_click(type=video\|channel)` (Video·Channel) | rename(병행) + align + 흡수 |
| J3 | `empty_state_view` | 컴포넌트 마운트 hook 박힘, 발사 미구현 | add (마운트 hook에 한 줄 추가) |
| J4 | `feature_request_signal` | 미구현 | won't (후보만 명시, 별도 라운드) |

#### J 영향 파일

**수정**:
- `src/components/babyfair/BabyfairCard.tsx:51` — `external_link_click(domain=hostname(event.official_url), context="babyfair")` 발사 추가. 구 `outbound_click` 옆.
- `src/components/videos/VideoCard.tsx:21` — `external_link_click(domain="youtube.com", context="video", video_id=video.id, channel_id=video.channelId)` 발사 추가.
- `src/components/videos/VideoCardCompact.tsx:23` — 동일.
- `src/components/videos/ChannelCard.tsx:27` — `external_link_click(domain="youtube.com", context="channel", channel_id=channel.id)` 발사 추가.
- `src/components/empty-states/*` 또는 p9-empty-state 라운드에서 박힌 마운트 hook — `empty_state_view` 발사 한 줄 추가. **정확한 파일 경로는 구현 라운드에서 grep 후 확정**.
- 4종 page wrapper에 `useScrollSignals` 마운트:
  - `src/app/articles/[slug]/page.tsx` (또는 ArticleContent 컴포넌트) — `useScrollSignals("article", { slug })`.
  - `src/app/checklist/[slug]/page.tsx` 또는 ChecklistPage — `useScrollSignals("checklist")`.
  - `src/app/page.tsx` 또는 HomeContent — `useScrollSignals("home")`.
  - `src/app/timeline/page.tsx` 또는 TimelineContainer — `useScrollSignals("timeline")`.

**신규**:
- `src/lib/use-scroll-signals.ts` (H2와 같은 파일).

**defer (묶음 O)**: 모든 `external_link_click` 발사 위치의 `<a target="_blank" rel="noopener noreferrer">` 표준 정합.

## 4. 예외·엣지 케이스

- **Consent 거부 사용자**: GA4 자체가 미주입 → `sendGAEvent` noop. 본 라운드 추가 처리 0.
- **localStorage 손실**: `useDueDateStore` user_properties가 null 상태 → `setUserProperties({due_date_set: false, current_pregnancy_week: undefined, ...})`. PageviewTracker 기존 동작 유지. 본 라운드 변경 0.
- **AbortError on share**: share.ts:42에서 이미 무시 처리 중. 본 라운드 변경 0. `share_click`은 `try`/`await navigator.share()` 성공 시점에만 발사 (기존 패턴 유지).
- **scroll_without_action 발사 후 늦은 클릭**: 사용자가 30s 후 dwell 충족으로 발사된 뒤에 클릭하면 retroactive 상쇄 불가 — 발사된 이벤트는 그대로. 분석 단계에서 시계열 해석으로 보정.
- **article_read_complete의 백그라운드 탭**: `document.visibilityState === "visible"` 조건 hard guard. 기존 catalog §3.C 주의사항.
- **외부 링크 클릭 후 즉시 페이지 떠남**: `<a target="_blank">`는 새 탭 → 현재 페이지 유지 → 이벤트 발사 보장. `window.open`(BabyfairCard)도 동일.
- **신/구 병행 4주 동안 GA4 컨버전 마킹**: `pregnancy_week_set`만 conversion 마킹 (이미 운영자 작업). 신 이벤트(`checklist_item_toggle`, `share_click`, `external_link_click`)는 4주 후 cleanup 라운드에서 conversion 마킹 검토.

## 5. 성공 기준

### 5.1 기능 동작 (본 라운드)

본 라운드는 spec·ga4 산출물까지. 코드 동작 검증은 **구현 라운드에서**:

- 카탈로그 정렬 표 §0의 26개 항목 액션이 모두 코드 또는 ga4.md에 반영.
- `useScrollSignals` hook이 4종 page_type에서 발사.
- 신/구 병행 4주 동안 GA4 DebugView에서 양쪽 이벤트 모두 발사 확인 (구현 라운드 검증).

### 5.2 측정 지표 (4주 후 cleanup 라운드 시점)

- ga4.md §3 카탈로그 ↔ 코드 1:1 정합 100% (운영 이벤트 7그룹 등재 완료).
- 4주 누적 GA4 데이터에서 신 이름 발사 ≥ 구 이름 발사 (진입 검증).
- `article_read_complete` / `article_view` 비율이 catalog §3.C 정상 범위(25~45%) 내 — 이외면 임계치 조정 라운드 트리거.
- `scroll_without_action.page_type` 4종 모두 발사 ≥ 1건/주 (전 페이지 wrapper 마운트 검증).
- `external_link_click.context` 4종(`article`/`video`/`channel`/`babyfair`) 모두 발사 ≥ 1건/주.

### 5.3 사용자 경험 (design.md 미생성 — 측정만)

본 라운드 사용자 가시 변경 0. UX 변경은 phase-4.6 이후 자동 리포트 데이터로 결정.

## 6. 충돌·시너지 분석

### 6.1 `article_read_complete` ↔ `scroll_without_action` 정의 분리

- 결정 3 옵션 C 적용: `scroll_without_action` 트리거에 "AND `article_read_complete` 미발사" 추가.
- 한 페이지뷰 시나리오 분석:
  - **시나리오 A** (완독 + 클릭 0): scroll 75% + dwell 60s + visibility → `article_read_complete` 발사. 이후 dwell ≥ 30s + 클릭 0 조건은 충족하지만 `article_read_complete` 이미 발사 → `scroll_without_action` 발사 억제. **양성 신호 우선**.
  - **시나리오 B** (스크롤만 + 클릭 0 + dwell 30~59s): `article_read_complete` 임계 미달 → `scroll_without_action` 발사. **음성 신호 인정**.
  - **시나리오 C** (스크롤 30% + dwell 5s + 떠남): 둘 다 미발사. **이탈로 분류**.
  - **시나리오 D** (article 외 page_type, 스크롤 50% + dwell 30s + 클릭 0): `scroll_without_action.page_type=checklist|home|timeline` 발사. `article_read_complete`은 article 한정이라 무관.
- 회색지대(스크롤 60% + dwell 45s + 클릭 0)는 **시나리오 B에 흡수** — 임계치 조정 라운드까지 그대로.

### 6.2 `external_link_click` ↔ design-bundle-O (rel 표준)

- 본 라운드: wiring만 (이름 정렬 + 파라미터). 코드에 `// TODO(bundle-O): rel="noopener noreferrer"` 주석 박기.
- 묶음 O 라운드 시점: 모든 발사 위치(BabyfairCard·VideoCard·VideoCardCompact·ChannelCard) 일괄 `<a target="_blank" rel="noopener noreferrer">` 또는 `window.open(url, "_blank", "noopener,noreferrer")`로 정합.
- 충돌 없음 — 본 라운드는 이벤트 발사만, 묶음 O는 보안 속성만.

### 6.3 `empty_state_view` ↔ p9-empty-state 마운트 hook

- 사용자 명시: p9-empty-state 라운드에서 컴포넌트 마운트 hook 위치는 이미 박힘 → **본 라운드는 발사 한 줄 추가만**.
- **재구현 금지**. 컴포넌트 구조·마운트 로직 변경 0.
- 발사 위치 정확한 파일 경로는 구현 라운드에서 `grep "EmptyState\|empty-state"` 후 확정 (본 spec은 추상적 위치만 명시).

### 6.4 시너지 — `useScrollSignals` 단일 hook의 비용 절감

- 결정 2 옵션 A로 `article_read_complete`(H2)·`scroll_without_action`(J1)이 한 hook에 통합 → 두 이벤트의 정의 변경(임계치·동시 발사 처리)을 한 곳에서 관리.
- visibility/scroll/click listener를 두 hook에 중복 박지 않음 → 모바일 성능·메모리 절감.

## 7. ga4.md 본체 갱신 패치 제안

> 본 라운드 종료 시 [docs/marketing/ga4.md](../../marketing/ga4.md) 본체에 적용할 패치. **직접 적용은 spec/ga4 머지 후 별도 PR**.

### 7.1 §3 신규 등재 (결정 5 — 카탈로그 외 운영 이벤트 7그룹)

ga4.md §3.B (체크리스트) 끝에 추가:

- `recommended_item_view` / `recommended_item_check` — 추천 항목 노출·체크. 파라미터: `item_id`, `week`, `category`, `source`(checklist/timeline). 층: 보조.
- `upcoming_item_view` / `upcoming_item_check` — 다가오는 항목 노출·체크. 파라미터: `item_id`, `week_diff`(D-day), `category`. 층: 보조.
- `custom_item_add` — 커스텀 항목 추가. 파라미터: `target`(enum: `checklist`/`timeline`), `category`, `slug`(optional), `auto_week`(bool optional). 층: 보조.
- `category_tab_switch` — 타임라인 카테고리 탭 전환. 파라미터: `category`. 층: 진단. **§3.B `checklist_filter`와 별개** — 대상 컨테이너 다름 (timeline vs checklist).

ga4.md §3.D (개인화 트래커) 끝에 추가:

- `timeline_scroll_depth` — 타임라인에서 도달한 최대 주차. 파라미터: `max_week_visible`(int). 층: 진단.
- `timeline_week_view` — 타임라인 주차 카드 펼침. 파라미터: `week`(int). 층: 보조. **§3.D `timeline_view`와 관계**: `timeline_view`는 페이지 진입, `timeline_week_view`는 개별 주차 펼침 — 둘 다 유지.
- `onboarding_complete` — 온보딩 완료. 파라미터: 없음. 층: 보조 (funnel 단계).
- `onboarding_due_date_set` / `onboarding_due_date_skip` — 온보딩 내 예정일 입력/건너뛰기. 파라미터: `pregnancy_week`(int, set 시만). 층: 보조 (funnel 단계). §5.3 온보딩 funnel과 정합.

ga4.md §3.E (Signals) 끝에 추가:

- `onboarding_banner_view` / `onboarding_banner_click` / `onboarding_banner_dismiss` — 홈 온보딩 배너 노출/클릭/닫기. 파라미터: `banner_id`(string), `event_id`(optional). 층: 진단.

### 7.2 §3.C `article_read_complete` 트리거 조건 갱신 (결정 3 — 임계치는 그대로)

> 변경 없음. 본 라운드는 catalog §3.C 정의를 그대로 유지.

### 7.3 §3.E `scroll_without_action` 트리거 조건 보강 (결정 3)

ga4.md §3.E `scroll_without_action` 트리거 항목 패치:

```diff
- - **트리거**: scroll 50% 이상 + dwell ≥ 30s + 같은 페이지 내 클릭 0
+ - **트리거**: scroll 50% 이상 + dwell ≥ 30s + 같은 페이지 내 클릭 0 + (page_type=`article`이면 `article_read_complete` 미발사)
```

### 7.4 §3.E `external_link_click` 파라미터 갱신 (결정 6 — wiring만, rel은 묶음 O)

ga4.md §3.E `external_link_click.context` enum에 `babyfair` 추가:

```diff
- - `context` (string enum) — `article` / `checklist` / `policy_guide` / **`video`**
+ - `context` (string enum) — `article` / `checklist` / `policy_guide` / **`video`** / **`channel`** / **`babyfair`**
```

ga4.md §6.8 (신규 섹션 또는 §6 enum 표 마지막) — `external_link_click.context` enum 정식 등재.

### 7.5 §3.C `share_click` 파라미터 보강 (결정 1 + I2)

ga4.md §3.C `share_click.method` enum + `content_type` 파라미터 추가:

```diff
  - **파라미터**:
    - `slug` (string)
-   - `method` (string enum) — `web-share` / `copy-link`
+   - `method` (string enum) — `web-share` / `copy-link`
+   - `content_type` (string enum) — `article` / `checklist` / `timeline` (기존 `share` 이벤트의 content_type 흡수)
    - `location` (string enum) — `article-bottom` / `header`
```

### 7.6 §6.5 `method` enum 갱신

이미 `web-share` / `copy-link`로 정의됨. 변경 없음. 코드 align만 (현재 `web_share_api`/`clipboard` → 새 이벤트는 `web-share`/`copy-link` 사용).

### 7.7 §6 enum 신규 추가

- §6.7 `page_type` enum (신규) — `article` / `checklist` / `home` / `timeline` (`scroll_without_action` 등 `useScrollSignals` 발사 이벤트의 슬라이스 축).
- §6.8 `context` enum (`external_link_click` 슬라이스, 7.4 참조).

### 7.8 §8 도입 단계 — G·H·I·J 체크

```diff
- - [ ] **G** — User properties 3종 + `pregnancy_week_set`
- - [ ] **H** — `checklist_item_toggle`, `article_read_complete`, `weight_log`, `search_submit`
- - [ ] **I** — `related_article_click`, `share_click`, `cta_click`
- - [ ] **J** — `scroll_without_action`, `external_link_click`, `empty_state_view`, `feature_request_signal`
+ - [x] **G** — User properties 3종 + `pregnancy_week_set` (2026-05-10)
+ - [x] **H** — `checklist_item_toggle`(병행 rename), `article_read_complete`(add), `weight_log`(align), `search_submit`(spec only) (2026-05-10)
+ - [x] **I** — `related_article_click`(병행 rename + add), `share_click`(병행 rename + align), `cta_click`(add — ArticleCard 일반 자리만) (2026-05-10)
+ - [x] **J** — `scroll_without_action`(add), `external_link_click`(병행 rename + align + 흡수), `empty_state_view`(add — 발사만), `feature_request_signal`(spec only) (2026-05-10)
- - [ ] **L** — 자동 주간 리포트 스크립트
- - [ ] **M** — launchd 등록 + 안정화
+ - [ ] **L** — 자동 주간 리포트 스크립트 (phase-4.6 — D1 발급 후)
+ - [ ] **M** — launchd 등록 + 안정화 (phase-4.6)
```

### 7.9 §9 변경 이력 1줄 추가

```diff
| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-03 | 최초 작성 | 이벤트 카탈로그·상관관계·분석 방법론 초기 정의 |
+ | 2026-05-10 | G·H·I·J wiring 완료 + 운영 이벤트 7그룹 §3 등재 + `scroll_without_action` 트리거에 `article_read_complete` 미발사 조건 추가 + `share_click.content_type` 파라미터 추가 + `external_link_click.context` enum에 `channel`·`babyfair` 추가 + §6.7 `page_type` / §6.8 `context` enum 등재 | docs/features/marketing-events-wiring 라운드 |
```

> 별도 cleanup 라운드(2026-06-07 이후) 시점에 §9에 추가:
> `| 2026-06-07 | 신/구 병행 grace period 종료 — 구 이름 4건 발사 제거 (checklist_check, share, outbound_click, content_click) + due_date_set 이벤트 제거 | 4주 grace 종료 |`
