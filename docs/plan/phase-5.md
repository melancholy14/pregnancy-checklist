# Phase 5: 산후 복귀 후 도구·콘텐츠 확장 (후보 정리)

> Phase 4.6 기록: [phase-4.6.md](phase-4.6.md)
> Date: 2026-05-20 · 정정: 2026-07-16 (AdSense 2차 재거절 반영)
> 목표 진입: 2026-11 이후 (산후 3개월 휴면 종료 후)
> Status: 📝 후보 등재만, 결정 미이행

## Overview

Phase 4.6에서 4축(체크리스트·베이비페어·블로그·체중)으로 정보 구조를 좁혔음.
당초 계획은 AdSense 6월 신청 통과 상태로 산후 휴면 진입이었으나 **1차(2026-06-19)·2차(2026-07-15) 모두 "Low value content"로 거절** → [phase-4.8 R4 발동](phase-4.8.md)으로 3차 신청도 산후 복귀 후로 이연. Phase 5 진입 라운드에 **F0. AdSense 3차 신청** 항목 신규 추가.

Phase 5는 **산후 복귀(2026-11~) 후 4축 fit이 검증된 자산에 도구·콘텐츠를 덧대면서 AdSense 3차 신청까지 마무리하는 단계**.

운영 무게는 [persona.md §3.3](../content/persona.md)대로 "신청 통과 가능성"에서 **"정책 위반 회피 + 사용자 가치"** 로 이동 — 단, 3차 AdSense 신청 시점에는 다시 "신청 통과 가능성"이 순간 우선.

### Phase 5에서 검토할 후보 목록

| ID | 후보 | 출처 | 우선순위 단서 |
|----|------|------|--------------|
| **F0** | **AdSense 3차 신청** | [phase-4.8 R4 발동](phase-4.8.md) (2026-07-16) | **1순위 확정**. 진입 라운드 직전 인스타 단계 2 D-2주 세팅 → 3차 신청 |
| F1 | **출산휴가/육아휴직 일정 + 급여 통합 계산기** | 2026-05-20 운영자 제안 | 4축 외 신규 도구. 블로그(`parental-leave-guide`) 트래픽이 SoT |
| F2 | 체중 차트 BMI 강화 | phase-4.6 Out of scope | 체중 축 심화. 도구 가치 vs 운영 비용 |
| F3 | 영상 채널 디렉토리 부활 | phase-4.6 Out of scope | V1 결정 결과 + AdSense 통과 마진에 의존 |
| F4 | 신규 체크리스트 종류 (예: 산후·신생아) | phase-4.6 Out of scope | 운영자 산후 경험 SoT 누적 후 |
| F5 | 회원가입 / PWA / 푸시 | phase-4.6 Out of scope | 코호트 리텐션 hook 필요성 검증 후 |
| F6 | 4축 외 신규 콘텐츠·기능 | phase-4.6 Out of scope | 4축 funnel 데이터로 빈 칸 식별 후 |

> 본 문서는 F1만 상세 설계. F0·F2~F6은 후보 등재까지만. Phase 5 진입 라운드에서 운영자 우선순위 결정 라운드를 따로 잡는다. F0은 phase-4.8에 진단·정합이 이미 있어 별도 상세 설계 불필요, 진입 라운드에서 재신청 조건 재점검(도메인 나이·트래픽 누적·인스타 단계 2 세팅 상태)만.

---

## 선행 작업 — phase-4.5에서 인계된 잔여

> 출처: [phase-4.5.md](phase-4.5.md) 종료 시점 (2026-06-06, `checklist-data-model-bundle` 묶음 완료 직후).
> phase-4.5는 P1·P5 묶음 해소로 본체 종료. 아래 항목들은 phase-4.5 종료를 차단하지 않지만 phase-5 진입 라운드에서 흡수하는 게 자연스러운 잔여.
> **산후 휴면(2026-08 ~ 2026-11) 동안 잊지 않도록 박아둠** — 복귀 첫 라운드에서 우선순위 매기는 작업 sweep로 사용.

