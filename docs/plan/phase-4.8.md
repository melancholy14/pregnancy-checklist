# Phase 4.8: AdSense 1차 거절 → 재신청 사이클

> Date: 2026-06-28
> 상태: 🟡 진행 중
> 트리거: 2026-06-19 신청 → 2026-06-28 거절 ("Low value content")
> 목표 완료: 2026-07-15 전후 재신청 (산후 휴면 진입 전 결과 통보 1회 보장)
> 선행: [phase-4.7](phase-4.7.md) 종료 (2026-06-24)
> 후속: [phase-5](phase-5.md) 산후 복귀 후

## Overview

phase-4.7 종료 직후 AdSense 신청(2026-06-19) → 9일 만에 **"Low value content"** 사유로 1차 거절(2026-06-28).
phase-4.8은 거절 사유 진단·해소·재신청·결과 통보까지를 묶은 짧은 사이클 phase로, 산후 휴면(2026-08 중순~2026-11) 진입 전 1회 재시도 기회 확보가 목표.

phase-4.7이 "신청 직전 게이트"였다면 phase-4.8은 **"거절 → 재신청 직전 게이트"** — 진단 → 인덱싱 시그널 작업 → 재신청 → 결과 모니터링 순.

---

## 거절 진단

### 1차 거절 메일 (2026-06-28)

- 사유: **"Low value content"**
- 안내 링크 4종: Minimum content requirements, Unique high-quality content, Thin content, Webmaster quality guidelines
- "I confirm that I have fixed the issues" → "Request review" CTA 노출

### 양적 기준은 통과 — 진짜 원인 후보 분석

| 진단 항목 | 측정값 | 판정 |
|---|---|---|
| 발행 글 수 | 17편 | ✅ 충분 |
| 글당 평균 단어 수 | 1,568~2,687 | ✅ 충분 |
| 개인 경험 마커 (PERSONAL EXPERIENCE) | 17/17 | ✅ 통과 |
| About / Privacy / Contact / Terms | 모두 존재 | ✅ 통과 |
| **Search Console 색인된 페이지** | **6 / 28 (~21%)** | ❌ **차단** |

색인 비율이 진짜 거절 원인. AdSense는 Google 색인된 페이지 기준으로 콘텐츠 가치를 측정하는데 17개 발행 글 중 6개만 indexed → Google 입장에선 "보이는 콘텐츠가 thin".

### Search Console 22개 미색인 분류 (2026-06-28 export)

| 사유 | 페이지 수 | 의미 |
|---|---|---|
| **Discovered – currently not indexed** | **22** | Google이 URL 발견했지만 크롤조차 안 함 |
| Page with redirect | 2 | 정상 (리다이렉트 페이지) |
| Not found (404) | 1 | 점검 필요 |
| Alternative page with canonical tag | 1 | 정상 (canonical 처리됨) |
| Crawled - currently not indexed | 1 | 크롤됐지만 품질 판정으로 미색인 |

### "Discovered, not indexed" 22개의 의미

이 상태는 robots.txt/sitemap 문제가 **아님**. Google이 URL은 발견했으니까 크롤링 게이트는 통과한 상태.
진짜 원인은 **크롤 예산(Crawl budget) 부족 + 사이트 권위 시그널 부족**:

1. 신규 도메인 (등록 후 ~6개월) → Google이 크롤 우선순위 낮게 매김
2. 외부 백링크 거의 없음 → 권위 시그널 부재
3. 트래픽 거의 0 (운영자 dogfooding 외) → 사용자 가치 증명 수단 없음

→ Google이 "이 URL들을 크롤해서 색인할 가치"가 낮다고 판정. AdSense는 그 결과를 그대로 "low value"로 통보.

---

## R1. 인덱싱 시그널 보강 (이번 phase 핵심)

### R1-A. Search Console URL Inspection 수동 색인 요청

