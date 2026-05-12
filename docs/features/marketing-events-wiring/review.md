# marketing-events-wiring 리뷰

> 작성일: 2026-05-10
> 상태: decided (2026-05-10)
> size: L
> phase_mode: all (next_phase=8 종료 후 complete)
> 관련 스펙: [spec.md](./spec.md) (휴먼 게이트 통과 후 생성)
> 관련 측정: [ga4.md](./ga4.md) (휴먼 게이트 통과 후 생성)
> design.md: 생성 안 함 (사용자 명시 — 산출물 meta·spec·ga4 3종)

## 1. 기능 요약

phase-4.5 §1.8 마케팅 묶음 G·H·I·J 4건의 GA4 이벤트 wiring을 한 라운드에 박아넣는다. 코드는 본 라운드에서 수정하지 않고 plan·spec까지만. D1(GA4 Data API service account)은 범위 밖, 묶음 L·M은 phase-4.6 선결조건으로 동결.

## 2. 적용 페어 + 선택 이유

- **dev × marketer**: 카탈로그 정렬 4건(`checklist_check`/`share`/`outbound_click`/`content_click`)의 rename 비용·scroll progress hook 위치(article 한정 vs Layout 공용) 결정에서 가장 첨예한 충돌 발생.
- **designer × marketer**: 사용자가 명시한 충돌 점검 포인트 — `article_read_complete` 임계치(스크롤 % + dwell sec) + `scroll_without_action`과의 동시 발사 정의 분리.

**제외 페어**:
- `planner × marketer`: 마케터 §7.6(측정 의무)와 기획자 §7.6(측정 없는 기능 거부)이 동일 — 충돌 약함.
- `dev × designer`: 본 라운드는 코드 수정 금지, 디자이너의 시각 제약과 직접 충돌하는 결정 없음.
- `dev × planner`, `planner × designer`: 범위·일정은 사용자가 이미 결정(한 라운드, G·H·I·J 4묶음).

## 3. 페어별 충돌

### 페어 1 — dev × marketer

**T0 — 페어 시작 선언**
- 이전 페어 [없음] — 첫 페어.
- dev 인용 후보: "사용자 데이터 무결성 silent corruption 거부" (§6.3) / "any 도배·--no-verify 우회 X" (§6.5)
- marketer 인용 후보: "측정 락인 깨기 금지 — 신/구 병행 4주 grace" (§3.6) / "PII 보호" (§3.1)

**T1 — [dev] 단독 입장**
- 잃는 것:
  1. 코드 14곳 grep된 `sendGAEvent` 중 이름 불일치 4건(`checklist_check`/`share`/`outbound_click`/`content_click`)을 일괄 정정 → PR 회귀 면적 큼.
  2. `scroll_without_action`을 카탈로그 §3.E 정의대로 page_type 4종(article/checklist/home/timeline)에서 발사하려면 Layout 또는 page_type별 공용 hook 도입 필요. article 한정 단순안 포기.
- 희생 거부 인용: "사용자가 입력한 값을 임의로 변형·삭제하지 않음. localStorage 스키마 변경 시 마이그레이션 의무" — docs/tech/persona.md §6.3.
- 주장:
  - 카탈로그 rename 4건은 **즉시 rename + 구 이름 발사 즉시 제거**. 근거: G 부분 머지 외 데이터 거의 안 쌓인 단계, 4주 병행은 코드 양 2배 + cleanup 라운드 추가 = 1인 운영자 부담.
  - scroll progress hook은 **`/articles/[slug]` ArticleContent 단일 컴포넌트**에 박는다. Layout-level은 리스트·체크리스트·홈에서 마운트되어 발사 노이즈 + 코드 비용↑. `scroll_without_action.page_type=checklist|home|timeline`은 J의 일부를 phase-4.6으로 이월.
- 잔재 자기검증: 이전 페어 없음 — N

**T2 — [marketer] 반박 입장**
- A 발언에 대한 명시 반박:
  1. **즉시 rename은 §3.6 측정 락인 룰 정면 위반**. `checklist_check`로 이미 발사된 이벤트는 GA4에 영구 잔존 → 컨버전·리텐션 리포트가 두 이름으로 갈라짐. 데이터 적게 쌓였다는 가정 자체가 검증 안 됨(G 머지 후 며칠~수주 누적 가능).
  2. **scroll hook 을 article 한정으로 박으면 J 묶음의 `scroll_without_action` page_type 3종이 미발사**. 카탈로그 §3.E 4종 enum 정의됨, 본 라운드 범위에 J 포함 — 일부를 phase-4.6 이월하면 사용자 명시 "G·H·I·J 한 라운드"와 어긋남.
