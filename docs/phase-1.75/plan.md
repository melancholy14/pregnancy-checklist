# Phase 1.75: Google AdSense 승인 준비 — Development Plan

> Generated from: AdSense 승인 요건 분석 + 현재 사이트 상태 점검
> Phase 1.5 기록: [plan.md](../phase-1.5/plan.md)
> Date: 2026-04-03
> Status: 📋 기획 완료

---

## Overview

Phase 1.5 완료 후, Google AdSense 승인을 받기 위해 필요한 **SEO 기반 작업 + 콘텐츠 보완 + 신뢰성 페이지 추가**를 수행한다.

### 왜 별도 Phase인가

| 이유 | 설명 |
|------|------|
| **Phase 1과 분리** | Phase 1은 핵심 기능 구현, 이 Phase는 수익화 준비에 집중 |
| **Phase 2 전에 완료** | PoC 기간(4주) 내에 AdSense 승인 신청 → 트래픽 + 수익 동시 검증 |
| **AdSense 심사 리드타임** | 승인까지 1~4주 소요 → 빨리 신청해야 PoC 기간 내 결과 확인 가능 |

### 현재 상태 (AS-IS)

| 항목 | 상태 | 비고 |
|------|------|------|
| 오리지널 콘텐츠 | 176+ 항목 | 체크리스트 114 + 타임라인 22 + 베이비페어 40 |
| 개인정보처리방침 | 있음 | GA4, AdSense 언급 포함 |
| 서비스 이용약관 | 있음 | 의료 면책 포함 |
| GA4 | 연동 완료 | 이벤트 추적 동작 |
| AdSense 메타태그 | 있음 | `layout.tsx` head에 삽입 |
| 커스텀 도메인 | 없음 | `github.io` 공유 도메인 → 승인 불가 |
| sitemap.xml | 없음 | 크롤링/색인 불가 |
| robots.txt | 없음 | 크롤링 지시 없음 |
| About/Contact 페이지 | 없음 | 운영자 정보 확인 불가 |
| 페이지별 메타데이터 | 루트만 | 개별 페이지 title/description 없음 |
| 영상 데이터 | 빈 배열 | 빈 페이지 = 저품질 사유 |
| 가이드 콘텐츠 | 없음 | 구조화 데이터만 존재, 글 형태 없음 |

---

## Scope

**In scope:**

- 커스텀 도메인 연결 (GitHub Pages)
- `sitemap.ts` 동적 사이트맵 생성
- `robots.ts` 크롤링 설정
- About 페이지 (`/about`) — 서비스 소개 + 연락처
- 각 페이지별 고유 메타데이터 (`generateMetadata` or `metadata` export)
- 영상 데이터 초기 큐레이션 (최소 6~9개) 또는 네비에서 임시 제거
- 가이드 콘텐츠 1~2개 작성 (SEO 랜딩 + 콘텐츠 깊이)
- AdSense 승인 신청

**Out of scope:**

- AdUnit 슬롯 페이지 배치 (승인 후 진행)
- 광고 위치 A/B 테스트 (Phase 3)
- 자동 광고 최적화 (승인 후)

---

## Implementation Steps

### Step 1. 커스텀 도메인 연결

> AdSense 승인의 **전제 조건**. `github.io`는 공유 도메인이라 승인 불가.
> **중요**: basePath 제거와 서빙 위치 변경은 **반드시 동시에** 해야 함.
> basePath만 빼면 에셋 경로가 깨지고, 도메인만 연결하고 basePath를 남기면 크롤러가 루트를 읽지 못함.

**방법 A: 커스텀 도메인 연결 (권장)**

- 도메인 구매 (예: `chulsan-checklist.com`, `출산준비.com` 등)
- GitHub Pages 커스텀 도메인 설정
  - repo Settings → Pages → Custom domain
  - DNS CNAME 레코드 설정 (`www` → `<username>.github.io`)
  - A 레코드 설정 (GitHub Pages IP: `185.199.108-111.153`)
- `CNAME` 파일을 `public/` 디렉토리에 추가
- HTTPS 자동 활성화 확인 (Enforce HTTPS 체크)