### S1. 기획 결정 잔여 (phase-4.5 §3)

| ID | 항목 | 트리거·근거 | 권장 처리 |
|----|------|------------|----------|
| **P8** | 카테고리 두 체계(글로벌 6종 vs slug별 subcategories) 통합 방향 | Phase 5 통합 검색·필터 도입 시 결정 안 하면 부채 누적 (단기 영향은 작음) | 통합 검색 라운드 결정 (F4·F6과 묶음) |
| **P10** | 운영자 통합 가이드 본체 (`image-sop.md §8` 부분 흡수만 됨) | 체크리스트 데이터 변경 사고 예방, 신규 글 작성 SOP, AI 이미지 SOP 합본 | F1·F4 진입 라운드 전 1회 작성 (2~3시간) |
| **P12** | 양방향 크로스링크 정책 (아티클 → 체크리스트 CTA) | persona §4.4 "콘텐츠 ↔ 도구 연결 의무" 정합, 유입(아티클)에서 본질 도구로 흐름 | 자동화 확장 라운드 (`scripts/generate-crosslinks.ts`) |
| **P13** | 외부 링크 인벤토리 1회 수집 | §1.5 `external_link_click` 누적 1~2주 후 자체화 우선순위 잡기 | 측정 데이터 누적 후 1회 (30분~1시간) — 또는 grep 선제 수집 |

### S2. 개발 D-D 묶음 잔여 (phase-4.5 §4)

| ID | 항목 | 트리거·근거 | 권장 처리 |
|----|------|------------|----------|
| **D-Mn12** | ChecklistHub 카드 두 종류(`TimelineCard` + `ChecklistCard`) 통합 | 기획 §3 결정 후 가능. 디자인 결정 영향 받음 | 진입 라운드 결정 묶음 (P8과 같이) |
| **D-Mn14** | ChecklistAddForm note textarea 추가 (priority는 P1 묶음에서 흡수) | 의도적 제외 (designer §3 원칙 5 부담 감수) → 사용자 피드백 누적 시 재오픈 | `custom_item_note_set` GA4 누적 데이터 보고 결정 |
| **D-Mn16** | ChecklistProgress 100% 라인 customItems 포함 여부 | UX 결정 — base 100% 시점 한정 vs customItems 포함 | 진입 라운드 결정 (작음) |

### S3. 개발 D-E 묶음 잔여 (트리거 대기)

| ID | 항목 | 트리거 도달 여부 | 권장 처리 |
|----|------|--------------|----------|
| **D-Mn17** | 체크리스트 note i18n-style 카탈로그 | ❌ 체크리스트 5종+ 추가 또는 영문 지원 시 트리거 | 트리거 도달 시 |
| **D-Mn18** | `articles/[slug]::getAllArticles()` 빌드 시 9회 호출 → 캐시 | ❌ 콘텐츠 수십~수백 도달 시 트리거 (현재 article 8개) | 트리거 도달 시 |
| **D-Mn19** | `related-content.ts` Jaccard 단일 패스 | ❌ 관련 콘텐츠 알고리즘 확장 시 | 트리거 도달 시 |
| **D-Mn20** | crosslinks front matter 파서 단위 테스트 | ✅ **2026-06-06 도달** (vitest 본격 활용 — `checklist-data-model-bundle` 묶음에서 unit 156개) | 즉시 가능 (1~2시간). phase-5 진입 첫 sweep 또는 별도 PR |

### S4. 외부 관찰 잔여 — ✅ 종료 (2026-06-15)

