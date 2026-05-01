# info-tab-integration 코드 리뷰

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> Impl: [../implementation/info-tab-integration-impl.md](../implementation/info-tab-integration-impl.md)
> Date: 2026-05-01

---

## 리뷰 대상 파일

**신규 (6)**

- `src/lib/unified-tags.ts`
- `src/types/info.ts`
- `src/components/info/InfoCard.tsx`
- `src/components/info/InfoContainer.tsx`
- `src/components/videos/VideoCardCompact.tsx`
- `src/app/info/page.tsx`

**수정 (9)**

- `src/app/articles/page.tsx`
- `src/app/videos/page.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/lib/search.ts`
- `src/components/home/HomeContent.tsx`
- `src/components/articles/ArticleDetail.tsx`
- `src/components/timeline/RelatedVideosLink.tsx`
- `src/components/checklist/ChecklistRelatedContent.tsx`
- `src/app/sitemap.ts`

총 15개 파일.

---

## Critical 이슈 (즉시 수정 완료)

없음.

타입 안전성·성능·보안·접근성 4가지 관점 모두에서 즉시 수정해야 할 런타임 위험·보안 결함·크래시 유발 코드는 발견되지 않았습니다.

---

## Warning (수정 권장)

### 1. InfoContainer — hash-scroll useEffect가 필터 변경 시마다 재실행됨

- **위치**: [src/components/info/InfoContainer.tsx:94-112](src/components/info/InfoContainer.tsx#L94-L112)
- **문제**: 의존성 배열이 `[activeTab, visibleItems]`이라 통합 태그 필터를 적용/해제할 때마다 `visibleItems`가 갱신되고, hash-scroll 효과가 다시 실행됨. 사용자가 `/info?tab=videos#video_001`로 진입한 뒤 태그 칩을 눌러 필터링할 때마다 스크롤이 다시 점프하고 ring 하이라이트가 반복적으로 깜빡일 가능성. 크래시는 아니지만 UX가 어색함.
- **권장 수정**: hash 처리는 마운트(또는 활성 탭 변경) 시 1회만 실행하도록 의존성을 `[activeTab]`로 축소하거나, hash를 한 번 처리한 뒤 `useRef`로 처리 완료 플래그를 두는 방식. 추가로 처리 후 `history.replaceState(null, '', pathname + search)`로 hash를 제거하면 재방문 시에도 영향 없음.

### 2. InfoContainer — 탭이 `role="tab"`만 두고 `tabpanel`/`aria-controls`가 없음

- **위치**: [src/components/info/InfoContainer.tsx:125-146](src/components/info/InfoContainer.tsx#L125-L146)
- **문제**: WAI-ARIA tab 패턴은 `role="tab"` 버튼이 `aria-controls="<panel-id>"`로 패널을 가리키고, 컨텐츠 영역이 `role="tabpanel"`로 마크되어야 완성됨. 현재는 버튼만 `tab`/`tablist`로 마크되어 스크린리더가 "이 탭이 어느 영역을 제어하는지" 알 수 없음. e2e 테스트는 통과하나 접근성 의도가 절반만 구현됨.
- **권장 수정**: 카드 리스트 컨테이너에 `id="info-panel"`, `role="tabpanel"`, `aria-labelledby="<active-tab-id>"`를 부여하고, 각 탭 버튼에 `id`와 `aria-controls="info-panel"`을 추가. 또는 ARIA 의도가 단순 "토글 그룹" 수준이면 `role="tab"`/`aria-selected`를 제거하고 `aria-pressed`로 통일.

### 3. InfoContainer — searchParams useEffect와 useState 초기화가 중복

- **위치**: [src/components/info/InfoContainer.tsx:42-49](src/components/info/InfoContainer.tsx#L42-L49)
- **문제**: 마운트 시 `useState`가 `searchParams.get("tab")`로 초기 탭을 설정한 직후, `useEffect([searchParams])`가 동일 값으로 `setActiveTab`을 한 번 더 호출. 로직상 무해하지만 한 번의 추가 렌더가 발생.
- **권장 수정**: useEffect를 제거하고, 사용자가 직접 탭 전환 후 브라우저 뒤로가기로 URL이 바뀌는 케이스가 필요하면 `useEffect`의 트리거를 `searchParams.toString()` 비교로 좁히거나 그 케이스만 처리. 가장 단순한 대안: `useEffect` 제거.

### 4. info/page.tsx — JSON 임포트에 `as` 타입 단언 사용

- **위치**: [src/app/info/page.tsx:28-29](src/app/info/page.tsx#L28-L29)
- **문제**: `videoData as VideoItem[]`, `channelData as ChannelItem[]` 타입 단언은 `videos.json`/`channels.json`의 실제 구조가 타입과 어긋나도 컴파일 에러를 잡지 못함. 특히 `VideoCategory` 타입은 `'exercise' | 'birth_prep' | 'newborn_care'` 3종만 정의되어 있는데 실제 JSON에는 7종 카테고리(`pregnancy_health`, `prenatal_checkup`, `nutrition`, `policy` 포함)가 존재. 단언으로 타입 불일치가 가려진 상태.
- **권장 수정**: 기존 `/videos/page.tsx`도 같은 패턴이라 프로젝트 전반의 약속이므로 단독 수정은 부담. 다만 `src/types/video.ts`의 `VideoCategory` union을 실제 데이터에 맞춰 7종으로 확장하면 단언이 정합성을 회복함. 또는 zod 등 런타임 검증을 도입(Phase 5 영역).

---

## Suggestion (개선 아이디어)

### 1. BottomNav — 활성 항목에 `aria-current="page"`

활성 링크에 `aria-current="page"`를 부여하면 스크린리더가 "현재 페이지" 임을 명확히 안내. 시각 클래스(`bg-pastel-pink/40`)와 의미가 일치.

### 2. InfoContainer 탭 — 키보드 화살표 내비게이션

WAI-ARIA tab 패턴은 좌/우 화살표로 탭 이동을 지원. 현재는 Tab 키만 동작. 모바일 우선 사이트라 우선순위는 낮음.

### 3. `getUsedUnifiedTags` 결과의 빌드타임 사전 계산

`articles`/`videos`는 빌드 시점에 결정되는 정적 데이터이므로 `getUsedUnifiedTags`를 server component에서 호출해 결과를 prop으로 주입하면 클라이언트 렌더 비용을 미세하게 줄일 수 있음. 현재 실측 무관 수준이라 우선순위 낮음.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 4건 (수정 권장) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |
