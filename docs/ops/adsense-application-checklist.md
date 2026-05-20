# 운영자 SOP — AdSense 신청 직전 체크리스트

> 작성일: 2026-05-20
> 사용 시점: phase-4.6 종료 직후, AdSense 6월 신청 폼 제출 전 1회
> 예상 소요: 1~2시간 수기 검증 + 신청 폼 입력
> 출처: [phase-4.5.md §4.2 D-C1](../plan/phase-4.5.md), [phase-4.6.md](../plan/phase-4.6.md) (AdSense 신청 직전 정돈 단계)

신청 폼 제출 전에 사이트 전체를 한 번 훑는 운영자 수동 작업. 코드 변경 없음. 4개 분류 각각 통과해야 신청 폼 입력 단계 진입.

## §1. 사이트 인프라 점검 (자동화로 대부분 커버)

대부분 phase-4.5·4.6 코드 작업으로 자동 보장된 항목 — 신청 직전에 1회 확인만 하면 됨.

### 1.1 ads.txt + AdSense 스크립트

- [ ] `curl -I https://pregnancy-checklist.com/ads.txt` → 200 OK 확인
- [ ] `curl https://pregnancy-checklist.com/ads.txt` → 본문 = `google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0`
- [ ] 시크릿 브라우저로 사이트 접속 → 쿠키 동의 "수락" → DevTools Network → `adsbygoogle.js?client=ca-pub-6022771079735605` 200 OK
- [ ] 같은 시크릿 브라우저 다시 접속 → 쿠키 동의 "거부" → `adsbygoogle.js` 요청 0건 확인 (D-M3 e2e로 자동 보장됨, 수동 1회만)

### 1.2 크롤링 가능성

- [ ] `https://pregnancy-checklist.com/robots.txt` 접근 가능 → `User-agent: *` 허용 + Disallow 정책 점검
- [ ] `https://pregnancy-checklist.com/sitemap.xml` 200 OK + phase-4.6 후 4축 라우트만 포함 (`/videos`·`/info`·`/timeline` 제거 확인)
- [ ] Google Search Console에 등록되어 있고 소유권 인증 완료

### 1.3 광고 슬롯 DOM 존재

- [ ] 발행 글 1편 시크릿 브라우저로 열어 DevTools Elements → `<ins class="adsbygoogle">` 존재 확인
- [ ] AdUnit 컴포넌트가 박힌 위치 1회 시각 점검 — 본문 흐름과 자연스러운지, 광고 슬롯이 인포그래픽 직후가 아닌지 ([image-sop.md §4](../content/image-sop.md))

### 1.4 성능 점수

- [ ] PageSpeed Insights에서 홈·체크리스트 허브·발행 글 1편 측정 → Mobile 점수 50 이상 (목표 70+)
- [ ] CLS < 0.1, LCP < 2.5s (AdSense 심사 영향)
- [ ] 점수 낮으면 신청 보류 후 next/image 전환·이미지 최적화 라운드 진행 검토

## §2. AdSense 정책 정합 (운영자 수기 점검)

Google AdSense Program Policies + Publisher Policies 정합.

### 2.1 콘텐츠 정합

- [ ] **저작권·스크랩 콘텐츠 없음** — phase-4.6에서 영상 큐레이션 자산 폐기로 가장 큰 리스크 제거됨
- [ ] **금지 콘텐츠 없음** — 임신·출산 도메인이라 자연스럽게 클린이지만 발행 글 11편 헤더·인트로 1회 훑기
- [ ] **YMYL 정합** — 면책 문구가 글 주제에 맞게 박혀 있는지 1회 sample 검수 ([marketing/persona.md §4.4](../marketing/persona.md))

### 2.2 검수자 표기 (E-E-A-T)

- [ ] `grep -l 'reviewed_by: ""' src/content/articles/*.md` → 0건 (D-C2 회귀 방지, [image-sop.md §9](../content/image-sop.md))
- [ ] 검수 받은 글은 frontmatter에 검수자 명시되어 있는지 sample 1회

### 2.3 필수 페이지 존재

- [ ] [src/app/privacy/page.tsx](../../src/app/privacy/page.tsx) — Privacy Policy 존재 + 최신화 (Google AdSense·GA4 명시, 쿠키 정책, 보관 기간)
- [ ] 운영자 정보 페이지 (About) — 사이트 운영자·연락처·도메인 신뢰성 자료 1개 (개인 블로그형 사이트는 운영자 소개로 충분)
- [ ] 푸터에 위 페이지 링크 노출

### 2.4 이미지·출처

