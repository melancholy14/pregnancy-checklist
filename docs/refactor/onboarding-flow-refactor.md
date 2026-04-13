# Onboarding Flow 리팩토링

## 리팩토링한 파일 목록
- `src/components/onboarding/OnboardingFlow.tsx`

---

## 작업별 내용

### 1. OnboardingFlow.tsx — Step indicator 접근성 개선
- **출처**: Warning 항목
- **무엇을**: step indicator 컨테이너에 `role="group"`, `aria-label="온보딩 진행 상태"` 추가. 각 도트에 `role="presentation"`, `aria-label`로 현재 상태(진행 중/완료/대기) 텍스트 추가.
- **왜**: 스크린리더 사용자가 현재 온보딩 진행 상태를 인지할 수 없었음

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 |
| 최대 파일 줄 수 | 49줄 | 53줄 |
| 접근성 속성 | 없음 | role + aria-label 추가 |

---

## 빌드 결과
성공 (1회 시도)
