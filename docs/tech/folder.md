# 폴더 구조 가이드

> 어떤 디렉토리가 어떤 책임을 지는지, 왜 그렇게 나뉘어 있는지.
> 새 파일을 만들기 전 "이 책임은 어느 폴더에 속하나?" 확인하는 용도.

---

## 1. 최상위 구조

```text
pregnancy-checklist/
├── src/                    # 애플리케이션 코드
├── public/                 # 정적 자산 (CNAME, og-image, ads.txt 등)
├── scripts/                # 일회성·반복 CLI 작업 (TS/Bash)
├── docs/                   # 모든 기술·기획 문서
├── e2e/                    # Playwright E2E 시나리오
├── .claude/                # Claude Code 스킬·설정
├── AGENTS.md / DESIGN.md   # 에이전트·디자인 단일 진실 문서
├── next.config.ts
├── package.json
└── tsconfig.json
```

**원칙**: `src/`는 런타임 번들에 포함되는 것만. 빌드·배포 도구·DB seed 같은 보조 코드는 모두 `scripts/`로.

---

## 2. `src/` 구조 — Feature 단위 분할

```text
src/
├── app/                    # Next.js App Router 라우트
├── components/             # React 컴포넌트 (feature별)
├── lib/                    # 도메인 유틸·로직 (UI 무관)
├── store/                  # Zustand store (localStorage 영속)
├── types/                  # 도메인 타입 정의
├── data/                   # 정적 콘텐츠 JSON
└── content/                # 마크다운 콘텐츠 (articles, draft)
```

### 2.1 `app/` — 라우트 = 화면

```text
app/
├── about/        contact/        privacy/        terms/        # 정적 정보 페이지
├── articles/     [slug]/                                       # 블로그 (정적 export)
├── baby-fair/                                                  # 베이비페어 일정
├── checklist/    hospital-bag/   partner-prep/   pregnancy-prep/ # 체크리스트 허브 + 3종
├── guides/                                                     # 구 가이드 → /articles 리다이렉트
├── info/                                                       # 블로그+영상 통합 탭
├── timeline/     videos/         weight/                       # 도구 페이지
├── layout.tsx    page.tsx        not-found.tsx
├── sitemap.ts    robots.ts                                     # SEO 메타
└── globals.css                                                 # 디자인 토큰
```

**규칙**:
- `page.tsx`는 데이터 import + Container 컴포넌트 props 전달만. 뷰 로직 X.
- 동적 세그먼트는 `generateStaticParams`로 빌드 시점에 결정.
- 클라이언트 인터랙션 컴포넌트는 별도 파일 `"use client"`로 분리 후 page에서 import.

### 2.2 `components/` — Feature 별 폴더 + 공유 ui

```text
components/
├── ui/                # shadcn/ui 프리미티브 (외부 의존성 컴포넌트)
├── ads/               # AdUnit
├── analytics/         # GA4 컴포넌트
├── articles/          # ArticleDetail, ArticleCard, RelatedContent...
├── babyfair/          # BabyfairContainer, BabyfairCard, AlertDialog 래퍼
├── checklist/         # ChecklistHub, ChecklistPage, ChecklistItemRow...
├── common/            # 페이지 공통 (PageDescription, MedicalDisclaimer)
├── consent/           # CookieConsentBanner
├── home/              # HomeContent, DashboardCard, DueDateBanner
├── info/              # InfoContainer (블로그+영상 통합)
├── layout/            # BottomNav, StickyHeader, Footer
├── onboarding/        # OnboardingFlow + Step 컴포넌트
├── search/            # 풀스크린 검색 모달
├── share/             # ShareButton, ShareModal
├── timeline/          # TimelineContainer, TimelineAccordionCard, RelatedArticlesLink
├── videos/            # VideosContainer, VideoCard, VideoCardCompact
└── weight/            # WeightContainer, WeightChart, WeightForm
```

**Feature 폴더 규칙**:
- 하나의 feature가 1개 폴더 = 1개 책임. 다른 feature를 import해 의존하면 그 import 방향이 명확해야 함.
- 파일 이름: 컴포넌트 파일은 PascalCase (`ChecklistPage.tsx`). 한 폴더 안 8~12개를 넘으면 sub-feature로 분할 검토.
- `components/ui/`는 외부에서 가져온 shadcn 프리미티브. 직접 수정보다는 wrapper 컴포넌트로 확장.

### 2.3 `lib/` — UI에 종속되지 않는 로직

```text
lib/
├── analytics.ts            # sendGAEvent (GA4 wrapper)
├── articles.ts             # MD 파싱·frontmatter 검증
├── checklist-week-map.ts   # week ↔ checklist id 매핑
├── consent.ts              # 쿠키 동의 상태 관리
├── constants.ts            # BRAND_PHASE, CREATOR_DUE_DATE, CATEGORY_OPTIONS
├── crosslink-utils.ts      # tokenize, jaccardSimilarity, relevanceScore
├── data-source.ts          # JSON import 추상화 (Phase 6 GCS 전환 대비)
├── related-content.ts      # getRelatedArticles/Checklists/Videos
├── search.ts               # buildSearchIndex, createSearcher (Fuse.js)
├── share.ts                # triggerShare (Web Share + Clipboard)
├── unified-tags.ts         # 태그 ↔ 영상 카테고리 매핑
├── use-consent.ts          # React hook (consent 상태 구독)
├── utils.ts                # cn (clsx + tailwind-merge)
└── week-calculator.ts      # 주차 계산 (due date → pregnancy week)
```

