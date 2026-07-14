# info-tab-integration

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-05-01

<!-- STEP:impl -->
## 구현

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> 출처 PRD: [../../plan/phase-4.md](../../plan/phase-4.md) Step 2
> Date: 2026-05-01

---

### 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | `/info` 진입 시 블로그 + 영상 혼합 카드 리스트 표시 (블로그 그룹 → 영상 그룹) | ✅ 완료 | `InfoContainer` `visibleItems` 결합 순서로 처리 |
| 2 | 콘텐츠 타입 탭 (전체/블로그/영상) 전환 | ✅ 완료 | `activeTab` 상태로 분기 |
| 3 | 통합 태그 필터 동작 (동의어 흡수 매핑) | ✅ 완료 | `unified-tags.ts` 13종 정의 + 매칭 유틸 |
| 4 | `?tab=videos` 쿼리로 영상 탭 초기 선택 | ✅ 완료 | `useSearchParams` + `resolveInitialTab` |
| 5 | `/info?tab=videos#<id>` hash-scroll + 하이라이트 | ✅ 완료 | `useEffect` hash-scroll, `articles` 탭에선 비활성 |
| 6 | 블로그 카드 → `/articles/[slug]` (URL 유지) | ✅ 완료 | `ArticleCard` 그대로 재사용 |
| 7 | 영상 카드 → 유튜브 외부 링크 | ✅ 완료 | `VideoCard` 그대로 재사용 |
| 8 | `/articles` → `/info` 리다이렉트 | ✅ 완료 | `redirect("/info")` 정적 export |
| 9 | `/videos` → `/info?tab=videos` 리다이렉트 | ✅ 완료 | `redirect("/info?tab=videos")` |
| 10 | BottomNav 5탭 구성, "영상" 탭 제거 | ✅ 완료 (4탭으로 축소) | "영상" 제거, "정보" → `/info`. 체중/더보기 확장은 Phase 5 |
| 11 | `/info` SEO 메타(title, description, canonical, OG) 설정 | ✅ 완료 | `info/page.tsx` `metadata` |
| 12 | `lib/search.ts` 영상 URL → `/info?tab=videos#<id>` | ✅ 완료 | |
| 13 | 영상 sub-category·채널 보기 모드 노출되지 않음 | ✅ 완료 | `InfoContainer`에 미포함 (의도적) |
| 14 | `/articles/[slug]` 진입 시 "정보" 탭 활성화 | ✅ 완료 | `BottomNav` `alsoMatchPrefixes` |

---

### 생성/수정 파일 목록

#### 신규 생성

- `src/lib/unified-tags.ts` — 통합 태그 13종 정의 + 동의어 흡수 매핑 + 매칭 유틸 (`articleMatchesUnifiedTag`, `videoMatchesUnifiedTag`, `getUsedUnifiedTags`)
- `src/types/info.ts` — `InfoItem` discriminated union + `InfoTab` 타입
- `src/components/info/InfoCard.tsx` — `ArticleCard`/`VideoCard` 분기 래핑 (재사용)
- `src/components/info/InfoContainer.tsx` — 탭 + 통합 태그 필터 + 혼합 리스트 + hash-scroll. `useSearchParams`로 초기 탭 결정
- `src/app/info/page.tsx` — `/info` 라우트 + 메타데이터 + `Suspense` 경계

#### 수정

- `src/app/articles/page.tsx` — 목록 페이지를 `redirect("/info")`로 전환 (`/articles/[slug]`는 변경 없음)
- `src/app/videos/page.tsx` — `redirect("/info?tab=videos")`로 전환
- `src/components/layout/BottomNav.tsx` — "영상" 탭 제거, "정보" → `/info`, `alsoMatchPrefixes: ["/articles", "/videos"]`로 prefix 매칭 확장. 5→4탭 구조
- `src/lib/search.ts` — 영상 검색 결과 URL을 `/info?tab=videos#<id>`로 변경
- `src/components/home/HomeContent.tsx` — 대시보드 영상 카드 `href="/info?tab=videos"`, 정보 카드 `href="/info"`로 갱신 (리다이렉트 우회)
- `src/components/articles/ArticleDetail.tsx` — "목록으로" 링크 `/articles` → `/info`
- `src/components/timeline/RelatedVideosLink.tsx` — `/videos#<id>` → `/info?tab=videos#<id>`
- `src/components/checklist/ChecklistRelatedContent.tsx` — `/videos#<id>` → `/info?tab=videos#<id>`
- `src/app/sitemap.ts` — `/articles`, `/videos` 항목 제거하고 `/info` 단일 항목으로 통합

---

### 주요 결정 사항

