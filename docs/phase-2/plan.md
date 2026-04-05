# Phase 2: 콘텐츠 강화 + AdSense 승인 — Development Plan

> Phase 1.5 기록: [phase-1.5/plan.md](../phase-1.5/plan.md)
> Date: 2026-04-04
> 목표 완료: 2026-04-30
> Status: 📋 기획 완료

---

## Overview

Phase 1.5에서 AdSense 승인의 **기초 요건**(도메인, sitemap, 메타데이터,
가이드 2개, 영상 9개)을 갖췄으나, 승인률을 높이려면
**콘텐츠 볼륨과 깊이**가 추가로 필요하다.

### 왜 지금 해야 하는가

| 이유 | 설명 |
|------|------|
| **AdSense 타임라인** | 4월 말 완료 → 5월 초 GSC 색인 → 5월 중순 신청 → 6월 말 PoC 내 결과 확인 |
| **"저품질 콘텐츠" 대응** | 가이드 2개 + 영상 9개만으로는 거절 리스크. 정보글 5개+ 확보 필요 |
| **색인 페이지 수** | 현재 ~11페이지. 정보글 추가로 20+ 페이지 확보 → 검색 노출 증가 |
| **유기적 트래픽** | 태그 기반 정보글은 롱테일 키워드 유입 채널 |

### 현재 상태 (AS-IS)

| 항목 | 상태 | 비고 |
|------|------|------|
| 영상 데이터 | 9개 (3카테고리 × 3개) | 세부 카테고리 없음 |
| 채널 데이터 | 없음 | videos.json에 혼재 |
| 정보성 글 | 가이드 2개 (TSX 하드코딩) | MD 파일 아님, 목록 페이지 없음 |
| 네비게이션 | 5탭 (홈/타임라인/베이비페어/체중/영상) | 정보글 진입점 없음 |

### TO-BE

| 항목 | 목표 |
|------|------|
| 영상 데이터 | 15~20개, 세부 카테고리별 분류 |
| 채널 데이터 | channels.json 분리, 채널별 썸네일 |
| 정보성 글 | 5개+, MD 파일 기반, 태그 필터 |
| 네비게이션 | 6탭 (정보글 메뉴 추가) + 홈 대시보드 |
| 색인 페이지 | 20+ 페이지 |

---

## Scope

**In scope:**

- YouTube 영상 세부 카테고리(subcategory) 추가
- `channels.json` 분리 + 채널 썸네일 (YouTube API)
- 영상 페이지 UI 개편 (카테고리 → 세부 카테고리 탭/필터)
- MD 파일 기반 정보글 시스템 구축 (SSG)
- `/articles` 목록 페이지 + `/articles/[slug]` 상세 페이지
- 태그 기반 필터링
- 네비게이션 + 홈 대시보드에 정보글 메뉴 추가
- 기존 가이드 2개(`hospital-bag`, `weekly-prep`) MD 변환
- 신규 정보글 3~5개 작성
- sitemap에 신규 페이지 추가
- AdSense 승인 신청 준비

**Out of scope:**

- YouTube Data API 자동 수집 파이프라인 (Phase 4 이후)
- CMS/Admin UI (MD 파일 직접 편집으로 충분)
- 댓글/좋아요 등 사용자 인터랙션
- 광고 슬롯 배치 최적화 (승인 후 Phase 3~)

---

## Step 1. YouTube 콘텐츠 세분화

### 1-1. 세부 카테고리 설계

현재 3개 대분류를 유지하면서 세부 카테고리를 추가한다.

| 대분류 (category) | 세부 카테고리 (subcategory) |
|-------------------|---------------------------|
| `exercise` 임산부 운동 | `yoga` 요가, `walking` 걷기, `stretching` 스트레칭, `pilates` 필라테스 |
| `birth_prep` 출산 준비 | `hospital_bag` 출산가방, `delivery_info` 분만정보, `prenatal_care` 산전관리 |
| `newborn_care` 신생아 케어 | `bathing` 목욕, `feeding` 수유, `sleep` 수면, `development` 발달 |

### 1-2. videos.json 스키마 변경

```json
{
  "id": "video_001",
  "title": "영상 제목",
  "youtube_id": "VIDEO_ID",
  "category": "exercise",
  "categoryName": "임산부 운동",
  "subcategory": "yoga",
  "subcategoryName": "요가",
  "description": "영상 설명",
  "channel_id": "channel_001"
}
```

**변경 사항:**
- `subcategory`, `subcategoryName` 필드 추가
- `channel_id` 참조 필드 추가 (channels.json과 연결)
- 기존 9개 영상에 subcategory 매핑 + 신규 영상 추가