**규칙**:
- React import 금지(use-consent.ts 제외). `import "react"`가 들어가면 그건 컴포넌트.
- 단일 책임 작은 파일 선호. 100~200줄 넘어가면 분할 고민.
- 외부 의존성(Fuse·gray-matter 등) wrapper는 lib에서 처리 → 컴포넌트는 `@/lib/*`만 import.

### 2.4 `store/` — Zustand persist

```text
store/
├── createChecklistStore.ts     # factory: 슬러그별 store 생성
├── useChecklistStore.ts        # 타임라인 통합 체크리스트 (legacy)
├── useDueDateStore.ts          # 출산 예정일
├── useSearchStore.ts           # 검색 모달 열림 상태 (persist 없음)
├── useTimelineStore.ts         # 커스텀 타임라인 항목
└── useWeightStore.ts           # 체중 로그
```

- 각 store는 독립 localStorage 키. 합치지 않음 (Phase 1.5 결정).
- factory 패턴(`createChecklistStore`)은 슬러그별 동일 구조 store를 다중 생성할 때만 사용.

### 2.5 `types/` — 도메인 타입

```text
types/
├── article.ts      # ArticleMeta (frontmatter 스키마)
├── babyfair.ts     # BabyfairEvent
├── checklist.ts    # ChecklistItem, ChecklistMeta, ChecklistData
├── info.ts         # InfoCard 통합 타입
├── timeline.ts     # TimelineItem
└── video.ts        # VideoItem, ChannelItem, VideoCategory
```

- 타입은 데이터 스키마와 1:1. JSON 변경 시 타입 먼저.
- runtime 검증 함수는 `lib/articles.ts`의 `parseArticleMeta` 패턴 참조.

### 2.6 `data/` 와 `content/`

| 폴더 | 형식 | 내용 |
|------|------|------|
| `src/data/` | JSON | 빌드 시 번들에 포함되는 정적 데이터 (체크리스트·타임라인·베이비페어·영상·채널) |
| `src/data/experts/` | (예약) | 전문가 검수 풀 데이터 |
| `src/content/articles/` | MD + frontmatter | 발행된 블로그 글 |
| `src/content/draft/` | MD | 운영자가 수정 중인 초안 (Obsidian vault 아님) |

---

## 3. `scripts/` — CLI 운영 도구

```text
scripts/
├── fetch-channel-thumbs.ts     # YouTube API → channels.json 썸네일 갱신
├── fetch-video-metadata.ts     # YouTube API → videos.json 검증·갱신
├── verify-videos.ts            # videos.json 데이터 무결성 검사
├── generate-crosslinks.ts      # 콘텐츠 간 크로스링크 자동 생성
├── lighthouse-check.sh         # 5개 페이지 SEO 90+ 검증
├── sync-obsidian-vault.sh      # Obsidian vault ↔ 코드 미러
└── seed-vault-media-notes.py   # vault seed
```

**규칙**:
- 모두 `npx tsx` 또는 `bash`로 실행. node 직접 X.
- API 키 등 시크릿은 `.env.local`에서 로드 (스크립트 내 fallback 파서 포함).
- 파일 변경 스크립트는 `--dry-run` 모드 기본 제공.

---

## 4. `docs/` — 정보 분류

```text
docs/
├── tech/                       # 기술 단일 진실 (이 폴더)
│   ├── persona.md  folder.md  spec.md  design.md
│   ├── infra.md    impl.md    review.md
│   └── technical-debt.md
├── plan/                       # PRD + 마스터 계획
├── phase-*/                    # phase별 plan.md
├── phase-4-step-*/             # phase 내 step 단위 README
├── implementation/             # 구현 보고서 (impl.md)
├── review/                     # 코드 리뷰 결과
├── refactor/                   # 리팩토링 결과
├── infra/                      # (legacy) Cloud Run·GCS 미래상 — tech/infra.md로 통합
├── specs/                      # 베이비페어 크롤러 스펙 (tech/ 외)
├── client-search/              # 검색 기능 archive
├── info-tab-integration/       # 정보 탭 archive
├── lighthouse-seo/             # SEO 측정 결과
└── README.md                   # 인덱스
```

**원칙**:
- **현재 진실**은 [docs/tech/](docs/tech/)에 모은다. 과거 phase 진행 기록은 phase-*/·implementation/·review/에 그대로 둠.
- 새 기능 추가 시: phase plan → impl 기록 → 끝나면 tech/impl.md 갱신.

---

## 5. 새 파일을 만들기 전 결정 트리

```
새 코드를 짠다
 ├── React 컴포넌트?
 │    ├── 기존 feature에 속함 → src/components/<feature>/
 │    └── 새 feature → src/components/<new-feature>/ + 폴더 신설
 ├── 순수 함수·클래스? (UI 무관)
 │    ├── 도메인 로직 → src/lib/<concern>.ts
 │    └── 일회성 작업 → scripts/<task>.ts
 ├── 데이터?
 │    ├── 빌드 시 고정 → src/data/<name>.json + types/ 정의
 │    └── 사용자 입력 → store/use<Concern>Store.ts
 ├── 콘텐츠 (글)?
 │    ├── 발행 준비 → src/content/articles/
 │    └── 작성 중 → src/content/draft/
 └── 문서?
      ├── 영구 진실 → docs/tech/
      └── 한시적 기록 → docs/<context>/
```
