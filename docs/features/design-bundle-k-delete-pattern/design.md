# design-bundle-k-delete-pattern 디자인 문서

> 작성일: 2026-05-10
> 관련 스펙: [spec.md](./spec.md)  관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **K-1 옵션 C**: 액션 비용 차등 + 전 영역 undo-toast (사용자 입력 데이터 3영역). AlertDialog 호출부 2개 제거 + DeleteConfirmDialog 컴포넌트 삭제. weight 즉시 삭제도 undo-toast로 통일.
- **K-2 옵션 A**: 메모리 임시 보관 (React state). 새로고침 시 undo 불가.
- **K-3 옵션 B**: undo 회복 창 = 7초.
- **K-4 옵션 A**: `useDeleteWithUndo<T>` 훅 신설.
- **페어 1**: sonner `toast.action` 패턴 첫 도입. `Toaster` `visibleToasts={3}`. richColors 패턴은 시각 톤 검토.

## 1. 화면 목록·플로우

본 라운드는 인터랙션 패턴 변경 — 화면 자체 신규 0. 토스트 컴포넌트(sonner)가 인터랙션 표면.

- **checklist 페이지** (`/checklist/<slug>`): 사용자 추가 항목 행의 삭제 버튼 → 즉시 항목 사라짐 + 토스트 출현(상단 중앙).
- **timeline 페이지** (`/timeline`): 사용자 노트의 삭제 버튼 → 즉시 사라짐 + 토스트.
- **weight 페이지** (`/weight`): 일자별 로그 카드의 X 버튼 → 즉시 사라짐 + 토스트.
- **토스트 표면**: 상단 중앙(현행 `<Toaster position="top-center">`). 7초 카운트다운(sonner default 시각) + "되돌리기" 액션 버튼.

## 2. 컴포넌트

### 신규

- [src/lib/hooks/useDeleteWithUndo.ts](src/lib/hooks/useDeleteWithUndo.ts) — React 훅. UI 컴포넌트 0, 로직만.

### 재사용·확장