- 잃는 것: 신/구 병행으로 코드 양 2배 + 4주 후 cleanup 라운드 추가 PR + 공용 hook(`useScrollSignals`)으로 인한 dev 비용 1회 증가.
- 희생 거부 인용: "이벤트명·파라미터 키·user_property 정의 임의 변경/삭제. 신규는 추가만, 변경은 신/구 병행 발사 4주 grace period, 삭제는 사실상 금지" — docs/marketing/persona.md §3.6.
- 주장:
  - 카탈로그 rename 4건은 **신/구 병행 4주** 룰 적용. 새 이름 추가 + 구 이름 유지 → 4주 후 별도 cleanup 라운드에서 구 제거.
  - scroll hook은 **공용 `useScrollSignals` hook**으로 한 곳에서 `article_read_complete`(article만)·`scroll_without_action`(4종 page_type) 둘 다 발사 + page_type 파라미터 분기. 마운트 위치는 Layout 또는 4종 page wrapper.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **rename 처리 방식(즉시 vs 4주 병행) + scroll hook 위치(article 한정 vs 공용 4종)**.
- 숨은 가정: 양쪽 다 "G 묶음 머지 후 데이터 누적 정도"를 모름. PageviewTracker user_properties + `pregnancy_week_set`이 머지된 시점부터 누적량 GA4 콘솔 확인 필요. 데이터 0이면 dev 안 비용↓, 누적 있으면 marketer 안 정당화.

### 페어 2 — designer × marketer

**T0 — 페어 시작 선언**
- 이전 페어 [dev × marketer] 의 양보·합의는 이 페어에 영향 없음.
- designer 인용 후보: "민감 데이터 분석 트래킹·URL 노출 금지" (§3 N3) / "사용자 시간 도둑질 금지 — 5초 이내 가치 도달" (§3 N8)
- marketer 인용 후보: "측정 락인 깨기 금지" (§3.6) / "PII 보호" (§3.1)

**T1 — [designer] 단독 입장**
- 잃는 것:
  1. 카탈로그 §3.C `article_read_complete` 트리거(scroll 75% + dwell 60s + visibility)를 그대로 가져가면 모바일 한국어 본문 + 임산부 사용 패턴(병원 대기실 짧은 진입, 산후 한 손)에서 dwell 60s 미달 false negative 다발.
  2. 같은 페이지뷰에서 `article_read_complete`(완독 = 행동 양성)와 `scroll_without_action`(클릭 0 = 행동 음성)이 동시 발사되면 측정 모델 자기 모순.
- 희생 거부 인용: "임신 중 시각 피로·산후 한 손 사용·휴대폰 외 접근 수단 0" + "진입 후 핵심 가치 도달까지 3 탭 / 5초 이내" — docs/design/persona.md §3 N1·N8.
- 주장:
  - `article_read_complete` 임계치를 **scroll 75% + dwell 30s + visibility=visible**로 완화. 60s → 30s.
  - `scroll_without_action`은 **`article_read_complete` 미발사 페이지뷰에서만** 발사. 동시 발사 케이스 정의상 제거.
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — 직전 페어는 hook 위치/rename 축, 여기는 임계치·정의 분리 축. 단 hook 위치 결정이 본 페어 동시 발사 코드 구현에 닿음.

**T2 — [marketer] 반박 입장**
- A 발언에 대한 명시 반박:
  1. **dwell 60s → 30s 완화는 ga4.md §3.C 본체 정의 변경** — §7 변경 정책상 트리거 조건 변경은 변경 이력 누적 + 신중한 검토 필요. 단순 코드 임계치 변경으로 끝나지 않음.
  2. **30s로 완화하면 인플레이션**(false positive). 도입부 5줄 읽고 떠나는 사용자도 "완독"으로 잡혀 콘텐츠 가치 지표(`article_read_complete`/`article_view`) 자체가 무의미. 임산부 모바일 패턴이 짧다는 가정은 실측 데이터 없음 — 직관.
  3. 동시 발사 케이스를 정의상 제거하면 회색지대 데이터 공백. scroll 60%·dwell 45s·클릭 0 페이지는 read_complete(75%·60s 미달)·scroll_without_action(50%·30s 통과) 어느 쪽도 명확하지 않게 됨.
