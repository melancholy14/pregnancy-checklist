# design-bundle-h-tab-filter-color Implementation

> 작성일: 2026-05-09
> 출처: [docs/features/design-bundle-h-tab-filter-color/spec.md](../../features/design-bundle-h-tab-filter-color/spec.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 12곳 클래스 변경: `bg-pastel-{pink\|mint}/40` 활성색 → `bg-pastel-lavender/40` | ✅ 완료 | I-7, T-4, B-4(도시·탭3) + articles TagFilter 2곳 + videos VideosContainer 4곳 |
| spec 성공 기준 grep — `bg-pastel-(pink\|mint)/40[^/]` in `src/components/{info,timeline,babyfair,articles,videos}/` 결과 0건 | ✅ 완료 | grep 빈 결과 확인 |
| won't 항목(BottomNav, ChecklistHub, AllDoneBadge, ring/focus 등) 미변경 | ✅ 완료 | `ring-pastel-pink` (InfoContainer L110/118) · `focus:ring-pastel-mint/50` (BabyfairContainer L88) 그대로 유지 |
| 빌드 통과 | ✅ 완료 | `npm run build` 성공 (Next.js 16.2.0 Turbopack, TS 통과, 32 페이지 SSG) |

## 생성/수정 파일 목록

### 신규 생성
- 없음 (클래스 문자열만 치환)

### 수정
- [src/components/info/InfoContainer.tsx:145](../../../src/components/info/InfoContainer.tsx#L145) — I-7 카테고리 탭 active 클래스 pink → lavender
- [src/components/timeline/CategoryFilter.tsx:25](../../../src/components/timeline/CategoryFilter.tsx#L25) — T-4 카테고리 필터 active 클래스 pink → lavender
- [src/components/babyfair/BabyfairContainer.tsx:108](../../../src/components/babyfair/BabyfairContainer.tsx#L108) — B-4 도시 선택 active 클래스 mint → lavender
- [src/components/babyfair/BabyfairContainer.tsx:137,143,149](../../../src/components/babyfair/BabyfairContainer.tsx#L137) — B-4 진행중·예정·지난 탭 `data-[state=active]` 클래스 mint → lavender (3곳)
- [src/components/articles/TagFilter.tsx:35,48](../../../src/components/articles/TagFilter.tsx#L35) — 태그 필터 "전체" + 개별 태그 active 클래스 pink → lavender (2곳)
- [src/components/videos/VideosContainer.tsx:139,150,165,178](../../../src/components/videos/VideosContainer.tsx#L139) — 영상/채널 토글 + 카테고리 "전체"/개별 active 클래스 pink → lavender (4곳)

## 주요 결정 사항

- **`replace_all` + 동일 문자열 패턴 활용**: 같은 파일에서 활성 클래스 문자열이 완전히 동일한 경우(예: TagFilter 2곳, VideosContainer 4곳, BabyfairContainer 탭 3곳) `Edit` 한 번에 일괄 치환. spec이 모든 변경을 동일 패턴으로 정의했고, 들여쓰기가 다른 라인도 `?` 시작 부분부터 매칭되는 부분 문자열은 동일하기 때문에 안전.
  → **이유**: spec은 12곳을 한 라운드에 일괄 정정한다는 원칙. 의미적 일관성 유지가 목적이라 라인별 분기 변경은 오히려 risky.

- **`text-foreground` · `text-accent-purple` 등 텍스트 토큰 그대로 유지**: spec L20에 명시 — "텍스트 색은 기존대로 유지". TagFilter는 `text-foreground` 그대로, info 탭도 동일. videos `subcategory` 영역(L201/L214)은 이미 `text-accent-purple` + `bg-pastel-lavender` 컨벤션이라 변경 없음(grep 결과로 확인).

- **won't 목록 검증을 grep으로**: spec의 won't 항목들이 의도대로 살아있는지 `ring-pastel-pink` · `focus:ring-pastel-mint`로 확인. 이건 활성색이 아니라 일시 강조 ring·focus ring이라 본 묶음 H 범위 밖.

## 가정 사항

- spec.md의 12곳 라인 번호와 변경 전 클래스 문자열이 현재 코드베이스와 일치한다고 가정 — Phase 2 검증으로 모두 일치 확인.
- pink/mint 토큰 자체는 globals.css에 그대로 보존(`BottomNav`·`AllDoneBadge` 등 다른 role에서 계속 사용). lavender 토큰도 이미 정의되어 있어 추가 토큰 작업 불필요.
- 텍스트 색은 spec 지시대로 `text-foreground` 유지 — lavender 배경 위 가독성 확인은 시각 회귀(다음 단계 E2E 또는 수동) 책임.

## 미구현 항목

- **시각 회귀 테스트 자동화**: 본 변경은 클래스 문자열 치환이라 단위/E2E 테스트로는 색상 변화를 직접 검증하기 어려움. 시각 확인은 `/run-e2e` 단계의 기존 테스트 회귀 0건 + 이후 수동 QA로 위임.
- **phase-4.5.md §2.8.3·§2.8.5 메모 갱신**: spec L10에 "phase-4.5.md 측 별도 갱신은 불필요"라 명시되어 있어 의도적으로 미반영.
