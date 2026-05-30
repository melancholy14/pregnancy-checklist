# marketing-events-wiring 코드 리뷰

> 작성일: 2026-05-12  대상: [docs/implementation/marketing-events-wiring-impl.md](../implementation/marketing-events-wiring-impl.md)

## 리뷰 대상 파일

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

## Critical 이슈 (즉시 수정 완료)

없음. 4가지 관점(타입 안전성·성능·보안·접근성) 모두에서 런타임 크래시·XSS·민감정보 노출 위험은 발견되지 않았다.

---

## Warning (수정 권장)

### 1. `useScrollSignals` — document-level click listener가 `scroll_without_action` 발사 조건을 과도하게 억제할 수 있음
- **위치**: [src/lib/use-scroll-signals.ts:88](../../src/lib/use-scroll-signals.ts#L88)
- **문제**: `document.addEventListener("click", handleClick)`는 페이지 어느 곳의 클릭이라도 캡처해 `clicked=true`로 만든다. 그 결과 사용자가 본문과 무관한 영역(예: 하단 네비게이션 탭 클릭으로 다른 페이지 이동 직전, 쿠키 동의 배너 닫기)을 클릭해도 `scroll_without_action`이 억제된다. 카탈로그 §3.E의 의도("같은 페이지 내 의미 있는 행동 0")보다 더 보수적이라 marketing 신호가 사실보다 적게 측정될 수 있다.
- **권장 수정**: 본문 컨테이너(예: `<main>` 또는 ArticleContent root)에만 리스너를 부착하거나, 클릭 이벤트의 `target`이 nav/banner 등 시스템 UI인지 필터링. 다만 영향은 보수적인 쪽(under-fire)이라 마케팅 의사결정을 오도하진 않음 — 4주 grace 데이터 보고 분기.

### 2. 코드 내 `TODO(bundle-O)` 주석 잔류
- **위치**: [src/components/babyfair/BabyfairCard.tsx:56](../../src/components/babyfair/BabyfairCard.tsx#L56), [src/components/videos/VideoCard.tsx:21](../../src/components/videos/VideoCard.tsx#L21), [VideoCardCompact.tsx:23](../../src/components/videos/VideoCardCompact.tsx#L23), [ChannelCard.tsx:27](../../src/components/videos/ChannelCard.tsx#L27)
- **문제**: AGENTS.md 컨벤션은 "`TODO` 주석을 최종 결과물에 남기지 않는다"이나, spec.md §6.2가 본 라운드 결정으로 `// TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드` 주석을 명시 요청. spec이 더 좁고 최근 결정이므로 유지가 정당하지만, 디시플린 측면에선 마커.
- **권장 수정**: 묶음 O 라운드 진입 시 동일 PR에서 일괄 제거. 별도 트래커(Issue) 발급으로 코드 외부에 두는 것도 가능.

### 3. WeightForm 입력 라벨이 input과 연결되지 않음 (사전 존재 이슈)
- **위치**: [src/components/weight/WeightForm.tsx:64](../../src/components/weight/WeightForm.tsx#L64), [WeightForm.tsx:73](../../src/components/weight/WeightForm.tsx#L73)
- **문제**: `<label className="...">날짜</label>` 등에 `htmlFor`가 없어 스크린 리더가 input과 라벨을 매핑하지 못함. 본 라운드 변경 영역 밖에서 발생한 사전 이슈지만, E2E에서 `getByLabel`이 실패해 selector를 `input[type="date"]`로 우회한 결과로도 확인됨.
- **권장 수정**: 두 input에 `id`를 부여하고 라벨에 `htmlFor` 연결. (본 라운드 범위 밖이므로 별도 접근성 라운드에서 처리)

---

## Suggestion (개선 아이디어)

### 1. SearchModal의 `isOpen` 의존성 useEffect 통합
- 현재 `isOpen` 변경 시 (1) query 리셋, (2) `lastFiredQueryRef` 리셋 두 개의 useEffect가 분리돼 있음. 한 useEffect로 묶으면 의존성 표면적이 줄어듦. 동작에는 영향 없음.

### 2. 분석 이벤트 헬퍼 추상화
- 4주 후 cleanup 라운드에서 legacy 이벤트(`content_click`/`outbound_click`/`share`/`checklist_check`)를 일괄 제거할 예정. 그때 각 호출처를 grep해서 지우기보다 `fireWithLegacy(canonicalName, params, { legacyName, legacyParams })` 헬퍼로 추상화해두면 cleanup이 한 곳에서 끝남. 본 라운드 범위 밖.

### 3. `recommendation_type` 동적 분기
- `RelatedArticles`는 현재 `auto-crosslink` 고정. spec should 항목에 `*_manual` 플래그 활용 분기가 명시돼 있고, 추후 `getRelatedArticles`가 manual override를 지원하면 prop으로 `recommendationType?: "manual" | "auto-crosslink"`를 받게 확장 가능.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 3건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |
