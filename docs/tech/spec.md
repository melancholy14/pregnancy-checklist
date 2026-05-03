# 개발 스펙

> 출산 준비 체크리스트 서비스의 기술 스펙 한 장 요약.
> 새 기능 작업 들어가기 전 "어떤 환경에서 도는 코드인가" 확인용.

---

## 1. 핵심 결정 사항

| 항목 | 값 | 이유 |
|------|------|------|
| 빌드 모드 | `output: "export"` (정적 export) | gh-pages 무료 배포 + SEO 자동 해결 |
| 데이터 저장 | localStorage (Zustand persist) | 회원가입 없이 즉시 사용 |
| 콘텐츠 데이터 | `src/data/*.json` 빌드 번들 포함 | API 없이 단일 정적 사이트 |
| 배포 | gh-pages → 커스텀 도메인 `pregnancy-checklist.com` | 무료, AdSense 호환 |
| 운영 전환 | Phase 6에서 Cloud Run + GCS 전환 예정 | 트래픽·기능 확장 시 |

---

## 2. 런타임 / 빌드 스택

| 영역 | 도구 | 버전 |
|------|------|------|
| 프레임워크 | Next.js | 16.2.0 (App Router) |
| 런타임 | React | 19.2.4 |
| 언어 | TypeScript | 5.8.3 |
| 스타일링 | Tailwind CSS v4 + shadcn/ui | 4.1.12 |
| 상태 관리 | Zustand (persist) | 5.0.12 |
| 차트 | Recharts | 2.15.2 |
| 검색 | Fuse.js | 7.3.0 |
| 마크다운 | remark + rehype + gray-matter | — |
| 분석 | `@next/third-parties` (GA4) | 16.2.2 |
| 광고 | Google AdSense (`<meta>` + AdUnit 컴포넌트) | — |
| 테스트 | Playwright | 1.58.2 |
| 빌드 도구 (스크립트) | tsx | 4.21.0 |
| 패키지 매니저 | npm | (lock 파일 기준) |

> **주의**: Next 16/React 19는 학습 데이터의 13~15와 다른 부분이 있다. 새 API 사용 전 [AGENTS.md](AGENTS.md) 안내·`node_modules/next/dist/docs/` 확인.

---

## 3. 환경변수

`.env.local` (커밋 안 함):

| 변수 | 용도 | 비고 |
|------|------|------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 측정 ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense 클라이언트 ID | `ca-pub-XXXXXXXXXX` |
| `NEXT_PUBLIC_FEEDBACK_FORM_URL` | 피드백 구글 폼 | `/contact` 페이지 사용 |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | scripts/ 전용 |

배포 스크립트(`npm run deploy`)는 환경변수를 인라인으로 주입.

---

## 4. 라우트 맵

| 경로 | 역할 | 데이터 소스 |
|------|------|-------------|
| `/` | 홈 (예정일 입력 + 미니 대시보드) | `useDueDateStore` + 4개 스냅샷 |
| `/about` | 만든 사람 스토리 | `CREATOR_DUE_DATE` 상수 |
| `/contact` | 의견 보내기 | `NEXT_PUBLIC_FEEDBACK_FORM_URL` |
| `/timeline` | 주차별 타임라인 + 체크리스트 통합 | `timeline_items.json` + `useChecklistStore` |
| `/checklist` | 체크리스트 허브 (3종 카드) | `*_checklist.json` |
| `/checklist/hospital-bag` | 출산 가방 | `hospital_bag_checklist.json` |
| `/checklist/partner-prep` | 배우자 준비 | `partner_prep_checklist.json` |
| `/checklist/pregnancy-prep` | 임신 준비 | `pregnancy_prep_checklist.json` |
| `/baby-fair` | 베이비페어 일정 | `babyfair_events.json` |
| `/weight` | 체중 기록 + 차트 | `useWeightStore` + Recharts |
| `/info` | 블로그 + 영상 통합 탭 | `articles/*.md` + `videos.json` |
| `/articles` | 블로그 목록 | `src/content/articles/*.md` |
| `/articles/[slug]` | 블로그 상세 | 동일 (generateStaticParams) |
| `/videos` | 영상 목록 | `videos.json` + `channels.json` |
| `/privacy`, `/terms` | 정적 정보 | — |
| `/guides/*` | 구 경로 → `/articles/*` 리다이렉트 | — |
| `/sitemap.xml`, `/robots.txt` | SEO | `sitemap.ts`, `robots.ts` |

