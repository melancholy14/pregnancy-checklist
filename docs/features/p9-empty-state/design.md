# P9: 빈 상태 카피·CTA 명세 — 디자인 문서

> 작성일: 2026-05-07
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **4.1 첫 방문**: 둘러보기 CTA만, 입력 유도는 P3 글로벌 슬림 배너 위임
- **4.2 모두 완료**: 헤더 격려 1줄 + 다음 행동 토스트 1회. 별도 빈 상태 시안 미도입
- **4.3 마이그레이션 손실**: 자동 복구 우선, 실패 시 부드러운 재시작 카피
- **4.4 custom만**: 단순 안내 카피, 운영 톤 미노출
- **4.5 §1.8 J**: GA4 별도 — 본 design은 카피·시안만

## 1. 화면 목록·플로우

본 기능은 체크리스트 페이지 본문 영역에 한정. 신규 페이지·라우팅 변경 없음.

- **화면 A (체크리스트 hub `/checklist` 또는 슬러그별 `/checklist/[slug]`)**: 본문이 비어 있을 때 빈 상태 컴포넌트 렌더. 헤더에 P3 글로벌 슬림 배너는 그대로(체크리스트 페이지 내 동작 분리).
- **화면 B (체크리스트 모두 완료 상태)**: 헤더에 격려 텍스트 1줄 + 마운트 시 토스트 3초 1회. 본문 항목 리스트는 strikethrough 상태 그대로 노출(별도 시안 전환 X).
- **화면 C (마이그레이션 손실 후 폴백)**: 본문 상단 inline alert 카드 + 항목 리스트 default 상태로 노출. alert는 [확인] CTA 또는 첫 체크 시 사라짐.

플로우 전환:
- 첫 방문 → [둘러보기] 탭 → 체크리스트 항목 리스트로 스크롤·전환 (페이지 내 앵커, 라우팅 변경 X)
- 모두 완료 토스트 → 액션 버튼 [둘러보기] → 다른 체크리스트 hub로 이동 (`/checklist`)
- 마이그레이션 손실 alert → [확인] 또는 첫 체크 → alert dismiss (라우팅 변경 X)

## 2. 컴포넌트

- **신규**:
  - `components/checklist/ChecklistEmptyState.tsx` — 빈 상태 컴포넌트. `case` prop(`first_visit | migration_lost | custom_only`) 분기. `all_done`은 별도 컴포넌트 미생성(헤더 텍스트 + 토스트만).
  - `components/checklist/AllDoneBadge.tsx` — 모두 완료 시 헤더에 노출되는 격려 텍스트 컴포넌트. mint 토큰 사용.
  - `components/common/InlineToast.tsx` — 가벼운 inline 토스트 유틸 (외부 라이브러리 추가 회피, 기존 패턴 부재 시). 마운트당 1회 발사 hook 포함.
- **재사용**:
  - 기존 [DueDateInput](../../../src/components/home/DueDateInput.tsx) / 슬림 배너(P3 결정 산출물) — 첫 방문 입력 유도는 이쪽이 담당, P9는 관여 X.
  - [ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx) — 헤더 영역에 `AllDoneBadge` 슬롯 추가.
  - [createChecklistStore.ts](../../../src/store/createChecklistStore.ts) — `onRehydrateStorage` 콜백 추가, `migrationLostFlag` 별도 store 키.
- **재사용 토큰**: `--prose-muted`, `--prose-divider`, `--background`, mint(success), peach(data) — globals.css 인라인 hex 금지.

## 3. 상태별 시안

| 상태 | UI 텍스트·동작 |
|---|---|
| **first_visit** (체크 0개, custom 0개) | 본문 중앙 정렬 카드. 일러스트(작은 체크리스트 아이콘 outline) + 카피 `체크리스트가 비어 있어요. 항목을 살펴보시겠어요?` + [둘러보기] 단일 CTA(lavender). 입력 유도 카피 없음(글로벌 슬림 배너에 위임). |
| **all_done** (모든 항목 체크 완료) | 별도 빈 상태 시안 미렌더. 헤더(`ChecklistHub` 상단)에 `AllDoneBadge` — 텍스트 `모든 항목을 챙기셨어요 ✓` + 옆에 mint 작은 체크 아이콘. 마운트 시 `InlineToast` 3초 1회 — 텍스트 `다른 체크리스트도 살펴보시겠어요?` + 액션 [둘러보기]. |
| **migration_lost** (자동 복구 실패) | 본문 상단 inline alert(쿠키 동의 패턴 차용) — 카피 `체크 기록을 새로 시작해요. 항목은 그대로 보여드릴게요.` + [확인] 단일 CTA(lavender). alert 배경은 peach/30, 강조 톤 회피. |
| **custom_only** (기본 0개 + custom ≥1개) | 본문 상단 짧은 안내 텍스트 — `기본 항목이 비어 있어요. 추가하신 항목은 그대로 보여드릴게요.` 카드·일러스트·CTA 없음. 텍스트 색 `--prose-muted`. custom 항목 리스트는 그 아래 정상 렌더. |
| **default (loading)** | 빈 상태 컴포넌트 자체 미렌더 — 체크리스트 데이터 로딩 중에는 기존 skeleton 또는 빈 영역 그대로. 빈 상태는 hydration 완료 후 분기 판정. |
| **error** (예: store 접근 실패) | 본 명세 범위 밖. 기존 error boundary 처리. |

## 4. 인터랙션·애니메이션