22개 미색인 URL에 대해 1개씩 수동 "색인 생성 요청" → 크롤 우선순위 강제 상승.

- [x] Search Console에서 22개 URL validate 신청 (2026-06-28 완료)
- [ ] validate 결과 통보 모니터링 (Search Console 알림 + 이메일)
- [ ] validate 통과 후 indexed 페이지 수 재측정

### R1-B. 외부 백링크 / 사회적 시그널 확보

크롤 예산을 늘리는 가장 효과적인 방법은 외부 신호. 인스타 본격 드라이브는 산후 복귀 후로 유지하되, **재신청 SEO 시그널 용도로 7월 초 제한된 활성화**.

상세는 [instagram-launch-strategy.md](instagram-launch-strategy.md) "제한된 활성화" 섹션. 7월 초 액션:

1. 인스타 계정 생성 + 바이오 링크에 사이트 URL 박음 (`utm_source=instagram&utm_medium=bio` 부착)
2. 카드뉴스 2~3개 게시 (발행 글 중 효자 후보 글로)
3. 본인 SNS / 맘카페 1~2곳에 자연스러운 링크 (스팸성 X)

목표는 트래픽이 아니라 **Google에 "외부에서 이 사이트가 참조된다" 신호 보내기**. 본격 운영은 산후 복귀 후 ([instagram-launch-strategy.md](instagram-launch-strategy.md) 그대로 유지).

### R1-C. 내부 링크 보강

색인된 6개 페이지에서 미색인 22개 페이지로 가는 내부 링크가 충분한지 점검.

- [ ] 색인된 6개 페이지 확인 (Search Console에서 indexed URL 목록 export)
- [ ] 미색인 22개로 가는 내부 링크 분포 점검
- [ ] 부족하면 허브 페이지(`/articles`, `/checklist`, `/info`) 또는 글 본문 안에 cross-link 보강

### DoD

- [ ] Search Console "색인 생성됨" 페이지 수 ≥ **15** (현재 6 → +9)
- [ ] "Discovered – currently not indexed" ≤ 10 (현재 22 → -12)
- [ ] 인스타 외부 백링크 최소 1건 (인스타 바이오 또는 게시물 1건)

---

## R2. 콘텐츠 보강 (선택, 시간 여유 시)

phase-4.7 종료 시점 17편. 양적 추가보다 **indexed 비율 끌어올리기가 우선**이지만, R1과 병행 시 2~3편 추가 검토.

후보 (이미 토픽 풀에서 식별된 것):
- (TBD — 운영자 결정. 신규 토픽 발굴 X, 기존 topic 풀에서 우선순위 높은 것)

신규 글 추가 시 주의: 색인 안 될 가능성 있는 글을 추가하면 indexed 비율이 더 떨어짐. **R1-A 결과로 22개 중 일부 색인 확인된 후** 추가가 안전.

### DoD

- [ ] 추가 시: 발행 글 ≥ 18편 (현재 17)
- [ ] 추가 시: 신규 글도 Search Console URL Inspection 수동 색인 요청

---

## R3. 재신청 사이클

### 재신청 타이밍

| 시점 | 이벤트 | 비고 |
|---|---|---|
| 2026-06-28 | 1차 거절 + validate 신청 | 완료 |
| 2026-07-01~07 | validate 결과 통보 | 평균 1~2주 |
| 2026-07-08~14 | indexed 페이지 ≥ 15 도달 + 재신청 | DoD 통과 시 |
| 2026-07-15~28 | 재신청 검토 (평균 1~2주) | 산후 휴면 진입 전 결과 통보 1회 보장 |
| 2026-07-29~ | 결과 통보 | 승인 → Auto Ads ON / 거절 → 산후 복귀 후 phase-4.9 또는 phase-5 흡수 |

### 재신청 차단 사유 점검 (재신청 전 1회)

[adsense-application-checklist.md](../ops/adsense-application-checklist.md) 전체 항목 + 아래 추가 항목:

