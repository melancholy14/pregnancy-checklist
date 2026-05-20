# Phase 4.6: 정보 구조 4축 정돈 (Pre-AdSense 신청)

> Phase 4.5 기록: [phase-4.5.md](phase-4.5.md)
> Date: 2026-05-09
> 목표 완료: 2026-06-14
> Status: 🚧 D-Data 수집 중 (D1 ✅ 완료 2026-05-12 / 데이터 누적 ~2026-05-26)

## Overview

Phase 4.5에서 토큰 디시플린·접근성·기획 결정을 정돈하고, **AdSense 6월 신청 직전 마지막 단계로 사이트의 정보 구조 자체를 4축(체크리스트·베이비페어·블로그·체중관리)으로 좁힌다.**

신규 기능은 추가하지 않는다. **기존 자산의 우선순위를 재배치**하고, 4축에서 벗어난 자산(영상 큐레이션·타임라인 별도 라우트)을 흡수·제거한다.

### 왜 별도 phase로 분리하는가

| 이유 | 설명 |
|------|------|
| **§7.6 측정 의무** | 타임라인·영상의 도달률·체류 데이터 없이 4축 결정 = 직관 결정 → §7.6 위반. D1 발급 + 2주 데이터가 선결 조건 |
| **§7.1 데이터 무결성** | 타임라인 흡수 = [useTimelineStore](../../src/store/useTimelineStore.ts) zustand `persist` migrate 함수 의무. phase-4.5 디자인 묶음 사이에 끼워 넣을 사이즈 아님 |
| **AdSense 신청 직전 정돈** | 정보 구조 흔들기는 신청 후 더 큼. 신청 직전이 마지막 정돈 기회. 신청 후로 미루면 정책 검사 통과한 사이트 구조 흔드는 셈 |
| **phase-4.5 종료 보호** | 기획 §3은 거의 마무리(2026-05-09 기준). 새 결정을 끼워 넣으면 종료가 또 밀리고 디자인 §2 진입이 늦어짐 |

### AS-IS vs TO-BE

| 영역 | AS-IS | TO-BE |
|------|-------|-------|
| BottomNav | 홈 / 체크리스트 / 베이비페어 / 정보 (4탭) | 체크리스트 / 베이비페어 / 블로그 / 체중 (4탭, 홈은 4축 허브) |
| 정보 구조 | 영상 + 블로그 통합 탭 (`/info`) + 별도 영상 (`/videos`) + 타임라인 (`/timeline`) | 블로그 단일화 (`/articles`), 영상 자산 제거, 타임라인은 흡수 |
| 도구 | 체크리스트 + 체중 (분리) | 체크리스트 + 체중 (체중에 임신 주차 컨텍스트 흡수 가능성) |
| 콘텐츠 | 아티클 11편 + 영상 57개 큐레이션 | 아티클 단일 축 (영상 큐레이션 폐기) |
| GA4 funnel | 영상 클릭(`content_click(type=video)`)·타임라인 이벤트 산재 | 4축 진입률 + 축별 핵심 행동 + 축 간 이동 |

---

## 선결 조건

### D1. GA4 Property ID + Service Account 발급

- ✅ **완료 (2026-05-12)** — Property ID 확인 + SA JSON 발급 + Viewer 권한 부여. JSON 키 `~/.config/pregnancy-checklist/ga4-sa.json` 보관 (SoT 경로 그대로).
- 상세: [phase-4.5.md §1.9.4 D1](phase-4.5.md)
- 잔여: `chmod 600` 권한 잠금 + `GA4_SA_KEY_PATH` 환경변수 설정 (묶음 L 착수 시).

### D-Data. 데이터 수집 2주

- 기간: D1 시작일 + 14일 (D1 = 2026-05-12 → 데이터 누적 마감 ~2026-05-26)
- 수집 대상: 영상 탭 도달률·클릭률 / 타임라인 페이지 도달률·체류 / 홈 카드별 클릭 분포 / `/info` vs `/articles` 직접 진입 비율 / `/weight` 회귀 방문률
- **이 데이터 없이 결정 항목 D2~D5 결정 금지.**

#### Weekly report manual run 일정 (묶음 M launchd 등록 전까지)

| 일자 | 작업 | 데이터 커버 | 비고 |
|---|---|---|---|
| 2026-05-20 (화) | `npm run report:weekly` 1차 manual run | W20 (5/11~5/17 → D1 기준 5/12~5/17 = 6일 partial) | 5/19 monday 일정 1일 슬립 보정 — noise floor baseline |
| 2026-05-25 (월) | `npm run report:weekly` 2차 manual run | W21 (5/18~5/24 = 7일 full) | 2 cycle 확보, phase-4.6 진입 직전 |
| 2026-05-26 (화) | **phase-4.6 진입** | — | D2~D5 결정 데이터 기반 |

