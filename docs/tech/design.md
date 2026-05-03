# 설계 / 디자인 패턴 / 방법론

> 시각 디자인 시스템은 [DESIGN.md](DESIGN.md). 이 문서는 **코드 레벨 설계 패턴**과 의사결정 근거.

---

## 1. 아키텍처 원칙

### 1.1 정적 우선 (Static-first)
- 모든 데이터는 빌드 시점에 결정. 런타임 fetch 없음.
- 사용자별 상태만 클라이언트 localStorage.
- 결과: CDN 캐시·SEO·무료 호스팅 모두 자연스럽게 해결.

### 1.2 회원가입 없는 PoC
- 인증 없음. dueDate 입력만으로 개인화.
- 데이터 소실(시크릿 모드·캐시 삭제)을 가정하고 UX 짠다 → 첫 입력 시 "이 브라우저에만 저장됨" 토스트 + `/privacy`·약관에 면책 명시.
- Phase 6 운영 전환 시 회원가입 + 동기화 추가 가능하도록 store 구조는 마이그레이션 친화적.

### 1.3 점진적 향상 (Progressive enhancement)
- 핵심 기능(타임라인 보기·체크)은 JS 없이도 컨텐츠 노출됨 (정적 HTML).
- 인터랙션(체크·커스텀 추가·검색)은 JS 활성화 후 작동.
- 검색·공유 같은 기능은 브라우저가 지원할 때만 활성, 미지원 시 graceful fallback (Web Share API → 모달).

---

## 2. 컴포넌트 패턴

### 2.1 Container / Presentational
- `<Container>` 컴포넌트가 store·data·effect 다룸.
- `<Card>`·`<Item>` 같은 자식은 props만 받는 순수 컴포넌트.
- 예: [TimelineContainer](src/components/timeline/TimelineContainer.tsx) → [TimelineAccordionCard](src/components/timeline/TimelineAccordionCard.tsx) → [WeekChecklistSection](src/components/timeline/WeekChecklistSection.tsx).

### 2.2 page.tsx는 글루(glue)만
- `page.tsx`는 데이터 import + Container에 props 전달만. 뷰 로직 직접 X.
- 동적 라우트는 `generateStaticParams`로 빌드 타임 결정.

### 2.3 클라이언트 경계 명시
- 인터랙션 컴포넌트는 `"use client"` 디렉티브.
- 페이지 단위로는 가능한 서버 컴포넌트 유지. 인터랙션 부분만 client.

### 2.4 Wrapper로 외부 의존성 격리
- shadcn/ui 프리미티브를 직접 쓰지 않고 wrapper(예: `BabyfairCard`가 `AlertDialog`를 감쌈) 통해 사용.
- 외부 라이브러리 업데이트 시 wrapper만 영향.

---

## 3. 상태 관리 패턴

### 3.1 Store 분리 유지
- 4개 도메인 store (`due-date`·`checklist`·`timeline`·`weight`) 합치지 않음.
- 이유: 각자 독립된 localStorage 키 → 부분 손실에 강하고 마이그레이션 단위가 작음.
- 뷰 레이어에서 합산(예: 홈 진행률은 4 store 모두 읽어 계산).

### 3.2 Factory 패턴 (체크리스트 허브)
- [createChecklistStore](src/store/createChecklistStore.ts)는 슬러그(`hospital-bag`·`partner-prep`·`pregnancy-prep`)별로 동일 구조 store를 생성.
- 슬러그→store 매핑(`CHECKLIST_STORE_BY_SLUG`)은 store 모듈에서 export → 신규 추가 시 한 파일만 수정.

### 3.3 Hydration 가드
- localStorage는 SSR 시 비어있음 → `hydrated` 플래그 + 빈 상태 렌더 후 hydrate 시 실제 값.
- 빈 배열·객체는 모듈 상수(예: `EMPTY_CHECKED_IDS: string[] = []`) → 매 렌더 새 참조 방지, 자식 메모이제이션 안전.

---

## 4. 데이터 추상화

### 4.1 `data-source.ts` — 미래 GCS 전환 대비
- 현재는 JSON `import`만 wrapping.
- Phase 6에서 `DATA_SOURCE=gcs` 환경변수 분기로 GCS fetch 추가 (코드 한 곳 변경).

### 4.2 frontmatter 검증 (`parseArticleMeta`)
- 단순 `as ArticleMeta` 단언 대신 필수 필드 검증 + 기본값 fallback.
- JSON 임포트(예: `videos as VideoItem[]`)는 관용으로 허용 — 모든 파일 일괄 정리는 Phase 5 영역.

### 4.3 통합 태그(unified-tags)
- 블로그 태그 ↔ 영상 카테고리 ↔ 체크리스트 슬러그 사이 N:N 매핑을 하드코딩 매트릭스로.
- 자동 크로스링크 스크립트의 1차 시그널.

---

## 5. 콘텐츠 추천·검색 알고리즘

### 5.1 관련 콘텐츠 (Phase 4 step 3)
- **Jaccard similarity** on tags. 동률이면 최신 글 우선.
- 점수 0인 경우는 fallback으로 최신 글 보충 (3개 채울 때까지).
- 구현: [src/lib/related-content.ts](src/lib/related-content.ts).

