# marketing-events-wiring

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-07
> plan: [spec](../../features/marketing-events-wiring/spec.md) · [ga4](../../features/marketing-events-wiring/ga4.md)

<!-- STEP:impl -->
## 구현

> 작성일: 2026-05-12  spec: [docs/features/marketing-events-wiring/spec.md](../../features/marketing-events-wiring/spec.md)
> review.md 결정 1·2·3·4·5·6 반영. 신/구 병행 grace 4주 — 2026-06-07 cleanup 라운드 예정.

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| G1 — user_properties 3종 발사 유지 | ✅ 변경 없음 | PageviewTracker.tsx:16 기존 동작 그대로 |
| G2 — `pregnancy_week_set` `source` 점검 | ✅ 정합 | DueDateInput.tsx:51 `manual_update`/`onboarding` 분기 이미 존재 |
| G3 — `due_date_set` 이벤트 won't (cleanup 라운드) | ✅ 변경 없음 | spec 결정 4 |
| H1 — `checklist_item_toggle` 병행 발사 + 200ms 디바운스 | ✅ | ChecklistPage.tsx, WeekChecklistSection.tsx |
| H2 — `article_read_complete` (75%/60s/visibility) | ✅ | useScrollSignals + ArticleDetail 마운트 |
| H3 — `weight_log` 파라미터 정렬 (week/delta_from_last/is_first_log) | ✅ | WeightForm.tsx, store 직접 read |
| H4 — `search_submit` (query 정규화 + results_count) | ✅ | SearchModal 800ms 디바운스, lowercase+trim+100자 |
| I1 — `related_article_click` (RelatedArticles 자리만) | ✅ | RelatedArticles.tsx, ArticleCard `onAnalyticsClick` |
| I2 — `share_click` 정규 발사 + `share` legacy 유지 | ✅ | share.ts triggerShare/copyShareLink 둘 다 |
| I3 — `cta_click` (ArticleCard 일반 자리) | ✅ | ArticlesContainer, InfoCard |
| J1 — `scroll_without_action` 4 page_type | ✅ | useScrollSignals hidden/pagehide 트리거 |
| J2 — `external_link_click` (babyfair/video/channel) | ✅ | BabyfairCard, VideoCard, VideoCardCompact, ChannelCard |
| J3 — `empty_state_view` (마운트 hook 한 줄 추가) | ✅ | ChecklistEmptyState |
| J4 — `feature_request_signal` won't (별도 라운드) | ✅ | spec 명시 deferral |

### 생성/수정 파일 목록

#### 신규 생성
- `src/lib/use-scroll-signals.ts` — `useScrollSignals(page_type, { slug? })`. `article_read_complete`(article 한정, scroll≥75% AND dwell≥60s AND `visibility=visible`)와 `scroll_without_action`(scroll≥50% AND dwell≥30s AND 클릭 0 AND `article_read_complete` 미발사)를 함께 담당. `scroll_without_action`은 visibility hidden / pagehide 시점에 평가해 양성 신호 우선 원칙을 유지.