대안 — 5/25 이전에 묶음 M(launchd 등록) 진행 시 자동 발사로 manual run 대체. launchd plist 작성 + `launchctl bootstrap` 등록 = 30분~1시간 작업.

---

## Scope

**In scope:**

- 영상 큐레이션 자산 일괄 제거 (`/videos`, InfoContainer 영상 탭, HomeContent 영상 카드)
- `/info` 통합 탭 → `/articles` 단일화 (블로그 축으로 명확화)
- 타임라인 흡수 위치 결정 + `useTimelineStore` migrate
- 홈 4축 허브화 ([HomeContent.tsx](../../src/components/home/HomeContent.tsx) 재작성)
- BottomNav 재구성 ([BottomNav.tsx](../../src/components/layout/BottomNav.tsx))
- GA4 이벤트 카탈로그 4축 기준 재정의 (phase-4.5 §1.5 갱신)
- 30-domain/ 운영 가이드 갱신 (영상·타임라인 룰 폐기·통합)
- 사이트맵·robots·canonical·redirect 정합

**Out of scope (Phase 5로 이동):**

- 체중 차트 BMI 강화
- 영상 채널 디렉토리 부활
- 신규 체크리스트 종류
- 회원가입 / PWA / 푸시
- 4축 외 신규 콘텐츠·기능

---

## 페르소나 점검표

| 룰 | 평가 |
|---|---|
| §3.2 체크리스트=본질 | ✅ 본질 도구(체크리스트) + 보조 도구(체중) + 신뢰자산(블로그) + 시즌자산(베이비페어) |
| §3.1 코호트 리텐션 | ✅ 체중관리 = 매주 회귀 방문 hook, 40주 LTV 동력 |
| §3.3 AdSense low-value | ✅ 영상 큐레이션 = scraped 의심 자산 제거. 신청 직전 정돈 |
| §7.5 도구 우선 | ✅ 두 도구 + 두 콘텐츠. 흐름 명확 |
| §7.6 측정 | ✅ D1 + 2주 데이터를 선결조건으로 박음 |
| §7.1 데이터 무결성 | ✅ migrate 함수 의무 명시 |
| §7.8 AdSense 정책 | ✅ 외부 영상 큐레이션·중복 정보 탭 정리로 정책 검사 통과 마진 ↑ |

---

## 1. 영상 큐레이션 자산 처리

### 1.1 결정 사항 (선결: 데이터)

#### V1. 영상 자산 처리 방식

- **A. 전체 제거** ([/videos](../../src/app/videos/page.tsx) 라우트, [InfoContainer.tsx](../../src/components/info/InfoContainer.tsx) 영상 탭, [HomeContent.tsx:339](../../src/components/home/HomeContent.tsx) 영상 카드, [src/types/video.ts](../../src/types/video.ts) 타입, [src/data/videos.json](../../src/data/videos.json) 데이터, [src/data/channels.json](../../src/data/channels.json))
- **B. 본인 코멘트 1줄 의무화로 큐레이션 격상** (10편 이하로 축소, §7.4 경험 기반 발행 적용)
- **C. 아티클 본문 임베드 슬롯으로만 좁힘** (정보 탭에서는 빼고 아티클 1~2개 임베드)

> 기본값 **A (전체 제거)**. 데이터에서 영상 클릭률이 의미 있게 잡히면 C 검토.

### 1.2 작업 (결정 A 기준)

| 작업 | 대상 |
|------|------|
| 라우트 제거 | [src/app/videos/page.tsx](../../src/app/videos/page.tsx), [src/app/info/page.tsx](../../src/app/info/page.tsx) (블로그로 단일화) |
| 컴포넌트 제거 | [src/components/info/InfoContainer.tsx](../../src/components/info/InfoContainer.tsx)의 영상 탭, [src/components/videos/VideoCard.tsx](../../src/components/videos/VideoCard.tsx), [src/components/videos/VideoCardCompact.tsx](../../src/components/videos/VideoCardCompact.tsx) |
| 타입 제거 | [src/types/video.ts](../../src/types/video.ts), [src/types/info.ts](../../src/types/info.ts) `InfoTab` 축소 또는 삭제 |
| 데이터 제거 | [src/data/videos.json](../../src/data/videos.json), [src/data/channels.json](../../src/data/channels.json) |
| 홈 카드 제거 | [HomeContent.tsx:339-353](../../src/components/home/HomeContent.tsx) (4축 허브화 §3 통합) |
| Sitemap/Robots | [sitemap.ts](../../src/app/sitemap.ts), [robots.ts](../../src/app/robots.ts)에서 `/videos`·`/info` 제거 |
| Redirect | `/videos` → `/articles`, `/info` → `/articles` (next.config redirects) |
| GA4 | `content_click(type=video)` deprecated 마킹 + 카탈로그(§5)에서 삭제 |
| 운영 가이드 | [30-domain/](../../../pregnancy-checklist/30-domain/)의 video 룰 폐기 |
| E2E | `e2e/info-tab-integration.spec.ts` 등 영상 시나리오 갱신·삭제 |

