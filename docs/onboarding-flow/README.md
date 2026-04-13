# Onboarding Flow

> 작성일: 2026-04-06 | 작성자: Claude Code

## 개요

첫 방문 유저에게 3단계 경량 온보딩 플로우를 제공합니다.
앱 소개(웰컴) → 출산 예정일 입력 → 데이터 저장 방식 안내 순서로 진행하며,
완료 시 `localStorage`에 플래그를 설정하고 타임라인 페이지로 이동합니다.
기존에 온보딩 플로우가 없어 첫 방문 유저의 이탈률이 높았던 문제를 해결합니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `onboarding-completed` localStorage 키 없을 때만 온보딩 표시 | ✅ 완료 | HomeContent에서 useEffect로 체크 |
| Step 1(웰컴) → Step 2(예정일) → Step 3(데이터 안내) 순서 진행 | ✅ 완료 | OnboardingFlow에서 step 상태로 관리 |
| Step 2에서 "나중에 입력할게요" 선택 시 예정일 없이 Step 3 이동 | ✅ 완료 | handleSkip으로 구현 |
| Step 3 CTA 클릭 시 localStorage 플래그 설정 후 `/timeline` 이동 | ✅ 완료 | handleComplete에서 처리 |

### 생성/수정 파일

#### 신규 생성
- `src/components/onboarding/WelcomeStep.tsx` — Step 1 웰컴 화면 (앱 소개 + 기능 하이라이트)
- `src/components/onboarding/DueDateStep.tsx` — Step 2 예정일 입력 (입력 or 건너뛰기)
- `src/components/onboarding/ReadyStep.tsx` — Step 3 데이터 안내 (로컬 저장 안내 + CTA)
- `src/components/onboarding/OnboardingFlow.tsx` — 3단계 스텝 컨테이너 (step indicator 포함)

#### 수정
- `src/components/home/HomeContent.tsx` — 온보딩 미완료 시 OnboardingFlow 렌더링

### 주요 결정 사항
- **풀스크린 오버레이**: `fixed inset-0 z-50`으로 온보딩 중 다른 UI를 완전히 가림 (PRD 와이어프레임 기준)
- **GA 이벤트**: 각 단계 주요 액션(예정일 설정/건너뛰기, 온보딩 완료)에 GA 이벤트 추가
- **스텝 인디케이터**: 상단에 3개의 도트로 현재 진행 상태 표시
- **기존 DueDateInput과 분리**: 온보딩의 예정일 입력은 독립 구현 — 기존 DueDateInput은 홈에서 계속 사용

### 가정 사항 및 미구현 항목
- 온보딩은 홈(/) 진입 시에만 트리거 (다른 페이지 직접 접근 시 미표시)
- Step 2에서 "다음" 버튼은 날짜 미선택 시 disabled 처리
- 시크릿 모드 등 localStorage 접근 불가 시 온보딩 미표시 (에러 무시)
- 미구현 항목 없음

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)
없음

### Warning (수정 권장)
1. **OnboardingFlow.tsx** — Step indicator에 스크린리더 접근성 부재 → 리팩토링 단계에서 수정 완료

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 (리팩토링에서 수정 완료) |
| Suggestion | 1건 (step 전환 애니메이션 — 미적용) |

---

## 리팩토링 내용

### 작업 목록
1. **OnboardingFlow.tsx — Step indicator 접근성 개선**
   - step indicator 컨테이너에 `role="group"`, `aria-label="온보딩 진행 상태"` 추가
   - 각 도트에 `role="presentation"`, `aria-label`로 현재 상태(진행 중/완료/대기) 텍스트 추가
   - 스크린리더 사용자가 온보딩 진행 상태를 인지할 수 있도록 개선

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| 최대 파일 줄 수 | 49줄 | 53줄 |
| 접근성 속성 | 없음 | role + aria-label 추가 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 3개 passed |
| Error/Validation | ✅ 2개 passed |
| 권한/인증 (localStorage) | ✅ 2개 passed |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **8 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
