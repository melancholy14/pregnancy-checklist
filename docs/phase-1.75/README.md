# Phase 1.75: Google AdSense 승인 준비

> 작성일: 2026-04-04 | 작성자: Claude Code

## 개요

Google AdSense 승인을 받기 위해 필요한 SEO 기반 작업, 콘텐츠 보완, 메타데이터 강화를 수행한다. Phase 1.5(기능 구현)와 Phase 2(크롤러/인프라) 사이에 위치하는 수익화 준비 Phase이다.

---

## 구현 내용

### 완료 조건 충족 여부

| # | 조건 | 상태 | 비고 |
|---|------|------|------|
| 1 | 커스텀 도메인으로 사이트 접속 + HTTPS 동작 | ✅ 완료 | `pregnancy-checklist.com` (Phase 1.5에서 완료) |
| 2 | `/sitemap.xml` 접속 시 모든 페이지 URL 표시 | ✅ 완료 | `sitemap.ts` + `force-static` |
| 3 | `/robots.txt` 접속 시 sitemap URL 포함 | ✅ 완료 | `robots.ts` + `force-static` |
| 4 | `/about` 페이지에 서비스 소개 + 연락처 표시 | ✅ 완료 | Phase 1.5에서 완료 |
| 5 | 각 페이지 `<title>`, `<meta description>`, OG 태그, canonical URL 확인 | ✅ 완료 | 10개 전체 페이지 |
| 6 | `/videos` 페이지에 영상 6개 이상 표시 (YouTube 썸네일 핫링크) | ✅ 완료 | 9개 영상 (카테고리별 3개) |
| 7 | 가이드 콘텐츠 2개 이상 게시 (각 1,000자+) | ✅ 완료 | hospital-bag, weekly-prep |
| 8 | 빌드 성공 (`next build`) | ✅ 완료 | 15개 페이지 정적 생성 |
| 9 | Playwright E2E 테스트 통과 | ✅ 완료 | 111개 테스트 전부 통과 |

### 생성/수정 파일

**신규 (6개)**

- `src/components/home/HomeContent.tsx` — 홈 페이지 클라이언트 컴포넌트 (page.tsx에서 분리, metadata export 지원)
- `src/app/guides/hospital-bag/page.tsx` — 출산 가방 필수 준비물 가이드
- `src/app/guides/weekly-prep/page.tsx` — 임신 주차별 검사 & 준비 가이드
- `public/og-image.png` — OG 공유용 대표 이미지 (1200x630)
- `e2e/guides.spec.ts` — 가이드 페이지 E2E 테스트 (14개)
- `e2e/seo-metadata.spec.ts` — SEO 메타데이터 E2E 테스트 (17개)

**수정 (12개)**

- `src/app/layout.tsx` — `metadataBase`, OG 기본값, canonical 추가. `BASE_URL`/`OG_IMAGE` 상수 사용
- `src/app/page.tsx` — `"use client"` 제거, Server Component 전환. metadata export + OG + canonical
- `src/app/timeline/page.tsx` — OG + canonical 메타데이터 추가
- `src/app/baby-fair/page.tsx` — OG + canonical 메타데이터 추가
- `src/app/weight/page.tsx` — OG + canonical 메타데이터 추가
- `src/app/videos/page.tsx` — OG + canonical 메타데이터 추가
- `src/app/about/page.tsx` — OG + canonical 메타데이터 추가
- `src/app/privacy/page.tsx` — description + OG + canonical 메타데이터 추가
- `src/app/terms/page.tsx` — description + OG + canonical 메타데이터 추가
- `src/app/sitemap.ts` — 가이드 페이지 2개 URL 추가
- `src/lib/constants.ts` — `BASE_URL`, `OG_IMAGE` 상수 추가
- `src/data/videos.json` — 9개 영상 데이터 추가 (exercise 3, birth_prep 3, newborn_care 3)
- `e2e/videos.spec.ts` — 빈 배열 → 데이터 있는 상태 테스트로 업데이트

---

## 주요 구현 결정

### 1. 홈 페이지 Server Component 전환

`page.tsx`가 `"use client"`였기 때문에 `metadata` export가 불가능했다. 클라이언트 로직을 `HomeContent.tsx`로 분리하고 `page.tsx`를 Server Component로 전환하여 metadata export를 활성화했다.

### 2. sitemap.ts `force-static` 방식 채택

`output: 'export'` 환경에서 원래 `sitemap.ts`가 동작하지 않을 수 있으나, `export const dynamic = "force-static"` 설정으로 빌드 시 정적 파일(`sitemap.xml`, `robots.txt`)로 생성됨을 확인했다. `public/` 정적 파일 대비 코드 관리 용이성이 높아 이 방식을 채택했다.

### 3. URL 하드코딩 제거

코드 리뷰에서 `https://pregnancy-checklist.com`이 9개 파일에 반복 사용된 것을 발견. `src/lib/constants.ts`에 `BASE_URL`, `OG_IMAGE` 상수를 추출하여 DRY 원칙을 적용했다.

### 4. YouTube 썸네일 핫링크 방식

YouTube 썸네일을 자체 호스팅하지 않고 `img.youtube.com` URL을 직접 참조한다. YouTube API 정책상 공식 API 응답의 썸네일 URL을 `<img>`로 표시하고 클릭 시 YouTube로 이동하는 것은 허용된다. 썸네일 다운로드 후 재호스팅은 저작권 침해 가능성이 있어 금지.

### 5. OG 이미지 shallow merge 대응

Next.js에서 page의 `openGraph`가 layout의 것을 shallow merge(완전 교체)한다. layout에 `images`를 설정해도 page에서 `openGraph`를 지정하면 `images`가 사라지는 문제를 발견. 홈 page.tsx의 `openGraph`에 `images`를 명시적으로 포함하여 해결했다.

---

## 테스트 결과

- **총 111개 테스트** (기존 80개 + 신규 31개)
- **전부 통과** (52.7s)

### 신규 테스트 커버리지

| 파일 | 테스트 수 | 범위 |
|------|----------|------|
| `guides.spec.ts` | 14개 | 가이드 2개 페이지 콘텐츠, 내부 링크, 의료 면책, 모바일 반응형 |
| `seo-metadata.spec.ts` | 17개 | 페이지별 title, OG 태그, canonical URL, 고유 description |
| `videos.spec.ts` (업데이트) | 8개 | 카테고리 탭, YouTube 링크/썸네일, 탭 전환 |

---

## 다음 단계

1. **Google Search Console 등록** + sitemap 제출 + 색인 요청 (외부 작업)
2. **OG 이미지 교체** — 현재 placeholder(단색 핑크). 디자인된 이미지로 교체 필요
3. **AdSense 승인 신청** — GSC 색인 확인 후 진행
4. **가이드 콘텐츠 추가** — 선택 가이드 (임신 초기 검사, 산후조리원, 비용 총정리) 중 1개 이상