- 잃는 것: 카탈로그 정의 그대로 유지로 인한 한국어 모바일 false negative 가능성 + 4주 후 임계치 조정 라운드 추가.
- 희생 거부 인용: "이벤트명·파라미터 키·정의 임의 변경. 신규는 추가만" — docs/marketing/persona.md §3.6.
- 주장:
  - 카탈로그 §3.C·§3.E **정의 그대로 유지**. 임계치 조정은 4주 실측 데이터 후 별도 라운드.
  - 동시 발사는 **양립**. 한 페이지뷰에서 둘 다 발사되는 케이스(75%·60s·클릭 0)는 "콘텐츠 가치는 있으나 다음 행동 유도 부재" 신호로 정합. 두 이벤트는 다른 질문에 답함.
- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — 직전 페어가 hook 위치 결정에 닿아 동시 발사 코드 구현 가능성에 영향. 다만 본 페어 정의(임계치·동시 발사 처리)는 hook 위치와 독립.

**T3 — 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **`article_read_complete` 임계치(60s 유지 vs 30s 완화) + 동시 발사 처리(양립 vs scroll_without_action 억제)**.
- 숨은 가정: 양쪽 다 "한국어 모바일 임산부 평균 dwell time"을 실측 안 함. ga4.md §3.C "60s"는 2026-05-03 작성자 추정값, designer "30s"도 추정값. 4주 실측 후 결정 가능한 항목 일부 포함.

## 4. 미해결 트레이드오프

> 옵션 중 하나를 골라 "결정" 영역에 직접 채워 주세요. Claude 가 추측으로 채우지 않습니다.

### [ ] 항목 1 — 카탈로그 이름 정렬 처리 방식

대상 4건:
- `checklist_check` → 카탈로그 `checklist_item_toggle` (ChecklistPage.tsx:177, WeekChecklistSection.tsx:71)
- `share` → 카탈로그 `share_click` (share.ts:37, share.ts:60). enum도 `web_share_api`/`clipboard` 코드 vs `web-share`/`copy-link` 카탈로그.
- `outbound_click` → 카탈로그 `external_link_click` (BabyfairCard.tsx:51). 파라미터 `url`/`event_name` 코드 vs `domain`/`context` 카탈로그.
- `content_click` → 카탈로그 분리 (ArticleCard.tsx:13, VideoCard.tsx:21, VideoCardCompact.tsx:23, ChannelCard.tsx:27).
  - article 카드: 추천 자리(article 하단 RelatedArticles)는 `related_article_click`, 그 외는 `cta_click(cta_id=view_article)`.
  - video/channel 카드: `external_link_click(context=video|channel)`로 흡수.

옵션:
- **옵션 A — 신/구 병행 4주 grace**: 새 이름 발사 추가 + 구 이름 그대로 4주 → 이후 cleanup 라운드에서 구 제거.
  - 즉시 비용: 코드 양 2배(병행), 4주 후 cleanup 라운드 PR 1개 추가, GA4 컨버전 리포트가 두 이름으로 갈라져 임시 혼선.
  - 나중 비용: 측정 락인 §3.6 룰 준수, 데이터 연속성 보존.
- **옵션 B — 즉시 rename**: 구 이름 발사 제거 + 새 이름만 발사. 데이터 미축적 가정.
  - 즉시 비용: 코드 정정 1회, 회귀 면적은 grep된 6개 호출부 한정.
  - 나중 비용: GA4에 이미 쌓인 구 이벤트 데이터 영구 잔존 → 과거 vs 현재 비교 시 이름 매핑 메모 필요. 마케터 §3.6 룰 일시 우회 (운영자 결정 필요).
- **옵션 C — 하이브리드**: 운영자가 GA4 콘솔에서 4건 각각 발사 누적량 확인 → 누적 ≈ 0인 이벤트는 즉시 rename, 누적 있는 이벤트는 4주 병행.
  - 즉시 비용: 운영자 GA4 콘솔 확인 1회 + 4건 분류 + 카테고리별 다른 처리.
  - 나중 비용: 분류 기준 문서화 필요(ga4.md §9 변경 이력에 어느 이벤트가 어느 처리됐는지).