- **내부 링크 일괄 갱신**: plan의 "수정 파일 목록"에는 내부 링크 컴포넌트가 빠져 있었으나, 리다이렉트만 두면 모든 내부 클릭이 `__next_error__` 페이지를 한 번 거쳐 깜빡거림 발생. 리다이렉트는 외부 진입(SEO·북마크)용으로만 두고, 내부 5개 컴포넌트(`HomeContent`, `ArticleDetail`, `RelatedVideosLink`, `ChecklistRelatedContent`, sitemap)에서 직접 `/info` 경로로 갱신
- **sitemap에서 `/articles`, `/videos` 제거**: `/info`로 통합되었고 두 URL은 리다이렉트 페이지이므로 사이트맵에서 빠짐. `/articles/[slug]`는 그대로 유지 (SEO 보호)
- **`Suspense` 경계 위치**: `useSearchParams`가 정적 export 환경에서 클라이언트에서만 평가되도록 `info/page.tsx`(서버 컴포넌트)에서 `<Suspense>`로 `InfoContainer`(`'use client'`)를 감쌈
- **BottomNav 5탭 → 4탭 축소**: plan.md Step 1-7은 5탭(`체중`, `더보기` 추가)을 그렸지만 현 시점에서 그 두 탭이 미구현. Step 2 범위에서는 "영상 제거"만 적용해 4탭(`홈/체크리스트/베이비페어/정보`)으로 축소. 5탭 확장은 Phase 5 이월
- **`alsoMatchPrefixes` 도입**: `/articles/[slug]` 페이지 진입 시 "정보" 탭이 활성화되어야 하는데, `/info` prefix 단독 매칭으로는 불가능. `NavItem` 타입에 보조 prefix 배열 추가
- **활성 탭에서만 hash-scroll**: 블로그 탭에서는 영상 hash가 의미 없으므로 `articles` 탭 활성 시 hash-scroll 효과를 발동하지 않음
- **태그 칩 정렬**: `getUsedUnifiedTags`는 `UNIFIED_TAGS` 배열 순서를 보존하여 노출되므로 운영자가 `unified-tags.ts`에서 표시 순서를 제어할 수 있음 (사전순 정렬 X)
- **영상 그리드 vs 단일 컬럼**: "영상" 탭에서만 grid 레이아웃, "전체"/"블로그"는 single column. 블로그-영상 카드 비주얼 차이가 커서 single column이 안정적. 영상 전용 탭에서는 기존 `/videos` 그리드와 동등한 UX 유지

---

### 가정 사항

- 정렬: 블로그=`date` 최신순 / 영상=`videos.json` 등장 순. 혼합은 "블로그 그룹 → 영상 그룹"
- 채널 보기 모드와 영상 sub-category 필터는 `/info`에서 의도적으로 제외 (Phase 5 채널 디렉토리로 부활 예정)
- 블로그 front matter `tags`는 변경하지 않음 — `unified-tags.ts`의 동의어 흡수 매핑으로 런타임 처리. 일괄 마이그레이션은 Phase 5
- 정적 export에서 `redirect()`는 `NEXT_REDIRECT` 디지스트를 포함한 `__next_error__` HTML로 빌드되어, JS 하이드레이션 후 클라이언트 라우터가 실제 이동을 수행 (기존 `/guides/*` 패턴과 동일)
- `?tab=videos` 쿼리는 클라이언트 라우터가 이동 시 그대로 보존됨 (검증: 빌드 산출물의 `NEXT_REDIRECT;replace;/info?tab=videos;307`)
- `/videos#<id>` 외부 북마크의 hash 보존은 클라이언트 리다이렉트 시 브라우저 동작에 위임 — 내부 검색·내부 링크는 `/info?tab=videos#<id>`로 직접 이동하도록 갱신했으므로 영향 미미

---

### 미구현 항목

- 영상 데이터 `registered_date` 백필 + 엄격한 시간축 통합 정렬 (Phase 5)
- 채널 디렉토리 (`/info/channels` 또는 `/channels`) (Phase 5)
- 통합 태그 2단계 계층 필터 (옵션 B, Phase 5)
- 큐레이션 컬렉션 카드 (옵션 D, Phase 5)
- 블로그 front matter 태그 일괄 마이그레이션 (Phase 5)
- BottomNav 5탭 확장 (체중·더보기 추가, Phase 5)
- 영상 sub-category 진입점 부활 (Phase 5)

---

