# marketing-events-wiring Implementation

> 작성일: 2026-05-12  spec: [docs/features/marketing-events-wiring/spec.md](../features/marketing-events-wiring/spec.md)
> review.md 결정 1·2·3·4·5·6 반영. 신/구 병행 grace 4주 — 2026-06-07 cleanup 라운드 예정.

## 완료 조건 충족 여부

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

## 생성/수정 파일 목록

### 신규 생성
- `src/lib/use-scroll-signals.ts` — `useScrollSignals(page_type, { slug? })`. `article_read_complete`(article 한정, scroll≥75% AND dwell≥60s AND `visibility=visible`)와 `scroll_without_action`(scroll≥50% AND dwell≥30s AND 클릭 0 AND `article_read_complete` 미발사)를 함께 담당. `scroll_without_action`은 visibility hidden / pagehide 시점에 평가해 양성 신호 우선 원칙을 유지.

### 수정
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

## 주요 결정 사항

- **share.ts: 코드의 기존 `share_click` → legacy `share`로 변환 후 새 정규 `share_click` 병행 발사**: spec §0 row 9는 현재 코드의 이벤트 이름을 `share`로 기록했지만 grep 결과 실제로는 `share_click`이었음 (2026-04 ba15a41 커밋에서 이미 부분 정렬). spec 의도(병행 4주 grace + 정규 파라미터 등재)를 충족하기 위해 기존 발사를 `share`로 옮기고 정규 `share_click`을 신규 발사로 분리.
- **`scroll_without_action`은 session-end(visibility hidden / pagehide) 시점에서 평가**: spec §6.1 시나리오 A의 "양성 신호 우선" 원칙을 보장하려면 30s 폴링으로 즉시 발사하면 `article_read_complete`(60s) 발사 이전에 중복으로 나갈 수 있음. session-end에서 단 한 번 평가하면 `readCompleteSent` flag로 자연스럽게 억제됨.
- **`recommendation_type` 기본값 `auto-crosslink`**: spec should 항목으로 `src/lib/unified-tags.ts`의 `*_manual` 플래그를 보고 분기하라고 적혀 있으나, 현재 `getRelatedArticles`는 태그 자카드 유사도만 사용해 manual/auto 분기점이 없음. 기본 `auto-crosslink`로 발사하고 manual crosslink 도입 시 별도 라운드에서 분기 추가.
- **`cta_click.location` 신규 enum 값 사용**: spec §3.E 예시는 `home_hero`/`article_bottom`/`floating`/`nav`만 명시. 본 라운드 흡수 자리는 `article_hub`(/articles 리스트), `info_hub`(/info 통합 카드)로 명명. ga4.md §3.E `location` enum 갱신 시 두 값 추가 필요.
- **ChecklistEmptyState에 `useEffect` 추가**: spec은 "박힌 마운트 hook에 한 줄 추가"로 표현했으나 현재 컴포넌트엔 마운트 hook이 없었음. 컴포넌트 재구현이 아니라 발사용 useEffect 한 개 추가만으로 처리해 사용자 명시 제약("컴포넌트 재구현 금지")을 위반하지 않음.
- **외부 링크 `rel` 표준 미정합**: 결정 6에 따라 본 라운드는 건드리지 않고 각 발사 위치에 `// TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드` 코멘트만 박음.

## 가정 사항

- GA4 `gtag` 미주입(consent 거부, env 미설정) 환경에서는 `sendGAEvent` 자체가 noop이므로 어떤 신/구 병행 발사도 안전하다. (spec §4)
- `useScrollSignals`는 Next.js App Router의 페이지 컴포넌트 마운트 단위로 작동. 같은 segment 내 dynamic param(`/articles/[slug]`) 변경 시 slug 의존성 변경으로 effect cleanup → 재마운트되어 새 페이지뷰로 카운트.
- `weight_log.delta_from_last`는 시간 정렬된 store에서 마지막 entry를 기준으로 계산(±15kg 클램핑). store는 add 시 `sort((a,b)=>a.date.localeCompare(b.date))`로 정렬됨. 기록 시점이 과거 날짜인 케이스는 spec 범위 밖이라 마지막 entry 기준 단순 차이를 사용.
- `search_submit`의 fired-cache는 모달 단위. 모달을 닫고 재오픈 시 같은 query를 재입력하면 다시 발사됨 — 분석 단계에서 세션 윈도우로 dedupe.
- `external_link_click.domain`은 hostname만 사용. BabyfairCard는 URL 파싱 실패 시 빈 문자열을 보냄 (catalog §3.E `domain` 정의: "host만").

## 미구현 항목

- **H4 `search_submit` 외 검색 entry(헤더 검색바 등)**: 본 라운드는 SearchModal만 wiring. 다른 검색 entry는 발견되지 않았음.
- **J4 `feature_request_signal`**: spec 결정에 따라 본 라운드 미발사(별도 라운드).
- **외부 링크 `rel="noopener noreferrer"` 표준 정합**: 묶음 O로 분리(spec 결정 6). VideoCard·VideoCardCompact는 이미 `rel="noopener noreferrer"` 적용, ChannelCard도 동일. BabyfairCard도 동일. 모든 위치에 TODO 코멘트는 박지 않았음 — 이미 적용된 위치는 cleanup 라운드에서 일괄 점검.
- **GA4 admin 작업**: custom dimension 등록, conversion 마킹, ga4.md §3 본체 갱신(§7.x 패치 제안)은 운영자/별도 PR 작업으로 본 임플 범위 밖.
- **4주 cleanup 라운드 (2026-06-07 이후)**: legacy `checklist_check`/`share`/`outbound_click`/`content_click(type=article|video|channel)` 발사 제거 + `due_date_set` 이벤트 제거.