---

## 5. 데이터 모델

### 5.1 도메인 타입 (요약)

```ts
// types/checklist.ts
type ChecklistItem = {
  id: string;
  title: string;
  category: 'hospital' | 'hospital_bag' | 'baby_items' | 'postpartum' | 'admin';
  recommendedWeek: number;
  priority: 'high' | 'medium' | 'low';
  isCustom?: boolean;
};

// types/timeline.ts
type TimelineItem = {
  id: string;
  week: number;
  title: string;
  description: string;
  type: 'prep' | 'shopping' | 'admin' | 'education' | 'wellbeing';
  priority: 'high' | 'medium' | 'low';
  linked_checklist_ids?: string[];
  linked_article_slugs?: string[];   // Phase 4 step 5 (자동 생성)
  linked_video_ids?: string[];       // 동일
  *_manual?: boolean;                 // 수동 매핑 보호 플래그
  isCustom?: boolean;
};

// types/article.ts
type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  authorNote?: string;
  reviewed_by?: string;
  linked_timeline_weeks?: number[];
  linked_video_ids?: string[];
};
```

### 5.2 사용자 상태 (localStorage)

| 키 | Store | 내용 |
|----|-------|------|
| `due-date-storage` | `useDueDateStore` | 출산 예정일 ISO 문자열 |
| `checklist-storage` | `useChecklistStore` | 체크 상태·커스텀 항목 (타임라인 통합) |
| `checklist-storage-{slug}` | `createChecklistStore` | 체크리스트 허브 3종 각각 |
| `timeline-storage` | `useTimelineStore` | 커스텀 타임라인 항목 |
| `weight-storage` | `useWeightStore` | 체중 로그 배열 |
| `onboarding-completed` | (raw) | 온보딩 완료 플래그 |
| `consent-storage` | `useConsentStore` | 쿠키 동의 상태 |

---

## 6. 의존성 정책

### 6.1 추가하기 전 체크
- 같은 일을 할 수 있는 기존 의존성이 있는가? (date-fns·zustand·radix·shadcn·sonner·lucide·fuse 모두 풍부)
- 번들 사이즈 영향 (200KB+ 라이브러리는 dynamic import 검토)
- Tree-shaking 가능 여부

### 6.2 현재 미사용으로 확인된 의존성 (제거 완료)
- `motion` (사용처 0건) → 제거
- `canvas-confetti` (사용처 0건) → 제거

### 6.3 wrapper 형태로만 들어있는 shadcn ui 컴포넌트
[review.md](review.md)에 미사용 ui 컴포넌트 30종 목록 있음. 페이지에서 import되는지 다시 검사 후 일괄 정리 가능 (Phase 5+).

---

## 7. 빌드·배포 명령

```bash
npm run dev                       # 로컬 개발
npm run build                     # next build (out/ 정적 export)
npm run deploy                    # 환경변수 인라인 주입 후 gh-pages 배포
npm run lint                      # eslint
npm run lighthouse-check          # 5개 페이지 SEO 90+ 검증
npm run fetch-channel-thumbs      # YouTube API → channels.json
npm run fetch-video-metadata      # 영상 메타 검증
npm run crosslinks                # 크로스링크 dry-run
npm run crosslinks:apply          # 실제 적용
npm run crosslinks:report         # 현재 매핑 통계
```

---

## 8. 성능·SEO 목표

| 지표 | 목표 |
|------|------|
| Lighthouse SEO | 90+ (5개 주요 페이지) |
| LCP | < 2.5s (모바일 4G) |
| 빌드 정적 페이지 수 | 26+ (현재 기준) |
| 번들 사이즈 (gzipped, 홈) | < 200KB 목표 |

---

## 9. 컴플라이언스·법적 제약

- **YMYL (의료/건강)**: 단정형 표현 금지. 의료 디스클레이머 모든 article 상단에 노출.
- **개인정보처리방침**: `/privacy`에 GA4·AdSense 데이터 수집 고지. 첫 방문 시 쿠키 동의 배너.
- **AdSense 정책**: ads.txt 파일 + `data-ad-client` 일치 + 사이트 내용물 충분 (현재 8개 article + 도구 페이지 5개).
- **Permanent Non-Goals**: 의료 상담·진단·처방·병원 추천. 체중 권장 범위는 IOM 2009 출처 명시 + 면책.
