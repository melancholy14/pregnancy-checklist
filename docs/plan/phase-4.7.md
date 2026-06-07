# Phase 4.7: AdSense 신청 전 게이트 (성능 최적화)

> Phase 4.6 기록: [phase-4.6.md](phase-4.6.md)
> Date: 2026-06-06
> 목표 완료: AdSense 신청 직전
> Status: 📝 진단 완료, R1·R2 구현 미착수
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