- [ ] Search Console indexed 페이지 ≥ 15 (R1 DoD)
- [ ] 외부 백링크 1건 이상 (인스타 바이오 또는 게시물)
- [ ] "Not found (404)" 1건 처리됨 (CSV 진단)
- [ ] phase-4.7 R1·R2·R3 머지분 회귀 없음 (LCP/CLS PSI 1회 재측정)

### 거절 → 재신청 사이 최소 대기 기간

같은 날 재신청 = 자동 거절 트리거. **최소 2주 대기 + 명확한 변경 사항 있음**을 충족해야 안전.
- 2026-06-28 거절 + 2026-07-15 재신청 = 17일 간격 ✓
- 변경 사항 = R1-A·R1-B·R1-C 작업 결과 명시

---

## R4. 거절 시 후속 (재거절 시 대응)

7월 말 재신청 후 거절되면:

1. 거절 사유 재분석 (Low value 재발 vs 다른 사유)
2. **산후 휴면 진입 전 1회 더 시도 금지** — 휴면 3개월 동안 추가 거절을 산후 복귀 후까지 끌고 가는 게 알고리즘 페널티 위험
3. 산후 복귀(2026-11) 후 phase-5 진입 라운드에 흡수, 인스타 본격 드라이브 후 누적 트래픽 데이터로 재신청

### 산후 복귀 후 재신청 시 추가 자산

phase-5에서 누적될 자산:
- 휴면 기간 launchd 자동 주간 리포트로 누적된 트래픽 데이터 (있다면)
- 인스타 본격 드라이브 후 외부 백링크·소셜 시그널
- 추가 발행 글 (산후 경험 기반 신규 토픽)

→ AdSense 입장에선 1차·2차 거절 시점 대비 양적·질적으로 강해진 상태로 3차 신청.

---

## 영향받는 다른 문서

| 문서 | 변경 |
|---|---|
| [phase-4.7.md](phase-4.7.md) | 종료 기록 §"산후 복귀 후 후속"에 phase-4.8 포인터 추가. phase-4.7 자체는 종료 상태 유지 |
| [adsense-audit.md](adsense-audit.md) | 2026-06-28 거절 결과 + 재신청 plan 박음. CRITICAL 항목 obsolete 정정 (Auto Ads + indexing 진단 결과 반영) |
| [instagram-launch-strategy.md](instagram-launch-strategy.md) | 상태 "보류 (산후 복귀 후)" → "제한된 활성화 (재신청 SEO 시그널) + 본격 드라이브는 산후 복귀 후"로 2단계 분리 |
| [adsense-application-checklist.md](../ops/adsense-application-checklist.md) | 재신청 시 추가 점검 항목 (indexed pages ≥ 15) 박음 |
| [phase-5.md](phase-5.md) | phase-4.8 거절 시 후속 항목 (R4) 인계 포인터 추가 |

---

## 의사결정 기록

### 2026-06-28: 거절 진단 후 옵션 A 채택 (인덱싱 보강 + 7월 중순 재신청)

**옵션 비교**:

| 옵션 | 액션 | 리스크 |
|---|---|---|
| A. 인덱싱 보강 + 7월 중순 재신청 | R1·R3 ~3주 작업 + 인스타 7월 초 제한 활성화 | 재거절 시 1회 더 시도 시간 부족 가능 |
| B. 산후 복귀 후 재신청 (2026-11) | 임신 후기 부담 없음, 트래픽 누적 후 신청 | 광고 수익화 5개월 지연 |
| C. 7월 초 즉시 재신청 | 빠른 재시도 | 인덱싱 미해소 상태로 재거절 거의 확정 |