### 1-3. channels.json 신규 생성

```json
[
  {
    "id": "channel_001",
    "youtube_channel_id": "UC...",
    "name": "채널명",
    "description": "채널 소개 (1줄)",
    "category": "exercise",
    "thumbnail_url": "https://yt3.ggpht.com/..."
  }
]
```

**채널 썸네일 확보 방법:**

YouTube Data API v3 `channels.list` 호출:

```
GET https://www.googleapis.com/youtube/v3/channels
  ?part=snippet
  &id={CHANNEL_ID}
  &key={API_KEY}
```

응답의 `snippet.thumbnails.default.url`을 `thumbnail_url`에 저장.

> **PoC 방식**: 빌드 스크립트(`scripts/fetch-channel-thumbs.ts`)로
> API 호출 → channels.json 업데이트. 빌드 시 자동 실행은 아님,
> 채널 추가 시 수동 실행.
>
> **재호스팅 금지**: YouTube API 응답 URL을 그대로 사용.
> `yt3.ggpht.com` 도메인 URL을 `<img>`로 직접 참조.

### 1-4. VideoItem 타입 변경

```ts
// src/types/video.ts
export type VideoItem = {
  id: string;
  title: string;
  youtube_id: string;
  category: 'exercise' | 'birth_prep' | 'newborn_care';
  categoryName: string;
  subcategory: string;
  subcategoryName: string;
  description?: string;
  channel_id: string;
};

export type ChannelItem = {
  id: string;
  youtube_channel_id: string;
  name: string;
  description: string;
  category: 'exercise' | 'birth_prep' | 'newborn_care';
  thumbnail_url: string;
};
```

### 1-5. 영상 페이지 UI 개편

```
┌─────────────────────────────────┐
│ 🎬 추천 영상                    │
├─────────────────────────────────┤
│ [채널] [영상]          ← 뷰 전환│
├─────────────────────────────────┤
│ 카테고리: [전체|운동|출산|케어]  │
│ 세부:     [전체|요가|걷기|...]   │
├─────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │ 썸네일 │ │ 썸네일 │ │ 썸네일 │  │
│ │ 제목   │ │ 제목   │ │ 제목   │  │
│ │ 채널명 │ │ 채널명 │ │ 채널명 │  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ ─ 채널 뷰 ─                    │
│ ┌─────────────────────────────┐│
│ │ [썸네일] 채널명               ││
│ │          카테고리 · 설명      ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

- **영상 뷰**: 카테고리 → 세부 카테고리 2단 필터
- **채널 뷰**: 카테고리별 채널 목록 (썸네일 + 이름 + 설명)
- 채널 클릭 → YouTube 채널 페이지로 이동 (새 탭)

---

## Step 2. 정보성 글 (블로그) 시스템

### 2-1. 아키텍처 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 글 저장 형식 | **Markdown + frontmatter** | 비개발자도 편집 가능, Git 관리 용이 |
| 빌드 처리 | **gray-matter + remark/rehype** | 경량, 의존성 최소, static export 호환 |
| 라우팅 | **`/articles/[slug]`** | Next.js generateStaticParams로 SSG |
| 목록 데이터 | **빌드 시 MD 파일 목록 읽기** | 별도 DB 불필요, JSON import 패턴과 유사 |
| 대안 검토 | contentlayer → 비채택 | 프로젝트 유지보수 중단됨, 과도한 의존성 |

### 2-2. MD 파일 구조

```
src/content/articles/
├── hospital-bag.md          ← 기존 가이드 변환
├── weekly-prep.md           ← 기존 가이드 변환
├── early-pregnancy-tests.md ← 신규
├── postpartum-care.md       ← 신규
├── baby-items-cost.md       ← 신규
├── breastfeeding-guide.md   ← 신규 (선택)
└── newborn-sleep.md         ← 신규 (선택)
```

### 2-3. Frontmatter 스키마

```yaml
---
title: "출산 가방 필수 준비물 총정리"
description: "출산 가방에 꼭 넣어야 할 준비물을 정리했습니다."
slug: "hospital-bag"
tags:
  - 출산준비
  - 출산가방
  - 병원준비
date: "2026-04-04"
updated: "2026-04-04"
---

본문 내용 (Markdown)...
```

### 2-4. Article 타입 정의

```ts
// src/types/article.ts
export type ArticleMeta = {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  date: string;
  updated?: string;
};

export type Article = ArticleMeta & {
  content: string; // HTML (remark 변환 후)
};
```

### 2-5. MD 처리 유틸리티

```ts
// src/lib/articles.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const ARTICLES_DIR = path.join(
  process.cwd(), 'src/content/articles'
);