---

## 2. 타임라인 흡수

### 2.1 결정 사항 (선결: 데이터)

#### T1. 타임라인 흡수 위치

- **A. 체중관리(`/weight`)로 흡수** — 임신 주차 + 체중 그래프 + 이번 주 권장 체중 + 이번 주 할 일 한 화면. 시계열 두 도구를 한 도구처럼 묶음
- **B. 체크리스트(`/checklist`)로 흡수** — "이번 주 해야 할 일"을 체크리스트 허브 상단에 띄움
- **C. 5축으로 추가** — BottomNav 5탭. 모바일 UX 빡빡

> 데이터 의사결정 기준:
> - `/timeline` 도달률 + `/weight` 회귀 방문률 비교 → A (체중)이면 두 도구 시너지 검증됨
> - 체크리스트 허브에서 타임라인 클릭이 더 많으면 B
> - 둘 다 의미 있게 잡히면 D2-Hybrid 검토 (체중에 시계열, 체크리스트에 "이번 주 할 일")

### 2.2 작업 (결정 A 기준 예시)

| 작업 | 대상 |
|------|------|
| 라우트 제거 | [src/app/timeline/page.tsx](../../src/app/timeline/page.tsx) |
| 컴포넌트 흡수 | [src/components/timeline/](../../src/components/timeline/)의 일부를 [src/components/weight/](../../src/components/weight/)로 이동·통합 |
| 타입 통합 | [src/types/timeline.ts](../../src/types/timeline.ts) → 잔존 필드만 weight 또는 checklist 도메인으로 이동 |
| 데이터 처리 | [src/data/timeline_items.json](../../src/data/timeline_items.json) — 흡수처에 통합 또는 deprecated 마킹 (§7.1 항목 ID 재사용 금지) |
| Store migrate ⭐ | [src/store/useTimelineStore.ts](../../src/store/useTimelineStore.ts) zustand `persist` `migrate` 함수 작성. 흡수처 store로 데이터 이전. **migrate 없이 배포 금지 — §7.1 양보 거부 항목** |
| Sitemap | `/timeline` 제거, 흡수처 canonical 갱신 |
| Redirect | `/timeline` → 흡수처 (next.config redirects) |
| 내부 링크 갱신 | [HomeContent.tsx:228](../../src/components/home/HomeContent.tsx), [OnboardingBannerProvider.tsx](../../src/components/providers/OnboardingBannerProvider.tsx), [OnboardingFlow.tsx](../../src/components/onboarding/OnboardingFlow.tsx), [ChecklistHub.tsx](../../src/components/checklist/ChecklistHub.tsx), [ArticleDetail.tsx](../../src/components/articles/ArticleDetail.tsx) 등 timeline 참조 일괄 갱신 |
| GA4 | timeline 이벤트 → 흡수처 namespace로 마이그레이션 (예: `timeline_week_view` → `weight_week_view`) |
| 운영 가이드 | 30-domain/ 의 timeline 룰을 흡수처 룰로 통합 |
| E2E | timeline spec 갱신·이동 |

### 2.3 §7.1 양보 거부 항목 적용

- migrate 함수 없이 배포 금지
- 항목 ID 재사용 금지 — 기존 timeline 항목 ID는 흡수처에서도 그대로 보존

### 2.4 후속 산출물 — P11 콘텐츠 매트릭스 (phase-4.5 §3.2)

- phase-4.5 P11 vault 매트릭스 1차 작성이 본 phase 종료 후로 이연 ([phase-4.5.md §3.2 P11](phase-4.5.md)).
- 사유: 타임라인 흡수가 매트릭스 행(주차)·셀(timeline_items.json 매핑)을 모두 재계산하게 함 + 4축 정합으로 열(토픽 카테고리) 그룹화 재정렬 가능성.
- 본 phase 종료 시 흡수 결과(timeline → weight/checklist)를 SoT로 매트릭스 1차 sketch 작성.
- 사용자 체크 상태 손실 0 검증 (e2e 시나리오 + 수동 시나리오)