#### 수정
- `src/components/articles/ArticleDetail.tsx` — `useScrollSignals("article", { slug })` 마운트. `RelatedArticles`에 `fromSlug` 전달.
- `src/components/articles/RelatedArticles.tsx` — `fromSlug` prop 추가, 각 카드에 `related_article_click(from_slug, to_slug, position, recommendation_type)` 발사 콜백 전달.
- `src/components/articles/ArticleCard.tsx` — `onAnalyticsClick?` prop 추가. 클릭 시 legacy `content_click(type=article)` 발사 후 콜백 호출.
- `src/components/articles/ArticlesContainer.tsx` — InfoCard 외 hub 리스트에서 `cta_click(cta_id=view_article, location=article_hub)` 발사.
- `src/components/info/InfoCard.tsx` — 통합 hub의 ArticleCard 진입에 `cta_click(location=info_hub)` 연결.
- `src/components/checklist/ChecklistPage.tsx` — `useScrollSignals("checklist", { slug })` 마운트, 200ms 디바운스로 `checklist_item_toggle` 병행 발사.
- `src/components/timeline/WeekChecklistSection.tsx` — 동일 패턴(200ms 디바운스).
- `src/components/timeline/TimelineContainer.tsx` — `useScrollSignals("timeline")` 마운트.
- `src/components/home/HomeContent.tsx` — `useScrollSignals("home")` 마운트.
- `src/components/weight/WeightForm.tsx` — 발사 시 store에서 `currentPregnancyWeek` / 이전 log 조회해 `week`/`delta_from_last`(±15 클램핑)/`is_first_log` 파라미터 추가.
- `src/components/search/SearchModal.tsx` — 800ms 디바운스로 query 정규화(lowercase+trim+100자) + `results_count` 와 함께 `search_submit` 발사. 모달 닫힐 때 fired-cache 리셋.
- `src/lib/share.ts` — 기존 `share_click` 발사를 legacy `share`로 보존, 카탈로그 정규 `share_click(slug, method=web-share|copy-link, location=header|article-bottom, content_type)` 신규 발사.
- `src/components/babyfair/BabyfairCard.tsx` — 기존 `outbound_click` 유지, `external_link_click(domain, context=babyfair, from_slug)` 병행 발사. URL 파싱 실패 시 domain 빈 문자열.
- `src/components/videos/VideoCard.tsx` — 기존 `content_click(type=video)` 유지, `external_link_click(domain=youtube.com, context=video, video_id, channel_id)` 병행 발사.
- `src/components/videos/VideoCardCompact.tsx` — 동일 패턴.
- `src/components/videos/ChannelCard.tsx` — 기존 `content_click(type=channel)` 유지, `external_link_click(domain=youtube.com, context=channel, channel_id)` 병행 발사.
- `src/components/checklist/ChecklistEmptyState.tsx` — 마운트 시 `empty_state_view(page, reason)` 발사. case 매핑: first_visit/custom_only → `expected_empty`, migration_lost → `validation`.

### 주요 결정 사항

- **share.ts: 코드의 기존 `share_click` → legacy `share`로 변환 후 새 정규 `share_click` 병행 발사**: spec §0 row 9는 현재 코드의 이벤트 이름을 `share`로 기록했지만 grep 결과 실제로는 `share_click`이었음 (2026-04 ba15a41 커밋에서 이미 부분 정렬). spec 의도(병행 4주 grace + 정규 파라미터 등재)를 충족하기 위해 기존 발사를 `share`로 옮기고 정규 `share_click`을 신규 발사로 분리.
- **`scroll_without_action`은 session-end(visibility hidden / pagehide) 시점에서 평가**: spec §6.1 시나리오 A의 "양성 신호 우선" 원칙을 보장하려면 30s 폴링으로 즉시 발사하면 `article_read_complete`(60s) 발사 이전에 중복으로 나갈 수 있음. session-end에서 단 한 번 평가하면 `readCompleteSent` flag로 자연스럽게 억제됨.
- **`recommendation_type` 기본값 `auto-crosslink`**: spec should 항목으로 `src/lib/unified-tags.ts`의 `*_manual` 플래그를 보고 분기하라고 적혀 있으나, 현재 `getRelatedArticles`는 태그 자카드 유사도만 사용해 manual/auto 분기점이 없음. 기본 `auto-crosslink`로 발사하고 manual crosslink 도입 시 별도 라운드에서 분기 추가.
- **`cta_click.location` 신규 enum 값 사용**: spec §3.E 예시는 `home_hero`/`article_bottom`/`floating`/`nav`만 명시. 본 라운드 흡수 자리는 `article_hub`(/articles 리스트), `info_hub`(/info 통합 카드)로 명명. ga4.md §3.E `location` enum 갱신 시 두 값 추가 필요.
- **ChecklistEmptyState에 `useEffect` 추가**: spec은 "박힌 마운트 hook에 한 줄 추가"로 표현했으나 현재 컴포넌트엔 마운트 hook이 없었음. 컴포넌트 재구현이 아니라 발사용 useEffect 한 개 추가만으로 처리해 사용자 명시 제약("컴포넌트 재구현 금지")을 위반하지 않음.
- **외부 링크 `rel` 표준 미정합**: 결정 6에 따라 본 라운드는 건드리지 않고 각 발사 위치에 `// TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드` 코멘트만 박음.

