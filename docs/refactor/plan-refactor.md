# Phase 1 리팩토링

## 리팩토링한 파일 목록

- `src/components/checklist/ChecklistItem.tsx`
- `src/components/checklist/ChecklistContainer.tsx`
- `src/components/timeline/TimelineContainer.tsx`
- `src/components/babyfair/BabyfairContainer.tsx`
- `src/components/checklist/ChecklistAddForm.tsx`

---

## 작업별 내용

### 1. ChecklistItem.tsx — 동적 Tailwind hover 클래스 → 정적 className 맵

- **출처**: Warning 항목
- **무엇을**: `PRIORITY_STYLES`를 `{ bg, text }` 분리 구조에서 `{ className }` 단일 문자열로 변경. `hover:${priority.bg}` 동적 조합을 제거하고 정적 클래스(`hover:bg-[#FFD4DE]/60`)를 직접 포함.
- **왜**: Tailwind은 빌드 시 정적 분석으로 CSS를 생성하므로, 동적으로 조합된 클래스명은 CSS에 포함되지 않아 hover 효과가 미동작.

### 2. ChecklistContainer.tsx — 매 렌더 필터/진행률 → useMemo 캐시

- **출처**: Warning 항목
- **무엇을**: `getItemsByCategory()`, `getTotalProgress()`, `getCategoryProgress()` 일반 함수를 `itemsByCategory`, `progress`, `categoryProgress` useMemo로 교체. 의존성: `allItems`, `checkedIds`.
- **왜**: 123+ 항목을 5개 카테고리 × 매 렌더마다 filter하는 것은 불필요한 연산. useMemo로 allItems/checkedIds가 변할 때만 재계산.

### 3. TimelineContainer.tsx — 다수 current ref → 첫 번째만 ref 부여

- **출처**: Warning 항목
- **무엇을**: `allItems.map()` 내부에 `firstCurrentAssigned` 플래그를 추가하여 첫 번째 current 항목에만 `currentRef`를 할당.
- **왜**: `currentWeek ± 1` 범위에 여러 항목이 해당될 수 있으며, 기존 코드는 마지막 current 항목에 ref가 덮어씌워져 스크롤 대상이 불확실. 첫 번째 항목이 스크롤 시작점으로 적절.

### 4. BabyfairContainer.tsx — today 매 렌더 재계산 → useState 초기화

- **출처**: Warning 항목
- **무엇을**: `const today = new Date().toISOString().split("T")[0]`을 `const [today] = useState(() => ...)`로 변경.
- **왜**: today가 `useMemo` 의존성에 포함되어 있어 매 렌더마다 새 문자열이 생성되면 필터가 불필요하게 재계산됨. useState 초기화 함수는 마운트 시 1회만 실행.

### 5. ChecklistAddForm.tsx — as 타입 단언 → 런타임 검증

- **출처**: Warning 항목
- **무엇을**: `activeCategory as ChecklistItem["category"]`를 `CATEGORY_OPTIONS.some(c => c.value === activeCategory)` 검증 후 통과하면 assertion, 아니면 `"hospital"` fallback으로 변경.
- **왜**: 타입 단언만으로는 런타임에 잘못된 값이 들어올 경우 방어 불가. 검증 + fallback이 안전.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 5개 | 5개 (동일) |
| ChecklistContainer 필터 방식 | 일반 함수 (매 렌더) | useMemo 캐시 |
| ChecklistItem hover | 동적 Tailwind (미동작) | 정적 className (동작) |
| Timeline 스크롤 대상 | 마지막 current | 첫 번째 current |
| Babyfair today 계산 | 매 렌더 | 마운트 1회 |
| ChecklistAddForm 타입 | 무검증 단언 | 검증 + fallback |

---

## 빌드 결과

성공 (1회)
