# Onboarding Flow Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| `onboarding-completed` localStorage 키 없을 때만 온보딩 표시 | ✅ 완료 | HomeContent에서 useEffect로 체크 |
| Step 1(웰컴) → Step 2(예정일) → Step 3(데이터 안내) 순서 진행 | ✅ 완료 | OnboardingFlow에서 step 상태로 관리 |
| Step 2에서 "나중에 입력할게요" 선택 시 예정일 없이 Step 3 이동 | ✅ 완료 | handleSkip으로 구현 |
| Step 3 CTA 클릭 시 localStorage 플래그 설정 후 `/timeline` 이동 | ✅ 완료 | handleComplete에서 처리 |

## 생성/수정 파일 목록
### 신규 생성
- `src/components/onboarding/WelcomeStep.tsx` — Step 1 웰컴 화면 (앱 소개 + 기능 하이라이트)
- `src/components/onboarding/DueDateStep.tsx` — Step 2 예정일 입력 (입력 or 건너뛰기)
- `src/components/onboarding/ReadyStep.tsx` — Step 3 데이터 안내 (로컬 저장 안내 + CTA)
- `src/components/onboarding/OnboardingFlow.tsx` — 3단계 스텝 컨테이너 (step indicator 포함)

### 수정
- `src/components/home/HomeContent.tsx` — 온보딩 미완료 시 OnboardingFlow 렌더링

## 주요 결정 사항
- **풀스크린 오버레이**: `fixed inset-0 z-50`으로 온보딩 중 다른 UI를 완전히 가림 — PRD 와이어프레임이 풀스크린을 명시
- **GA 이벤트**: 각 단계 주요 액션(예정일 설정/건너뛰기, 온보딩 완료)에 GA 이벤트 추가
- **스텝 인디케이터**: 상단에 3개의 도트로 현재 진행 상태 표시 — PRD에 없지만 UX 관행상 추가
- **기존 DueDateInput과 분리**: 온보딩의 예정일 입력은 독립 구현 — 기존 DueDateInput은 홈에서 계속 사용

## 가정 사항
- 온보딩은 홈(/) 진입 시에만 트리거 (다른 페이지 직접 접근 시 미표시)
- Step 2에서 "다음" 버튼은 날짜 미선택 시 disabled 처리
- 시크릿 모드 등 localStorage 접근 불가 시 온보딩 미표시 (에러 무시)

## 미구현 항목
- 없음 (PRD Step 1의 모든 요구사항 구현 완료)