**결정:** _(사용자 작성 영역)_

### [ ] 항목 2 — scroll progress hook 위치

옵션:
- **옵션 A — Layout-level 또는 page_type별 공용 hook (`useScrollSignals`)**: 한 hook에서 `article_read_complete`(article만)·`scroll_without_action`(4종 page_type) 둘 다 발사 + `page_type` 파라미터로 분기. 마운트 위치는 4종 page wrapper 각각(article·checklist·home·timeline) 또는 RootLayout에서 pathname 기반 분기.
  - 즉시 비용: hook 1개 작성 + page_type 매핑 로직 + 4종 페이지 wrapper에 마운트 추가. 본 라운드는 spec까지라 코드는 다음 라운드.
  - 나중 비용: 카탈로그 §3.E `page_type` 4종 enum 모두 발사 가능, 한 곳 수정으로 두 이벤트 정합. J 묶음 본 라운드 완전 처리.
- **옵션 B — article 컴포넌트 한정 hook**: `article_read_complete`만 article에서. `scroll_without_action.page_type=article`도 같이. checklist/home/timeline은 phase-4.6 이월.
  - 즉시 비용: hook 작성 단순(article 한 곳).
  - 나중 비용: `scroll_without_action.page_type=checklist|home|timeline` 미발사 → J 묶음 일부 phase-4.6 이월. 사용자 명시 "G·H·I·J 한 라운드"와 어긋남 → 사용자 결정 필요.

**결정:** _(사용자 작성 영역)_

### [ ] 항목 3 — `article_read_complete` 임계치 + `scroll_without_action`과의 동시 발사 처리

옵션:
- **옵션 A — 카탈로그 §3.C·§3.E 정의 그대로 유지** (read_complete: scroll 75% + dwell 60s + visibility / scroll_without_action: scroll 50% + dwell 30s + 클릭 0). 동시 발사 양립.
  - 즉시 비용: 코드는 카탈로그대로, ga4.md 본체 갱신 0.
  - 나중 비용: 한국어 모바일 임산부 평균 dwell이 60s 미만이면 false negative. 4주 후 데이터로 임계치 조정 라운드 1개 추가.
- **옵션 B — read_complete 임계치 완화 (60s → 30s)** + 동시 발사 시 scroll_without_action 억제.
  - 즉시 비용: ga4.md §3.C 정의 변경 + §9 변경 이력 1줄 + 코드에서 두 hook 발사 로직 상호 의존.
  - 나중 비용: 임계치 완화로 read_complete 인플레이션(false positive) 가능성. scroll_without_action 발사 억제로 일부 진단 신호 감소.
- **옵션 C — read_complete 임계치 그대로 + 동시 발사 시 scroll_without_action 억제**: 카탈로그 §3.C 유지하되 §3.E 트리거 조건에 "AND `article_read_complete` 미발사"를 추가.
  - 즉시 비용: ga4.md §3.E 트리거 조건 추가 + §9 변경 이력 1줄. enum/이름 변경 아니라 §7 정책상 안전(파라미터 추가급).
  - 나중 비용: 진단 신호 일부 감소(완독한 페이지의 scroll_without_action 발사 0). 단 완독 = 행동 양성이라 신호 음성으로 보지 않는 게 정의상 정합.

**결정:** _(사용자 작성 영역)_

### [ ] 항목 4 — `due_date_set` 이벤트 vs user_property 충돌

현재 코드(DueDateInput.tsx:48, DueDateStep.tsx:34)에서 `sendGAEvent("due_date_set", { pregnancy_week })`를 발사. 카탈로그 §2는 `due_date_set`을 user_property로만 정의(PageviewTracker.tsx:16~20에서 `setUserProperties` 호출).

옵션:
- **옵션 A — 이벤트 `due_date_set` 발사 제거**: DueDateInput:48, DueDateStep:34 두 줄 제거. user_property는 PageviewTracker에서 set 유지. 컨버전 마킹은 `pregnancy_week_set`만.
  - 즉시 비용: 코드 2줄 제거. 신/구 병행 룰 적용 모호 — 이름 변경이 아니라 **중복 이벤트 제거**라 §3.6 적용 범위 운영자 판단.
  - 나중 비용: 과거 `due_date_set` 이벤트 데이터 GA4 잔존. 컨버전 마킹된 적 있으면 운영자가 GA4 admin에서 해제.