---

## 3. 홈 4축 허브화

### 3.1 결정 사항

#### H1. 홈의 역할

- **A. 4축 허브 + BottomNav 4탭(체크/페어/블로그/체중)** — 홈을 별도 탭에서 빼고 4축 카드 4개로 단순화. 첫 진입은 `/`
- **B. 홈 유지 + BottomNav 5탭** — 익숙하지만 모바일 UX 빡빡

> **A 권장.** 홈은 허브이지 축이 아님. 4축이 명확하면 홈은 4개로 가는 관문.

### 3.2 작업 (결정 A 기준)

| 작업 | 대상 |
|------|------|
| 홈 재작성 | [HomeContent.tsx](../../src/components/home/HomeContent.tsx) — 4축 카드 4개 + 출산일 D-day + 임신 주차 컨텍스트 + (옵션) 이번 주 할 일 요약 |
| 영상 카드 제거 | §1.2와 통합 |
| 타임라인 카드 처리 | §2.2 흡수 결정 따라 — A면 체중 카드 안 "이번 주 권장량/체중", B면 체크리스트 카드 안 "이번 주 할 일" |
| BottomNav 첫 자리 | 홈 탭 → "체크리스트"가 첫 자리, 또는 4탭 균등 |

---

## 4. BottomNav 재구성

### 4.1 결정 사항

#### N1. 탭 구성

- **A. 4탭 (체크리스트 / 베이비페어 / 블로그 / 체중)** — 홈은 `/`로만 접근, 4축 균등
- **B. 5탭 (홈 / 체크리스트 / 베이비페어 / 블로그 / 체중)** — 홈 탭 유지

> H1과 묶어서 결정. A 권장.

### 4.2 작업

| 작업 | 대상 |
|------|------|
| BottomNav 갱신 | [BottomNav.tsx:18-34](../../src/components/layout/BottomNav.tsx) `navItems` 재구성 |
| 라벨 갱신 | "정보" → "블로그" (또는 4탭이면 "정보" 제거 + "체중" 추가) |
| 라우트 정합 | "블로그" → `/articles`, "체중" → `/weight` |
| `alsoMatchPrefixes` | `/videos` 제거, 필요 시 `/articles` `/guides` 정렬 |
| DESIGN.md 영향 | 아이콘 `w-5 h-5` → `w-6 h-6` (phase-4.5 §2.8.1 H-5 자연 해소) |

---

## 5. GA4 이벤트 카탈로그 4축 기준 재정의

### 5.1 phase-4.5 §1.5 갱신

기존 카탈로그(phase-4.5 §1.5):

- A. 자동 (GA4 기본) — 변경 없음
- B. 핵심 기능 — 체크리스트 — 4축 namespace 정렬
- C. 콘텐츠 — 아티클/영상/가이드 — **영상 deprecated**
- D. 개인화 트래커 — 체중/타임라인 — **타임라인 흡수처로 namespace 이동**
- E. 신호 (Signals) — 4축 funnel 기준 재설계

### 5.2 신규/변경 이벤트

| 이벤트 | 의미 | 비고 |
|--------|------|------|
| `axis_enter` | 4축 진입 (체크/페어/블로그/체중) | 4축 진입률 측정 |
| `axis_cross_link` | 한 축에서 다른 축으로 이동 | 콘텐츠↔도구 흐름 측정 |
| `weight_week_view` | 체중에서 주차 컨텍스트 조회 (§2.2 A 결정 시) | timeline 이벤트 흡수 |
| `content_click(type=video)` | **deprecated** | §1.2 V1 결정 후 카탈로그에서 삭제 |
| `timeline_*` | **deprecated** | §2.2 결정에 따라 흡수처 namespace로 마이그레이션 |

### 5.3 funnel 정의

`session_start → axis_enter → core_action(체크리스트 토글 / 체중 입력 / 아티클 스크롤 / 페어 외부링크) → return_visit_n_days`

---

## 6. 데이터 마이그레이션 룰 (§5.1·§7.1 적용)

| 룰 | 적용 |
|----|------|
| zustand `persist` schema 변경 시 `migrate` 의무 | [useTimelineStore](../../src/store/useTimelineStore.ts) 흡수, [useChecklistStore](../../src/store/useChecklistStore.ts)·[useWeightStore](../../src/store/useWeightStore.ts) 신규 필드 시 |
| 항목 ID 재사용 금지 | timeline_items.json 흡수처 통합 시 ID 보존, 영상 ID는 자연 폐기 (사용자 상태 무관) |
| deprecated 플래그 후 N주 보존 | timeline 항목은 흡수 후에도 4주 deprecated 유지, video는 사용자 상태 없으므로 즉시 삭제 |
| 배포 전 e2e migrate 시나리오 | 기존 사용자(localStorage 잔존) 시나리오 1개 + 신규 사용자 시나리오 1개 |

