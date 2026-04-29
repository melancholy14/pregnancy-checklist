# 구글 애드센스 승인 분석 리포트

> 작성일: 2026-04-13
> 대상: pregnancy-checklist.com

## 현재 상태 요약

| 항목 | 값 |
|------|-----|
| 기술 스택 | Next.js 16 + Static Export (GitHub Pages) |
| 콘텐츠 | 9개 아티클 (평균 ~1,178단어) |
| 도구 페이지 | 5개 (타임라인, 체중관리, 베이비페어, 영상, 체크리스트) |
| 법적 페이지 | 개인정보처리방침, 이용약관, 서비스 소개, 연락처 |
| 광고 구현 | AdUnit 컴포넌트 존재, 미사용 |

---

## CRITICAL — 반드시 수정해야 승인 가능

### 1. AdSense 스크립트가 로드되지 않음

- **위치**: `src/app/layout.tsx:43-45`
- **문제**: `<meta name="google-adsense-account">` 태그만 있고, 실제 `adsbygoogle.js` 스크립트가 `<head>`에 없음
- **영향**: 스크립트 없이는 광고가 절대 로드되지 않아 심사 자체가 불가

```html
<!-- 현재: meta만 있음 -->
<meta name="google-adsense-account" content="ca-pub-..." />

<!-- 필요: 스크립트도 있어야 함 -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..."
  crossorigin="anonymous"></script>
```

### 2. AdUnit 컴포넌트가 어디에서도 사용되지 않음

- **위치**: `src/components/ads/AdUnit.tsx`
- **문제**: 컴포넌트가 존재하지만 실제 페이지에서 import하는 곳이 0개
- **필요 조치**: 최소 아티클 상세 페이지, 홈, 타임라인 페이지에 광고 슬롯 배치

### 3. 참고 자료 URL이 전부 빠져 있음 (URL-NEEDED)

- **위치**: `src/content/articles/*.md` (9개 아티클 전체)
- **문제**: 참고 자료 링크가 `<!-- URL-NEEDED -->` 주석으로 남아있음. 총 30개 이상 미삽입
- **영향**: YMYL(Your Money Your Life) 카테고리에서 출처 링크 없는 의료 정보 사이트는 승인 거절 1순위

```markdown
<!-- URL-NEEDED: 대한산부인과학회 임신 초기 진료 권고안 -->
<!-- URL-NEEDED: 질병관리청 산전 검사 안내 -->
```

### 4. PERSONAL EXPERIENCE 섹션이 플레이스홀더 상태

- **위치**: `src/content/articles/*.md` (9개 아티클 전체)
- **문제**: `<!-- PERSONAL EXPERIENCE: ... -->` 주석만 있고 실제 경험담 본문이 없음
- **영향**: E-E-A-T의 첫 번째 E(Experience)가 완전히 비어있음. About 페이지에서 "초산 임산부 개발자"라고 밝혔으면서 경험담이 없으면 신뢰도 하락

---

## HIGH — 승인률에 큰 영향

### 5. 콘텐츠 양 부족 (9개 아티클)

- **현재**: 9개
- **권장**: 최소 15~20개 이상
- **특이사항**: `infant-vaccination-schedule.md`는 611단어로 다른 글(평균 1,178단어) 대비 절반 수준. 최소 1,000단어 이상으로 보강 필요
- **거절 사유 예상**: "충분한 콘텐츠가 없다(Insufficient content)"

### 6. 도구(Tool) 페이지의 콘텐츠 빈약

- **대상**: 체중 관리, 영상, 베이비페어 페이지
- **문제**: 도구/위젯 위주로 텍스트 콘텐츠가 거의 없음
- **필요 조치**: 각 도구 페이지에 "왜 이 도구가 필요한지, 어떻게 활용하는지" 설명 텍스트 추가

### 7. reviewed_by 필드가 모두 비어있음

