# Onboarding Flow 코드 리뷰

## 리뷰 대상 파일
- `src/components/onboarding/WelcomeStep.tsx`
- `src/components/onboarding/DueDateStep.tsx`
- `src/components/onboarding/ReadyStep.tsx`
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/home/HomeContent.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음

---

## Warning (수정 권장)

### 1. OnboardingFlow.tsx — Step indicator에 스크린리더 접근성 부재
- **위치**: `src/components/onboarding/OnboardingFlow.tsx:33-40`
- **문제**: step indicator가 시각적 도트만 있고 `aria-label` 또는 `role="progressbar"` 등 스크린리더용 텍스트가 없음. 시각 장애 유저가 현재 진행 상태를 알 수 없음.
- **권장 수정**: indicator 컨테이너에 `role="group"`, `aria-label="온보딩 진행 상태"` 추가하고 각 도트에 `aria-label={N단계 ${s === step ? '진행 중' : s < step ? '완료' : '대기'}}` 추가

---

## Suggestion (개선 아이디어)

### 1. OnboardingFlow.tsx
- Step 전환 시 `motion` 라이브러리(이미 package.json에 포함)로 슬라이드 애니메이션을 추가하면 UX가 자연스러워질 수 있음. 현재는 즉시 전환.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 1건 |
| Suggestion | 1건 |
| 빌드 | 미실행 (Critical 없음) |