- **옵션 B — `due_date_set` 이벤트 그대로 유지 + 카탈로그 §3.D에 신규 등재**: GA4는 이벤트와 user_property 네임스페이스 분리 → 충돌 없음 인정.
  - 즉시 비용: ga4.md §3.D 등재 + §9 변경 이력 1줄.
  - 나중 비용: 같은 이름의 user_property와 이벤트 혼선 위험(대시보드에서 어느 쪽 보는지 매번 확인).
- **옵션 C — 이벤트는 다른 이름으로 rename**: `due_date_event_recorded` 같은 명시적 이름. user_property와 동명 회피.
  - 즉시 비용: rename + ga4.md §3.D 등재. 항목 1과 동일한 신/구 병행 vs 즉시 rename 선택지에 포함됨.
  - 나중 비용: 항목 1 결정 따라.

**결정:** _(사용자 작성 영역)_

### [ ] 항목 5 — 카탈로그 외 운영 이벤트 처리

코드에 박힌 카탈로그 외 이벤트(7종 그룹):
- `recommended_item_view`/`check` (TimelineContainer, ChecklistPage, WeekChecklistSection)
- `upcoming_item_view`/`check` (ChecklistItemRow, ChecklistPage)
- `custom_item_add` (ChecklistAddForm, UnifiedAddForm)
- `category_tab_switch` (CategoryFilter)
- `timeline_scroll_depth`, `timeline_week_view` (TimelineContainer, TimelineAccordionCard)
- `onboarding_complete`, `onboarding_due_date_set`, `onboarding_due_date_skip` (OnboardingFlow, DueDateStep)
- `onboarding_banner_view`/`click`/`dismiss` (OnboardingBannerProvider)

옵션:
- **옵션 A — 본 라운드에서 ga4.md §3에 신규 등재**: 카탈로그 ↔ 코드 1:1 정합. spec.md §0 카탈로그 정렬 표에 등재 액션 명시.
  - 즉시 비용: ga4.md §3 신규 항목 7~10개 추가 + §6 enum 점검 + 본 라운드 산출물 부피 증가.
  - 나중 비용: 카탈로그 SoT 정합 → 인계 비용 0. ga4.md §9 변경 이력 누적 1회.
- **옵션 B — 본 라운드는 G·H·I·J 4묶음 wiring 범위만**: 운영 이벤트 카탈로그 등재는 별도 "카탈로그 정합화" 라운드 분리. 본 라운드 spec.md won't에 명시.
  - 즉시 비용: 본 라운드 부피 절감.
  - 나중 비용: 카탈로그 ↔ 코드 미정합 4주+ 지속. 운영자 본인 외 인계 시 의미 추적 비용.
- **옵션 C — 핵심만 등재(`recommended_item_*`, `custom_item_add`) + 나머지 이월**: 운영 이벤트 중 phase-4.5 산출물에서 명시적으로 합의된 것만 본 라운드에 흡수.
  - 즉시 비용: ga4.md §3.B 신규 2~3 항목 + 라운드 부피 적당.
  - 나중 비용: 미흡수 이벤트(`onboarding_banner_*`, `timeline_scroll_depth` 등)는 별도 라운드.

**결정:** _(사용자 작성 영역)_

### [ ] 항목 6 — `external_link_click` rel 처리 (B-5 묶음 O와 정합)

현재 코드 BabyfairCard.tsx에서 `window.open` + `opener=null` 패턴. 카탈로그 §3.E `external_link_click`은 트리거가 `<a target="_blank">` 또는 `rel*=external`.

옵션:
- **옵션 A — 본 라운드 wiring만 (`outbound_click` → `external_link_click` 이름 정렬 + `domain`/`context` 파라미터)**. `rel="noopener noreferrer"` 추가는 묶음 O로 분리.
  - 즉시 비용: BabyfairCard `window.open` + opener=null 그대로 + `external_link_click` 발사 추가. spec.md에 묶음 O placeholder TODO 명시.
  - 나중 비용: 묶음 O까지 rel 처리 미완. `window.open + opener=null`이 이미 보안적으로 안전하나 `<a target="_blank" rel="...">` 표준 정합 미달.