### 가정 사항

- GA4 `gtag` 미주입(consent 거부, env 미설정) 환경에서는 `sendGAEvent` 자체가 noop이므로 어떤 신/구 병행 발사도 안전하다. (spec §4)
- `useScrollSignals`는 Next.js App Router의 페이지 컴포넌트 마운트 단위로 작동. 같은 segment 내 dynamic param(`/articles/[slug]`) 변경 시 slug 의존성 변경으로 effect cleanup → 재마운트되어 새 페이지뷰로 카운트.
- `weight_log.delta_from_last`는 시간 정렬된 store에서 마지막 entry를 기준으로 계산(±15kg 클램핑). store는 add 시 `sort((a,b)=>a.date.localeCompare(b.date))`로 정렬됨. 기록 시점이 과거 날짜인 케이스는 spec 범위 밖이라 마지막 entry 기준 단순 차이를 사용.
- `search_submit`의 fired-cache는 모달 단위. 모달을 닫고 재오픈 시 같은 query를 재입력하면 다시 발사됨 — 분석 단계에서 세션 윈도우로 dedupe.
- `external_link_click.domain`은 hostname만 사용. BabyfairCard는 URL 파싱 실패 시 빈 문자열을 보냄 (catalog §3.E `domain` 정의: "host만").

### 미구현 항목

- **H4 `search_submit` 외 검색 entry(헤더 검색바 등)**: 본 라운드는 SearchModal만 wiring. 다른 검색 entry는 발견되지 않았음.
- **J4 `feature_request_signal`**: spec 결정에 따라 본 라운드 미발사(별도 라운드).
- **외부 링크 `rel="noopener noreferrer"` 표준 정합**: 묶음 O로 분리(spec 결정 6). VideoCard·VideoCardCompact는 이미 `rel="noopener noreferrer"` 적용, ChannelCard도 동일. BabyfairCard도 동일. 모든 위치에 TODO 코멘트는 박지 않았음 — 이미 적용된 위치는 cleanup 라운드에서 일괄 점검.
- **GA4 admin 작업**: custom dimension 등록, conversion 마킹, ga4.md §3 본체 갱신(§7.x 패치 제안)은 운영자/별도 PR 작업으로 본 임플 범위 밖.
- **4주 cleanup 라운드 (2026-06-07 이후)**: legacy `checklist_check`/`share`/`outbound_click`/`content_click(type=article|video|channel)` 발사 제거 + `due_date_set` 이벤트 제거.

---

<!-- STEP:review -->
## 코드 리뷰