**방법 B: repo 이름 변경 (도메인 비용 없음)**

- repo 이름을 `melancholy14.github.io`로 변경
- `melancholy14.github.io/` 루트에서 서빙됨
- 커스텀 도메인 불필요 (단, AdSense 승인 가능 여부는 불확실)

**공통 작업 (A/B 모두):**

- `next.config.ts`에서 `basePath` 설정 제거
- `.env.production`에서 `NEXT_PUBLIC_BASE_PATH=` 빈 값 확인
- GitHub Actions 배포 스크립트에서 basePath 관련 설정 제거
- 사이트 전체 링크/에셋 경로 정상 동작 확인

```
public/CNAME
→ www.your-domain.com
```

### Step 2. sitemap.ts + robots.ts

> Google이 사이트를 크롤링하고 색인할 수 있도록 필수 파일 생성.

**`src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.your-domain.com";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/timeline`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/baby-fair`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/weight`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

**`src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [] },
    sitemap: "https://www.your-domain.com/sitemap.xml",
  };
}
```

### Step 3. About 페이지 (`/about`)

> AdSense 리뷰어가 "누가 운영하는 사이트인지" 확인하는 신뢰성 페이지.

- 경로: `src/app/about/page.tsx`
- 내용:
  - 서비스 소개 (무엇을, 왜 만들었는지)
  - 타겟 사용자 (임산부, 예비 부모)
  - 제공하는 기능 요약
  - 연락처 (이메일)
  - 의료 면책 고지 (footer와 동일 문구)
- 푸터에 About 링크 추가

### Step 4. 페이지별 메타데이터

> 각 페이지가 고유한 title + description을 가져야 Google 색인 품질이 올라감.

| 페이지 | title | description |
|--------|-------|-------------|
| `/` | 출산 준비 체크리스트 - 임신 주차별 준비 가이드 | 임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요. |
| `/timeline` | 임신 주차별 타임라인 & 체크리스트 | 4주부터 40주까지, 주차별로 준비해야 할 항목을 체크리스트와 함께 확인하세요. |
| `/baby-fair` | 베이비페어 일정 모음 | 전국 베이비페어 일정, 장소, 공식 링크를 한곳에서 확인하세요. |
| `/weight` | 임신 체중 기록 & 변화 그래프 | 임신 중 체중 변화를 기록하고 그래프로 한눈에 확인하세요. |
| `/videos` | 임산부 추천 영상 모음 | 임산부 운동, 출산 준비, 신생아 케어 관련 추천 영상을 모아봤습니다. |
| `/about` | 서비스 소개 - 출산 준비 체크리스트 | 출산 준비 체크리스트 서비스의 소개와 연락처입니다. |

### Step 5. 영상 데이터 채우기

> 빈 페이지는 "저품질/불충분한 콘텐츠" 거절 사유. 최소 콘텐츠 확보 필요.

- YouTube에서 임산부 관련 영상 수동 큐레이션 (최소 6~9개)
- 카테고리별 2~3개씩: 임산부 운동 / 출산 준비 / 신생아 케어
- `src/data/videos.json`에 추가
- 영상 데이터 확보가 어려우면 **대안**: 네비에서 영상 탭 임시 제거 + sitemap에서 제외

### Step 6. 가이드 콘텐츠 (권장)

> 구조화 데이터(리스트)만으로는 "사용자에게 가치 있는 콘텐츠"로 인정받기 어려움.
> 1~2개의 가이드 글이 있으면 콘텐츠 깊이와 SEO 랜딩 효과를 동시에 얻음.

- 후보 주제:
  - "출산 가방 꼭 필요한 것만 정리" — 체크리스트 데이터를 풀어쓴 가이드
  - "임신 주차별 검사 & 준비 가이드" — 타임라인 데이터를 풀어쓴 가이드
- 형태: 정적 페이지 (`/guides/hospital-bag`, `/guides/weekly-prep`)
- 기존 데이터를 활용하되 **설명형 글**로 재구성 (리스트 복사 X)

### Step 7. AdSense 승인 신청