---

## 7. 회귀 안전장치

| 항목 | 검증 |
|------|------|
| AdSense 스크립트·`ads.txt` 영향 | 0건 — phase-4.6은 광고 인프라 미접촉 |
| Sitemap·robots·canonical | 4축 라우트로 일괄 갱신, 외부 링크 인벤토리 0건 누락 |
| Redirect | `/videos`·`/info`·`/timeline` → 흡수처 (next.config redirects). 301 영구. SEO 큐 보존 |
| 내부 링크 깨짐 | `grep -rn "/timeline\|/videos\|/info" src/` 0건 (deprecated 표기 제외) |
| 사용자 데이터 손실 | localStorage 기존 사용자 e2e — 체크 상태·체중 기록·타임라인 항목 0건 손실 |
| GA4 funnel 회귀 | 신규 이벤트 발화 + deprecated 이벤트 무발화 검증 (DebugView) |
| 검색 인덱스 | 자동 크로스링크 [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts) 재실행 후 4축 정합 확인 |
| 디자인 토큰 정합 | phase-4.5 디자인 §2 결과와 충돌 없음 — 영상·타임라인 위반(I-3·I-4·T-1~T-12) 자연 소멸 검증 |

---

## 8. E2E 테스트 코드·스크립트 갱신

> phase-4.6는 라우트 폐기(`/videos`·`/info`·`/timeline`) + BottomNav 재구성 + GA4 이벤트 namespace 마이그레이션을 동시에 한다. 본 섹션은 코드 변경에 종속되는 **테스트/스크립트 갱신 작업 자체를 작업 항목으로 박는다.** 회귀 검증(§7)이 통과 여부 검사라면, §8은 통과 가능 상태를 만드는 작업.

### 8.1 영향 매트릭스 — e2e/

V1=A(영상 전체 제거) + T1=A(타임라인 → 체중 흡수) + H1=A + N1=A 기준. 총 e2e/ 56 파일 중 **약 25 파일**이 갱신 또는 폐기 대상.

