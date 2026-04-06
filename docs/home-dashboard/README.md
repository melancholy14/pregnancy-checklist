# Phase 2.5 Step 3: 홈 대시보드 개편

> Date: 2026-04-06
> Status: Complete
> PRD: [docs/phase-2.5/plan.md](../phase-2.5/plan.md) — Step 3

---

## 개요

홈 하단의 Feature Grid(아이콘+라벨 메뉴판)를 **각 기능의 실시간 스냅샷을 보여주는 미니 대시보드 카드**로 교체하여, 유저에게 클릭 동기를 부여하고 기능 활용도를 높인다.

### AS-IS → TO-BE

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 홈 하단 | 아이콘+라벨 5개 그리드 (단순 메뉴판) | 4개 미니 대시보드 카드 (스냅샷 데이터) |
| 클릭 동기 | 없음 (라벨만 표시) | 행사 수, 체중 변화, 영상 수, 최신 글 등 표시 |
| 타임라인 카드 | 그리드에 포함 | 제거 (상단 체크리스트 대시보드와 중복) |

---

## 구현

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/home/DashboardCard.tsx` | **신규** — 재사용 가능한 미니 대시보드 카드 컴포넌트 |
| `src/components/home/HomeContent.tsx` | Feature Grid 제거 → 4개 DashboardCard로 교체, useWeightStore/babyfairEvents/videosData 연동, articles props 수신 |
| `src/app/page.tsx` | 서버에서 `getAllArticles()` 호출 후 `{ title, slug }` 배열을 HomeContent에 전달 |
| `e2e/home.spec.ts` | 기존 Feature Grid 테스트 → 미니 대시보드 카드 테스트로 교체 |

### 카드 구성

| 카드 | 표시 데이터 | 데이터 소스 |
|------|------------|------------|
| 베이비페어 | 다가오는 행사 수, 가장 가까운 행사명 | `babyfair_events.json` 클라이언트 필터 |
| 체중 기록 | 최근 체중, 시작 대비 변화량 | `useWeightStore` |
| 영상 | 총 영상 수, 카테고리 수 | `videos.json` (정적) |
| 정보 & 가이드 | 최신 글 제목, 총 아티클 수 | `getAllArticles()` → server props |

### DashboardCard 컴포넌트

```tsx
interface DashboardCardProps {
  icon: string;      // 이모지 아이콘
  title: string;     // 카드 제목
  href: string;      // 클릭 시 이동 경로
  color: string;     // 아이콘 배경색
  children: ReactNode; // 스냅샷 데이터 영역
  cta?: string;      // CTA 텍스트 (기본: "자세히 보기")
}
```

---

## 코드 리뷰

| 등급 | 이슈 | 해결 |
|------|------|------|
| Critical | dead code `fullWidth` prop | 제거 완료 |
| Critical | JSX에서 `&amp;` 리터럴 렌더링 | `&`로 수정 |

---

## 리팩토링

- 변경 범위 내 추가 리팩토링 대상 없음
- 기존 `setHydrated` lint warning은 Phase 1.5 코드 (scope 외)

---

## E2E 테스트

**15/15 통과**

| 카테고리 | 테스트 수 | 내용 |
|----------|----------|------|
| Happy Path | 4 | 히어로, 예정일 입력, 대시보드, CTA |
| 미니 대시보드 카드 | 7 | 4개 카드 렌더링, 스냅샷 데이터, 라우팅 |
| 피드백 배너 | 1 | 새 탭 열기 속성 |
| 온보딩/미입력 | 2 | 유도 카드 표시/숨김 |
| 반응형 375px | 1 | 모바일 렌더링 |

---

## 파이프라인 실행 이력

| 단계 | 결과 |
|------|------|
| 1. implement-feature | DashboardCard 신규 + HomeContent/page.tsx 수정 |
| 2. write-e2e-tests | 15개 테스트 작성 |
| 3. run-e2e | 15/15 통과 |
| 4. code-review | Critical 2건 수정 |
| 5. refactor | 추가 대상 없음 |
| 6. run-e2e | 15/15 통과 (리팩토링 검증) |
| 7. write-feature-doc | 이 문서 |