| 항목 | 결과 |
|------|------|
| 마케팅 묶음 M 안정화 — launchd 2주 관찰 | ✅ 종료. W19~W24 6주 무중단 실행, exit 0 일관성, `pregnancy-checklist-report.log` 누락/실패 0건 → 인프라 측면 종료 완료 (2026-06-15). 부수 incident: W24(2026-06-08~14) 데이터 0건 모든 이벤트 -100% — 같은 코드 배포 + 현재 gtag 정상 발화 → 인프라 결함이 아니라 모집단 임계값 부재가 원인. → [weekly-report-improvement.md](weekly-report-improvement.md) Wave 2 (#6 모집단 임계값 + #7 schema validate)로 분리 이관 |

### S5. 측정 신뢰성 강화 — Wave 2 즉시 진입 권장 (별도 트랙)

W24 incident (모든 이벤트 0건 → -100% incident 오인 신호)가 정확히 Wave 2에서 해결할 케이스. Wave 1(be99cc3, 2026-06-15) 머지 직후 한 사이클(W24) 결과로 임계값 검증할 데이터가 이미 손에 있음 → 휴면 진입(2026-08) 전 처리 권장.

| 항목 | 출처 | 권장 처리 |
|------|------|----------|
| #6 모집단 임계값 가드 (`previousCount < 10` → noise 다운그레이드) | [weekly-report-improvement.md](weekly-report-improvement.md) §Wave 2 | W22~W24 raw JSON으로 unit test. 임계값 자체는 실데이터 본 다음 확정 |
| #7 스키마 검증 강화 (placeholder `\| ... \|` 통과 차단) | 같음 | Wave 1 `"new"` sentinel 검증 포함 |
| M1 유입 채널 Q6 (sessionDefaultChannelGroup TOP) | 같음 | GA4 표준 차원, 추가 등록 불필요 |
| M2 랜딩 페이지 Q7 (landingPagePlusQueryString TOP) | 같음 | SEO 최적화 우선순위 신호 |

> Wave 2 자체는 phase-4.5의 부산물이 아니라 별도 트랙. 본 섹션은 W24 incident 처리 경로를 명시하기 위한 포인터 — 본문은 `weekly-report-improvement.md` Wave 2 SoT.

### 권장 진입 sweep (phase-5 첫 라운드)

복귀 직후 1주차 안에 처리 권장:
1. **마감일 박힌 것 먼저**: 마케팅 묶음 M 관찰 종료 확인 (이미 9일 후 마감)
2. **즉시 가능한 작업**: D-Mn20 (vitest unit test 1~2시간)
3. **운영자 가이드 통합**: P10 통합 본체 작성 (2~3시간) — F1·F4 본격화 전 필수
4. **데이터 의존 항목**: P13 외부 링크 인벤토리 (`external_link_click` 누적 1~2주 후)
5. **F1·F4 본격화 전 결정 묶음**: P8 + D-Mn12 + D-Mn14 + D-Mn16 묶어서 1회 결정 라운드

---

## F1. 출산휴가/육아휴직 일정 + 급여 통합 계산기

### F1.1 페르소나 점검표

| 룰 | 평가 |
|---|---|
| [§3.2](../content/persona.md) 체크리스트=본질 | ✅ 도구. "출산휴가 신청" 체크리스트 항목과 양방향 연결 가능 |
| [§3.1](../content/persona.md) 코호트 리텐션 | ⚠️ 30~36주차 + 산후 1년 이내 회귀 hook. 임신 후반 + 산후 LTV 보강 |
| [§7.2](../content/persona.md) YMYL | ⚠️ 의학 X / **재무·정책 YMYL**. 금액·시행일 = 1차 소스 + 작성일 명시 의무 |
| [§7.3](../content/persona.md) 1차 소스 | ⚠️ 고용노동부·고용보험·근로기준법. 시행일 단위로 변경 → 매년 갱신 운영 룰 의무 |
| [§7.4](../content/persona.md) 경험 기반 발행 | ⚠️ 운영자 출산휴가 7월 중순 시점 사용 예정 → 산후 복귀 후 = 경험 완료 정점 |
| [§7.5](../content/persona.md) 도구 우선 흐름 | ✅ 블로그 진입 → 계산기 → 체크리스트 흐름 가능 |
| [§7.6](../content/persona.md) 측정 의무 | ⚠️ GA4 이벤트 동반 (`tool_open`·`tool_calc`·`tool_to_checklist`) |
| [§7.1](../content/persona.md) 데이터 무결성 | ⚠️ 입력값 저장 시 zustand store + migrate 의무. 저장 안 하면 면제 |
| [§7.7](../content/persona.md) 공포 마케팅 거부 | ✅ "이거 모르면 손해" 카피 금지. "계산 결과는 참고용" 톤 |
| [§7.8](../content/persona.md) AdSense 정책 | ✅ 정부 정책 정보 도구는 유틸 가치 있음. low-value 아님. 다만 정책 정보 정확도가 정책 위반 판정과 직결 |

### F1.2 결정 사항

#### F1-D1. 단일 도구 vs 분리

- **A. 단일 도구 (`/leave-calculator`)** — 일정 + 급여 통합. 주차·입력값을 한 화면에서 공유. 유지보수 1곳
- **B. 두 도구 분리 (`/leave-schedule`, `/leave-pay`)** — SEO 키워드 분리(`출산휴가 계산기` vs `육아휴직 급여 계산기`) — 검색량 큰 두 키워드 각각 1차 노출
- **C. 단일 도구 + 2개 SEO 랜딩** — 한 도구, URL은 canonical 동일, 별도 진입점 2개로 키워드 커버

> 기본값 **C**. 1인 운영 유지보수 비용 ↓ + SEO 키워드 둘 다 보존. 단 라우트 정합 + canonical 룰 검증 필요.

#### F1-D2. 산출물 범위

- **A. 일정 + 통상임금 기반 급여 + 6+6 부모육아휴직제 보너스 + 아동수당·부모급여 가산** — 부부 동시 입력
- **B. A에서 아동수당·부모급여 제외** — 정책 변경 빈도 높음 → 별도 콘텐츠 글로 분리
- **C. 일정만 계산, 급여는 외부 링크(고용보험)** — 정책 변경 리스크 최소화

> 기본값 **B**. 6+6제는 도구 핵심 가치(부부 동시 가산 시각화)인데, 아동수당·부모급여는 카탈로그 변경 빈도가 더 높아 콘텐츠와 도구 분리가 운영 비용 낮음.

#### F1-D3. 4축 vs 5축

- **A. 4축 유지, 체크리스트 또는 블로그 안에 도구 카드로 흡수** — phase 4.6 4축 룰 보호
- **B. 5축(도구 축 신설: 체중 + 휴가 계산기)** — 도구 모음 탭. 모바일 UX 빡빡 (phase 4.6에서 거부된 5탭)
- **C. 체중 축을 "트래커" 축으로 확장 + 휴가 계산기 흡수** — 체중·휴가가 한 축 안 두 도구

> 기본값 **A**. 4축 funnel 데이터(2026-09~2026-11 누적)에서 5축 필요성이 잡히면 그때 B/C 재검토.

#### F1-D4. 입력값 저장 정책

- **A. 저장 안 함** — 매번 입력. zustand store 추가 X, migrate 부담 X
- **B. localStorage 저장** — 회귀 방문 UX ↑. [§7.1](../content/persona.md) migrate 함수 의무, store schema 설계 비용
- **C. 출산예정일 + 통상임금만 저장** — 최소한. 일정·휴가일 자동 채움

> 기본값 **C**. 출산예정일은 이미 [useChecklistStore](../../src/store/useChecklistStore.ts)·온보딩에서 보유 → 재사용. 통상임금만 추가 필드 (단순 number 1개라 migrate 비용 작음).

### F1.3 선결 조건

| 항목 | 조건 |
|------|------|
| 콘텐츠 SoT | [src/content/draft/2026-parental-leave-guide-draft.md](../../src/content/draft/2026-parental-leave-guide-draft.md) 운영자 휴가 직후 PE 채워 발행 + 1차 소스 인용 정착 |
| 트래픽 데이터 | 발행 후 최소 8주 트래픽 (검색 의도·체류·체크리스트 진입률) — 도구화 정당성 데이터 |
| 정책 SoT | 고용보험·고용노동부 공식 페이지 URL + 작성일 명시 룰 [docs/content/persona.md §4.3](../content/persona.md) 적용 |
| phase 4.6 마감 | 4축 funnel(`axis_enter`·`axis_cross_link`) 안정 + zustand migrate 패턴 정립 ([useTimelineStore](../../src/store/useTimelineStore.ts) 흡수 결과) |
| 운영자 경험 | 2026-07 출산휴가 실사용 + 2026-08~10 육아휴직 1차 사용 종료 → PE 완전 채움 |

### F1.4 작업 (기본값 C+B+A+C 기준)

| 작업 | 대상 |
|------|------|
| 라우트 신설 | `src/app/leave-calculator/page.tsx` (canonical), `src/app/leave-schedule/page.tsx` + `src/app/leave-pay/page.tsx` (rewrite or alias) |
| 컴포넌트 신설 | `src/components/leave-calculator/` — 입력 form, 결과 카드, 6+6 보너스 시각화 |
| 타입 | `src/types/leave.ts` — 통상임금, 휴가 기간, 급여 계산 결과 |
| 데이터 SoT | `src/data/leave-policy.json` — 시행일·상한액·계산 공식 (작성일 + 1차 소스 URL 필드 의무) |
| Store | [useChecklistStore](../../src/store/useChecklistStore.ts)에 `monthlyWage?: number` 1필드 추가 + migrate v(N+1) |
| 콘텐츠 ↔ 도구 | 발행된 parental-leave 글 본문 CTA → `/leave-calculator`, 도구 페이지 → 체크리스트 "출산휴가 신청" 항목 deep link |
| GA4 | `tool_open(name=leave_calculator)`, `tool_calc(name=leave_calculator, has_partner=bool)`, `tool_to_checklist(from=leave_calculator)` |
| Sitemap/robots/canonical | 3개 라우트 정합. canonical은 `/leave-calculator`로 통일 |
| 운영 가이드 | `30-domain/`에 정책 SoT 갱신 룰 추가 (매년 1월 정책 변경 점검) |
| E2E | `e2e/leave-calculator.spec.ts` — 계산 정확도(고정 입력 → 고정 출력) + 체크리스트 진입 funnel + migrate 시나리오 |
| AdSense | 도구 페이지에 면책 문구 ([§4.1](../content/persona.md) 정부 정책 면책 변형 적용) + 작성일 명시 |

### F1.5 양보 거부 항목 적용

- **1차 소스 + 작성일 의무** ([§7.3](../content/persona.md)) — `leave-policy.json` 모든 금액·시행일 필드에 `source_url`·`asof_date` 동반. 누락 시 빌드 실패시키는 검증 스크립트
- **공포 마케팅 거부** ([§7.7](../content/persona.md)) — "지금 신청 안 하면 손해" 류 카피 검수. 카피 검수 e2e 또는 수동 체크
- **measurement 동반** ([§7.6](../content/persona.md)) — GA4 이벤트 3종 같이 머지. 이벤트 없는 도구 머지 금지

---

## F2. E2E hydration race cleanup (phase-4.6에서 이입)

### F2.1 배경

- phase-4.6 §5 라운드 (2026-06-03) 풀 회귀에서 13건 spec random 실패.
- 단독 spec 실행은 통과, 풀 회귀에서만 재현 → timing race 확정.
- CI=1 (retries:1) 로 cover됨 (552/557 통과, 0 failed) — 머지는 가능하나
  근본 원인 미해결 누적 부채.
- 영향 spec: ga4-events.spec.ts (2건), gamification.spec.ts (3건),
  phase-4-step-1-checklist-hub.spec.ts (3건), plan.spec.ts (4건),
  timeline-retention.spec.ts (1건).
- 공통 패턴: timeline/체크리스트 페이지의 sr-only checkbox에
  `dispatchEvent("click")` 시 React onChange 누락.

### F2.2 의심 원인

| 후보 | 근거 |
|---|---|
| useDueDateStore hydration race | timeline-retention.spec.ts:88 `test.skip` 주석에 명시된 "useMemo([hydrated])와 last-visit useEffect 사이 race" |
| sr-only input + controlled component | `<input className="sr-only peer" checked={isChecked} onChange={onToggle}>` — Playwright `dispatchEvent("click")`이 native change 합성 못 함 |
| webServer 응답 누적 | `npx serve out` 단일 인스턴스가 9분간 1500+ test 처리 시 응답 지연 |

### F2.3 작업

| 작업 | 대상 |
|---|---|
| 진단 1 — 컴포넌트 측 | [ChecklistRow.tsx](../../src/components/checklist/ChecklistRow.tsx) sr-only input + label 구조 검증. `label.click()` 또는 별도 visible toggle 도입 검토 |
| 진단 2 — store hydration | [useDueDateStore](../../src/store/useDueDateStore.ts) `refreshWeekIfNeeded` + hydrated flag race 핀포인트 |
| spec 안정화 (보수안) | 13 spec의 `dispatchEvent("click")` 앞에 `waitFor({state:"attached"})` 추가 |
| 페르소나 §7.1 정합 | retry 의존 부채 해소 — 로컬 retries:0 환경에서도 통과 보장 |
| 검증 | 로컬 `npm run test:e2e` 풀 회귀 0 failure (retry 없이 통과) |

### F2.4 선결 조건

- phase-4.6 §5 ga4-axis-funnel-5tab 라운드 머지 완료
- AdSense 신청 완료 (목표 6/15) — 신청 전후 안정성 가드라 신청 이후 진입 가능

---

## Out of scope (Phase 5에서도 제외)

- Phase 4.6 in-scope 재방문 (이미 완료된 4축 정돈)
- 의학적 단정 도구 (체중 → 출산 위험도 예측 등) — [§7.2](../content/persona.md) 위반
- 외부 의존 API 도구 (실시간 정책 API 등) — 1인 운영 지속 가능성 ↓

---

## 결정 매트릭스 (Phase 5 진입 라운드에서 결정)

| ID | 결정 | 선결 | 기본값 |
|----|------|------|--------|
| F1-D1 | 단일 도구 vs 분리 | parental-leave 글 트래픽 | C (단일 + 2 SEO 랜딩) |
| F1-D2 | 산출물 범위 | 6+6제·아동수당 정책 안정성 | B (아동수당 제외) |
| F1-D3 | 4축 vs 5축 | 4축 funnel 데이터 (2026-09~11) | A (4축 유지) |
| F1-D4 | 입력값 저장 | zustand migrate 비용 | C (출산예정일 + 통상임금만) |
| F2~F6 | 후보 진입 여부 | 각 후보별 선결 데이터 | 미정 |

---

## 일정 계획 (잠정)

| 마일스톤 | 날짜 | 비고 |
|----------|------|------|
| `parental-leave-guide` 발행 | 2026-07 휴가 직후 (PE 채움) | 콘텐츠 SoT 선행 |
| 트래픽 누적 | 2026-07 ~ 2026-10 | 8주 이상 |
| 산후 휴면 종료 | 2026-11 ~ | 운영자 복귀 |
| Phase 5 결정 라운드 | 2026-11 ~ | F1-D1~D4 + F2~F6 우선순위 |
| Phase 5 구현 | 2026-12 ~ | 우선순위 1번 후보부터 |

> 본 일정은 7월 휴가·8월 출산·산후 휴면이 계획대로 진행된 경우 기준. 운영자 컨디션·아이 컨디션에 따라 전체 시프트.

---

## 참고

- [phase-4.6.md](phase-4.6.md) — 직전 phase, 4축 정돈
- [phase-4.5.md](phase-4.5.md) — phase-4.5 디자인·기획 정돈
- [adsense-audit.md](adsense-audit.md) — AdSense 신청 점검표
- [docs/content/persona.md](../content/persona.md) — 기획·콘텐츠 페르소나 (양보 거부 항목 §7)
- [src/content/draft/2026-parental-leave-guide-draft.md](../../src/content/draft/2026-parental-leave-guide-draft.md) — F1 선결 콘텐츠 SoT
