# marketing-events-wiring 측정 설계

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)
> 카탈로그 SoT: [docs/marketing/ga4.md](../../marketing/ga4.md) (본 라운드 종료 시 [spec.md §7](./spec.md#7-ga4md-본체-갱신-패치-제안) 패치 적용)

## review.md 결정사항 참조

본 측정 설계는 [review.md §5](./review.md#5-결정) 결정을 따른다.

- **결정 1**: rename 4건 신/구 병행 4주 grace → 본 매트릭스에서 신·구 이벤트를 `[병행]` 마킹.
- **결정 2**: `useScrollSignals` 공용 hook → §1 매트릭스에서 `article_read_complete`·`scroll_without_action` 같은 hook으로 표기.
- **결정 3**: read_complete 임계치 그대로 + scroll_without_action에 "AND read_complete 미발사" 추가.
- **결정 4**: `due_date_set` 이벤트 발사 제거 → 4주 cleanup 라운드 일정.
- **결정 5**: 카탈로그 외 운영 이벤트 7그룹 ga4.md §3 등재 → §1 매트릭스에 `[catalog]` 마킹.
- **결정 6**: `external_link_click` rel은 묶음 O 분리 → §1 매트릭스에 `// TODO(bundle-O)` 주석 명시.

## 1. 측정 목표

- **핵심 질문 1**: 카탈로그 §3 ↔ 코드 sendGAEvent 호출부의 1:1 정합 달성 — phase-4.6 자동 주간 리포트(GA4 Data API) 진입 전제 조건.
- **핵심 질문 2**: 본 라운드에서 신규 발사된 이벤트 7개(`article_read_complete`·`weight_log` 파라미터 보강·`search_submit`·`related_article_click`·`cta_click`·`external_link_click`·`scroll_without_action`·`empty_state_view`)가 4주 누적 데이터에서 **3층 지표 트리** 슬라이싱에 충분한 분석 해상도를 제공하는가.
- **의사결정 연결**:
  - 4주 후 cleanup 라운드 진입 가능 여부 (신·구 병행 데이터 정합 검증).
  - phase-4.6 D1 발급 후 자동 리포트 §1.7 시나리오 1:1 매핑 가능 여부.
  - read_complete 임계치 조정 라운드 트리거 여부 (한국어 모바일 임산부 평균 dwell 실측).

## 2. 이벤트 명세 — 발사 위치 매트릭스 (컴포넌트 ↔ 이벤트 ↔ 파라미터)

> 형식: 한 행 = 한 발사 위치(=한 `sendGAEvent` 호출). `[병행]` = 결정 1 신/구 4주 / `[add]` = 본 라운드 신규 추가 / `[align]` = 파라미터·enum 정정 / `[keep]` = 변경 없음 / `[catalog]` = 코드 변경 0, ga4.md만 등재 / `[remove(4주 후)]` = cleanup 라운드 / `[defer]` = 묶음 O 분리.

### 2.G 묶음 G — User properties 3종 + 핵심 등록

| 컴포넌트 / 파일 | 트리거 | 이벤트 / property | 파라미터 (이름 / 타입 / 예시) | 액션 | 비고 |
|---|---|---|---|---|---|
| [PageviewTracker.tsx:16~20](../../../src/components/analytics/PageviewTracker.tsx#L16-L20) | 매 pathname 변경 | `setUserProperties` | `due_date_set: bool` / `current_pregnancy_week: int? (0~42)` / `cohort_join_week: int? (0~42)` | [keep] | catalog §2 정합. GA4 admin custom dimension 등록 운영자 작업 |
| [PageviewTracker.tsx:22](../../../src/components/analytics/PageviewTracker.tsx#L22) | 매 pathname 변경 | `page_view` | `page_path: string` | [keep] | catalog §3.A 자동 + 수동 page_view |
| [DueDateInput.tsx:48](../../../src/components/home/DueDateInput.tsx#L48) | 예정일 입력 저장 | `due_date_set` (이벤트) | `pregnancy_week: int` | [remove(4주 후)] | 결정 4 — user_property와 동명 충돌. 본 라운드 추가 작업 0 |
| [DueDateInput.tsx:49](../../../src/components/home/DueDateInput.tsx#L49) | 예정일 입력 저장 | `pregnancy_week_set` | `week: int` / `source: enum (manual_update)` | [keep + check] | catalog §3.D 정합. **`source` 파라미터 누락 여부 점검**. 누락 시 add |
| [DueDateStep.tsx:34](../../../src/components/onboarding/DueDateStep.tsx#L34) | 온보딩 예정일 저장 | `due_date_set` (이벤트) | `pregnancy_week: int` | [remove(4주 후)] | 결정 4 |
| [DueDateStep.tsx:35](../../../src/components/onboarding/DueDateStep.tsx#L35) | 온보딩 예정일 저장 | `pregnancy_week_set` | `week: int` / `source: "onboarding"` | [keep] | catalog §3.D 정합 |

### 2.H 묶음 H — 핵심 4개 이벤트

| 컴포넌트 / 파일 | 트리거 | 이벤트 | 파라미터 | 액션 | 비고 |
|---|---|---|---|---|---|
| [ChecklistPage.tsx:177](../../../src/components/checklist/ChecklistPage.tsx#L177) | 체크박스 토글 | `checklist_check` (구) | `note_type: string` (현재 발사) | [병행] | 4주 유지 → cleanup |
| [ChecklistPage.tsx:177](../../../src/components/checklist/ChecklistPage.tsx#L177) (옆 한 줄 추가) | 체크박스 토글 | `checklist_item_toggle` (신) | `item_id: string` / `action: enum(check\|uncheck)` / `week: int` / `category: enum §6.1` / `is_custom: bool` | [add] | catalog §3.B. 200ms 디바운스 |
| [WeekChecklistSection.tsx:71](../../../src/components/timeline/WeekChecklistSection.tsx#L71) | 주차별 체크박스 토글 | `checklist_check` (구) | (현재 발사 그대로) | [병행] | 4주 유지 |
| [WeekChecklistSection.tsx:71](../../../src/components/timeline/WeekChecklistSection.tsx#L71) (옆 한 줄 추가) | 주차별 체크박스 토글 | `checklist_item_toggle` (신) | (위와 동일) | [add] | catalog §3.B |
| `src/lib/use-scroll-signals.ts` (신규) → ArticleContent (또는 `/articles/[slug]/page.tsx`) 마운트 | scroll 75% AND dwell ≥ 60s AND `visibilityState=visible` | `article_read_complete` | `slug: string` / `read_time_sec: int` / `scroll_depth_pct: int (75\|100)` | [add] | catalog §3.C. 한 페이지뷰 1회. 결정 3 임계치 그대로 |
| [WeightForm.tsx:29](../../../src/components/weight/WeightForm.tsx#L29) | 체중 입력 저장 | `weight_log` | `week: int` (store 파생) / `delta_from_last: float` (±15kg 클램핑) / `is_first_log: bool` (store 파생) | [align] | 현재 파라미터 0 → catalog §3.D 정합 |
| (검색 컴포넌트 — 구현 라운드 식별) | 검색 제출 (results 렌더 후) | `search_submit` | `query: string` (lowercase + trim + 100자) / `results_count: int` | [add (spec only)] | PII 보호 룰 §3.1: query raw 저장 금지. 발사 위치 후보: `src/components/search/`, `src/app/search/page.tsx`, 헤더 검색바 — **현재 검색 UI 미존재 가능성**, 구현 라운드에서 결정 |

### 2.I 묶음 I — 콘텐츠 보조 이벤트

| 컴포넌트 / 파일 | 트리거 | 이벤트 | 파라미터 | 액션 | 비고 |
|---|---|---|---|---|---|
| [ArticleCard.tsx:13](../../../src/components/articles/ArticleCard.tsx#L13) | onClick (모든 자리) | `content_click` (구) | `type: "article"` / `title: string` | [병행] | 4주 유지 |
| [ArticleCard.tsx:13](../../../src/components/articles/ArticleCard.tsx#L13) → RelatedArticles 자리만 | onClick (RelatedArticles 자리) | `related_article_click` (신) | `from_slug: string` / `to_slug: string` / `position: int (1~N)` / `recommendation_type: enum(manual\|auto-crosslink)` | [add] | catalog §3.C. variant prop 또는 onClick 오버라이드로 자리 분기 |
| [ArticleCard.tsx:13](../../../src/components/articles/ArticleCard.tsx#L13) → RelatedArticles 외 자리 | onClick (ArticleHub·홈·인포 등) | `cta_click` (신) | `cta_id: "view_article"` / `location: enum (article_bottom\|home_hero\|nav)` / `destination: string (/articles/<slug>)` | [add] | catalog §3.E + §6.6 `cta_id` snake_case verb_object |
| [share.ts:37](../../../src/lib/share.ts#L37) | Web Share API 성공 | `share` (구) | `method: "web_share_api"` / `content_type` / `item_id` | [병행] | 4주 유지 |
| [share.ts:37](../../../src/lib/share.ts#L37) (옆 한 줄 추가) | Web Share API 성공 | `share_click` (신) | `slug: string (=item_id)` / `method: "web-share"` (catalog §6.5) / `content_type: enum(article\|checklist\|timeline)` / `location: enum(article-bottom\|header)` | [add] | catalog §3.C + §7.5 패치 (content_type 파라미터 추가) |
| [share.ts:60](../../../src/lib/share.ts#L60) | Clipboard 복사 성공 | `share` (구) | `method: "clipboard"` / `content_type` / `item_id` | [병행] | 4주 유지 |
| [share.ts:60](../../../src/lib/share.ts#L60) (옆 한 줄 추가) | Clipboard 복사 성공 | `share_click` (신) | `slug: string (=item_id)` / `method: "copy-link"` / `content_type` / `location` | [add] | catalog §3.C |

### 2.J 묶음 J — Signals 그룹

| 컴포넌트 / 파일 | 트리거 | 이벤트 | 파라미터 | 액션 | 비고 |
|---|---|---|---|---|---|
| `src/lib/use-scroll-signals.ts` (신규) → 4종 page wrapper 마운트 | scroll ≥ 50% AND dwell ≥ 30s AND 클릭 0 AND (page_type=`article`이면 `article_read_complete` 미발사) | `scroll_without_action` | `page_type: enum §6.7 신규 (article\|checklist\|home\|timeline)` / `dwell_sec: int` | [add] | 결정 2·3. 마운트 위치: `/articles/[slug]`, `/checklist/[slug]`, `/`, `/timeline` |
| [BabyfairCard.tsx:51](../../../src/components/babyfair/BabyfairCard.tsx#L51) | 외부 행사 페이지 클릭 | `outbound_click` (구) | `url: string` / `event_name: string` | [병행] | 4주 유지. `// TODO(bundle-O): rel="noopener noreferrer"` |
| [BabyfairCard.tsx:51](../../../src/components/babyfair/BabyfairCard.tsx#L51) (옆 한 줄 추가) | 외부 행사 페이지 클릭 | `external_link_click` (신) | `domain: string (host only — new URL(url).hostname)` / `context: "babyfair"` (§6.8 신규 enum) | [add] | catalog §3.E + §7.4 패치 (context enum 확장) |
| [VideoCard.tsx:21](../../../src/components/videos/VideoCard.tsx#L21) | YouTube 영상 클릭 | `content_click` (구) | `type: "video"` / `title: string` | [병행] | 4주 유지 |
| [VideoCard.tsx:21](../../../src/components/videos/VideoCard.tsx#L21) (옆 한 줄 추가) | YouTube 영상 클릭 | `external_link_click` (신) | `domain: "youtube.com"` / `context: "video"` / `video_id: string (video.id)` / `channel_id: string? (video.channelId)` / `from_slug: string?` | [add] | catalog §3.E. YouTube Studio 별도 분석 |
| [VideoCardCompact.tsx:23](../../../src/components/videos/VideoCardCompact.tsx#L23) | YouTube 영상 클릭 (컴팩트) | `content_click` (구) | (동일) | [병행] | 4주 유지 |
| [VideoCardCompact.tsx:23](../../../src/components/videos/VideoCardCompact.tsx#L23) (옆 한 줄 추가) | YouTube 영상 클릭 (컴팩트) | `external_link_click` (신) | (위와 동일) | [add] | |
| [ChannelCard.tsx:27](../../../src/components/videos/ChannelCard.tsx#L27) | YouTube 채널 클릭 | `content_click` (구) | `type: "channel"` / `title: string` | [병행] | 4주 유지 |
| [ChannelCard.tsx:27](../../../src/components/videos/ChannelCard.tsx#L27) (옆 한 줄 추가) | YouTube 채널 클릭 | `external_link_click` (신) | `domain: "youtube.com"` / `context: "channel"` (§6.8 신규 enum) / `channel_id: string (channel.id)` | [add] | catalog §3.E |
| (p9-empty-state 라운드에서 박힌 마운트 hook — 정확한 파일 grep 후 확정) | 빈 상태 컴포넌트 마운트 | `empty_state_view` | `page: string (pathname)` / `reason: enum (network\|validation\|not_found\|permission\|expected_empty)` | [add] | catalog §3.E. 컴포넌트 재구현 금지 |
| (신호 포인트 — 별도 라운드) | 빈 댓글창 클릭·비활성 메뉴·미존재 카테고리 진입 | `feature_request_signal` | `trigger: enum (comment_attempt\|disabled_menu_click\|missing_category)` / `context: string` | [add (spec only)] | catalog §3.E. 본 라운드 후보만 명시 |

### 2.사후 (catalog 외 운영 이벤트 — 결정 5 catalog 등재만, 코드 변경 0)

| 컴포넌트 / 파일 | 이벤트 | 파라미터 (현재 코드 발사 기준) | 액션 | 등재 위치 |
|---|---|---|---|---|
| [TimelineContainer.tsx:71](../../../src/components/timeline/TimelineContainer.tsx#L71), [ChecklistPage.tsx:112](../../../src/components/checklist/ChecklistPage.tsx#L112) | `recommended_item_view` | `item_id` / `week` / `category` / `source` (checklist\|timeline 추정) | [catalog] | ga4.md §3.B 신규 |
| [WeekChecklistSection.tsx:83](../../../src/components/timeline/WeekChecklistSection.tsx#L83), [ChecklistPage.tsx:190](../../../src/components/checklist/ChecklistPage.tsx#L190) | `recommended_item_check` | (위와 동일) | [catalog] | ga4.md §3.B 신규 |
| [ChecklistItemRow.tsx:64](../../../src/components/checklist/ChecklistItemRow.tsx#L64) | `upcoming_item_view` | `item_id` / `week_diff` / `category` | [catalog] | ga4.md §3.B 신규 |
| [ChecklistPage.tsx:203](../../../src/components/checklist/ChecklistPage.tsx#L203) | `upcoming_item_check` | (위와 동일) | [catalog] | ga4.md §3.B 신규 |
| [ChecklistAddForm.tsx:47](../../../src/components/checklist/ChecklistAddForm.tsx#L47), [UnifiedAddForm.tsx:70,95](../../../src/components/timeline/UnifiedAddForm.tsx) | `custom_item_add` | `target: enum (checklist\|timeline)` / `category` / `slug?` / `auto_week?: bool` | [catalog] | ga4.md §3.B 신규 |
| [CategoryFilter.tsx:21](../../../src/components/timeline/CategoryFilter.tsx#L21) | `category_tab_switch` | `category: string` | [catalog] | ga4.md §3.B 신규. `checklist_filter`와 별개 — 대상 컨테이너 다름 |
| [TimelineContainer.tsx:180](../../../src/components/timeline/TimelineContainer.tsx#L180) | `timeline_scroll_depth` | `max_week_visible: int` | [catalog] | ga4.md §3.D 신규 |
| [TimelineAccordionCard.tsx:82](../../../src/components/timeline/TimelineAccordionCard.tsx#L82) | `timeline_week_view` | `week: int` | [catalog] | ga4.md §3.D 신규. catalog §3.D `timeline_view`(페이지 진입)과 별개 — 개별 주차 펼침 |
| [OnboardingFlow.tsx:24](../../../src/components/onboarding/OnboardingFlow.tsx#L24) | `onboarding_complete` | (params 없음) | [catalog] | ga4.md §3.D 신규. §5.3 온보딩 funnel 단계 |
| [DueDateStep.tsx:33](../../../src/components/onboarding/DueDateStep.tsx#L33) | `onboarding_due_date_set` | `pregnancy_week: int` | [catalog] | ga4.md §3.D 신규 |
| [DueDateStep.tsx:42](../../../src/components/onboarding/DueDateStep.tsx#L42) | `onboarding_due_date_skip` | (params 없음) | [catalog] | ga4.md §3.D 신규 |
| [OnboardingBannerProvider.tsx:97](../../../src/components/providers/OnboardingBannerProvider.tsx#L97) | `onboarding_banner_view` | `banner_id` / `event_id?` | [catalog] | ga4.md §3.E 신규 |
| [OnboardingBannerProvider.tsx:106](../../../src/components/providers/OnboardingBannerProvider.tsx#L106) | `onboarding_banner_click` | (위와 동일) | [catalog] | ga4.md §3.E 신규 |
| [OnboardingBannerProvider.tsx:113](../../../src/components/providers/OnboardingBannerProvider.tsx#L113) | `onboarding_banner_dismiss` | (위와 동일) | [catalog] | ga4.md §3.E 신규 |
| [ChecklistPage.tsx:221](../../../src/components/checklist/ChecklistPage.tsx#L221) | `checklist_filter` | `filter_type` / `value` | [keep] | catalog §3.B 정합 |

## 3. 유저 프로퍼티 변경

본 라운드 신규/수정 user_property: **없음**. 기존 3종(`due_date_set`/`current_pregnancy_week`/`cohort_join_week`)은 [PageviewTracker.tsx:16~20](../../../src/components/analytics/PageviewTracker.tsx#L16-L20)에서 매 방문 set, 변경 0.

대기 중인 user_property (Phase 5 도입):
- `is_first_pregnancy` (bool) — 온보딩 입력 시 set.
- `notification_opt_in` (bool) — Phase 5 푸시 도입 시.

GA4 admin 작업 (운영자, spec 범위 밖):
- 3종 user_property가 custom dimension으로 등록되었는지 확인. 미등록 시 등록 작업 1회.

## 4. 깔때기·세그먼트

### 4.1 온보딩 funnel (catalog §5.3 정의 + 본 라운드 정합화)

1. `first_visit` (자동)
2. `pregnancy_week_set(source=onboarding)` — 목표 60%
3. `checklist_view`(catalog §3.B, 본 라운드 won't) **또는** `recommended_item_view`(catalog §3.B 신규 등재) **또는** `article_view` — 목표 80%
4. `checklist_item_toggle(action=check)` (신) **또는** `article_read_complete` — 목표 50%
5. 다음주 `session_start` (W+1 리텐션) — 목표 70%

> 4주 grace 동안은 step 4를 `checklist_check`(구) **또는** `checklist_item_toggle`(신)로 OR 조건 — cleanup 라운드 후 신만 유지.

### 4.2 콘텐츠 funnel (catalog §5.3 정의)

1. `article_view` (이미 wired된 페이지뷰 또는 catalog §3.C 신규 등재)
2. `article_read_complete` (신) — 목표 30%
3. `related_article_click` (신) **또는** `share_click` (신) — 목표 15%
4. 다른 article view (=깊이) — 목표 50%

### 4.3 세그먼트 — 코호트 슬라이싱

- `cohort_join_week` × 행동 매트릭스 (catalog §4.3):
  - 초기(8~16주): `article_view(topic=nutrition)` 비중↑, `weight_log` 주기적
  - 중기(20~28주): `checklist_item_toggle(category=hospital-bag)` 비중↑
  - 후기(30주+): 즉시 체크리스트 직행, 검색·필터 우선순위↑
- `current_pregnancy_week` × 이벤트 시점: 매 이벤트 슬라이스에 user_property로 자동 결합.

### 4.4 page_type 슬라이스 (J1 신규)

- `scroll_without_action.page_type` 4종(`article`/`checklist`/`home`/`timeline`)별 발사율.
  - `article` 30%↑: 도입부/길이 문제 (catalog §3.E 분석).
  - `checklist`/`home`/`timeline` 30%↑: CTA 부재 또는 페이지 정보 부재 신호.

## 5. 대시보드 항목 (phase-4.6 자동 리포트 §1.7 매핑)

본 라운드 wiring 완료 후 phase-4.6 자동 주간 리포트(L 묶음 — D1 발급 후)가 답해야 할 항목:

| 보고 항목 | 사용 이벤트 (본 라운드 wired) | 자동 리포트 §1.9.6 섹션 |
|---|---|---|
| 코호트 리텐션 W+1·W+4 | `session_start` × `cohort_join_week` user_property | §1 |
| 핵심 행동 도달률 | `checklist_item_toggle`(신) / `article_read_complete`(신) / `weight_log`(align) | §2 |
| 다음 콘텐츠 백로그 | `search_submit WHERE results_count=0` (신) | §3 |
| 자체화 후보 | `external_link_click.domain` TOP × `context` 슬라이스(신) | §4 |
| 이상치/마찰점 | `empty_state_view`(신) / `scroll_without_action.page_type`(신) | §5 |
| 추천 액션 | 위 5항목 종합 (Claude API 생성) | §6 |

> **본 라운드는 wiring까지**. 대시보드·자동 리포트 구현은 phase-4.6 D1 발급 후 별도 라운드.

## 6. 본 라운드 PII·Consent 점검 (마케터 §3.1·§3.2 / 디자이너 N3 룰)

매 산출물 작성 시 점검 (페이즈 6 결정 보호 룰):

- ✅ `search_submit.query` — lowercase + trim + 100자 제한 명시 (catalog §3.E 주의 그대로). raw 저장 금지.
- ✅ `external_link_click.domain` — host만, path/query 제외 (`new URL(url).hostname`).
- ✅ `external_link_click.video_id`/`channel_id` — YouTube 공개 식별자 (PII 아님).
- ✅ `share_click.slug` — 콘텐츠 식별자 (PII 아님).
- ✅ `weight_log.delta_from_last` — ±15kg 클램핑으로 비정상 입력 노이즈 차단. raw weight 미발사.
- ✅ `pregnancy_week_set.week` — 주차 정수, 정확 출산예정일 미발사 (catalog §3.D 주의).
- ✅ User properties 3종 — 주차 단위 코호트, PII 아님 (designer §3 N3 명시 허용).
- ✅ Consent 거부 사용자 — `sendGAEvent` noop 확인 ([analytics.ts:9~10](../../../src/lib/analytics.ts#L9-L10) `gtag` 미주입 시 return).
- ✅ Fingerprinting / 서버사이드 우회 0 (consent 게이팅 [ConsentGatedScripts.tsx](../../../src/components/consent/ConsentGatedScripts.tsx)에서만 GA4 로드).
- ⚠️ `checklist_item_toggle.item_id` — 사용자 추가 커스텀 항목 ID는 사용자 입력 텍스트 일부일 가능성. **store가 자동 생성한 UUID/nanoid이면 안전**, 사용자 입력 그대로면 위험. 구현 라운드에서 store 생성 로직 점검 필요.

## 7. ga4.md 본체 갱신 패치 (요약 — 상세는 [spec.md §7](./spec.md#7-ga4md-본체-갱신-패치-제안))

본 라운드 종료 시 적용할 docs/marketing/ga4.md 패치 5건:

1. **§3.B 신규 등재 6항목** (`recommended_item_view/check`, `upcoming_item_view/check`, `custom_item_add`, `category_tab_switch`).
2. **§3.D 신규 등재 5항목** (`timeline_scroll_depth`, `timeline_week_view`, `onboarding_complete`, `onboarding_due_date_set`, `onboarding_due_date_skip`).
3. **§3.E 신규 등재 3항목** (`onboarding_banner_view/click/dismiss`).
4. **§3.E `scroll_without_action` 트리거 보강** — "AND `article_read_complete` 미발사" 추가 (결정 3).
5. **§3.E `external_link_click.context` enum 확장** — `channel`·`babyfair` 추가 (결정 6 wiring + §6.8 등재).
6. **§3.C `share_click` 파라미터 보강** — `content_type` enum 추가 (결정 1 신/구 병행 + I2 align).
7. **§6.7 `page_type` enum 신규 등재** (`article`/`checklist`/`home`/`timeline`).
8. **§6.8 `context` enum 신규 등재** (`external_link_click` 슬라이스 7종).
9. **§8 도입 단계 G·H·I·J [x] 체크 + 일자(2026-05-10)**.
10. **§9 변경 이력 1줄 추가** — 2026-05-10 G·H·I·J wiring 완료 + 운영 이벤트 7그룹 §3 등재 + enum/파라미터 보강.

> 패치 본문은 spec.md §7에 diff 형식으로 명시. **본 라운드는 docs/marketing/ga4.md 직접 갱신 금지** — spec/ga4 머지 후 별도 PR.

## 8. 4주 후 cleanup 라운드 (2026-06-07 이후) 체크리스트

본 라운드의 `[병행]`·`[remove(4주 후)]` 작업이 cleanup 라운드의 입력:

- [ ] GA4 콘솔에서 4주간 신·구 이벤트 발사량 비교 (catalog §3.6 grace period 검증).
- [ ] 구 이벤트 발사 제거 (총 7개 호출부):
  - [ChecklistPage.tsx:177](../../../src/components/checklist/ChecklistPage.tsx#L177) `checklist_check`
  - [WeekChecklistSection.tsx:71](../../../src/components/timeline/WeekChecklistSection.tsx#L71) `checklist_check`
  - [share.ts:37,60](../../../src/lib/share.ts#L37) `share`
  - [BabyfairCard.tsx:51](../../../src/components/babyfair/BabyfairCard.tsx#L51) `outbound_click`
  - [ArticleCard.tsx:13](../../../src/components/articles/ArticleCard.tsx#L13) `content_click(type=article)`
  - [VideoCard.tsx:21](../../../src/components/videos/VideoCard.tsx#L21), [VideoCardCompact.tsx:23](../../../src/components/videos/VideoCardCompact.tsx#L23) `content_click(type=video)`
  - [ChannelCard.tsx:27](../../../src/components/videos/ChannelCard.tsx#L27) `content_click(type=channel)`
- [ ] `due_date_set` 이벤트 발사 제거 (결정 4):
  - [DueDateInput.tsx:48](../../../src/components/home/DueDateInput.tsx#L48)
  - [DueDateStep.tsx:34](../../../src/components/onboarding/DueDateStep.tsx#L34)
- [ ] GA4 admin: 신 이벤트(`checklist_item_toggle`/`share_click`/`external_link_click`/`related_article_click`/`cta_click`) conversion 마킹 검토.
- [ ] ga4.md §9 변경 이력에 cleanup 완료 1줄 추가.
- [ ] read_complete 임계치 조정 검토 — 4주 누적 데이터 기준 false negative 비율 확인 (review.md §4 항목 3 결정 C 부수 조건).
