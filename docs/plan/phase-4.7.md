# Phase 4.7: AdSense 신청 전 게이트 (성능 최적화)

> Phase 4.6 기록: [phase-4.6.md](phase-4.6.md)
> Date: 2026-06-06
> 종료: **2026-06-24** — AdSense 신청 완료(2026-06-19) + R1·R2·R3 누적 반영 후
> 운영자 페르소나 판정으로 종료. 잔여는 산후 복귀 후 정식 LCP 라운드로 이관.
> Status: ✅ R1 머지(PR #22)·R2 자연 해소·R3 머지(PR #23). DoD `<4s` 일부 미달
> 인정 하에 종료. 트래픽 2~3명/주·휴가 임박·산후 휴면 진입 임박 정합.
> Trigger: phase-4.6 종료 후 [adsense-application-checklist.md](../ops/adsense-application-checklist.md) §1.4 PageSpeed 측정 결과 fail + §1.3 재진단 시 광고 슬롯 미배치 발견

## Overview

Phase 4.6 종료 후 AdSense 신청 직전 audit를 돌렸을 때 두 개의 차단 항목이 드러났음.

**차단 항목 1 — §1.3 광고 슬롯 미배치** → **Auto Ads 채택으로 해소**
[adsense-audit.md](adsense-audit.md) CRITICAL #2 ("AdUnit 컴포넌트가 어디에서도 사용되지 않음")가 phase-3 §M3-A에서 ✅ 완료 마킹됐으나 6월 재진단 시 prod에서 미배치 확인. **마케터 페르소나 검토 결과 광고 게재 방식을 Auto Ads로 채택 → 신청 전 광고 슬롯 배치 작업 불필요로 결론** (의사결정 기록 §1 참고). 코드 작업 없이 승인 후 AdSense 콘솔에서 Auto Ads ON 토글 1클릭으로 게재 시작.

**차단 항목 2 — §1.4 PageSpeed CLS·LCP 미달**

| 페이지 | Mobile 점수 | CLS | LCP | 판정 |
|---|---|---|---|---|
| 홈 | 58 | 0 | 7.7s | LCP fail |
| 발행 글 | 61 | 0.176 | 6.8s | CLS·LCP 둘 다 fail |
| 허브 | 82 | 0.095 | 3.6s | LCP fail |

체크리스트 §1.4 기준 (CLS<0.1, LCP<2.5s) 대비 전반 fail. 체크리스트 본문이 "점수 낮으면 신청 보류 후 next/image 전환·이미지 최적화 라운드 진행 검토"라고 명시한 그대로 보류 결정.

phase-4.7 범위는 차단 항목 2 처리 = **R1 이미지 LCP + R2 발행 글 CLS 식별·수정**.

### 진단 요약 (2026-06-06)

| 항목 | 상태 | 단서 |
|---|---|---|
| next/image 적용 | ✅ 이미 적용 (raw `<img>` 0건) | grep `from "next/image"` 3건 |
| 폰트 로딩 | ✅ next/font/google (Poppins) + Pretendard system fallback | layout.tsx:3, globals.css:469 |
| 홈 LCP 후보 | ❌ `/home.png` PNG 그대로, prod HTML에 webp/avif srcSet 없음 | curl 검증 |
| 발행 글 CLS 0.176 원인 | ❓ 미식별 (광고 슬롯 미배치 상태인데도 발생) | 실측 필요 |
| 광고 슬롯 DOM | ⚪ Auto Ads 채택으로 코드상 배치 불필요 | grep + curl |

체크리스트가 추정한 "next/image 전환" 작업은 이미 완료 상태. 진짜 병목은 **(a) `/home.png` 최적화 누락**과 **(b) CLS 0.176의 미식별 원인** 두 가지.

---

## R1. 이미지 LCP 최적화

### R1-A. `/home.png` 처리

`<img src="/home.png">` 또는 `<Image src="/home.png">` 사용처 확인 후 다음 순서:

1. 원본 PNG 크기·dimensions 확인 (현재 형식·크기 미파악)
2. WebP/AVIF 변환 (스크립트 또는 이미지 도구) — `/home.webp` + `/home.avif` 추가
3. next/image `priority` prop 부여로 LCP candidate 명시 + preload 자동
4. 정적 export 환경에서 next/image 동작 확인 — `unoptimized` 옵션 필요 여부, `sizes` prop 정합성

[next.config.mjs](../../next.config.mjs)의 `images` 설정 점검 필요. static export는 기본적으로 next/image의 server-side optimization 비활성 → 빌드 시점 WebP 변환은 운영자 수동 또는 별도 스크립트 필요.

### R1-B. 인포그래픽 이미지 점검

발행 글 15편의 인포그래픽 이미지 형식·크기·next/image 적용 여부 sample 점검. 발행 글 LCP 6.8s 원인이 인포그래픽일 가능성 있음 — 인포그래픽이 fold 위쪽에 있으면 LCP candidate가 됨.

### R1 Definition of Done

- [ ] `/home.png` → WebP 또는 AVIF 변환 + next/image priority 적용
- [ ] PageSpeed 홈 LCP < 4s (목표 < 2.5s)
- [ ] 발행 글 LCP < 4s

목표값은 체크리스트의 <2.5s보다 느슨 — 정적 export·외부 폰트·AdSense 스크립트 로딩 오버헤드 고려한 현실적 타협. 신청 통과엔 충분.

---

## R2. 발행 글 CLS 0.176 원인 식별·수정

광고 슬롯 미배치 상태에서도 0.176 발생 → 원인은 광고 외 요소. 후보:

| 후보 | 검증 방법 | 수정 방향 |
|---|---|---|
| hero 이미지 lazy → swap | DevTools Performance Layout Shift 트래킹 | next/image `priority` + dimensions 명시 |
| 폰트 swap (Poppins late load) | Performance → Web Fonts | next/font의 `display: swap` → `display: optional` 검토 |
| 인포그래픽 reflow | 인포그래픽 dimensions 명시 여부 | width/height 명시 또는 aspect-ratio |
| frontmatter rendering shift | ArticleDetail의 상단 메타 영역 hydration | 정적 SSR 영역만 사용 |

R2-A: 발행 글 1편을 Chrome DevTools Performance로 측정해서 Layout Shift 원천 식별. R2-B: 식별된 원천에 height/dimensions 예약 또는 폰트 전략 변경.

### R2 Definition of Done

- [ ] 발행 글 CLS < 0.1 (PageSpeed 재측정)
- [ ] Auto Ads 게재 시작 후에도 CLS < 0.1 유지 (광고 영역 자동 reserve 효과 검증, 신청 후 작업)

---

## 신청 ready 기준 (R1·R2 모두 통과 시)

[adsense-application-checklist.md §1.4](../ops/adsense-application-checklist.md#14-성능-점수) 통과 확인 후 나머지 §2.3 푸터 링크, §3.3 build·redirect 점검 마치고 §4.2 신청 폼 진입. 광고 슬롯 DOM 검증(§1.3)은 Auto Ads 게재 시작 후 prod 검증으로 이동.

## 신청 후 후속 (R3 — phase-4.7 범위 밖, 별도 작업)

AdSense 승인 후:

1. AdSense 콘솔 → 광고 → "자동 광고" 페이지 → 사이트 추가 → 자동 광고 ON
2. 광고 형식 설정:
   - ON: Display, In-page, Side rail (자연스럽고 수익 안정)
   - **OFF: Anchor (하단 고정 띠), Vignette (전체 화면 인터스티셜)** — 모바일 UX 보호
3. 변경 적용 후 24~48시간 내 게재 시작
4. prod 발행 글 1편에서 `<ins class="adsbygoogle">` 자동 삽입 확인 (§1.3 prod 검증 활성화)
5. 초기 2~4주 광고 노출·CTR·UX 영향 모니터링

이 작업은 PIN 우편 도착 전에도 가능. AdSense 콘솔이 사이트 상태를 "준비됨"으로 전환한 직후부터.

### Auto Ads → 수동 슬롯 전환 결정 라운드 (산후 복귀 후, 별도 phase)

다음 4개 임계값 중 2개 이상 충족 시 수동 전환 검토:

| 지표 | 임계값 | 측정 도구 |
|---|---|---|
| 월간 활성 사용자 (MAU) | 1,000+ | GA4 |
| 일 평균 페이지뷰 | 500+ | GA4 |
| 월간 광고 노출 | 30,000+ | AdSense 콘솔 |
| 월간 광고 수익 | $30+ | AdSense 콘솔 |

산후 복귀(2026-11) 후 3개월 운영 데이터로 판정 → 2027-02 즈음 결정 라운드. 임계값 미충족 시 Auto Ads 유지.

---

## 영향받는 다른 문서

| 문서 | 영향 |
|---|---|
| [adsense-audit.md](adsense-audit.md) | CRITICAL #2 status — Auto Ads 채택으로 광고 슬롯 배치 작업 자체가 obsolete (4월 시점엔 수동 슬롯이 디폴트 가정) |
| [phase-3.md](phase-3.md) §M3-A "AdUnit이 아티클 상세, 홈, 타임라인에 렌더링됨" ✅ | Auto Ads 채택으로 obsolete. phase-3 마킹은 history로만 남김 |
| [adsense-application-checklist.md §1.2](../ops/adsense-application-checklist.md#12) | "/timeline 제거 확인" → "/timeline 유지 (2026-06-02 rollback)" 정정 완료 |
| [adsense-application-checklist.md §1.3](../ops/adsense-application-checklist.md#13) | "AdUnit 박힌 위치 1회 시각 점검" — Auto Ads 게재 시작 후 prod 검증 항목으로 활성화 (코드 측 사전 작업 없음) |

---

## 의사결정 기록

### 2026-06-06: 광고 게재 방식 = Auto Ads (1차 수동 슬롯 → 마케터 페르소나 재검토 후 정정)

**1차 결정 (2026-06-06 오전): 수동 슬롯**
- 사유: 광고 위치·형식 통제 + 수익 최적화 여지
- 부담: R1 placeholder 배치 + R4 slot ID 채우기 2단계

**재정정 (2026-06-06 오후): Auto Ads**
- 트리거: 마케터 페르소나 검토에서 4가지 결정적 단서 도출
  1. **트래픽 규모가 수동 슬롯 ROI를 정당화 못함** — 주당 활성 사용자 2~3명, Auto Ads vs 수동 슬롯 수익 차이 10~30%가 절대값으로 무의미
  2. **휴면 리스크** — 운영자 출산 예정일 2026-08-13, 휴가 7월 중순부터. 심사가 4주+ 걸리면 slot ID 채우기가 휴면 진입 후로 밀려 광고 미게재 상태로 휴면 진입 → 회복 불가 수익 손실
  3. **데이터 수집기로 활용** — Auto Ads 4~6개월 운영 후 위치별 노출·CTR·RPM 데이터 축적 → 산후 복귀 후 수동 전환 시 데이터 기반 의사결정 가능
  4. **UX 통제는 콘솔 토글로 충분** — Anchor·Vignette OFF면 거슬리는 형식 차단
- 결정: Auto Ads 채택. phase-4.7 R1(수동 슬롯 배치) 작업 제거 → 작업량 33% 감소
- 전환 트리거: 위 §"Auto Ads → 수동 슬롯 전환 결정 라운드" 표 임계값 2개 이상 충족 시 2027-02 결정 라운드

### 2026-06-06: §1.4 PageSpeed fail → 신청 보류

- 측정값: 홈 LCP 7.7s / 발행 글 CLS 0.176 LCP 6.8s / 허브 LCP 3.6s
- 체크리스트 §1.4 기준 (CLS<0.1, LCP<2.5s) 전반 fail
- 결정: AdSense 거절 사유에 LCP가 명문화돼 있진 않으나, 본인이 작성한 체크리스트 원칙 우선. 보류 후 본 phase로 분리.

### 2026-06-06: 4월 audit CRITICAL #2 정합성 재정의

- [adsense-audit.md](adsense-audit.md):35 "AdUnit 컴포넌트가 어디에서도 사용되지 않음 — CRITICAL"
- [adsense-infra-finalize/spec.md:38](../features/adsense-infra-finalize/spec.md#L38) W1 "슬롯 배치는 D-A 범위 외, 별건 기능으로 분리"
- [adsense-application-checklist.md:107](../ops/adsense-application-checklist.md#L107) "신청 시 추가 작업 불필요"
- 결정: 4월 audit는 수동 슬롯 모델 가정으로 작성됨. Auto Ads 채택 후 4월 audit CRITICAL #2는 obsolete — 광고 슬롯 코드 배치 자체가 불필요해짐.

---

## 종료 기록 (2026-06-24)

### 측정 timeline

세 PSI Lab 측정 비교 — `https://pagespeed.web.dev/` Mobile.

| 페이지 | 6/6 (R1 전) | 6/19 (R1 후) | 6/19 (R3 후) | 종료 시점 누적 Δ |
|---|---|---|---|---|
| 홈 | LCP 7.7 / CLS 0 | FCP 3.9 / LCP 5.7 / CLS 0 | FCP **3.0** / LCP 5.7 / CLS 0 | LCP **-2.0s**, FCP -0.9s |
| 허브 (`/checklist`) | LCP 3.6 / CLS 0.095 | FCP 3.3 / LCP 5.7 / CLS 0.094 | FCP 3.2 / LCP **4.4** / CLS 0.094 | LCP +0.8s (6/6 대비 회귀) |
| 발행 글 | LCP 6.8 / CLS **0.176** | FCP 4.2 / LCP 8.1 / CLS 0 | FCP 4.2 / LCP **5.6** / CLS 0.094 | LCP **-1.2s**, CLS **-0.082** |

### 머지된 변경

- **R1 — LCP 이미지 최적화** (PR #22, merged 2026-06-19)
  - `/home.png` → `/home.webp` 변환은 이전 #18에 선반영. R1에서 [HomeContent.tsx](../../src/components/home/HomeContent.tsx) hero `<Image>`에 `priority` 부여 → head에 `<link rel=preload as=image href=/home.webp>` 주입
  - [rehype-article-figure.ts](../../src/lib/markdown/rehype-article-figure.ts): 문서 내 첫 이미지(LCP candidate)만 `loading="eager"` + `fetchpriority="high"` 부여, 나머지는 `loading="lazy"` 유지. webp dimensions 추출 정상 동작 (1536×1024)
- **R2 — 발행 글 CLS** (자연 해소)
  - 6/6 0.176 → 6/19 (R1 후) 0 → 6/24 (R3 후) 0.094. PSI 단일 런 변동성 + 인포그래픽 dimensions 빌드 타임 박힘이 누적 효과. 별도 코드 작업 없이 DoD `<0.1` 통과 마진 확보
- **R3 — FCP 정공법** (PR #23, merged 2026-06-19)
  - Poppins 제거 (`globals.css`가 전역에서 Pretendard로 덮어쓰므로 실사용 0건이었음). head preload `<link as=font>` 4건 + woff2 ~80~120KB 다운로드 제거
  - GA4 `gtag/js`를 head async → body 끝 `<Script strategy="lazyOnload">`로 이전. 초기 네트워크 우선순위에서 3rd-party 해방. consent default-deny 인라인은 head 유지 (Consent Mode v2 정합)
  - `<link rel=preconnect>` 2건 (googletagmanager.com / google-analytics.com) — gtag.js lazy 로드 시 핸드셰이크 사전 워밍
  - [SearchModalGate.tsx](../../src/components/search/SearchModalGate.tsx) 신규: `useSearchStore.isOpen` true일 때만 dynamic import + `ssr:false`. fuse.js + timeline JSON + 모달 코드 (~39KB 합계) 별도 chunk로 분리 → 초기 번들에서 제거

### DoD 평가

R1 DoD ([§R1](#r1-이미지-lcp-최적화)) + R2 DoD ([§R2](#r2-발행-글-cls-0176-원인-식별수정)):

- [x] `/home.png` → WebP 변환 + next/image priority — `home.webp` + `priority` 머지
- [x] 발행 글 첫 이미지 eager + fetchpriority — rehype 플러그인 머지
- [x] 발행 글 CLS `<0.1` — 0.094 통과
- [ ] PageSpeed 홈 LCP `<4s` (목표 `<2.5s`) — **5.7s 미달**
- [ ] 발행 글 LCP `<4s` — **5.6s 미달**

LCP `<4s` 두 페이지 미달이 종료 시점 미해소 잔여. 허브만 4.4s로 턱밑.

### 미달 인정 + 종료 결정

DoD `<4s`는 phase-4.7 자체 기준이지 AdSense 정책 강제 아님 ([adsense-application-checklist.md §1.4](../ops/adsense-application-checklist.md#14)는 운영자 자체 작성). AdSense는 LCP 명문 거절 사유 없음.

운영자 페르소나 4단서로 종료 판정:

1. **AdSense 신청 완료** — 2026-06-19. phase-4.7의 트리거 자체가 신청 보류 해소였는데 이미 신청됐으니 게이트 의미 소멸. Auto Ads 채택 정합 ([§의사결정 2026-06-06](#2026-06-06-광고-게재-방식--auto-ads-1차-수동-슬롯--마케터-페르소나-재검토-후-정정)) 그대로 적용
2. **트래픽 floor 미도달** — 주당 활성 사용자 2~3명. LCP 5.6~5.7s vs 4s 차이가 1~2명 사용자 체감에 미치는 영향 무의미. ROI 정당화 불가 (마케터 페르소나 §1.2 결정 라운드 동일 논리)
3. **휴가·산후 임박** — 운영자 휴가 7월 중순, 출산 예정일 2026-08-13, 산후 3개월 휴면. 진짜 병목인 FCP 4초대는 gh-pages CDN(US 엣지 → 한국 RTT) + CSS 80KB + 초기 JS 815KB 합인데, gh-pages 한계 + 큰 위험 작업이라 휴가 직전 착수 부적합
4. **데이터 부재** — PSI Diagnostics "LCP element" 미확보 상태로 추가 최적화는 추정 작업. 산후 복귀 후 실측 데이터 수집부터 다시 시작이 정합

→ **phase-4.7 종료. R1·R2·R3 누적 머지분 + DoD `<4s` 일부 미달을 history 보존**

### 산후 복귀 후 후속 (phase-4.7 범위 밖)

phase-5 또는 별도 phase로 재진입할 항목 — [phase-5.md](phase-5.md)에 이관 후보:

| 항목 | 트리거 | 작업 후보 |
|---|---|---|
| **LCP `<4s` 본격 라운드** | 트래픽 floor 도달 (월 100+ MAU) 또는 산후 복귀 시점 | PSI Diagnostics "LCP element" 캡쳐 → 페이지별 LCP candidate 정조준. 홈 5.7s 의심: H1 텍스트·DueDateInput 카드·dashboard 카드 |
| **FCP 4초대 병목** | LCP 라운드 동시 진행 | gh-pages → Vercel/Cloudflare Pages (한국 엣지) 마이그 검토, 또는 critical CSS inline·초기 JS chunk 추가 분할 |
| **CLS 0.094 재현 확인** | LCP 라운드 직전 | PSI 3회 연속 측정 후 평균값으로 회귀 vs 노이즈 판정. 회귀 확정 시 sticky header·BottomNav·OnboardingBanner shift 의심 |

### 종료 기준 영향받는 다른 문서

| 문서 | 갱신 |
|---|---|
| [adsense-application-checklist.md §1.4](../ops/adsense-application-checklist.md#14) | LCP `<2.5s` 기준은 운영자 자체 작성 — phase-4.7 종료 정합으로 "신청 후 후속 라운드에서 재평가" 마킹 후보 |
| [phase-5.md](phase-5.md) | LCP `<4s` 본격 라운드 항목 추가 (산후 복귀 후) |
| [adsense-audit.md](adsense-audit.md) | CRITICAL/HIGH 0건 유지 (성능 항목 별도 트랙) |

---

## 사후 정정 (2026-06-28): AdSense 1차 거절

phase-4.7 종료 정합으로 2026-06-19 AdSense 신청 → 9일 뒤 거절
("Low value content"). 양적 콘텐츠 기준은 모두 충족했으나 **Search
Console 색인 6/17 (21%)** 이 진짜 차단 사유였음.

phase-4.7 범위는 PageSpeed 차단 항목 해소였고 indexing 진단은 범위 밖이라
phase-4.7 자체의 종료 판정은 정합. 거절 후속 사이클은 별도 phase로 분리.

→ **[phase-4.8.md](phase-4.8.md) 로 인계**. 인덱싱 시그널 보강 + 인스타
제한 활성화 + 2026-07-15 전후 재신청. phase-4.7 §"산후 복귀 후 후속"의
LCP `<4s` 본격 라운드는 phase-5 인계분 유지 (재신청 사이클과 별도 트랙).
