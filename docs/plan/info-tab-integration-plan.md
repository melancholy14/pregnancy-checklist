# Feature Plan: info-tab-integration

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> 상위 계획: [../phase-4/plan.md](../phase-4/plan.md)
> Date: 2026-05-01

---

## 기능 목표

블로그(`/articles`)와 영상(`/videos`) 두 별도 탭을 `/info` 통합 허브 한 곳으로
합쳐 콘텐츠 깊이 인식과 탐색 시너지를 확보한다. 통합 태그(블로그 태그 ↔ 영상
카테고리 매핑) 기반 단일층 필터로 두 매체의 관련 콘텐츠를 한 화면에서 노출하고,
기존 `/articles/[slug]` URL은 SEO 보호를 위해 유지한다. 채널 보기 모드와 영상
sub-category는 `/info`에서 제외하고 Phase 5로 이월한다.

---

## 완료 조건 (AC)

| # | 조건 | 비고 |
|---|------|------|
| 1 | `/info` 진입 시 블로그 + 영상 혼합 카드 리스트 표시 (블로그 그룹 → 영상 그룹 순) | plan.md Step 2-2 |
| 2 | 콘텐츠 타입 탭 (전체/블로그/영상) 전환 동작 | plan.md Step 2-2 |
| 3 | 통합 태그 필터 동작 (동의어 흡수 매핑 적용) | plan.md Step 2-2 |
| 4 | `?tab=videos` 쿼리로 영상 탭 초기 선택 | `/videos` 리다이렉트 호환 |
| 5 | `/info?tab=videos#<video_id>` hash-scroll + 하이라이트 | 기존 `/videos` 동등 |
| 6 | 블로그 카드 → `/articles/[slug]` (URL 유지) | SEO 보호 |
| 7 | 영상 카드 → 유튜브 외부 링크 | 기존 동작 유지 |
| 8 | `/articles` → `/info` 리다이렉트 | plan.md Step 2-5 |
| 9 | `/videos` → `/info?tab=videos` 리다이렉트 | plan.md Step 2-5 |
| 10 | BottomNav 5탭, "영상" 탭 제거 | plan.md Step 1-7 |
| 11 | `/info` SEO 메타(title, description, canonical, OG) 설정 | plan.md Step 2-6 |
| 12 | `lib/search.ts`의 영상 URL → `/info?tab=videos#<id>` | 통합 후 깨진 링크 방지 |
| 13 | 영상 sub-category 필터·채널 보기 모드는 `/info`에 노출되지 않음 | 의도적 제거 |
| 14 | `/articles/[slug]` 진입 시 BottomNav "정보" 탭 활성화 | prefix 매칭 |

---

## 기술 스택

- 라우터: App Router (Next 16, `output: "export"`)
- 상태관리: useState/useMemo (이번 기능에서 Zustand 미사용)
- HTTP: 사용 없음 (정적 JSON + gray-matter)
- CSS: Tailwind v4 + Radix UI + shadcn 패턴
- TypeScript: Yes

---

## 레퍼런스 패턴

- `src/components/articles/ArticlesContainer.tsx` — 컨테이너/필터/PageDescription 패턴
- `src/components/videos/VideosContainer.tsx` — 카테고리 토글 스타일, hash-scroll, 영상 그리드
- `src/components/articles/TagFilter.tsx` — 펼치기/접기 칩 컴포넌트
- `src/components/articles/ArticleCard.tsx`, `src/components/videos/VideoCard.tsx` — 카드 재사용
- `src/app/guides/weekly-prep/page.tsx` — 정적 export `redirect()` 패턴
- `src/components/checklist/ChecklistHub.tsx` — Phase 4 Step 1 허브 패턴

---

## 통합 태그 매핑 (옵션 A: 단일층)

| 통합 태그 | 블로그 태그 (정규화 흡수) | 영상 카테고리 |
| ---------- | -------------------------- | ------------- |
| 임신초기 | `임신초기`, `임신초기증상`, `임신피로`, `프로게스테론` | — |
| 임신중기 | `임신중기` | — |
| 출산준비 | `출산준비` | `birth_prep` |
| 영양 | `영양`, `임산부영양` | `nutrition` |
| 운동 | `임산부운동` | `exercise` |
| 검사 | `검사`, `산전검사`, `NIPT`, `정밀초음파`, `기형아검사` | `prenatal_checkup` |
| 건강 | `임산부건강`, `임산부빈혈`, `임신성당뇨`, `임신중독증`, `건강` | `pregnancy_health` |
| 신생아 | `신생아` | `newborn_care` |
| 산후관리 | `산후관리` | — |
| 정책/제도 | `정책`, `제도`, `정부지원`, `국민행복카드`, `부모급여`, `첫만남이용권`, `임신지원금` | `policy` |
| 보험 | `보험`, `태아보험`, `임신보험`, `태아보험가입시기`, `태아보험특약` | — |
| 체중관리 | `체중관리` | — |
| 임신준비 | `임신준비` | — |

> **옵션 채택 사유**: 콘텐츠 규모(블로그 7개·영상 57개)에는 단일층 옵션 A가 적합.
> 옵션 B(2단계 계층), 옵션 D(큐레이션 컬렉션)은 콘텐츠 20개+ 시점 → Phase 5 이월.

---

## 채널 처리 결정

`/info`에서 채널 카드·채널 보기 모드를 **제외**한다.

