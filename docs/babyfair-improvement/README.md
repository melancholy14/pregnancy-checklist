# Phase 2.5 Step 6: 베이비페어 개선

## 개요

베이비페어 페이지의 탭 구조를 2분류에서 3분류로 개선하고, 진행 중 행사에 D-day 배지를 추가하며, 연도 라벨을 서브타이틀에 반영한다.

---

## 구현 내역

### 1. 3분류 카테고리 탭

| 카테고리 | 조건 | 유저 니즈 |
|----------|------|-----------|
| **진행 중** | `start_date <= today && end_date >= today` | "지금 갈 수 있는 곳" |
| **예정** | `start_date > today` | "미리 일정 잡아야 할 곳" |
| **지난 행사** | `end_date < today` | "후기 참고용" |

- 기본 선택 탭: 진행 중 행사 1건 이상이면 "진행 중", 없으면 "예정"
- 진행 중 탭에 행사 수 배지: `진행 중 (N)`

### 2. D-day 배지

진행 중 탭의 카드에 `end_date` 기준 남은 일수 배지 표시:
- 남은 일수 > 0: `D-N일 남음`
- 당일: `D-Day`

### 3. 연도 라벨

서브타이틀에 현재 연도 자동 반영:
```
AS-IS: "전국 베이비페어 행사 안내"
TO-BE: "2026년 전국 베이비페어 행사 안내"
```

### 4. CITY_COLORS 확장

기존 7개 도시에서 18개 도시로 확장하여 `babyfair_events.json`의 모든 도시에 색상 매핑 완료.

---

## 수정 파일

| 파일 | 변경 |
|------|------|
| `src/components/babyfair/BabyfairContainer.tsx` | 3탭 분리, 기본 탭 로직, 연도 라벨, `BabyfairTab` 타입 |
| `src/components/babyfair/BabyfairCard.tsx` | `daysLeft` prop 추가, D-day 배지 UI, CITY_COLORS 18개 도시 확장 |
| `e2e/baby-fair.spec.ts` | 3탭 구조에 맞게 기존 테스트 업데이트 |
| `e2e/babyfair-improvements.spec.ts` | 신규 E2E 테스트 (7건) |

---

## 코드 리뷰 결과

| 등급 | 건수 | 내용 |
|------|------|------|
| Critical | 0 | - |
| Warning | 1 | `BabyfairTab` 타입 함수 내부 선언 → 리팩토링에서 외부로 이동 완료 |

---

## 리팩토링

- `BabyfairTab` 타입을 컴포넌트 함수 내부에서 모듈 레벨로 이동

---

## E2E 테스트

### 기존 테스트 수정 (`e2e/baby-fair.spec.ts` — 13건)
- 2탭→3탭 탭명 변경 반영
- 과거 행사 참조를 "지난 행사" 탭 전환 후로 변경
- 도시 필터 `exact: true` 추가 (카드 role="button"과의 strict mode 충돌 해결)

### 신규 테스트 (`e2e/babyfair-improvements.spec.ts` — 7건)
- 3탭 구조 존재 확인
- 예정/지난 행사 탭 필터링
- 탭 간 전환 동작
- 연도 라벨 표시
- 도시 필터 + 탭 복합 필터
- 모바일 375px 반응형

### 테스트 실행 결과
```
20 passed (11.5s)
```