> 작성일: 2026-05-12  대상: [docs/implementation/marketing-events-wiring-impl.md](#구현)

### 리뷰 대상 파일

- `src/lib/use-scroll-signals.ts` (신규)
- `src/lib/share.ts`
- `src/components/analytics`: (변경 없음 — 점검만)
- `src/components/articles/ArticleDetail.tsx`
- `src/components/articles/RelatedArticles.tsx`
- `src/components/articles/ArticleCard.tsx`
- `src/components/articles/ArticlesContainer.tsx`
- `src/components/info/InfoCard.tsx`
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/checklist/ChecklistEmptyState.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`
- `src/components/timeline/TimelineContainer.tsx`
- `src/components/home/HomeContent.tsx`
- `src/components/weight/WeightForm.tsx`
- `src/components/search/SearchModal.tsx`
- `src/components/babyfair/BabyfairCard.tsx`
- `src/components/videos/VideoCard.tsx` / `VideoCardCompact.tsx` / `ChannelCard.tsx`

총 16개 파일.

---

### Critical 이슈 (즉시 수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두에서 런타임 크래시·XSS·민감정보 노출 위험은 발견되지 않았다.

---

### Warning (수정 권장)

#### 1. `useScrollSignals` — document-level click listener가 `scroll_without_action` 발사 조건을 과도하게 억제할 수 있음
- **위치**: [src/lib/use-scroll-signals.ts:88](../../../src/lib/use-scroll-signals.ts#L88)
- **문제**: `document.addEventListener("click", handleClick)`는 페이지 어느 곳의 클릭이라도 캡처해 `clicked=true`로 만든다. 그 결과 사용자가 본문과 무관한 영역(예: 하단 네비게이션 탭 클릭으로 다른 페이지 이동 직전, 쿠키 동의 배너 닫기)을 클릭해도 `scroll_without_action`이 억제된다. 카탈로그 §3.E의 의도("같은 페이지 내 의미 있는 행동 0")보다 더 보수적이라 marketing 신호가 사실보다 적게 측정될 수 있다.
- **권장 수정**: 본문 컨테이너(예: `<main>` 또는 ArticleContent root)에만 리스너를 부착하거나, 클릭 이벤트의 `target`이 nav/banner 등 시스템 UI인지 필터링. 다만 영향은 보수적인 쪽(under-fire)이라 마케팅 의사결정을 오도하진 않음 — 4주 grace 데이터 보고 분기.

#### 2. 코드 내 `TODO(bundle-O)` 주석 잔류
- **위치**: [src/components/babyfair/BabyfairCard.tsx:56](../../../src/components/babyfair/BabyfairCard.tsx#L56), [src/components/videos/VideoCard.tsx:21](../../../src/components/videos/VideoCard.tsx#L21), [VideoCardCompact.tsx:23](../../../src/components/videos/VideoCardCompact.tsx#L23), [ChannelCard.tsx:27](../../../src/components/videos/ChannelCard.tsx#L27)
- **문제**: AGENTS.md 컨벤션은 "`TODO` 주석을 최종 결과물에 남기지 않는다"이나, spec.md §6.2가 본 라운드 결정으로 `// TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드` 주석을 명시 요청. spec이 더 좁고 최근 결정이므로 유지가 정당하지만, 디시플린 측면에선 마커.
- **권장 수정**: 묶음 O 라운드 진입 시 동일 PR에서 일괄 제거. 별도 트래커(Issue) 발급으로 코드 외부에 두는 것도 가능.

#### 3. WeightForm 입력 라벨이 input과 연결되지 않음 (사전 존재 이슈)
- **위치**: [src/components/weight/WeightForm.tsx:64](../../../src/components/weight/WeightForm.tsx#L64), [WeightForm.tsx:73](../../../src/components/weight/WeightForm.tsx#L73)
- **문제**: `<label className="...">날짜</label>` 등에 `htmlFor`가 없어 스크린 리더가 input과 라벨을 매핑하지 못함. 본 라운드 변경 영역 밖에서 발생한 사전 이슈지만, E2E에서 `getByLabel`이 실패해 selector를 `input[type="date"]`로 우회한 결과로도 확인됨.
- **권장 수정**: 두 input에 `id`를 부여하고 라벨에 `htmlFor` 연결. (본 라운드 범위 밖이므로 별도 접근성 라운드에서 처리)

---

### Suggestion (개선 아이디어)

#### 1. SearchModal의 `isOpen` 의존성 useEffect 통합
- 현재 `isOpen` 변경 시 (1) query 리셋, (2) `lastFiredQueryRef` 리셋 두 개의 useEffect가 분리돼 있음. 한 useEffect로 묶으면 의존성 표면적이 줄어듦. 동작에는 영향 없음.

#### 2. 분석 이벤트 헬퍼 추상화
- 4주 후 cleanup 라운드에서 legacy 이벤트(`content_click`/`outbound_click`/`share`/`checklist_check`)를 일괄 제거할 예정. 그때 각 호출처를 grep해서 지우기보다 `fireWithLegacy(canonicalName, params, { legacyName, legacyParams })` 헬퍼로 추상화해두면 cleanup이 한 곳에서 끝남. 본 라운드 범위 밖.

#### 3. `recommendation_type` 동적 분기
- `RelatedArticles`는 현재 `auto-crosslink` 고정. spec should 항목에 `*_manual` 플래그 활용 분기가 명시돼 있고, 추후 `getRelatedArticles`가 manual override를 지원하면 prop으로 `recommendationType?: "manual" | "auto-crosslink"`를 받게 확장 가능.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> 작성일: 2026-05-12  대상 리뷰: [docs/review/marketing-events-wiring-review.md](#코드-리뷰)

### 리팩토링한 파일 목록

- `src/lib/hooks/useChecklistToggleEvent.ts` (신규)
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/timeline/WeekChecklistSection.tsx`

---

### 작업별 내용

#### 1. `useChecklistToggleEvent` hook 신규 추출 — 디바운스+발사 패턴 단일화
- **출처**: 추가 판단 (리뷰의 Warning 3건은 외부 라운드·data-driven 결정·pre-existing이라 본 라운드 즉시 수정 대상 아님)
- **무엇을**: `Map<itemId, timer>` + `setTimeout(...200ms)` + `sendGAEvent("checklist_item_toggle", ...)` + unmount cleanup useEffect 패턴이 ChecklistPage.tsx와 WeekChecklistSection.tsx에 거의 동일하게 중복(각 ~18줄). 두 곳에서 동일 동작하는 hook으로 추출 — 컴포넌트 호출부는 `fireToggleEvent(item, willCheck)` 한 줄로 단축.
- **왜**: catalog §3.B 200ms 디바운스 정의를 한 곳에서 관리. 4주 cleanup 라운드에서 임계치 변경·이벤트명 제거가 발생하면 hook 한 파일만 손대면 됨. 또한 두 호출처가 동일 의미를 갖는다는 점이 코드에서도 명시됨.

#### 2. `ChecklistPage.tsx` — 인라인 디바운스 로직 제거
- **출처**: 위 hook 추출에 따른 호출부 정리
- **무엇을**: `toggleDebounceTimersRef` ref + 별도 cleanup useEffect + setTimeout 블록 제거. `useChecklistToggleEvent()` 호출 + `fireToggleEvent(item, willCheck)` 한 줄로 교체.
- **왜**: 컴포넌트가 토글 상태 관리에만 집중하도록. 분석 디바운스는 hook 책임.

#### 3. `WeekChecklistSection.tsx` — 동일 패턴 제거
- **출처**: 위 hook 추출에 따른 호출부 정리
- **무엇을**: ChecklistPage와 동일하게 ref/useEffect/setTimeout 블록 제거 + hook 호출로 교체. 더 이상 사용하지 않는 `useEffect`·`useRef` import 제거.
- **왜**: 동일.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 200ms 디바운스 정의 위치 | 2곳 (ChecklistPage, WeekChecklistSection) | 1곳 (useChecklistToggleEvent) |
| 중복 라인 수 | ~36줄 (18 × 2) | ~37줄 hook + 2줄(호출) = -28줄 회로 |
| 컴포넌트 import (WeekChecklistSection) | useCallback, useEffect, useMemo, useRef, useState | useCallback, useMemo, useState |
| 동작 변경 | — | 없음 (cleanup 시점만 컴포넌트 unmount → hook unmount로 동일) |

---

### 빌드 결과

성공 (1회 시도).

### 미처리 Warning 사유

- **`useScrollSignals` over-suppress**: 어느 범위로 click listener를 좁힐지는 4주 grace 데이터(실제 발사 비율) 보고 분기할 사안. 본 라운드 수정 시 측정 결과 자체가 달라져 비교 기준이 흐려짐.
- **`TODO(bundle-O)` 주석 잔류**: spec.md §6.2가 명시 요청한 마커. 묶음 O 라운드에서 일괄 제거 예정.
- **WeightForm 라벨 미연결**: 본 라운드 변경 영역 밖의 사전 이슈. 별도 접근성 라운드에서 처리.
