# marketing-events-wiring

> 작성일: 2026-05-12 | 작성자: Claude Code
> spec: [docs/features/marketing-events-wiring/spec.md](../features/marketing-events-wiring/spec.md) · review.md 결정 1·2·3·4·5·6 반영

## 개요

phase-4.5 마케팅 측정 모델(3층 지표 트리·코호트 리텐션)이 정립된 상태에서 카탈로그(ga4.md)와 코드 사이 드리프트 4건 + 미발사 7개 + 미등재 운영 이벤트 7그룹을 해소하는 wiring 라운드. 사용자 가시 변경 0, 측정 인프라 정합성만 끌어올려 4주 후 phase-4.6 자동 주간 리포트 진입을 가능하게 한다. 묶음 G·H·I·J를 모두 다루며 신/구 이벤트 병행 4주 grace를 적용한다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| G1 — user_properties 3종 발사 유지 | ✅ 변경 없음 | PageviewTracker.tsx:16 그대로 |
| G2 — `pregnancy_week_set` `source` 점검 | ✅ 정합 | DueDateInput.tsx:51 `manual_update`/`onboarding` 분기 존재 |
| G3 — `due_date_set` 이벤트 won't | ✅ 변경 없음 | 결정 4 — 4주 cleanup 라운드 처리 |
| H1 — `checklist_item_toggle` 병행 + 200ms 디바운스 | ✅ | ChecklistPage, WeekChecklistSection — 리팩토링 후 hook으로 통합 |
| H2 — `article_read_complete` (75%/60s/visibility) | ✅ | useScrollSignals + ArticleDetail 마운트 |
| H3 — `weight_log` 파라미터 정렬 | ✅ | week / delta_from_last(±15 클램핑) / is_first_log |
| H4 — `search_submit` (정규화 + results_count) | ✅ | SearchModal 800ms 디바운스, lowercase+trim+100자 |
| I1 — `related_article_click` (RelatedArticles 자리만) | ✅ | onAnalyticsClick override 패턴 |
| I2 — `share_click` 정규 + `share` legacy | ✅ | triggerShare/copyShareLink 모두 |
| I3 — `cta_click` (ArticleCard 일반 자리) | ✅ | ArticlesContainer, InfoCard |
| J1 — `scroll_without_action` 4 page_type | ✅ | useScrollSignals hidden/pagehide 트리거 |
| J2 — `external_link_click` 흡수 | ✅ | BabyfairCard, VideoCard, VideoCardCompact, ChannelCard |
| J3 — `empty_state_view` (발사만) | ✅ | ChecklistEmptyState 마운트 hook |
| J4 — `feature_request_signal` won't | ✅ | spec 명시 deferral |

### 생성/수정 파일

**신규**
- `src/lib/use-scroll-signals.ts` — `useScrollSignals(pageType, { slug? })`. `article_read_complete`(article 한정)와 `scroll_without_action`(visibility hidden / pagehide 시점 평가)을 같은 hook이 담당.
- `src/lib/hooks/useChecklistToggleEvent.ts` — (리팩토링) `checklist_item_toggle` 200ms 디바운스 + 발사 단일화.

**수정 (16개)**
- `src/components/articles/ArticleDetail.tsx` — `useScrollSignals("article", { slug })` + RelatedArticles에 fromSlug 전달
- `src/components/articles/RelatedArticles.tsx` — fromSlug prop, `related_article_click` 콜백
- `src/components/articles/ArticleCard.tsx` — `onAnalyticsClick?` prop 추가 (legacy `content_click` 유지)
- `src/components/articles/ArticlesContainer.tsx` — `cta_click(location=article_hub)`
- `src/components/info/InfoCard.tsx` — `cta_click(location=info_hub)`
- `src/components/checklist/ChecklistPage.tsx` — useScrollSignals + checklist_item_toggle 발사 (hook 사용)
- `src/components/checklist/ChecklistEmptyState.tsx` — `empty_state_view` 마운트 발사
- `src/components/timeline/WeekChecklistSection.tsx` — checklist_item_toggle 발사 (hook 사용)
- `src/components/timeline/TimelineContainer.tsx` — useScrollSignals("timeline")
- `src/components/home/HomeContent.tsx` — useScrollSignals("home")
- `src/components/weight/WeightForm.tsx` — week / delta_from_last / is_first_log 파라미터 추가
- `src/components/search/SearchModal.tsx` — search_submit 정규화 + 디바운스
- `src/lib/share.ts` — legacy `share` + canonical `share_click` 병행
- `src/components/babyfair/BabyfairCard.tsx` — `external_link_click(context=babyfair)`
- `src/components/videos/VideoCard.tsx`, `VideoCardCompact.tsx`, `ChannelCard.tsx` — `external_link_click(context=video|channel)`

### 주요 결정 사항