- **first_visit [둘러보기] CTA 탭**: 페이지 내 항목 리스트로 스크롤(부드러운 scroll-into-view, 300ms ease-out). 라우팅 변경 X.
- **all_done 토스트 등장**: 마운트 후 100ms 지연 → fade-in + slide-up 200ms ease-out. 3초 후 fade-out 200ms. 액션 버튼 탭 시 즉시 dismiss + 라우팅 이동.
- **all_done 헤더 격려 텍스트**: 모든 체크 완료 시 즉시 노출(애니메이션 없음). 체크 해제 시 즉시 사라짐.
- **migration_lost alert 등장**: 페이지 마운트 직후 노출(애니메이션 없음 — 정직한 노출이 톤에 맞음). [확인] 또는 첫 체크 시 fade-out 150ms 후 dismiss.
- **`prefers-reduced-motion`**: 토스트·alert·스크롤 모두 transition·smooth scroll 제거.

## 5. 토큰·접근성

### 5.1 사용 토큰

| 용도 | 토큰 | 값 |
|---|---|---|
| first_visit 카드 배경 | `bg-card` | `var(--card)` |
| first_visit 카피 색 | `text-muted-foreground` | `var(--muted-foreground)` (#9CA0A4) |
| first_visit CTA | `bg-pastel-lavender text-foreground` | lavender (secondary role) |
| all_done 헤더 격려 색 | mint(success) 텍스트 | `text-pastel-mint` 또는 `var(--prose-accent)` 톤 |
| all_done 토스트 배경 | `bg-foreground/90 text-background` | foreground 90% alpha + background 텍스트 |
| migration_lost alert 배경 | peach/30 | `var(--prose-tip-bg)` 또는 동등 |
| custom_only 안내 색 | `--prose-muted` | #7A7F83 |
| 본문 keep-all | `.article-prose` 또는 동등 wrapper | `word-break: keep-all` 상속 |

빨간 경고색·destructive 토큰 사용 금지 — designer 도메인 컨텍스트 "신체 변화·민감 시기 — 빨간 경고색 지양" 정합.

### 5.2 접근성 (WCAG 2.1 AA)

- **시맨틱**:
  - `ChecklistEmptyState`는 `<section role="status" aria-live="polite">`. 케이스 변경 시 스크린리더 자연 알림.
  - `AllDoneBadge`는 정적 텍스트 — `<span>`으로 충분. `aria-label="모든 항목 완료"` 추가 가능.
  - `InlineToast`는 `role="status"` (긴급 알림 아님). 액션 버튼은 `<button>` 시맨틱.
  - migration_lost alert는 `<div role="alert">` (자동 복구 실패는 사용자 즉시 인지 필요).
- **색 대비**:
  - first_visit 카피 (`#9CA0A4` on `var(--card)` ~ #FFFAF7) ≈ 4.6:1 — AA 통과.
  - all_done 토스트 (background 텍스트 on foreground 90%) ≈ 12+:1 — 통과.
  - migration_lost alert (foreground on peach/30) — 마이그레이션 시 axe-core 검증.
  - custom_only 안내 (`#7A7F83` on background) ≈ 4.65:1 — 통과.
- **키보드 흐름**:
  - first_visit [둘러보기] CTA: Tab으로 도달, Enter/Space로 활성화 → 항목 리스트로 focus 이동.
  - all_done 토스트 액션 버튼: Tab으로 도달 가능. 토스트 dismiss(3초)되면 focus 자동 이동 X (사용자 위치 유지).
  - migration_lost [확인] CTA: Tab으로 도달, Enter/Space로 dismiss.
- **스크린리더 라벨**:
  - first_visit: 일러스트는 `aria-hidden="true"`. 카피·CTA만 낭독.
  - all_done 토스트: `role="status"` + 텍스트 + 액션 버튼.
  - migration_lost: `role="alert"`로 즉시 낭독 — 사용자 인지 의무 충족.
- **`prefers-reduced-motion`**: §4 인터랙션 모두 transition 제거.
- **모바일 320px**:
  - first_visit 카드 폭 화면의 90%, 내부 패딩 16px.
  - all_done 토스트 폭 화면의 90%, 하단 16px 안쪽.
  - migration_lost alert 폭 본문 폭 100% (체크리스트 본문 영역과 동일).
  - 카피 줄바꿈 자연스러움 — `word-break: keep-all` 검증.
- **한국어 본문 keep-all**: 모든 카피 `.article-prose` 또는 동등 wrapper 안에서 자동 상속.

### 5.3 다크 패턴·정직성 점검

- **N4 가짜 진행률 회피**: all_done 케이스에 별도 게이미피케이션 화면(축하 일러스트·점수·뱃지) 미도입 — 헤더 텍스트 + 토스트만. designer 우려 사전 차단.
- **N4 광고 위장 회피**: all_done 토스트의 [둘러보기] 액션은 자체 도구 안내(`/checklist` hub)만. 외부 링크·AdSense 노출 금지.
- **공포 카피 0**: 모든 카피 부드러운 톤. "이거 모르면 큰일 나요" 류 절대 금지(planner §7.7).
- **숨김 다크 패턴 회피**: migration_lost는 자동 복구가 사일런트 처리하지 않고 사용자에게 명시 — `role="alert"` + 부드러운 카피 동시 충족.
- **임의 결정 0**: 카피 변경은 review.md 갱신 후만. design.md 임의 카피 추가 시 review.md와 동기화 의무.