export function getAllArticles(): ArticleMeta[] {
  const files = fs.readdirSync(ARTICLES_DIR);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(
        path.join(ARTICLES_DIR, f), 'utf-8'
      );
      const { data } = matter(raw);
      return data as ArticleMeta;
    })
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const result = await remark().use(html).process(content);

  return {
    ...(data as ArticleMeta),
    content: result.toString(),
  };
}
```

> **SSG 핵심**: `getAllArticles()`와 `getArticleBySlug()`는
> 빌드 시(서버 사이드)에만 실행됨. `fs` 모듈 사용 가능.
> `output: 'export'` 환경에서 `generateStaticParams`로
> 모든 slug에 대해 정적 HTML 생성.

### 2-6. 페이지 구현

#### 목록 페이지 (`/articles`)

```
┌─────────────────────────────────┐
│ 📝 정보 & 가이드                │
├─────────────────────────────────┤
│ 태그: [전체] [출산준비] [신생아] │
│       [임신초기] [산후관리] ...  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 출산 가방 필수 준비물 총정리 │ │
│ │ 출산 가방에 꼭 넣어야 할...  │ │
│ │ #출산준비 #출산가방 #병원준비│ │
│ │ 2026-04-04                  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 임신 주차별 검사 & 준비     │ │
│ │ 임신 초기부터 출산까지...    │ │
│ │ #임신초기 #검사 #주차별      │ │
│ │ 2026-04-04                  │ │
│ └─────────────────────────────┘ │
│ ...                             │
└─────────────────────────────────┘
```

```ts
// src/app/articles/page.tsx
import { getAllArticles } from '@/lib/articles';

export const metadata: Metadata = { ... };

export default function ArticlesPage() {
  const articles = getAllArticles();
  return <ArticlesContainer articles={articles} />;
}
```

#### 상세 페이지 (`/articles/[slug]`)

```ts
// src/app/articles/[slug]/page.tsx
import {
  getAllArticles,
  getArticleBySlug,
} from '@/lib/articles';

export function generateStaticParams() {
  return getAllArticles().map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `${BASE_URL}/articles/${params.slug}` },
    openGraph: { ... },
  };
}