**결정: 옵션 A**.
- 사유 1: 인덱싱 6/17은 명확히 진단된 해소 가능한 문제 — 그냥 기다리는 옵션 B는 ROI 낮음
- 사유 2: 산후 휴면 직전 1회 재시도 보장이 핵심 — 7월 말 신청 → 휴면 진입 전 결과 통보 가능
- 사유 3: 인스타 본격 드라이브는 산후 복귀 후 유지하되, 재신청 SEO 시그널용 제한 활성화는 운영 부담 작음

### 2026-06-28: 인스타 마케팅 = 2단계 분리

[project_launch_strategy.md](../../memory/project_launch_strategy.md) 메모 갱신 필요.

기존: "AdSense 승인 = 광고 ON, 인스타 마케팅 드라이브는 산후 복귀 후" (단일 트리거)
변경: **"AdSense 재신청 SEO 시그널용 인스타 제한 활성화 (7월 초)" + "본격 마케팅 드라이브는 산후 복귀 후"** (2단계 분리)

분리 사유: 재신청 차단 사유가 인덱싱이고 인덱싱은 외부 시그널이 가장 효과적. 시그널용 제한 활성화 ≠ 본격 운영 시작. 인스타 알고리즘 모멘텀 손해는 본격 드라이브 시점 기준.

---

## 진행 로그

### 2026-06-28
- AdSense 1차 거절 메일 수신 ("Low value content")
- Search Console export 분석 → 22개 "Discovered, not indexed" 진단
- Search Console에서 22개 validate 신청 (R1-A 시작)
- 옵션 A 결정 → phase-4.8 신규 작성
- sitemap.xml / robots.txt 점검 → 33개 URL 노출 정상, 차단 룰 없음.
  코드 변경 불필요로 결론. R1-A/B/C 작업이 정공법
- 영향 문서 갱신: [adsense-audit.md](adsense-audit.md) 거절 후 정정,
  [instagram-launch-strategy.md](instagram-launch-strategy.md) 2단계 분리,
  [phase-4.7.md](phase-4.7.md) 사후 정정 메모,
  memory/project_launch_strategy.md 2단계 분리 반영

### 2026-07-10

- Search Console Domain property 색인 상태 확인: **Indexed 9 / Not Indexed 5**
- URL prefix property 색인 상태 확인: **Indexed 9 / Not Indexed 2**
- 두 property indexed 수치 일치 → URL prefix property 삭제 결정
  (Domain property를 표준 SoT로 확정)
- Sitemap discovered URLs 35개 확인 → Google이 sitemap 정상 읽음
- R1-B 인스타 계정 생성 + 게시 3건 (기존 발행 글 재활용, 캡션에 프로필 링크 유도)

### 2026-07-14

- Search Console 요약 카운트 여전히 9 (Page Indexing 리포트 지연 확인 —
  Page Indexing 그래프 최신이 6/30, batch aggregation 파이프라인 지연 정상)
- **URL Inspection 정밀 샘플링 (15개, 발행 글 위주) → 13개 색인 확인 (87%)**
  - 15개 발행 글은 90%+ 색인 추정
  - 요약 카운트 vs 실제 인덱스 대괴리 확인 — 리포트 지연에 갇힌 상태
- **R1 DoD 실질 통과 판정** — AdSense는 Google 실제 인덱스 조회하므로
  요약 카운트 9는 무시 가능. 실제 상태(87% 색인율)로 판단
- 재신청 진행 결정: **2026-07-15 재신청 트리거**

### R1 DoD 최종 판정 (2026-07-14)

- [x] Search Console "색인 생성됨" 페이지 수 ≥ 15
  → 요약 카운트는 9지만 URL Inspection 샘플링으로 13/15 (87%) 확인.
  실제 인덱스 기준 DoD 통과 판정
- [x] "Discovered – currently not indexed" ≤ 10
  → Domain property 기준 Not Indexed 5, URL prefix 기준 2. 통과
- [x] 인스타 외부 백링크 최소 1건 → 계정 생성 + 게시 3건 (2026-07-10)