<!-- STEP:review -->
## 코드 리뷰

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> Impl: [../implementation/info-tab-integration-impl.md](#구현)
> Date: 2026-05-01

---

### 리뷰 대상 파일

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

### Critical 이슈 (즉시 수정 완료)

없음.

타입 안전성·성능·보안·접근성 4가지 관점 모두에서 즉시 수정해야 할 런타임 위험·보안 결함·크래시 유발 코드는 발견되지 않았습니다.

---

### Warning (수정 권장)

#### 1. InfoContainer — hash-scroll useEffect가 필터 변경 시마다 재실행됨

- **위치**: [src/components/info/InfoContainer.tsx:94-112](src/components/info/InfoContainer.tsx#L94-L112)
- **문제**: 의존성 배열이 `[activeTab, visibleItems]`이라 통합 태그 필터를 적용/해제할 때마다 `visibleItems`가 갱신되고, hash-scroll 효과가 다시 실행됨. 사용자가 `/info?tab=videos#video_001`로 진입한 뒤 태그 칩을 눌러 필터링할 때마다 스크롤이 다시 점프하고 ring 하이라이트가 반복적으로 깜빡일 가능성. 크래시는 아니지만 UX가 어색함.
- **권장 수정**: hash 처리는 마운트(또는 활성 탭 변경) 시 1회만 실행하도록 의존성을 `[activeTab]`로 축소하거나, hash를 한 번 처리한 뒤 `useRef`로 처리 완료 플래그를 두는 방식. 추가로 처리 후 `history.replaceState(null, '', pathname + search)`로 hash를 제거하면 재방문 시에도 영향 없음.

#### 2. InfoContainer — 탭이 `role="tab"`만 두고 `tabpanel`/`aria-controls`가 없음

- **위치**: [src/components/info/InfoContainer.tsx:125-146](src/components/info/InfoContainer.tsx#L125-L146)
- **문제**: WAI-ARIA tab 패턴은 `role="tab"` 버튼이 `aria-controls="<panel-id>"`로 패널을 가리키고, 컨텐츠 영역이 `role="tabpanel"`로 마크되어야 완성됨. 현재는 버튼만 `tab`/`tablist`로 마크되어 스크린리더가 "이 탭이 어느 영역을 제어하는지" 알 수 없음. e2e 테스트는 통과하나 접근성 의도가 절반만 구현됨.
- **권장 수정**: 카드 리스트 컨테이너에 `id="info-panel"`, `role="tabpanel"`, `aria-labelledby="<active-tab-id>"`를 부여하고, 각 탭 버튼에 `id`와 `aria-controls="info-panel"`을 추가. 또는 ARIA 의도가 단순 "토글 그룹" 수준이면 `role="tab"`/`aria-selected`를 제거하고 `aria-pressed`로 통일.

#### 3. InfoContainer — searchParams useEffect와 useState 초기화가 중복

- **위치**: [src/components/info/InfoContainer.tsx:42-49](src/components/info/InfoContainer.tsx#L42-L49)
- **문제**: 마운트 시 `useState`가 `searchParams.get("tab")`로 초기 탭을 설정한 직후, `useEffect([searchParams])`가 동일 값으로 `setActiveTab`을 한 번 더 호출. 로직상 무해하지만 한 번의 추가 렌더가 발생.
- **권장 수정**: useEffect를 제거하고, 사용자가 직접 탭 전환 후 브라우저 뒤로가기로 URL이 바뀌는 케이스가 필요하면 `useEffect`의 트리거를 `searchParams.toString()` 비교로 좁히거나 그 케이스만 처리. 가장 단순한 대안: `useEffect` 제거.

#### 4. info/page.tsx — JSON 임포트에 `as` 타입 단언 사용

- **위치**: [src/app/info/page.tsx:28-29](src/app/info/page.tsx#L28-L29)
- **문제**: `videoData as VideoItem[]`, `channelData as ChannelItem[]` 타입 단언은 `videos.json`/`channels.json`의 실제 구조가 타입과 어긋나도 컴파일 에러를 잡지 못함. 특히 `VideoCategory` 타입은 `'exercise' | 'birth_prep' | 'newborn_care'` 3종만 정의되어 있는데 실제 JSON에는 7종 카테고리(`pregnancy_health`, `prenatal_checkup`, `nutrition`, `policy` 포함)가 존재. 단언으로 타입 불일치가 가려진 상태.
- **권장 수정**: 기존 `/videos/page.tsx`도 같은 패턴이라 프로젝트 전반의 약속이므로 단독 수정은 부담. 다만 `src/types/video.ts`의 `VideoCategory` union을 실제 데이터에 맞춰 7종으로 확장하면 단언이 정합성을 회복함. 또는 zod 등 런타임 검증을 도입(Phase 5 영역).

---

### Suggestion (개선 아이디어)

#### 1. BottomNav — 활성 항목에 `aria-current="page"`

활성 링크에 `aria-current="page"`를 부여하면 스크린리더가 "현재 페이지" 임을 명확히 안내. 시각 클래스(`bg-pastel-pink/40`)와 의미가 일치.

#### 2. InfoContainer 탭 — 키보드 화살표 내비게이션

WAI-ARIA tab 패턴은 좌/우 화살표로 탭 이동을 지원. 현재는 Tab 키만 동작. 모바일 우선 사이트라 우선순위는 낮음.

#### 3. `getUsedUnifiedTags` 결과의 빌드타임 사전 계산

`articles`/`videos`는 빌드 시점에 결정되는 정적 데이터이므로 `getUsedUnifiedTags`를 server component에서 호출해 결과를 prop으로 주입하면 클라이언트 렌더 비용을 미세하게 줄일 수 있음. 현재 실측 무관 수준이라 우선순위 낮음.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 4건 (수정 권장) |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> Review: [../review/info-tab-integration-review.md](#코드-리뷰)
> Date: 2026-05-01

---

### 리팩토링한 파일 목록

- `src/components/info/InfoContainer.tsx` — 2건 적용

---

### 작업별 내용

#### 1. InfoContainer — hash-scroll useEffect 의존성 축소 + 처리 후 hash 제거

- **출처**: Warning #1
- **무엇을**:
  - useEffect 의존성을 `[activeTab, visibleItems]` → `[activeTab]`로 축소
  - 스크롤·하이라이트 적용 직후 `window.history.replaceState`로 hash를 제거
- **왜**: 통합 태그 칩을 적용/해제할 때마다 `visibleItems` 참조가 바뀌어 hash-scroll 효과가 반복 실행되고 ring 하이라이트가 깜빡일 수 있었음. 의존성을 `activeTab`만 두면 탭 전환 시 1회 실행되며, 처리 후 hash를 제거하면 같은 탭 안에서 필터링하더라도 재진입이 차단됨

#### 2. InfoContainer — ARIA 탭 패턴 완성 (`aria-controls`/`tabpanel`/`aria-labelledby`)

- **출처**: Warning #2
- **무엇을**:
  - 각 탭 버튼에 `id={`info-tab-${tab}`}`, `aria-controls="info-panel"` 부여
  - 콘텐츠 영역(빈 상태/리스트 공통)을 새 wrapper `<div>`로 감싸 `id="info-panel"`, `role="tabpanel"`, `aria-labelledby={`info-tab-${activeTab}`}` 부여
- **왜**: 기존에는 `role="tab"`만 마크되어 스크린리더가 "이 탭이 어느 영역을 제어하는지" 알 수 없는 반쪽짜리 ARIA 패턴이었음. 패널이 활성 탭의 `id`를 참조하도록 연결해 SR 사용자도 콘텐츠 변경을 명확히 인지

---

### 보류한 Warning 항목

#### Warning #3 — searchParams useEffect와 useState 초기화 중복

- **결정**: 보류 (제거하지 않음)
- **사유**: 표면상 마운트 시 `setActiveTab`이 한 번 더 호출되지만, React가 동일 값에 대해 재렌더를 bail-out하므로 실비용 0. 더 중요한 것은 이 useEffect가 **브라우저 뒤로가기/앞으로가기로 `?tab=` 쿼리가 변할 때 activeTab을 동기화**하는 역할을 함. 제거하면 URL과 UI 불일치(예: `/info?tab=videos`에서 뒤로가기로 `/info`에 도달했는데 영상 탭이 그대로 활성)라는 동작 회귀가 발생함. 따라서 코드 모양상의 "중복"보다 동작 보존 우선

#### Warning #4 — JSON 임포트 `as VideoItem[]` 타입 단언

- **결정**: 보류 (범위 밖)
- **사유**: 진짜 해결책은 `src/types/video.ts`의 `VideoCategory` union을 실데이터 7종(`pregnancy_health`, `prenatal_checkup`, `nutrition`, `policy` 포함)에 맞춰 확장하거나 zod 런타임 검증을 도입하는 것. 둘 다 본 기능 범위(Phase 4 Step 2) 밖이며 프로젝트 전반의 타입 정합성 작업으로 별도 진행이 적절. Phase 5 이월 권장

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 15개 | 15개 (수정 1) |
| InfoContainer 줄 수 | 204줄 | 213줄 (panel wrapper + history.replaceState 추가) |
| hash-scroll 트리거 | 탭/필터 변경 시마다 | 탭 변경 시 1회 + hash 자동 제거 |
| ARIA 탭 패턴 완성도 | 절반 (role="tab" 만) | 완전 (controls·tabpanel·labelledby) |

---

### 빌드 결과

성공 (1회 시도)
