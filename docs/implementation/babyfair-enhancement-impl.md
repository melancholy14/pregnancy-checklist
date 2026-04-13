# 베이비페어 정보 구체화 Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| BabyfairEvent 타입에 신규 optional 필드 추가 | ✅ 완료 | scale, admission, parking, highlights, tip, operating_hours, pre_register_url |
| 4월 이후 주요 행사에 확장 데이터 추가 | ✅ 완료 | 대형 행사 8개에 scale/admission/operating_hours 등 보강 |
| scale 배지 UI 추가 | ✅ 완료 | 대형(#FFD4DE), 중형(#FFF4D4), 소형(#E0F0FF) |
| 확장 정보 조건부 렌더링 | ✅ 완료 | operating_hours, admission, parking, highlights, tip |
| 하위 호환 유지 | ✅ 완료 | 기존 데이터만 있는 카드도 정상 동작 |

## 생성/수정 파일 목록
### 수정
- `src/types/babyfair.ts` — 7개 optional 필드 추가
- `src/data/babyfair_events.json` — 8개 주요 행사에 확장 데이터 추가
- `src/components/babyfair/BabyfairCard.tsx` — scale 배지, 확장 정보 섹션, highlights, tip 조건부 렌더링

## 주요 결정 사항
- **조건부 렌더링**: 모든 신규 필드는 optional → 값이 없으면 해당 줄 자체를 렌더하지 않음
- **highlights 최대 3개**: 카드 길이 제한을 위해 3개까지만 표시, 초과 시 "외 N개"
- **footer 텍스트 분기**: 확장 데이터가 있으면 "상세 정보는 공식 홈페이지에서 확인하세요", 없으면 기존 문구 유지
- **이모지 접근성**: 확장 정보 아이콘에 `aria-hidden="true"` 적용

## 가정 사항
- 데이터 출처는 각 행사 공식 사이트 기준
- pre_register_url은 아직 데이터 없음 (점진적으로 추가 예정)
- BabyfairContainer의 scale 필터는 행사 수가 더 많아지면 추가 (현재 미구현)

## 미구현 항목
- BabyfairContainer scale 필터 (PRD에서 "선택사항"으로 명시)
- pre_register_url 별도 버튼 (데이터 확보 후 추가)