- **옵션 B — 본 라운드 wiring + rel 동시 처리 (묶음 O 일부 흡수)**.
  - 즉시 비용: 묶음 O 범위 일부가 본 라운드로 이동 → 사용자 명시 "L·M은 phase-4.6 선결조건이라 손대지 마"는 L·M 한정이지만 묶음 O는 다른 별도 라운드라 스코프 크리프 가능성.
  - 나중 비용: 묶음 O 라운드의 잔여 작업 명확성 확보.

**결정:** _(사용자 작성 영역)_

## 5. 결정

> 2026-05-10 운영자 결정 (휴먼 게이트 통과).

- **항목 1 — 카탈로그 이름 정렬 처리**: **옵션 A — 신/구 병행 4주 grace**. 새 이름 발사 추가 + 구 이름 발사 4주 유지 → 4주 후 별도 cleanup 라운드에서 구 이름 발사 제거. 마케터 §3.6 측정 락인 룰 정석.
- **항목 2 — scroll progress hook 위치**: **옵션 A — Layout-level/page_type별 공용 hook (`useScrollSignals`)**. 한 hook에서 `article_read_complete`(article만)·`scroll_without_action`(4종 page_type) 둘 다 발사 + page_type 파라미터 분기. J 묶음 본 라운드 완전 처리.
- **항목 3 — read_complete 임계치 + 동시 발사 처리**: **옵션 C — 카탈로그 §3.C 임계치 그대로 유지(scroll 75% + dwell 60s + visibility) + §3.E 트리거 조건에 "AND `article_read_complete` 미발사" 추가**. 정의 변경 없이 트리거 조건만 보강 → §7 정책상 안전. 임계치 조정은 4주 실측 후 별도 라운드.
- **항목 4 — `due_date_set` 이벤트 vs user_property**: **옵션 A — 이벤트 `due_date_set` 발사 제거**. DueDateInput.tsx:48, DueDateStep.tsx:34 두 줄 제거. user_property는 PageviewTracker.tsx:16에서 set 유지. 컨버전 마킹은 `pregnancy_week_set`만. 단 항목 1 결정(4주 병행)에 따라 즉시 제거가 아니라 4주 후 cleanup 라운드에서 함께 제거.
- **항목 5 — 카탈로그 외 운영 이벤트**: **옵션 A — 본 라운드 ga4.md §3에 신규 등재**. 7그룹(`recommended_*`/`upcoming_*`/`custom_item_add`/`category_tab_switch`/`timeline_*`/`onboarding_*`/`onboarding_banner_*`) 모두 카탈로그 SoT 정합화. ga4.md §9 변경 이력 1줄 누적.
- **항목 6 — `external_link_click` rel 처리**: **옵션 A — 본 라운드 wiring만**. `outbound_click` → `external_link_click` 이름 정렬 + `domain`/`context` 파라미터 + `context=video|channel`로 VideoCard·ChannelCard 흡수. `rel="noopener noreferrer"` 추가는 묶음 O 별도 라운드. spec.md에 placeholder TODO 명시.

## 6. 우선순위 영향

- **항목 1 결정이 항목 4와 묶임**: `due_date_set` 이벤트 처리(옵션 C: rename) 선택 시 항목 1과 동일한 신/구 병행 vs 즉시 rename 결정에 포함됨.
- **항목 2 결정이 항목 3 코드 구현에 닿음**: hook 위치(공용 vs article 한정)가 결정되어야 동시 발사 처리 로직이 한 곳에 박힘. 단 정의 자체(임계치·발사 조건)는 항목 2와 독립.
- **항목 5 결정이 ga4.md 부피 결정**: 옵션 A 선택 시 ga4.md §3에 7~10 항목 추가 + §6 enum 점검. 옵션 B 선택 시 ga4.md 부피 절반.
- **항목 6 결정이 묶음 O 라운드 범위에 영향**: 옵션 B 선택 시 묶음 O 라운드의 잔여 작업이 절반 가량 줄어듦. 단 본 라운드 스코프 크리프 위험.
- **phase-4.6 선결조건 동결**: 묶음 L·M은 D1(GA4 Data API service account) 미발급으로 본 라운드 won't 명시 — 결정 사항 아님, 사용자 명시.
