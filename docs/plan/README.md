# Phase 1: 핵심 기능 개발

> 작성일: 2026-04-02 | 작성자: Claude Code

## 개요

Phase 0에서 세팅된 프로젝트 뼈대 위에 **6개 핵심 기능**(체크리스트, 타임라인, 베이비페어, 체중기록, 영상, Due Date 입력)과 **부가 기능**(홈 대시보드, 온보딩, GA4, AdSense, 법적 페이지, gh-pages 배포)을 구현했다. 모든 데이터는 정적 JSON import, 사용자 상태는 LocalStorage(Zustand persist). `output: 'export'` 빌드 → 10개 페이지 정적 생성 완료.

---

## 구현 내용

### 완료 조건 충족 여부

| Step | 내용 | 상태 |
|------|------|------|
| 1 | 공통 레이아웃 + 네비게이션 | ✅ Phase 0 완료 |
| 2 | Due Date Store + 주차 계산 | ✅ Phase 0 완료 |
| 3 | 홈 페이지 + Due Date 입력 | ✅ |
| 4 | 체크리스트 Store + 페이지 | ✅ |
| 5 | 타임라인 Store + 페이지 | ✅ |
| 6 | 베이비페어 페이지 | ✅ |
| 7 | 체중 기록 페이지 | ✅ |
| 8 | 영상 큐레이션 페이지 | ✅ |
| 9 | 홈 대시보드 완성 | ✅ |
| 10 | gh-pages 배포 | 🔧 워크플로우 준비 완료 |
| 11 | Google Analytics 4 | ✅ |
| 12 | Google AdSense | ✅ |
| 13 | 개인정보/약관 + 의료 면책 | ✅ |
| 14 | 온보딩 플로우 | ✅ |

### 생성/수정 파일

**신규 10개**

| 파일 | 용도 |
|------|------|
| `src/components/checklist/ChecklistAddForm.tsx` | 체크리스트 커스텀 항목 추가 폼 |
| `src/components/timeline/TimelineAddForm.tsx` | 타임라인 커스텀 항목 추가 폼 |
| `src/components/home/DueDateBanner.tsx` | 예정일 미입력 시 유도 배너 |
| `src/components/ads/AdUnit.tsx` | AdSense 광고 슬롯 컴포넌트 |
| `src/components/layout/Footer.tsx` | 공통 푸터 (면책 고지 + 법적 링크) |
| `src/lib/analytics.ts` | GA4 커스텀 이벤트 헬퍼 |
| `src/app/privacy/page.tsx` | 개인정보처리방침 |
| `src/app/terms/page.tsx` | 서비스 이용약관 |
| `.github/workflows/deploy-gh-pages.yml` | gh-pages 자동 배포 |
| `docs/phase-0/analysis.md` | Phase 0 적용 분석 보고서 |

**수정 15개** (페이지 5 + 컴포넌트 10)

| 파일 | 변경 내용 |
|------|----------|
| `src/app/page.tsx` | 대시보드 (주차/D-day/진행률/타임라인), 온보딩, 토스트 |
| `src/app/layout.tsx` | metadata 한글화, Footer, Toaster, GA4 |
| `src/app/checklist/page.tsx` | DueDateBanner 추가 |
| `src/app/timeline/page.tsx` | DueDateBanner 추가 |
| `src/app/videos/page.tsx` | videos.json import |
| `src/components/checklist/ChecklistContainer.tsx` | 커스텀 항목, 하이라이트, FAB |
| `src/components/checklist/ChecklistItem.tsx` | priority 배지, 삭제 버튼 |
| `src/components/timeline/TimelineContainer.tsx` | 30+ 카드, 커스텀, 자동 스크롤 |
| `src/components/timeline/TimelineCard.tsx` | 시각 구분, 삭제 버튼 |
| `src/components/babyfair/BabyfairContainer.tsx` | 도시/연도 필터, upcoming/ended 탭 |
| `src/components/weight/WeightChart.tsx` | 권장 범위 참조선, 출처/면책 |
| `src/components/weight/WeightContainer.tsx` | baseWeight prop 전달 |
| `src/components/videos/VideosContainer.tsx` | items prop, empty state |
| `src/components/videos/VideoCard.tsx` | VideoItem 타입, YouTube 연동 |
| `package.json` | deploy 스크립트, 의존성 추가 |

### 주요 결정 사항