- [ ] AI 생성 이미지에 `(AI 생성 이미지)` 후행 표기 + `Imagined with AI` 워터마크 칩 확인 ([image-sop.md §1](../content/image-sop.md))
- [ ] 인포그래픽·통계 이미지 출처 명시
- [ ] 외부 절대 URL 이미지 0건 (sample 글 1편 grep `'!\['` 후 패턴 점검)

## §3. 콘텐츠 품질 점검 (운영자 수기)

### 3.1 콘텐츠 양

- [ ] 발행 글 수 카운트 — `ls src/content/articles/*.md | wc -l`
- [ ] **목표 15편 이상** (현재 11편 기준 — phase-4.6 종료 시점까지 4편 추가 발행 여부 결정)
- [ ] 부족하면 신청 보류 후 발행 라운드 추가

### 3.2 콘텐츠 차별성

- [ ] 각 글 길이 1500자 이상 (sample grep 또는 word count로 확인)
- [ ] 각 글이 독립적 정보 가치 보유 — 발행 글 리스트 훑어 중복·rewrite 의심 없는지 운영자 자가 판단

### 3.3 내부 링크 무결성

- [ ] `npm run build` 통과 — Next.js 빌드가 broken link 일부 잡음
- [ ] 사이트 홈 → 발행 글 1편 → 관련 글 → 체크리스트 → 베이비페어 → 체중 5단계 클릭으로 깨진 링크 없는지 1회 확인
- [ ] phase-4.6 redirect 동작 확인 — `/videos`·`/info`·`/timeline` 진입 시 정상 redirect

## §4. Google 계정 정합 + 신청 폼 입력

### 4.1 계정 정합 (사전 작업)

- [ ] AdSense 계정 ↔ Google Search Console 동일 Google 계정 사용 (다르면 AdSense 자동 검증 불가)
- [ ] Search Console에서 `https://pregnancy-checklist.com` 사이트 등록 + 소유권 인증 (DNS TXT 또는 HTML 파일)

### 4.2 신청 폼 입력

https://www.google.com/adsense/ 접속 → "시작하기"

- [ ] **사이트 URL**: `https://pregnancy-checklist.com`
- [ ] **국가/지역**: 대한민국
- [ ] **결제 통화**: KRW (또는 USD)
- [ ] **수취인 정보**: 사업자등록 시 사업자명, 개인이면 실명 + 주민등록번호
- [ ] **주소**: 우편물 PIN 수신 가능 주소 (PIN 우편 = 신청 후 ~수주)
- [ ] **사이트 카테고리**: Health & Wellness → Pregnancy (또는 Family & Parenting)
- [ ] AdSense 약관 동의

### 4.3 검토 코드 삽입 확인

신청 폼에서 AdSense가 사이트 헤드에 `<script>` 태그 삽입 요구할 수 있음.

- [ ] 이미 [ConsentGatedScripts.tsx](../../src/components/consent/ConsentGatedScripts.tsx)에 `adsbygoogle.js` consent-gated 주입 + [layout.tsx](../../src/app/layout.tsx)에 `<meta name="google-adsense-account">` 박혀 있으므로 추가 작업 불필요
- [ ] 신청 폼이 별도 verification meta tag 요구하면 layout.tsx에 추가 후 배포

## §5. 신청 후 followup

- 신청 폼 제출 후 24시간~수주 검토 (도메인·국가별 다름)
- AdSense 콘솔 사이트 상태 = "준비 중" → "준비됨" 전환 확인
- 거부 시: 사유 확인 → 본 체크리스트 §2 정책 정합 재점검 → 수정 후 재신청 (재신청 cooldown 없음)
- 승인 시: PIN 우편 도착(수주) → 입력 → 결제 정보 확정 → 광고 게재 시작

## §6. 거부 사유 흔한 패턴 (참고)

| 사유 | 대응 |
|---|---|
| Insufficient content (콘텐츠 부족) | 발행 글 추가 발행 후 재신청 |
| Site does not comply with policies | 본 체크리스트 §2 재점검 |
| Page not found / Site down | 배포 상태 확인, 사이트 접근성 점검 |
| Low-value content / Scraped content | YMYL 검수자 표기 강화 + 차별성 점검 (phase-4.6 영상 폐기로 1차 마진 확보) |
| Navigation issues | sitemap·내부 링크 정합 점검 |

거부 사유는 보통 1줄로만 통보되므로 본 체크리스트의 어느 항목이 미충족인지 운영자가 추정해서 정정.

---

## 변경 이력

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-05-20 | 최초 작성 | phase-4.5 D-C1 검증 + phase-4.6 정보 구조 정돈 직전 SOP 정합 |