- **위치**: `src/content/articles/*.md` (9개 아티클 전체, `reviewed_by: ""`)
- **문제**: 의료 정보 사이트에서 전문가 리뷰 없이 배포하면 YMYL 심사에서 불리
- **대안**: 실제 전문가 리뷰가 어렵다면 이 필드를 아예 제거하는 게 나음. 빈 값 노출은 "리뷰받지 않았다"를 명시하는 것과 동일

### 8. 쿠키 동의 배너 없음

- **위치**: `src/app/privacy/page.tsx`에서 "서비스 첫 방문 시 쿠키 사용에 대한 안내를 제공합니다" 명시
- **문제**: 실제 쿠키 동의 배너가 구현되어 있지 않음
- **영향**: 개인정보처리방침에 쓴 내용과 실제 구현이 다르면 정책 위반

### 9. canonical URL에 플레이스홀더 남아있음

- **위치**: `src/content/articles/infant-vaccination-schedule.md:4`
- **문제**: `canonical: "https://{{SITE_URL}}/articles/infant-vaccination-schedule"` — `{{SITE_URL}}`이 미치환
- **필요 조치**: 다른 아티클도 동일 패턴 점검 필요

---

## MEDIUM — 승인 후에도 중요

### 10. 사이트 내 네비게이션 부족

- **현재**: 아티클 간 내부 링크가 일부(2~3개) 존재
- **필요**: 아티클 하단에 "관련 글" 섹션 추가로 체계적인 탐색 경험 제공

### 11. About 페이지의 운영자 정보 부족

- **위치**: `src/app/about/page.tsx`
- **문제**: "개발자"라고만 소개, 이름/필명/프로필 사진 없음. 개인정보처리방침에서도 "개인 운영"으로만 표기
- **필요 조치**: 최소한의 필명이나 프로필 사진 추가로 신뢰도 향상

### 12. ads.txt 파일 없음

- **위치**: `public/` 디렉토리에 ads.txt 미존재
- **필요 조치**: `public/ads.txt`로 아래 내용 추가

```
google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0
```

---

## 점수 요약

| 영역 | 현재 상태 | 비고 |
|------|----------|------|
| 법적 페이지 (Privacy/Terms/About/Contact) | ★★★★☆ | 잘 갖춰짐, 쿠키배너만 추가 |
| 콘텐츠 양 | ★★☆☆☆ | 9개 → 최소 15개+ 필요 |
| 콘텐츠 품질 (E-E-A-T) | ★★☆☆☆ | URL-NEEDED, PERSONAL EXPERIENCE 미작성 |
| SEO 인프라 (sitemap, robots, meta) | ★★★★★ | 매우 잘 되어 있음 |
| 광고 구현 | ★☆☆☆☆ | 스크립트 미로드, 슬롯 미배치 |
| 사이트 디자인/UX | ★★★★★ | 모바일 퍼스트, 깔끔한 UI |
| 네비게이션 | ★★★☆☆ | 내부 링크 보강 필요 |

---

## 우선순위별 실행 순서

| 순위 | 작업 | 중요도 |
|------|------|--------|
| 1 | AdSense 스크립트 로드 + AdUnit 실제 배치 | CRITICAL |
| 2 | URL-NEEDED 참고자료 링크 전부 채우기 | CRITICAL |
| 3 | PERSONAL EXPERIENCE 섹션 실제 경험담으로 채우기 | CRITICAL |
| 4 | 아티클 6개 이상 추가 (최소 15개 목표) | HIGH |
| 5 | 쿠키 동의 배너 구현 | HIGH |
| 6 | ads.txt 추가 | HIGH |
| 7 | canonical URL 플레이스홀더 수정 | HIGH |
| 8 | 도구 페이지에 설명 텍스트 추가 | MEDIUM |
| 9 | About 페이지 운영자 정보 보강 | MEDIUM |
| 10 | 아티클 하단 관련 글 추천 섹션 추가 | MEDIUM |
| 11 | reviewed_by 필드 정리 (제거 또는 실제 값 입력) | MEDIUM |

> 1~3번이 해결되지 않으면 신청해도 "가치가 낮은 콘텐츠(Low-value content)" 또는 "정책 위반"으로 거절될 가능성이 매우 높음.