- **데이터 로딩**: 정적 JSON `import` (API Routes 없음, static export)
- **커스텀 항목**: Zustand persist로 LocalStorage에 저장, 기본 항목은 삭제 불가
- **체중 참조선**: 정상 BMI 기준 +11.5~16kg (대한산부인과학회)
- **영상**: videos.json 기반 (현재 빈 배열, PoC에서 수동 큐레이션 예정)
- **GA4/AdSense**: 환경변수 없으면 미로드/미렌더링
- **토스트**: localStorage 플래그로 1회만 표시

### 미구현 항목

- Step 10 gh-pages 실제 배포 (워크플로우는 준비 완료, main push 시 자동 실행)
- GA4 커스텀 이벤트 전송 코드 삽입 (헬퍼 `sendGAEvent`만 준비)
- AdSense 슬롯 페이지별 배치 (컴포넌트만 준비)

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)

| 파일 | 문제 | 수정 |
|------|------|------|
| `page.tsx` | 토스트가 매 페이지 로드마다 반복 (Zustand hydration 시 prevDueDateRef 로직 오동작) | localStorage 플래그(`due-date-toast-shown`)로 1회 제한 |

### Warning (리팩토링에서 수정)

1. **ChecklistItem.tsx** — 동적 Tailwind hover 클래스 미동작 → 정적 className 맵으로 교체
2. **ChecklistContainer.tsx** — 필터/진행률 매 렌더 재계산 → useMemo 캐시
3. **TimelineContainer.tsx** — 다수 current ref 중복 → 첫 번째만 ref 부여
4. **BabyfairContainer.tsx** — today 매 렌더 재계산 → useState 초기화
5. **ChecklistAddForm.tsx** — as 타입 단언 → 런타임 검증 + fallback

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 1건 발견, 1건 수정 완료 |
| Warning | 5건 (리팩토링에서 전부 수정) |
| Suggestion | 2건 (form 접근성, img→next/image) |

---

## 리팩토링 내용

### 작업 목록

| 파일 | 작업 | 이유 |
|------|------|------|
| `ChecklistItem.tsx` | `PRIORITY_STYLES`를 `{ className }` 단일 문자열로 통합 | Tailwind 동적 클래스 미동작 해결 |
| `ChecklistContainer.tsx` | `itemsByCategory`, `progress`, `categoryProgress` useMemo 적용 | 매 렌더 filter 연산 제거 |
| `TimelineContainer.tsx` | `firstCurrentAssigned` 플래그로 첫 번째 current만 ref | 스크롤 대상 명확화 |
| `BabyfairContainer.tsx` | `today`를 `useState(() => ...)` 초기화 | useMemo 의존성 안정화 |
| `ChecklistAddForm.tsx` | `CATEGORY_OPTIONS.some()` 검증 후 fallback | 타입 안전성 향상 |

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 5개 | 5개 (동일) |
| ChecklistContainer 필터 | 일반 함수 (매 렌더) | useMemo 캐시 |
| ChecklistItem hover | 동적 Tailwind (미동작) | 정적 className (동작) |
| Timeline 스크롤 대상 | 마지막 current | 첫 번째 current |
| Babyfair today 계산 | 매 렌더 | 마운트 1회 |
| ChecklistAddForm 타입 | 무검증 단언 | 검증 + fallback |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| 홈 페이지 (Happy Path + 온보딩 + 반응형) | ✅ 8개 passed |
| 체크리스트 (Happy Path + 커스텀 + Validation + 배너 + 반응형) | ✅ 12개 passed |
| 타임라인 (Happy Path + 커스텀 + Validation + 배너 + 반응형) | ✅ 10개 passed |
| 베이비페어 (Happy Path + 필터 + 탭 + 반응형) | ✅ 9개 passed |
| 체중 기록 (Happy Path + 차트 + Validation + 반응형) | ✅ 8개 passed |
| 영상 (Happy Path + empty state + 반응형) | ✅ 4개 passed |
| 개인정보/약관 (Happy Path + Footer + 반응형) | ✅ 5개 passed |
| 하단 네비게이션 | ✅ 2개 passed |
| **전체** | **57 passed / 0 failed (22.7s)** |

---

## 빌드 결과

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /baby-fair
├ ○ /checklist
├ ○ /privacy
├ ○ /terms
├ ○ /timeline
├ ○ /videos
└ ○ /weight

○  (Static)  prerendered as static content
```

10개 페이지 정적 생성 완료.