- [src/app/layout.tsx:62](src/app/layout.tsx#L62) `<Toaster>` — `visibleToasts={3}` props 추가. 기존 `position="top-center" richColors theme="light"` 유지.
- [src/components/checklist/ChecklistItemRow.tsx](src/components/checklist/ChecklistItemRow.tsx) — 삭제 액션 wiring 교체. 시각 토큰 변경 0.
- [src/components/timeline/WeekChecklistSection.tsx](src/components/timeline/WeekChecklistSection.tsx) — 삭제 액션 wiring 교체. DeleteConfirmDialog import·사용 제거.
- [src/components/weight/WeightContainer.tsx:93-100](src/components/weight/WeightContainer.tsx#L93-L100) — onClick wiring 교체. 호버 노출 정책 검토(아래 §5).

### 삭제

- [src/components/timeline/DeleteConfirmDialog.tsx](src/components/timeline/DeleteConfirmDialog.tsx) — 컴포넌트 자체 삭제. import 정리.

## 3. 상태별 시안

### default (삭제 직전)

- 삭제 버튼 시각 — 영역별 현행 유지:
  - checklist: 행 우측 호버/포커스 시 노출되는 삭제 아이콘(현행 유지).
  - timeline: 노트 카드 우측 삭제 아이콘(현행 유지).
  - weight: X 아이콘 + `bg-red-50 text-red-500` (호버 시에만 `opacity-0 group-hover:opacity-100`로 노출). **§5 인터랙션 검토 — 본 라운드 호버 노출 정책 변경 0.**

### 토스트 표시 (삭제 직후, 7초)

- sonner toast.action 시각 — 기본 sonner 톤 + richColors 패턴(현행 layout.tsx 정합):
  - 컨테이너: 상단 중앙, `rounded-xl` 또는 sonner default radius. 흰 배경 + 그림자 sonner default.
  - 아이콘: sonner default(success/info/warning 자동) — 본 라운드는 default(미설정) 또는 명시적 info 톤. richColors 활성 시 sonner가 의미 톤(success=green, error=red 등) 자동 적용.
  - 메시지 텍스트: 영역별 카피
    - checklist: "체크리스트 항목을 삭제했어요"
    - timeline: "타임라인 노트를 삭제했어요"
    - weight: "체중 기록을 삭제했어요"
  - 액션 버튼: 텍스트 "되돌리기" + sonner default action 톤 (작은 텍스트 버튼, 우측 정렬).
  - 카운트다운 시각 표시: sonner default(상단 또는 하단 progress bar).

### 토스트 dismiss / 만료 (7초 후)

- 토스트 fade out (sonner default).
- 항목 hard delete 확정 — 메모리 임시 보관 state cleanup.

### undo 클릭 시

- 즉시 토스트 dismiss.
- 항목 복원 — store에 다시 추가 (위치 보존: checklist는 `atIndex`, timeline은 동일, weight는 자동 정렬).
- 시각 피드백 0(별도 토스트 X) — 항목이 다시 등장하는 것 자체가 피드백.

### 다중 토스트 (3개 동시)

- `visibleToasts={3}` — 상단부터 3개 stack. 4번째 발사 시 가장 오래된 토스트 dismiss + 그 항목 hard delete.
- 각 토스트 독립 카운트다운 + 독립 undo 버튼.

## 4. 색·토큰 매핑

- 토스트 컨테이너·텍스트 톤: sonner default + richColors 패턴(현행 유지). DESIGN.md 5-pastel role 토큰 직접 매핑 없음 — sonner 라이브러리 default가 chrome 톤(white/foreground/muted) 사용으로 정합 OK.
- "되돌리기" 액션 버튼: sonner default action 색 — chrome 톤. 명시적 토큰 매핑 0(검증 1회 — 만약 어색하면 페이즈 8 cross-check 시 sonner config 갱신 검토).
- 영역별 삭제 버튼 시각 토큰 변경 0.

## 5. 인터랙션·동작

- **삭제 버튼 클릭** → `useDeleteWithUndo` 훅의 반환 함수 호출 → store remove 즉시 실행 → 토스트 발사 → 7초 또는 dismiss까지 대기.
- **"되돌리기" 클릭** → store add 호출 → 토스트 dismiss.
- **새로고침/탭 이동** → React state 소멸 → undo 불가. UX = "토스트 끝 = 영구".
- **연속 삭제** → 토스트 별개 발사, 각자 7초 카운트다운.

### weight 호버 노출 정책

- 현행 [WeightContainer.tsx:97](src/components/weight/WeightContainer.tsx#L97) `opacity-0 group-hover:opacity-100`.
- 본 라운드 호버 노출 정책 변경 0 — undo 패턴 도입과 호버 정책은 직교. 단, 모바일에서 호버 X 환경 = X 버튼 시각 노출 항상 → spec 검증 1회 (현재 mobile은 호버 = 터치이므로 첫 탭 시 노출, 두 번째 탭 시 삭제 가능 — 현행 동작 유지).

## 6. 접근성

- 토스트 ARIA — sonner default `role="status"` + `aria-live="polite"`. 스크린리더가 토스트 등장 음성 출력.
- "되돌리기" 액션 버튼 — sonner default `<button>` (시맨틱 정합).
- 카운트다운 시각만 표시되면 스크린리더 사용자가 7초 끝남을 인지 못 함 — 단점. sonner default 동작 그대로 양보 (페어 1 결정 시점 인지 — 향후 `aria-live="assertive"` 또는 명시적 카운트다운 음성 검토는 별도 라운드).
- 삭제 버튼 자체의 `aria-label` 영역별 명확성 검증 1회 — checklist/timeline/weight 각각 `aria-label="삭제"` 또는 `aria-label="<항목명> 삭제"` 정합.
- N7 사용자 데이터 무결성 정합 — undo 패턴이 N7 "위험 액션 undo 또는 confirm 필수"의 undo 충족.

## 7. 모바일 정합

- 토스트 위치 = 상단 중앙(현행). 320px 폭에서 토스트 width = `calc(100% - 2rem)` sonner default — 검증 1회.
- 삭제 버튼 시각 — 모바일에서 호버 X 환경 = 첫 탭 시 행 활성, 두 번째 탭 시 삭제 (weight 현행). 본 라운드 변경 0.
- "되돌리기" 액션 버튼 터치 타겟 ≥ 40px — sonner default 검증 1회. 미달 시 sonner config 갱신.

## 8. 다른 영역 영향

- AlertDialog 호출부 제거 — checklist·timeline. 영역별 시각 마감(여백 등) 페이지 빌드 후 시각 검증 1회.
- DeleteConfirmDialog 파일 삭제 — import 정리: timeline WeekChecklistSection 외 사용처 없음 (grep 검증 — 본 라운드 spec M3에서 의무).
- 묶음 J(ShareButton 위치)·묶음 N(체중 차트 색)와 독립.

## 9. won't (이번 범위 밖)

- 토스트 시각 디자인 커스터마이즈(sonner config 깊은 변경) — sonner default + richColors 그대로.
- 카운트다운 음성 출력·assertive aria-live — 향후 별도 라운드 가능.
- 백엔드 백업·계정 동기화.
- AlertDialog 패턴 자체 폐기 — 정적 데이터 영역에서 향후 confirm 필요할 수 있음.