| 분류 | 파일 | 작업 |
|------|------|------|
| **통째 폐기** | [info-tab-integration.spec.ts](../../e2e/info-tab-integration.spec.ts) | `/info` 통합 허브·영상 탭·`/articles`→`/info` redirect 시나리오 전체. `/articles` 단일화로 별도 spec 신규 작성 필요 시 [client-search.spec.ts](../../e2e/client-search.spec.ts) 등 흡수 |
| **통째 폐기** | [timeline.spec.ts](../../e2e/timeline.spec.ts), [timeline-enhancement.spec.ts](../../e2e/timeline-enhancement.spec.ts), [timeline-retention.spec.ts](../../e2e/timeline-retention.spec.ts) | `/timeline` 라우트 가정 spec 3개. 시나리오는 흡수처(체중 또는 체크리스트) spec으로 마이그레이션 — "이번 주 할 일 카드"·"타임라인에서 확인하기" CTA는 흡수처 라벨로 재작성 |
| **통째 폐기** | [cross-links-video-weight.spec.ts](../../e2e/cross-links-video-weight.spec.ts) Step 3 | 타임라인 → 영상 8개 주차 매핑 검증. Step 6 (체중↔블로그) 부분만 신규 spec으로 분리 보존 |
| **통째 폐기** | [fetch-channel-thumbs.spec.ts](../../e2e/fetch-channel-thumbs.spec.ts), [phase-4-step-3-related-content.spec.ts](../../e2e/phase-4-step-3-related-content.spec.ts) | 영상 자산 의존(`/info?tab=videos#<id>` 매칭, `videoCategories`). V1=A 결정 시 통째 폐기 |
| **부분 폐기** | [phase-4-step-5-crosslinks.spec.ts](../../e2e/phase-4-step-5-crosslinks.spec.ts) | `linked_video_ids`/`linked_video_ids_manual` 시나리오 제거, `linked_article_slugs` 부분만 보존. [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts) 영상 매핑 제거에 동기 |
| **재작성 (BottomNav·홈)** | [navigation.spec.ts](../../e2e/navigation.spec.ts) | 4탭 검증 — "홈/체크/페어/정보" → "체크/페어/블로그/체중" (N1=A 시). `nav.getByText("영상")` 미존재 assertion은 더 이상 무의미 |
| **재작성 (BottomNav·홈)** | [home.spec.ts](../../e2e/home.spec.ts) | 미니 대시보드 4 카드 (베페·체중·영상·정보) → 4축 허브 (체크/페어/블로그/체중). 영상 카드·정보 카드 검증 삭제, 4축 카드 4개 신규 |
| **재작성 (GA4 namespace)** | [ga4-events.spec.ts](../../e2e/ga4-events.spec.ts) | `timeline_week_view` → `weight_week_view` (T1=A), `content_click(type=video)` 제거, `/info?tab=videos` 진입 시나리오 제거, `axis_enter`·`axis_cross_link` 신규 spec 추가 |
| **재작성 (GA4 namespace)** | [marketing-events-wiring.spec.ts](../../e2e/marketing-events-wiring.spec.ts) | `external_link_click(context=video)` 시나리오(`/videos` 진입) 제거, `/timeline` 진입 검증(L143~L168, L286~L359) 흡수처로 마이그레이션 |
| **path 교체 (간단)** | [seo-metadata.spec.ts](../../e2e/seo-metadata.spec.ts), [seo-meta.spec.ts](../../e2e/seo-meta.spec.ts), [page-description.spec.ts](../../e2e/page-description.spec.ts), [sticky-header.spec.ts](../../e2e/sticky-header.spec.ts), [lighthouse-seo.spec.ts](../../e2e/lighthouse-seo.spec.ts), [canonical-url.spec.ts](../../e2e/canonical-url.spec.ts) | `TARGET_PAGES`·`paths` 배열에서 `/timeline`·`/info` 제거 후 `/articles` (또는 흡수처) 추가. title/canonical 기댓값 갱신 |
| **path 교체 (회귀 진입 동선)** | [checklist.spec.ts](../../e2e/checklist.spec.ts), [checklist-recommendation-semantics.spec.ts](../../e2e/checklist-recommendation-semantics.spec.ts), [checklist-week-bug.spec.ts](../../e2e/checklist-week-bug.spec.ts), [cross-links.spec.ts](../../e2e/cross-links.spec.ts), [onboarding-flow.spec.ts](../../e2e/onboarding-flow.spec.ts), [pregnancy-week-onboarding.spec.ts](../../e2e/pregnancy-week-onboarding.spec.ts), [gamification.spec.ts](../../e2e/gamification.spec.ts), [plan.spec.ts](../../e2e/plan.spec.ts), [guides.spec.ts](../../e2e/guides.spec.ts), [content-enhancement.spec.ts](../../e2e/content-enhancement.spec.ts), design-bundle-* | `/timeline`·`/info`·`/videos` 진입 부분만 흡수처 라우트로 교체. 보조 검증이라 스코프 작음 |
| **신규 spec** | `e2e/axis-funnel.spec.ts` (가칭), `e2e/timeline-migrate.spec.ts` (가칭) | (a) 4축 funnel — `axis_enter` 4종 발화 + `axis_cross_link` 검증, (b) zustand `migrate` 시나리오 — 기존 사용자 localStorage 잔존 → 흡수처 store 무손실 이전 (§7.1 양보 거부 항목) |

> **삭제 vs 마이그레이션 판단 기준**: 영상·타임라인 라우트 자체를 검증하는 spec은 폐기, 라우트가 부수적 진입 동선인 spec은 path만 교체. 시나리오의 본질이 유지되면 마이그레이션.

### 8.2 영향 매트릭스 — scripts/

