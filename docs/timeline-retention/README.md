# Timeline Retention (타임라인 유도 강화 + 데이터 보존 가이드)

> 작성일: 2026-04-06 | 작성자: Claude Code

## 개요

홈→타임라인 전환율 향상과 데이터 보존 불안 해소를 위한 3가지 개선.
홈 CTA 카드를 체크리스트 미리보기 + 풀너비 버튼으로 강화하고,
타임라인에서 첫 체크 시 데이터 자동 저장 안내 배너를 1회 표시하며,
재방문 유저에게 이전 체크 기록을 보여주는 웰컴 메시지를 추가합니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 홈 CTA 카드에 현재 주차 + 미완료 수 + 체크 미리보기 + 풀너비 CTA | ✅ 완료 | thisWeekChecklist 기반 |
| 타임라인 첫 체크 시 인라인 배너 1회 표시 | ✅ 완료 | checkedIds 0→1 감지 + localStorage 플래그 |
| 재방문 유저 웰컴 메시지 | ✅ 완료 | last-visit-date 비교, 당일 아닐 때만 표시 |

### 생성/수정 파일

#### 수정
- `src/components/home/HomeContent.tsx` — CTA 강화 (체크리스트 미리보기 + Button CTA), 재방문 유저 웰컴 메시지
- `src/components/timeline/TimelineContainer.tsx` — 첫 체크 인라인 배너 (Save 아이콘 + 확인 버튼)

### 주요 결정 사항
- **체크리스트 기반 CTA**: `getChecklistByWeek` 유틸 재사용, 기존 TimelineItem 대신 ChecklistItem 표시
- **Checkbox 읽기 전용**: 홈에서 직접 체크 불가, `pointer-events-none` + `aria-hidden` 적용
- **첫 체크 감지**: `useRef`로 이전 `checkedIds.length` 추적, 0→1 전환 시에만 배너
- **재방문 판단**: `last-visit-date` ISO 날짜 비교, `checklist-storage` 직접 파싱

### 가정 사항 및 미구현 항목
- 재방문 메시지는 `hasDueDate` 조건 내에서만 렌더 (예정일 미입력 유저에겐 미표시)
- CTA 카드 최대 3개 항목 미리보기
- 미구현 항목 없음

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)
없음

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 1건 (getChecklistByWeek 중복 호출 → 향후 공통 훅 추출 가능) |

---

## 리팩토링 내용

리팩토링할 항목 없음. Warning 0건, 추가 판단 항목도 미발견.

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 5개 passed |
| Error/Validation | ✅ 2개 passed |
| 권한/인증 (localStorage) | ✅ 1개 passed |
| 반응형 (Mobile 375px) | ✅ 1개 passed |
| **전체** | **9 passed / 0 failed** |

📊 상세 리포트: `playwright-report/index.html`