| 항목 | 결정 |
|------|------|
| `/info`에 채널 카드 노출 | ❌ 제외 |
| `/videos` 페이지 | 폐기 → `/info?tab=videos` 리다이렉트 |
| `VideosContainer`의 채널 토글 | 제거 |
| 영상 카드 내부 채널명 | 표기는 유지 |

> **사유**: 정보 허브의 콘텐츠 정체성 보호, 통합 태그 필터의 채널 적용 의미 약함,
> 채널 리스트의 AdSense thin content 위험. 채널 디렉토리는 Phase 5에서 별도 페이지로 부활.

---

## 정렬 전략

1. **블로그**: front matter `date` 최신순
2. **영상**: `videos.json` 등장 순서(파일 인덱스)
3. **혼합**: 블로그 그룹 → 영상 그룹 순서로 이어붙임

> 엄격한 시간 기준 혼합 정렬은 영상 `registered_date` 필드 백필 후 가능 → Phase 5 이월.

---

## 구현 순서

1. **Types/Util** — `unified-tags.ts` (통합 태그 13종 + 동의어 흡수 매핑) + `info.ts` (`InfoItem` discriminated union)
2. **InfoCard** — `ArticleCard`/`VideoCard` 래핑 분기 렌더
3. **InfoContainer** — 탭 + 통합 태그 필터 + 혼합 리스트 + hash-scroll, `useSearchParams`로 초기 탭 결정
4. **`/info` 라우트** — `getAllArticles()` + `videos.json` + `channels.json` 주입, 메타데이터 설정
5. **리다이렉트** — `/articles`(목록만) → `/info`, `/videos` → `/info?tab=videos`
6. **BottomNav 재구성** — "영상" 제거, "정보" → `/info`, prefix 매칭 확장(`/info`·`/articles/`·`/videos`)
7. **search.ts** — 영상 URL → `/info?tab=videos#<id>`

---

## 생성/수정 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 신규 | `src/lib/unified-tags.ts` | 통합 태그 정의 + 동의어 흡수 매핑 + 매칭 유틸 |
| 신규 | `src/types/info.ts` | `InfoItem` discriminated union |
| 신규 | `src/components/info/InfoContainer.tsx` | 탭 + 필터 + 혼합 리스트 + hash-scroll |
| 신규 | `src/components/info/InfoCard.tsx` | `ArticleCard`/`VideoCard` 래핑 분기 |
| 신규 | `src/app/info/page.tsx` | `/info` 라우트 + 메타데이터 |
| 수정 | `src/app/articles/page.tsx` | 목록 페이지를 `/info` 리다이렉트로 전환 |
| 수정 | `src/app/videos/page.tsx` | `/info?tab=videos` 리다이렉트 |
| 수정 | `src/components/layout/BottomNav.tsx` | "영상" 제거, "정보"→`/info`, prefix 매칭 확장 |
| 수정 | `src/lib/search.ts` | 영상 검색 URL을 `/info?tab=videos#<id>`로 |

---

## 가정 사항

- **카드 재사용**: `ArticleCard`/`VideoCard`를 `InfoCard`가 import해 분기 렌더 (재구현보다 안전)
- **정렬**: 블로그=`date` 최신순 / 영상=`videos.json` 등장 순. 혼합은 "블로그 그룹 → 영상 그룹". 엄격 시간축 정렬은 Phase 5(`registered_date` 백필)
- **sub-category·채널 보기**: `/info`에서 제외 (Phase 5 이월). `VideosContainer`의 토글은 `/videos` 폐기와 함께 제거
- **태그 정규화**: 런타임 매핑(`unified-tags.ts`)으로 처리. front matter는 변경하지 않음 (Phase 5에 일괄 마이그레이션)
- **리다이렉트**: `redirect()` from `next/navigation` (정적 export 호환 — 이미 검증된 패턴). 쿼리 보존이 안 되면 클라이언트 리다이렉트로 폴백

---

## Out of Scope

- Step 3 관련 콘텐츠 추천, Step 4 공유 기능, Step 5 크로스링크 스크립트 (별도 Step)
- 영상 데이터 `registered_date` 백필 (Phase 5)
- 블로그 front matter 태그 일괄 마이그레이션 (Phase 5)
- 채널 디렉토리 페이지 (Phase 5)
- 통합 태그 2단계 계층 필터 (Phase 5)
- 큐레이션 컬렉션 카드 (Phase 5)
- 영상 sub-category 진입점 (Phase 5)

---

## 예상 리스크

1. **수정 파일이 다른 기능과 공유 — search.ts 영상 URL 변경**: 검색 결과 클릭이 통합 후 `/info?tab=videos#<id>`로 이동해야 하므로 라우터 변경과 동시 반영 필수
2. **정적 export 리다이렉트 + 쿼리 보존**: `redirect("/info?tab=videos")`이 빌드 타임에 쿼리를 보존하는지 검증 필요. 실패 시 클라이언트 리다이렉트로 폴백
3. **BottomNav prefix 매칭**: `/articles/[slug]` 진입 시 "정보" 탭 활성화를 위해 `/info`·`/articles/`·`/videos` 세 prefix를 OR로 매칭하도록 수정
4. **PRD AC 모호 — sub-category·채널 처리**: plan.md에 명시 없던 부분을 갱신에서 명시. 채널 디렉토리는 Phase 5 이월로 합의됨
