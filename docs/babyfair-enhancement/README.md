# 베이비페어 정보 구체화

> 작성일: 2026-04-10 | 작성자: Claude Code

## 개요

베이비페어 카드에 규모(scale) 배지, 운영시간, 입장 안내, 주차 정보, 주요 특징(highlights),
만든이 팁(tip) 등 확장 정보를 추가하여 "이 페어 가볼 만한가?"를 판단할 수 있게 합니다.
모든 신규 필드는 optional이며 기존 데이터만 있는 카드도 정상 동작합니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| BabyfairEvent 타입 확장 (7개 optional 필드) | ✅ 완료 | scale, admission, parking, highlights, tip, operating_hours, pre_register_url |
| 4월 이후 주요 행사 데이터 보강 | ✅ 완료 | 대형 8개 행사에 확장 데이터 |
| scale 배지 UI (대형/중형/소형) | ✅ 완료 | 색상별 배지 |
| 확장 정보 조건부 렌더링 | ✅ 완료 | 값 없으면 해당 줄 미표시 |
| 하위 호환 유지 | ✅ 완료 | 기존 카드 정상 동작 |

### 생성/수정 파일

- `src/types/babyfair.ts` — 7개 optional 필드 추가
- `src/data/babyfair_events.json` — 8개 주요 행사 데이터 보강
- `src/components/babyfair/BabyfairCard.tsx` — scale 배지, 확장 정보, highlights, tip UI

### 주요 결정 사항

- **조건부 렌더링**: optional 필드 값 없으면 해당 줄 미렌더
- **highlights 최대 3개**: 초과 시 "외 N개" 표시
- **이모지 접근성**: `aria-hidden="true"` 적용
- **footer 텍스트 분기**: 확장 데이터 유무에 따라 문구 변경

### 가정 사항 및 미구현 항목

- 데이터 출처는 각 행사 공식 사이트 기준
- 미구현: BabyfairContainer scale 필터 (PRD "선택사항"), pre_register_url 버튼 (데이터 확보 후)

---

## 코드 리뷰 결과

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 0건 |

---

## 리팩토링 내용

리팩토링 항목 없음. 코드가 이미 충분히 정리된 상태.

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 6개 passed |
| Error/Validation | ✅ 2개 passed |
| 반응형 (Mobile 375px) | ✅ 2개 passed |
| **전체** | **10 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