export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.slug);
  return <ArticleDetail article={article} />;
}
```

### 2-7. 기존 가이드 변환 전략

| 기존 파일 | 변환 대상 |
|----------|----------|
| `src/app/guides/hospital-bag/page.tsx` | `src/content/articles/hospital-bag.md` |
| `src/app/guides/weekly-prep/page.tsx` | `src/content/articles/weekly-prep.md` |

**변환 절차:**

1. TSX 페이지의 텍스트 콘텐츠를 MD로 추출
2. frontmatter 작성 (title, description, tags, date)
3. `/guides/*` → `/articles/*`로 리다이렉트 설정
4. 기존 TSX 가이드 페이지 삭제
5. sitemap.ts URL 업데이트

### 2-8. 신규 정보글 (최소 3개)

| slug | 제목 | 태그 | 데이터 소스 |
|------|------|------|-------------|
| `early-pregnancy-tests` | 임신 초기 필수 검사 총정리 | 임신초기, 검사, 병원 | 타임라인 4~12주 |
| `postpartum-care` | 산후조리원 선택 가이드 | 산후관리, 산후조리원 | 체크리스트 postpartum |
| `baby-items-cost` | 출산 준비물 예상 비용 총정리 | 출산준비, 비용, 쇼핑 | 체크리스트 전체 |

**선택 (시간 여유 시):**

| slug | 제목 | 태그 |
|------|------|------|
| `breastfeeding-guide` | 모유수유 초보맘 가이드 | 신생아, 수유, 모유 |
| `newborn-sleep` | 신생아 수면 교육 기초 | 신생아, 수면, 육아 |

**작성 원칙:**

- 각 글 1,000자+ (AdSense 콘텐츠 기준)
- 기존 데이터를 **설명형 글**로 재구성 (리스트 복사 X)
- 실질적 팁, 주의사항, 시기별 포인트 포함
- 다른 페이지/글로의 내부 링크 포함 (상호 연결)
- 의료 면책 고지 포함

---

## Step 3. 네비게이션 & 대시보드 통합

### 3-1. 네비게이션 변경

| AS-IS (5탭) | TO-BE (5탭) |
|-------------|-------------|
| 홈 / 타임라인 / 베이비페어 / 체중 / 영상 | 홈 / 타임라인 / 베이비페어 / 영상 / 정보 |

> **체중 탭 → 홈에서 접근**: 체중 기록은 사용 빈도가 낮음
> (주 1회 정도). 홈 대시보드 또는 Feature Grid에서
> 접근 가능하도록 유지하되, 하단 네비에서는 제거.
> 정보글이 AdSense 승인과 SEO에 더 중요하므로 우선순위 교체.

```ts
// BottomNav 변경
const navItems = [
  { path: "/", icon: Home, label: "홈" },
  { path: "/timeline", icon: Calendar, label: "타임라인" },
  { path: "/baby-fair", icon: Users, label: "베이비페어" },
  { path: "/videos", icon: Video, label: "영상" },
  { path: "/articles", icon: FileText, label: "정보" },
];
```

### 3-2. 홈 대시보드 변경

Feature Grid에 "정보 & 가이드" 카드 추가:

- 아이콘: `FileText`
- 라벨: "정보"
- 링크: `/articles`
- 최신 글 1~2개 미리보기 (선택)

---

## Step 4. 빌드 & SEO 연동

### 4-1. 의존성 추가

```bash
npm install gray-matter remark remark-html
```

### 4-2. sitemap.ts 업데이트

`getAllArticles()`에서 slug 목록을 가져와 sitemap에 자동 추가:

```ts
// src/app/sitemap.ts
import { getAllArticles } from '@/lib/articles';

// 기존 URL + 정보글 URL 자동 생성
const articles = getAllArticles();
const articleUrls = articles.map(a => ({
  url: `${BASE_URL}/articles/${a.slug}`,
  lastModified: new Date(a.updated ?? a.date),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}));
```

### 4-3. 리다이렉트 설정

```ts
// src/app/guides/hospital-bag/page.tsx
import { redirect } from 'next/navigation';
export default function Page() {
  redirect('/articles/hospital-bag');
}

// src/app/guides/weekly-prep/page.tsx
import { redirect } from 'next/navigation';
export default function Page() {
  redirect('/articles/weekly-prep');
}
```

---

## Step 5. AdSense 승인 신청

### 5-1. 사전 체크리스트

- [ ] 정보글 5개+ 게시 (각 1,000자+)
- [ ] YouTube 영상 15개+ 표시
- [ ] 채널 목록 + 썸네일 정상 노출
- [ ] `/articles` 목록 페이지 정상 동작
- [ ] 태그 필터 동작
- [ ] sitemap에 신규 URL 포함
- [ ] 빌드 성공 (`next build`)
- [ ] E2E 테스트 통과
- [ ] Lighthouse SEO 90+

### 5-2. GSC & AdSense

- Google Search Console에 sitemap 재제출
- 색인된 페이지 수 ≥ 15개 확인
- AdSense 계정에서 사이트 추가 + 심사 제출

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/content/articles/*.md` | 정보글 MD 파일 (5~7개) |
| `src/lib/articles.ts` | MD 파싱 유틸 (gray-matter + remark) |
| `src/types/article.ts` | ArticleMeta, Article 타입 |
| `src/app/articles/page.tsx` | 정보글 목록 페이지 |
| `src/app/articles/[slug]/page.tsx` | 정보글 상세 페이지 |
| `src/components/articles/ArticlesContainer.tsx` | 목록 클라이언트 컴포넌트 (태그 필터) |
| `src/components/articles/ArticleCard.tsx` | 글 카드 컴포넌트 |
| `src/components/articles/ArticleDetail.tsx` | 상세 뷰 컴포넌트 |
| `src/components/articles/TagFilter.tsx` | 태그 필터 칩 |
| `src/data/channels.json` | YouTube 채널 데이터 |
| `src/types/channel.ts` (또는 video.ts 확장) | ChannelItem 타입 |
| `scripts/fetch-channel-thumbs.ts` | 채널 썸네일 수집 스크립트 |

### Modified Files

| File | Changes |
|------|---------|
| `src/data/videos.json` | subcategory, channel_id 필드 추가 |
| `src/types/video.ts` | subcategory, channel_id 필드 추가 |
| `src/components/videos/VideosContainer.tsx` | 세부 카테고리 필터 + 채널 뷰 |
| `src/components/videos/VideoCard.tsx` | 채널명 표시 |
| `src/components/layout/BottomNav.tsx` | 5탭 재구성 (체중→정보) |
| `src/components/home/HomeContent.tsx` | Feature Grid에 정보 카드 |
| `src/app/sitemap.ts` | 정보글 URL 자동 추가 |
| `src/app/guides/hospital-bag/page.tsx` | → redirect |
| `src/app/guides/weekly-prep/page.tsx` | → redirect |

### Deleted Files

| File | Reason |
|------|--------|
| (없음) | 기존 가이드 TSX는 리다이렉트로 유지 |

---

## Implementation Steps

| Step | 내용 | 의존성 | 예상 기간 |
|------|------|--------|----------|
| 1 | 의존성 설치 (gray-matter, remark) | 없음 | 1일 |
| 2 | Article 타입 + MD 파싱 유틸 작성 | Step 1 | 1일 |
| 3 | 기존 가이드 2개 MD 변환 | Step 2 | 1일 |
| 4 | 목록/상세 페이지 구현 + 태그 필터 | Step 2 | 2~3일 |
| 5 | 네비게이션 + 대시보드 업데이트 | Step 4 | 1일 |
| 6 | 신규 정보글 3~5개 작성 | Step 3 | 3~5일 |
| 7 | channels.json + 채널 썸네일 스크립트 | 없음 | 1~2일 |
| 8 | videos.json 세부 카테고리 추가 | Step 7 | 1일 |
| 9 | 영상 페이지 UI 개편 (세부 필터 + 채널 뷰) | Step 8 | 2~3일 |
| 10 | sitemap 업데이트 + 리다이렉트 설정 | Step 4, 9 | 1일 |
| 11 | E2E 테스트 작성 | Step 10 | 2일 |
| 12 | GSC 색인 + AdSense 신청 준비 | Step 11 | 외부 작업 |

**병렬 가능**: Step 2~6(정보글 시스템)과 Step 7~9(YouTube 세분화)는 독립 작업.

---

## 일정 (Timeline)

| 기간 | 작업 | 비고 |
|------|------|------|
| 4/7~4/11 | Step 1~5: 정보글 시스템 기본 구축 | 목록+상세+네비 |
| 4/7~4/11 | Step 7~8: channels.json + 영상 세분화 | 병렬 진행 |
| 4/14~4/18 | Step 6: 신규 정보글 작성 (3~5개) | 콘텐츠 작성 |
| 4/14~4/18 | Step 9: 영상 페이지 UI 개편 | 병렬 진행 |
| 4/21~4/25 | Step 10~11: 통합 + 테스트 | 마무리 |
| 4/28~4/30 | 배포 + GSC sitemap 재제출 | |
| 5/1~5/10 | GSC 색인 확인 (≥ 15페이지) | 외부 대기 |
| 5/10~5/15 | AdSense 승인 신청 | |

---

## 완료 조건

| # | 조건 | 검증 방법 |
|---|------|----------|
| 1 | `/articles` 목록 페이지에 글 5개+ 표시 | E2E |
| 2 | `/articles/[slug]` 상세 페이지 정상 렌더링 | E2E |
| 3 | 태그 필터 동작 (클릭 시 해당 태그 글만 노출) | E2E |
| 4 | 각 정보글 1,000자+ 콘텐츠 | 수동 확인 |
| 5 | 기존 `/guides/*` → `/articles/*` 리다이렉트 | E2E |
| 6 | 네비게이션에 "정보" 탭 노출 + 동작 | E2E |
| 7 | 홈 대시보드에 정보글 진입점 | E2E |
| 8 | `videos.json`에 subcategory 필드 존재 | 타입 체크 |
| 9 | `channels.json` 생성 + 채널 썸네일 정상 노출 | E2E |
| 10 | 영상 페이지에서 세부 카테고리 필터 동작 | E2E |
| 11 | 영상 페이지에서 채널 뷰 전환 + 채널 목록 노출 | E2E |
| 12 | sitemap에 정보글 + 채널 URL 포함 | 브라우저 확인 |
| 13 | 빌드 성공 (`next build`) | CI |
| 14 | E2E 테스트 통과 | CI |
| 15 | Lighthouse SEO 90+ | Lighthouse |

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| gray-matter가 static export에서 동작 안 함 | 빌드 실패 | 서버 사이드(빌드 시)에서만 fs 사용. 클라이언트 번들에 포함 안 되도록 import 분리 |
| 정보글 작성 지연 | AdSense 신청 지연 | 필수 3개에 집중, 선택 글은 승인 후 추가 |
| YouTube API 할당량 초과 | 채널 썸네일 실패 | PoC에서는 수동 실행 (빌드 시 자동 아님). 할당량 여유 |
| 채널 썸네일 URL 만료 | 이미지 깨짐 | 빌드/배포 시 스크립트 재실행으로 URL 갱신 |
| 네비 5탭 → 체중 제거 시 사용자 혼란 | 체중 기능 접근성 하락 | 홈 Feature Grid에서 체중 접근 유지 |
| AdSense "트래픽 부족" 거절 | 수익화 지연 | SNS/커뮤니티 공유 + GSC 색인 확인 후 신청 |