### 5.2 자동 크로스링크 (Phase 4 step 5)
- **두 단계 점수**: unified-tag Jaccard (0.6) + keyword Jaccard (0.4) → top-N + threshold(0.2) 필터.
- 양방향 대칭 보강(article ↔ timeline week, checklist ↔ video) 후 manual 보호 플래그가 있는 필드는 덮어쓰지 않음.
- 구현: [scripts/generate-crosslinks.ts](scripts/generate-crosslinks.ts) + [src/lib/crosslink-utils.ts](src/lib/crosslink-utils.ts).

### 5.3 클라이언트 검색 (Phase 3 step 2)
- Fuse.js, fuzzy threshold 0.4, minMatchCharLength 2.
- 가중치: title 2 / tags 1.5 / categoryName 1.2 / description 1.
- 검색 인덱스는 모듈 빌드 타임에 한 번 생성 (timeline + articles + videos 합쳐 단일 인덱스).
- 구현: [src/lib/search.ts](src/lib/search.ts).

---

## 6. 디자인 시스템 (요약)

> 자세한 내용은 [DESIGN.md](DESIGN.md).

- **Cream canvas (#FFFAF7) + 5 pastel + 3 accent**. 다섯 파스텔 각각 고정 역할.
- **Pretendard Variable** 단일 font stack. `word-break: keep-all` 한국어 mandatory.
- **Whisper border** `rgba(0,0,0,0.05)` + 5단계 shadow scale (그림자는 0.07 이하).
- **Mobile-first**. `max-w-*` 강제 X. `pb-24 px-4` 페이지 wrapper 패턴.
- `.article-prose` 단일 wrapper로 longform 한국어 reading surface 통일.

---

## 7. 접근성 패턴

- **ARIA tab pattern**: 탭 버튼 `role="tab"` + `aria-controls` + `id`. 패널 `role="tabpanel"` + `aria-labelledby`. (info-tab-integration refactor에서 보완)
- **포커스 링**: `--ring` 토큰(파스텔 핑크). focus:outline-none + focus:ring-2.
- **키보드 지원**: 클릭 가능한 div는 role + tabIndex + onKeyDown 3종 세트 (Phase 1.5 합의).
- **터치 타겟**: 최소 40px (`h-10`). BottomNav 44px+.

---

## 8. SEO·메타데이터

- 모든 페이지 `export const metadata`로 `title`·`description`·`openGraph`·`canonical` 명시.
- JSON-LD structured data: 아티클은 `Article` schema, 체크리스트는 `HowTo` schema 적용 가능 (현재 부분 적용).
- `sitemap.ts`·`robots.ts` 파일 라우트로 빌드 시 생성.

---

## 9. 분석·관측

- **GA4** via `@next/third-parties`. 커스텀 이벤트는 `sendGAEvent` wrapper(`src/lib/analytics.ts`).
- **쿠키 동의**: 거부 시 GA4·AdSense 스크립트 비활성. `useConsent` hook으로 컴포넌트 구독.
- **에러 모니터링**: 미적용 (Phase 6 후보 — Sentry / Cloud Error Reporting).

---

## 10. 테스트 전략

- **E2E (Playwright)**: 핵심 플로우 + feature 단위 시나리오. CI에서 chromium만.
- **Unit Test**: 미적용. Phase 5에서 vitest 도입 예정 ([plan.md §5-0b](../plan/plan.md)).
- **타입 안전**: TypeScript strict + `as` 단언은 JSON import에 한정. Phase 5에서 zod 런타임 검증 도입 예정 ([plan.md §5-0c](../plan/plan.md)).

---

## 11. 의도적인 제약 (Permanent Non-Goals)

| 제약 | 이유 |
|------|------|
| 회원가입 도입 X (현 phase) | "설치/가입 없이 즉시 쓰는" 포지셔닝 핵심 |
| 의료 상담·진단·처방 X | YMYL 리스크. 정보 제공 도구로 자기규정 |
| 병원 추천·예약 연동 X | 의료기기법 회피 |
| 데스크톱 멀티 컬럼 X | 모바일 우선 페르소나 (이동 중·병원 대기 사용) |
| 다크 모드 X | 단일 cream canvas가 브랜드 |
| API Routes·서버 액션 X (현 phase) | static export 호환 |

---

## 12. 결정 이력

| 시점 | 결정 | 영향 |
|------|------|------|
| Phase 1.5 | Store 분리 유지 (체크리스트/타임라인 합치지 않음) | localStorage 호환성 보장 |
| Phase 2 | gray-matter + remark (contentlayer/next-mdx-remote 거부) | 의존성 최소 |
| Phase 2.5 | "초산 개발자" 1인칭 톤 + `BRAND_PHASE` 분기 구조 | 페이지·온보딩 카피 일괄 전환 가능 |
| Phase 3 | Fuse.js 단일 인덱스 (timeline + articles + videos) | 검색 모달에서 통합 결과 |
| Phase 4 step 1 | 체크리스트 3종 분리 + factory store | 슬러그별 독립 + 재사용 |
| Phase 4 step 2 | `/info` 단일 라우트로 블로그·영상 통합 | 콘텐츠 회유 강화 |
| Phase 4 step 5 | 크로스링크 자동 생성 + `*_manual` 보호 | 운영자 수동 매핑 보존 |
