# 지금까지 구현된 것 — 기획·콘텐츠 관점

> 개발·아키텍처 디테일은 별도 (예정 위치: `docs/tech/`).
> 본 문서는 **사용자 가치 / 사이트 정체성 / 콘텐츠 자산** 축으로 정리한다.
> 마지막 갱신: 2026-05-03 (Phase 4 완료 시점)

---

## 1. 사이트 정체성

| 축 | 현재 상태 |
|----|----------|
| **포지셔닝** | "설치/가입 없이 즉시 쓰는 출산 준비 관리 도구" |
| **본질 도구** | 체크리스트 4종 (주차별 타임라인 + 출산가방 + 남편준비 + 임신준비) |
| **신뢰 보강 자산** | 정보성 글 8건 + 영상 큐레이션 57건 |
| **퍼블리셔 신뢰도** | "초산 개발자가 직접 만든" 1인칭 톤 + About 스토리 + authorNote 카드 |
| **AdSense 상태** | 인프라(스크립트·AdUnit·ads.txt·쿠키 동의) 완비, **승인 미신청** — 신청 목표 2026년 6월 ([adsense-audit.md](../plan/adsense-audit.md) CRITICAL/HIGH 통과 후 신청) |
| **YMYL 대응** | 의료 디스클레이머 공통 컴포넌트, reviewed_by 빈 필드 정리, 면책 문구 주제별 분기 룰 합의 |

---

## 2. 사용자 가치 (체험 흐름)

### 2.1 첫 방문 → 정착

1. 풀스크린 3단계 온보딩(웰컴 → 예정일 입력 → 데이터 안내)
2. 예정일 입력만으로 **주차 기반 개인화** 작동 (현재 주차 자동 계산)
3. localStorage 저장 안내 + "데이터 손실 주의" 토스트

### 2.2 재방문 트리거

- 홈 미니 대시보드(타임라인 / 베이비페어 / 체중 / 영상 / 정보)에서 다음 액션 직접 진입
- Sticky 헤더(44px) — 스크롤 따라 숨김/표시
- 주차 진행에 따라 타임라인 자동 갱신
- 체크리스트별 진행률(% + 25/50/75/100 마이크로카피)

### 2.3 도구 깊이

- **체크리스트 허브** + 4종 독립 체크리스트, 각 체크리스트는 자체 localStorage 키로 격리
- **타임라인** 임신 4~40주, 주차별 type 아이콘(준비/쇼핑/행정/교육/웰빙)
- **체중 기록** Recharts Line + 입력/리스트 — BMI 권장 범위는 Phase 5 이월
- **베이비페어** 진행중/예정/지난 3분류, D-N일 배지, scale·하이라이트·팁 확장
- **영상 큐레이션** 57건, 채널 메타 + sub-category(현재는 통합 태그로 흡수)

### 2.4 콘텐츠 탐색

- `/info` 통합 탭 (블로그 + 영상 혼합 최신순) — Phase 4에서 분리되어 있던 두 탭 통합
- 통합 태그 13종 + 동의어 흡수 매핑 → 블로그·영상 동시 필터
- 아티클 하단 **관련 콘텐츠 추천 3개** (태그 Jaccard + 최신 글 보충)
- 아티클 하단 **관련 체크리스트/타임라인/영상** 크로스 추천
- 클라이언트 사이드 검색 (fuse.js)

### 2.5 바이럴

- Web Share API → Clipboard API → 카카오 fallback
- OG 메타 태그 정비, GA4 `share` 이벤트 전송

---

## 3. 콘텐츠 자산 인벤토리

### 3.1 발행된 정보성 글 (8건)

| 슬러그 | 토픽 | 면책 유형 |
|--------|------|----------|
| early-pregnancy-fatigue-reasons | 임신 초기 피로 원인 | 의학 |
| early-pregnancy-tests | 임신 초기 검사 | 의학 |
| mid-pregnancy-lifestyle-guide | 임신 중기 생활 가이드 | 의학 |
| pregnancy-foods-to-avoid | 임산부 주의 음식 | 의학·식약 |
| pregnancy-government-benefits-2026 | 2026 정부 지원금 | 정책 |
| pregnancy-weight-management | 임산부 체중 관리 | 의학 |
| prenatal-insurance-preparation-guide | 태아 보험 준비 | 재무 |
| weekly-prenatal-checklist | 주차별 산전 체크리스트 | 의학 |

### 3.2 draft 풀 (운영자 경험 전 의도적 홀딩)