| 분류 | 파일 | 작업 |
|------|------|------|
| **통째 폐기 (V1=A 시)** | [scripts/fetch-video-metadata.ts](../../scripts/fetch-video-metadata.ts), [scripts/fetch-channel-thumbs.ts](../../scripts/fetch-channel-thumbs.ts), [scripts/verify-videos.ts](../../scripts/verify-videos.ts) | YouTube API 의존, `videos.json`/`channels.json` 처리. `package.json` `scripts` 4개(`fetch-channel-thumbs`·`fetch-video-metadata`·`fetch-channel-thumbs:force`·`fetch-video-metadata:update`) 제거 |
| **부분 정리** | [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts) | `TIMELINE_PATH`·`VIDEOS_PATH` 상수 + `linked_video_ids` 자동 매핑 로직 제거. T1 흡수 데이터 모델 반영 (timeline_items 데이터가 흡수처 JSON으로 이동 시 source path 갱신). `--apply` `--dry-run` 시나리오 e2e [phase-4-step-5-crosslinks.spec.ts](../../e2e/phase-4-step-5-crosslinks.spec.ts) 동기 갱신 |
| **부분 정리** | [scripts/lighthouse-check.sh](../../scripts/lighthouse-check.sh) L15-23 | `PAGES` 배열에서 `/timeline.html`·`/info.html` 제거, `/articles.html` (또는 흡수처) 추가. [lighthouse-seo.spec.ts](../../e2e/lighthouse-seo.spec.ts)의 `TARGET_PAGES`와 동시 갱신 (인프라 검증 spec이 7개 path를 grep함) |
| **부분 정리** | [scripts/seed-vault-media-notes.py](../../scripts/seed-vault-media-notes.py) | `videos.json`/`channels.json` 동기 부분 제거. vault `20-content/videos/`·`20-content/channels/` MOC 노트 자체 폐기 결정 시 스크립트 통째 삭제 후보 |
| **GA4 query 갱신** | [scripts/weekly-report/ga4-queries.ts](../../scripts/weekly-report/ga4-queries.ts) (및 prompt-shared·types) | 주간 리포트가 `timeline_week_view`·`content_click(type=video)` 등을 dimension/metric으로 끌어쓰면 4축 funnel (`axis_enter`·`axis_cross_link`·`weight_week_view`) 기준으로 query 재작성. deprecated 이벤트 차트는 발화 0건 안내로 fallback |
| **인프라 검증 spec 동기** | (위 스크립트 변경 시) | [fetch-channel-thumbs.spec.ts](../../e2e/fetch-channel-thumbs.spec.ts), [lighthouse-seo.spec.ts](../../e2e/lighthouse-seo.spec.ts) "Lighthouse 스크립트 인프라" describe, [phase-4-step-5-crosslinks.spec.ts](../../e2e/phase-4-step-5-crosslinks.spec.ts) sandbox 시나리오는 스크립트가 살아있어야 통과. 스크립트 폐기 시 e2e도 동시 폐기 |

### 8.3 작업 순서 (구현 단계 §1~§4와 묶음)

| 순서 | 단계 | 동기 갱신할 e2e·scripts |
|------|------|--------------------------|
| 1 | §1 영상 자산 일괄 제거 | scripts 3개 + 인프라 spec 1개 + `info-tab-integration.spec.ts`·`fetch-channel-thumbs.spec.ts`·`phase-4-step-3-related-content.spec.ts` 폐기, [ga4-events.spec.ts](../../e2e/ga4-events.spec.ts) `content_click(type=video)` 시나리오 제거 |
| 2 | §2 타임라인 흡수 | timeline 3종 + `cross-links-video-weight.spec.ts` Step 3 폐기 → 흡수처 spec으로 마이그레이션. `timeline-migrate.spec.ts` 신규 (§7.1 zustand migrate 검증) |
| 3 | §3·§4 홈 4축 허브 + BottomNav | [home.spec.ts](../../e2e/home.spec.ts), [navigation.spec.ts](../../e2e/navigation.spec.ts) 재작성 |
| 4 | §5 GA4 카탈로그 4축 갱신 | [ga4-events.spec.ts](../../e2e/ga4-events.spec.ts), [marketing-events-wiring.spec.ts](../../e2e/marketing-events-wiring.spec.ts) 갱신 + `axis-funnel.spec.ts` 신규. [scripts/weekly-report/ga4-queries.ts](../../scripts/weekly-report/ga4-queries.ts) 동기 |
| 5 | Sitemap·robots·canonical·redirect | SEO 6 spec(`seo-metadata`·`seo-meta`·`page-description`·`sticky-header`·`lighthouse-seo`·`canonical-url`) path 일괄 교체 + `scripts/lighthouse-check.sh` `PAGES` 배열 동기 |
| 6 | 회귀 진입 동선 정리 | 보조 spec ~10개 `/timeline`·`/info` path만 교체. `npm run test:e2e` 풀 회귀 통과 확인 |

### 8.4 양보 거부 항목

- **e2e migrate 시나리오 없이 §2 머지 금지** — §7.1 자동 적용. `timeline-migrate.spec.ts`가 통과해야 zustand `migrate` 함수 검증 완료
- **deprecated 이벤트 발화 검증 누락 금지** — `axis-funnel.spec.ts`에 "deprecated 이벤트(`content_click(type=video)`·`timeline_*`) 0건 발화" assertion 필수. DebugView 대신 gtag spy 패턴 ([ga4-events.spec.ts](../../e2e/ga4-events.spec.ts) `injectGtagSpy`) 재사용
- **스크립트·e2e 동시 갱신** — `lighthouse-check.sh` PAGES 배열을 바꿨는데 `lighthouse-seo.spec.ts` `TARGET_PAGES`를 안 바꾸면 인프라 spec(L77~85)이 빨강. 같은 PR에 묶어 머지