> Step 1~5 완료 + 2~4주 운영 후 신청.

- Google Search Console에 사이트 등록 + sitemap 제출
- AdSense 계정에서 사이트 추가 + 소유권 확인 (메타태그 이미 있음)
- 심사 제출 (1~4주 소요)

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/app/sitemap.ts` | 동적 사이트맵 생성 |
| `src/app/robots.ts` | 크롤링 설정 |
| `src/app/about/page.tsx` | 서비스 소개 + 연락처 페이지 |
| `public/CNAME` | GitHub Pages 커스텀 도메인 설정 |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | 루트 메타데이터 보강 (description 상세화) |
| `src/app/timeline/page.tsx` | 페이지 고유 `metadata` export 추가 |
| `src/app/baby-fair/page.tsx` | 페이지 고유 `metadata` export 추가 |
| `src/app/weight/page.tsx` | 페이지 고유 `metadata` export 추가 |
| `src/app/videos/page.tsx` | 페이지 고유 `metadata` export 추가 |
| `src/app/page.tsx` | 홈 `metadata` export 보강 |
| `src/components/layout/Footer.tsx` | About 링크 추가 |
| `src/data/videos.json` | 영상 6~9개 초기 데이터 추가 |
| `next.config.ts` | `basePath` 제거 (커스텀 도메인 시) |

### Optional Files (가이드 콘텐츠)

| File | Purpose |
|------|---------|
| `src/app/guides/hospital-bag/page.tsx` | 출산 가방 가이드 |
| `src/app/guides/weekly-prep/page.tsx` | 주차별 준비 가이드 |

---

## 완료 조건

| # | 조건 | 검증 방법 |
|---|------|----------|
| 1 | 커스텀 도메인으로 사이트 접속 + HTTPS 동작 | 브라우저 확인 |
| 2 | `/sitemap.xml` 접속 시 모든 페이지 URL 표시 | 브라우저 확인 |
| 3 | `/robots.txt` 접속 시 sitemap URL 포함 | 브라우저 확인 |
| 4 | `/about` 페이지에 서비스 소개 + 연락처 표시 | 브라우저 확인 |
| 5 | 각 페이지 `<title>`, `<meta description>` 고유 값 확인 | 개발자 도구 |
| 6 | `/videos` 페이지에 영상 6개 이상 표시 | 브라우저 확인 |
| 7 | Google Search Console에 사이트 등록 + sitemap 제출 | GSC 대시보드 |
| 8 | AdSense에서 사이트 추가 + 소유권 확인 통과 | AdSense 대시보드 |
| 9 | 빌드 성공 (`next build`) | CI |

---

## 의존성 & 순서

```
Step 1 (커스텀 도메인) ← 도메인 구매 필요 (외부 작업)
    ↓
Step 2 (sitemap + robots) ← 도메인 URL 확정 후
    ↓
Step 3 (About 페이지) ← 독립 작업
Step 4 (메타데이터) ← 독립 작업
Step 5 (영상 데이터) ← 독립 작업
Step 6 (가이드 콘텐츠) ← 독립 작업 (권장)
    ↓
Step 7 (AdSense 신청) ← 전체 완료 + 2~4주 운영 후
```

Step 2~6은 도메인 구매 대기 중 **병렬 진행** 가능 (URL만 나중에 교체).

---

## 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| AdSense 심사 거절 | 수익화 지연 | 거절 사유 확인 → 보완 → 재신청 (횟수 제한 없음) |
| "저품질 콘텐츠" 거절 | 가장 흔한 사유 | 가이드 콘텐츠 추가, 영상 데이터 확보 |
| "트래픽 부족" 거절 | PoC 초기에 발생 가능 | GSC 색인 확인 + SNS/커뮤니티 공유로 초기 트래픽 확보 |
| 커스텀 도메인 DNS 전파 지연 | 배포 후 1~48시간 접속 불가 | DNS TTL 낮게 설정, HTTPS 활성화 대기 |
| static export에서 sitemap.ts 미동작 | sitemap.xml 미생성 | `output: 'export'` 환경에서는 `public/sitemap.xml` 정적 파일로 대체 |