`src/content/draft/` 9건. 운영자가 해당 주차에 도달하거나 경험한 시점에 PERSONAL EXPERIENCE 채워서 발행.

- `2026-parental-leave-guide-draft.md`
- `2026-parenting-subsidy-guide-draft.md`
- `baby-items-cost-draft.md`
- `hospital-bag-draft.md`
- `husband-postpartum-checklist-draft.md`
- `infant-vaccination-schedule.md`
- `newborn-bath-tips.md`
- `postpartum-care-draft.md`
- `postpartum-diet.md`

### 3.3 자동화

- `scripts/generate-crosslinks.ts` — 태그 Jaccard + 키워드 매칭으로 timeline·체크리스트·아티클 간 크로스링크 자동 생성. `*_manual: true` 보호 플래그 지원
- 운영 주기: 글 추가/태그 변경 시 `npm run crosslinks:apply`

---

## 4. 측정 인프라

### 4.1 깔린 것

- GA4 + AdSense 모두 **쿠키 동의 게이팅** 통과 후 로딩 (GDPR/PIPA 호환)
- App Router SPA 전환에 대응한 **수동 page_view** 트래커
- 타입 안전 헬퍼 `sendGAEvent` (SSR/미주입 노옵 처리)

### 4.2 발사 중인 이벤트

- `page_view` (수동)
- `share` (Phase 4 Step 4)
- 자동 측정: `session_start`, `first_visit`, `user_engagement`, `scroll`(90%)

### 4.3 아직 안 깔린 것 (Phase 4.5에서 도입 예정)

- user properties (`due_date_set`, `current_pregnancy_week`, `cohort_join_week`, `is_first_pregnancy`, `notification_opt_in`)
- 핵심 행동 이벤트 (`checklist_item_toggle`, `article_read_complete`, `weight_log`, `pregnancy_week_set`)
- 신호 이벤트 (`search_submit`, `external_link_click`, `scroll_without_action`, `feature_request_signal`, `empty_state_view`)
- 자동 주간 리포트 (Pattern C: GA4 Data API + Claude API → Obsidian vault)

---

## 5. 운영 정책 (합의된 룰)

| 영역 | 룰 | 출처 |
|------|----|------|
| 면책 문구 | 글 주제에 맞춰 분기 (의학·재무·정책) | persona §4.1 |
| draft 위치 | `src/content/draft/` 단수형 | auto-memory `feedback_draft_location.md` |
| draft 홀딩 | PERSONAL EXPERIENCE 비어 있으면 발행 안 함 | auto-memory `user_pregnancy_status.md` |
| 새 글 작성 | 운영자가 경험한 주제만 신규 발행 | 위와 동일 |
| Obsidian vault | `~/Documents/pregnancy-checklist/` Johnny Decimal 구조 | auto-memory `reference_obsidian_vault.md` |
| 데이터 변경 | 글 추가/태그 변경 시 `npm run crosslinks:apply` 후 검토 | phase-4 plan §QA |

---

## 6. 단계별 마감 시점

| Phase | 완료일 | 핵심 산출물 |
|-------|--------|------------|
| 0 | ~2026-03-29 | Next.js + shadcn/ui + 폴더 구조 + 타입 정의 |
| 1 | ~2026-04-02 | 핵심 기능 + GA4/Ads 인프라 + gh-pages PoC |
| 1.5 | 2026-04-04 | 타임라인↔체크리스트 통합, AdSense 인프라 기초 |
| 2 | 2026-04-04 | YouTube 세분화, 정보성 글 시스템 (AdSense 신청 준비 시작) |
| 2.5 | 2026-04-13 | 온보딩, 홈 대시보드 개편, "초산 개발자" 톤, 타임라인 정보 구체화 |
| 3 | 2026-05-01 | AdSense 인프라 마감 (스크립트·AdUnit·ads.txt·쿠키 동의), YMYL 보강, GA4 누락 이벤트, 검색, Lighthouse SEO |
| 4 | 2026-05-02 | 체크리스트 허브 + 정보 탭 통합 + 관련 추천 + 공유 + 크로스링크 자동화 |
| 4.5 | 진행 중 | (AdSense 신청 직전 마감 라운드) GA4 측정 모델 + UI/UX 마감 + 데이터 모델 정합성 |
| — | 2026-06 (목표) | **AdSense 승인 신청** — 신청 직전 [adsense-audit.md](../plan/adsense-audit.md) CRITICAL/HIGH 라인 0건 확인 |

---

## 7. 갱신 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-03 | 초안 작성 (Phase 4 완료 시점 스냅샷) |