- **share.ts 처리**: 기존 코드가 이미 `share_click` 이름을 쓰고 있어 spec과 어긋남. 기존 발사를 `share`(legacy)로 옮기고 정규 파라미터의 새 `share_click`을 추가해 4주 grace + 카탈로그 정합을 모두 달성.
- **`scroll_without_action` 트리거 시점**: 30s 폴링이 아닌 visibility hidden / pagehide 시점에 단 한 번 평가. `readCompleteSent` 플래그로 양성 신호 우선 보장 (spec 시나리오 A).
- **`recommendation_type` 기본값**: `auto-crosslink` 고정. `*_manual` 플래그 분기는 manual crosslink 도입 시 별도 라운드.
- **`cta_click.location` 신규 enum 값**: `article_hub`, `info_hub` — ga4.md §3.E `location` enum 갱신 필요.
- **ChecklistEmptyState에 useEffect 추가**: spec의 "박힌 마운트 hook에 한 줄 추가" 표현은 실제 hook이 없었기 때문에 useEffect 한 개로 처리 (재구현 아님).
- **외부 링크 rel 표준 미정합**: 묶음 O로 분리 — 발사 위치에 `// TODO(bundle-O)` 마커만.

### 가정 사항

- `gtag` 미주입 환경(consent 거부, env 미설정)에서는 `sendGAEvent` noop이라 신/구 병행 발사 안전.
- `useScrollSignals`는 페이지 컴포넌트 마운트 단위로 작동. `/articles/[slug]` slug 변경 시 cleanup → 재마운트로 새 페이지뷰 카운트.
- `weight_log.delta_from_last`는 시간 정렬된 store의 마지막 entry 기준 ±15kg 클램핑.
- `search_submit` fired-cache는 모달 단위. 모달 재오픈 시 같은 query 재발사 가능 — 분석 단계에서 세션 윈도우로 dedupe.

### 미구현 항목

- H4 외 검색 entry(헤더 검색바 등) — 현재 검색은 SearchModal만.
- J4 `feature_request_signal` — 별도 라운드.
- 외부 링크 `rel="noopener noreferrer"` 표준 정합 — 묶음 O로 분리.
- ga4.md §3 본체 갱신(§7.x 패치 제안) — 운영자/별도 PR.
- 4주 cleanup 라운드 (2026-06-07 이후) — legacy 4건(`checklist_check`/`share`/`outbound_click`/`content_click`) 제거 + `due_date_set` 이벤트 제거.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성)에서 런타임 크래시·XSS·민감정보 노출 위험 발견되지 않음.

### Warning (수정 권장)

1. **`useScrollSignals` document-level click listener over-suppress 가능성** — nav/banner 클릭까지 캡처해 `scroll_without_action` 발사를 보수적으로 만듦. 4주 grace 데이터 보고 본문 컨테이너 한정 / target 필터 결정.
2. **`TODO(bundle-O)` 주석 4곳 잔류** — AGENTS.md "TODO 금지"와 spec.md §6.2 명시 요청이 충돌. 묶음 O 라운드에서 일괄 제거.
3. **WeightForm 라벨 미연결** — 사전 이슈. 본 라운드 범위 밖, 별도 접근성 라운드.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록

1. **`useChecklistToggleEvent` hook 신규 추출** — `Map<itemId, timer>` + 200ms `setTimeout` + `sendGAEvent("checklist_item_toggle", ...)` + unmount cleanup이 ChecklistPage·WeekChecklistSection에 동일 중복(각 ~18줄). 한 hook으로 단일화해 200ms 정의를 한 곳에서 관리, 4주 cleanup 시 임계치/이벤트명 변경이 한 파일로 끝나도록.
2. **ChecklistPage.tsx 인라인 디바운스 제거** — `fireToggleEvent(item, willCheck)` 한 줄로 교체.
3. **WeekChecklistSection.tsx 동일 패턴 제거** — 사용 안 하게 된 `useEffect`·`useRef` import도 정리.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 200ms 디바운스 정의 위치 | 2곳 (ChecklistPage, WeekChecklistSection) | 1곳 (useChecklistToggleEvent) |
| 중복 라인 수 | ~36줄 (18 × 2) | ~37줄 hook + 2줄 호출 |
| 동작 변경 | — | 없음 (cleanup 시점도 컴포넌트 unmount → hook unmount로 동일) |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 8개 passed |
| Error/Validation | ✅ 3개 passed |
| 권한/인증 | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **13 passed / 0 failed** |

리팩토링(`useChecklistToggleEvent` 추출) 후에도 13/13 통과 — checklist_item_toggle 발사 횟수·페이로드 동일 확인.

📊 상세 리포트: [playwright-report/index.html](../../playwright-report/index.html)
📄 테스트 파일: [e2e/marketing-events-wiring.spec.ts](../../e2e/marketing-events-wiring.spec.ts)
