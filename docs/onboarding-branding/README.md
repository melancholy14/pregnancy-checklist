# Phase 2.5 Step 12: 온보딩 톤 변경

## 요약

온보딩 WelcomeStep/ReadyStep의 카피를 3인칭 서비스 안내에서 1인칭 당사자 톤으로 전환했습니다. Phase 전환을 위해 `BRAND_COPY`에 `onboardingGreeting` 필드도 추가했습니다.

## 변경 사항

### WelcomeStep

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| h1 | "출산 준비, 빠짐없이 챙기세요" | **"안녕하세요!"** |
| 서브 텍스트 | (없음) | **"저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요."** |
| highlight 1 | "주차별 맞춤 체크리스트" | **"주차별로 뭘 해야 하는지 정리"** |
| highlight 2 | "전국 베이비페어 일정" | **"전국 베이비페어 일정 모음"** |
| highlight 3 | "임신·출산 정보 한곳에" | **"체중 기록 & 출산 정보까지"** |

### ReadyStep

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| h1 | "준비 완료!" | **"준비 완료! 같이 챙겨봐요"** |

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/constants.ts` | `BRAND_COPY`에 `onboardingGreeting` 필드 추가 (3 Phase) |
| `src/components/onboarding/WelcomeStep.tsx` | h1, 서브 텍스트, highlights 배열 변경 |
| `src/components/onboarding/ReadyStep.tsx` | h1 카피 변경 |
| `e2e/onboarding-flow.spec.ts` | 기존 카피 레퍼런스 업데이트 |
| `e2e/onboarding-branding.spec.ts` | E2E 테스트 5개 케이스 신규 작성 |

## 코드 리뷰

Critical/Warning 이슈 없음. 리팩토링 불필요.

## E2E 테스트

파일: `e2e/onboarding-branding.spec.ts`

| 테스트 | 설명 |
|--------|------|
| h1 변경 | "안녕하세요!" 표시 확인 |
| 서브 텍스트 | onboardingGreeting 표시 확인 |
| highlights | 유저 관점 혜택 3개 표시 확인 |
| ReadyStep | "준비 완료! 같이 챙겨봐요" 표시 확인 |
| 모바일 반응형 | 375px에서 카피 정상 표시 |

결과: **5/5 통과** (3.0s)
기존 onboarding-flow.spec.ts: **8/8 통과**