---

## 일정 계획

| 마일스톤 | 날짜 | 비고 |
|----------|------|------|
| D1 GA4 발급 시작 | 2026-05-18 | phase-4.5 진행 중 백그라운드 |
| 데이터 수집 시작 | 2026-05-18 ~ | phase-4.5와 병행 |
| phase-4.5 마무리 | 2026-05-31 (목표) | 디자인 §2 묶음 일괄 |
| 데이터 수집 종료 | 2026-06-01 | 2주 데이터 확보 |
| **phase-4.6 결정 라운드** | 2026-06-01 ~ 2026-06-04 | V1·T1·H1·N1 결정 |
| **phase-4.6 구현** | 2026-06-04 ~ 2026-06-12 | 영상 제거 → 타임라인 흡수 → 홈 허브 → BottomNav → GA4 |
| 회귀 검증 + e2e | 2026-06-12 ~ 2026-06-14 | §7 회귀 안전장치 전체 |
| AdSense 신청 | 2026-06-15 ~ | [adsense-audit.md](adsense-audit.md) CRITICAL/HIGH 0건 확인 후 |

> 7월 중순 휴가 + 8월 13일 출산 일정 고려 — phase-4.6은 6월 14일 안에 마감, AdSense 신청은 6월 안에 완료. 산후 3개월 휴면 기간 동안 정책 검사 통과 가능 상태로 둠.

---

## 결정 매트릭스 (운영자 결정용)

| ID | 결정 | 선결 | 기본값 | 영향 |
|----|------|------|--------|------|
| V1 | 영상 자산 처리 | 데이터 (영상 클릭률) | 전체 제거 | §1, GA4 카탈로그, 운영 가이드 |
| T1 | 타임라인 흡수 위치 | 데이터 (타임라인 vs 체중 도달·체류) | 체중관리 | §2, store migrate, GA4 namespace |
| H1 | 홈의 역할 | T1 결정 | 4축 허브 | §3, §4 |
| N1 | BottomNav 탭 구성 | H1 결정 | 4탭 (홈 빼고) | §4 |

> V1·T1은 데이터 의사결정. H1·N1은 V1·T1 결정에서 자연 도출.

---

## QA 체크리스트

- [ ] D1 GA4 Property ID + Service Account 발급 완료
- [ ] 2주 데이터 수집 완료 (영상 클릭률·타임라인 도달률·체중 회귀 방문 확보)
- [ ] V1·T1·H1·N1 4건 결정 + phase-4.6.md 결정 매트릭스 반영
- [ ] 영상 자산 일괄 제거 + redirect 301 동작
- [ ] 타임라인 흡수 + zustand `migrate` 함수 e2e 검증
- [ ] 홈 4축 허브 + BottomNav 4탭 동작
- [ ] GA4 카탈로그 갱신 + funnel DebugView 발화 검증
- [ ] sitemap·robots·canonical 4축 정합
- [ ] 30-domain/ 운영 가이드 갱신
- [ ] 내부 링크 0건 깨짐 (`grep` 검증)
- [ ] 사용자 데이터 손실 0건 (e2e migrate 시나리오 = `timeline-migrate.spec.ts` 신규 통과)
- [ ] §8.1 영향 매트릭스 25개 spec 갱신·폐기 완료 + `npm run test:e2e` 풀 회귀 통과
- [ ] §8.2 영향 매트릭스 — `scripts/lighthouse-check.sh` PAGES, `scripts/generate-crosslinks.ts` video 매핑, `scripts/weekly-report/ga4-queries.ts` 4축 funnel, `scripts/fetch-*` + `verify-videos.ts` 폐기 동시 머지
- [ ] `axis-funnel.spec.ts` 신규 + deprecated 이벤트 0건 발화 assertion 통과
- [ ] AdSense 인프라 미회귀 (스크립트·ads.txt 무변경)
- [ ] [adsense-audit.md](adsense-audit.md) CRITICAL/HIGH 0건
- [ ] phase-4.5 디자인 §2 결과와 충돌 0건

---

## 참고

- [phase-4.5.md](phase-4.5.md) — 직전 phase, 디자인·기획·마케팅 정돈
- [phase-4.md](phase-4.md) — phase-4 기록 (정보 탭 통합·BottomNav 4탭 도입 시점)
- [adsense-audit.md](adsense-audit.md) — AdSense 신청 직전 점검표
- [docs/content/persona.md](../content/persona.md) — 기획·콘텐츠 페르소나 (양보 거부 항목 §7)
- [docs/design/persona.md](../design/persona.md) — 디자인 페르소나
