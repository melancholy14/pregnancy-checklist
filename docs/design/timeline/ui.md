# UI 스펙 — 타임라인

> 대상 영역: 타임라인 (`/timeline`)
> 페르소나/원칙: [../persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)

---

## 1. 적용 범위

타임라인 페이지 + 그 하위 컴포넌트(TimelineContainer, TimelineAccordionCard, WeekChecklistSection, CategoryFilter, UnifiedAddForm, RelatedChecklistsLink/RelatedArticlesLink/RelatedVideosLink, DeleteConfirmDialog).

---

## 2. 페이지 셸

```tsx
<div className="min-h-screen pb-24 px-4">  {/* 권장: bg-background 단색 추가 */}
  <DueDateBanner />
  <TimelineContainer />
</div>
```

**현재 위반**: `bg-linear-to-b from-background to-white` ([TimelineContainer.tsx:183](../../../src/components/timeline/TimelineContainer.tsx)). DESIGN.md "to-white 금지" — `bg-background` 단색으로 정정 필요. ([persona §5 AP2](../persona.md))

---

## 3. 토큰 매핑 (영역별 적용)

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 페이지 캔버스 | `--background` | — | — | 그라디언트 to-white 금지 |
| 현재 주차 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-md` | 정보 카드 — `shadow-sm` 권장 (위반 §10) |
| 진행률 카드 | `--card` + `border-black/4` | `rounded-2xl` | `shadow-md` | 정보 카드 — 위반 §10 |
| 첫 체크 배너 | `bg-pastel-mint/20 + border-pastel-mint/40` | `rounded-2xl` | `shadow-md` | mint=success ✓ / shadow 위반 |
| 카테고리 필터 활성 | `bg-pastel-pink/40 text-foreground border-pastel-pink/30` | `rounded-xl` | — | **pink가 데이터 라벨 — 위반 §10** |
| 카테고리 필터 비활성 | `bg-white text-muted-foreground border-black/4` | `rounded-xl` | — | OK |
| 행정 주의사항 패널 | `bg-pastel-yellow/40 + border-pastel-yellow/60` | `rounded-2xl` | — | yellow=info ✓ / 보더 weight 검토 |
| 주차 원형 배지 | `style={{ backgroundColor: type.color }}` | `rounded-2xl w-14 h-14` | `shadow-sm` | type.color에 토큰 외 색 포함(§10) |
| 주차 카드 (Accordion) | `--card` + `border-black/4` | `rounded-xl` (현재) → `rounded-2xl` 권장 | `shadow-sm hover:shadow-md` | radius 위반 §10 |
| Current 강조 ring | `ring-2 ring-offset-2` (type.color) | — | — | OK |
| 체크된 행 | `bg-pastel-mint/20` + `line-through` | `rounded-xl` | — | OK |
| 체크박스 보더 | `border-gray-200` (현재) | — | — | **토큰 외 위반** §10 |
| 카테고리 배지 | inline `style={{ backgroundColor: catColor + "40" }}` + 인라인 `color: "#3D4447"` | `rounded` | — | hex 인라인 위반 §10 |
| 편집 모드 행 | `bg-pastel-lavender/10 + border-pastel-lavender/30` | `rounded-xl` | — | OK |
| FAB | `bg-pastel-lavender shadow-lg` | `rounded-2xl w-14 h-14` | — | secondary CTA |
| UnifiedAddForm 카드 | `bg-pastel-lavender/10 + border-pastel-lavender/30` | `rounded-2xl` | `shadow-md` | 인풋 보유 OK |
| 추가 폼 필수표시 | `text-red-400` (현재) | — | — | **토큰 외 위반** §10 |
| 최종 메시지 | `bg-linear-to-r from-pastel-pink/60 to-pastel-lavender/60` | `rounded-2xl` | — | hero 한정 그라디언트 OK |
| 세로 그라디언트 라인 | `bg-linear-to-b from-pastel-pink via-pastel-lavender to-pastel-yellow opacity-60` | — | — | 시각 시그니처 OK |
| 관련 콘텐츠 링크 | `text-accent-purple hover:bg-pastel-lavender/10` | `rounded-lg` | — | OK |
| 삭제 다이얼로그 트리거 | `hover:bg-red-50` (현재) | — | — | **토큰 외 위반** §10 |
| 삭제 confirm 버튼 | `bg-red-500` (현재) | — | — | **`bg-destructive`로 정정** §10 |

---

## 4. 컴포넌트 인벤토리

### 4.1 [TimelineContainer](../../../src/components/timeline/TimelineContainer.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 페이지 wrapper | `min-h-screen pb-24 px-4 bg-linear-to-b ... to-white` | **위반** — 단색으로 |
| h1 | 글로벌 `text-2xl/700` | OK |
| ShareButton 위치 | `flex justify-end mb-4` | 우상단 단독 — 검토 (체크리스트 동일 이슈) |
| 자동 스크롤 트리거 | useEffect + IntersectionObserver | hydration 후 1회 |

### 4.2 [TimelineAccordionCard](../../../src/components/timeline/TimelineAccordionCard.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 컨테이너 | `rounded-xl shadow-sm hover:shadow-md border border-black/4` | radius 위반 — `rounded-2xl` 권장 |
| 주차 원형 배지 | `w-14 h-14 rounded-2xl shadow-sm border-black/4` (위치 absolute) + `ring-4 ring-white` (current) | TIMELINE_TYPE_CONFIG.color에 `#E0F0FF` 토큰 외 (admin) |
| 헤더 영역 | `flex items-center justify-between p-4 cursor-pointer` | Collapsible trigger |
| 타입 배지 | `bg-pastel-*40 rounded border-0` | OK |
| "내 항목" 배지 | `bg-pastel-lavender/40 text-accent-purple` | OK |
| 제목 | `text-[15px] font-medium` | **인라인 size override 위반** — `<h3>` + 글로벌 위계 |
| 편집 입력 | `focus:ring-2 focus:ring-pastel-lavender/50` | OK |
| Collapsible 본문 | `border-t border-black/4` | divider OK |

### 4.3 [WeekChecklistSection](../../../src/components/timeline/WeekChecklistSection.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 행 컨테이너 | `rounded-xl p-3 hover:bg-muted/50` (체크 시 `bg-pastel-mint/20`) | 체크리스트와 동일 패턴 |
| Checkbox | `border-gray-200` + `data-[state=checked]:bg-pastel-mint` | **위반** — `border-black/4` |
| 카테고리 배지 | inline `style={{ backgroundColor: catColor + "40" }}` 인라인 hex | 위반 — 토큰 기반으로 |
| 진행률 바 | `<Progress h-1.5 bg-muted />` | OK |
| 편집 모드 카드 | `rounded-xl bg-pastel-lavender/10 border-pastel-lavender/30` | OK |

### 4.4 [CategoryFilter](../../../src/components/timeline/CategoryFilter.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 활성 버튼 | `bg-pastel-pink/40 text-foreground border-pastel-pink/30 rounded-xl` | **pink가 필터 라벨에 사용 — 위반** |
| 비활성 버튼 | `bg-white text-muted-foreground border-black/4 hover:bg-muted` | OK |

→ 권장: 활성을 `bg-pastel-lavender/40 text-accent-purple` 로 (정보 탭 필터와 통일).

### 4.5 [UnifiedAddForm](../../../src/components/timeline/UnifiedAddForm.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 폼 카드 | `rounded-2xl shadow-md border-pastel-lavender/30 bg-pastel-lavender/10` | OK |
| 헤더 | `<h3>` `text-[15px] font-medium` | size override 위반 |
| 라디오: checklist 모드 | `accent-pastel-pink` | 색 검토 |
| 라디오: timeline 모드 | `accent-pastel-lavender` | OK |
| 필수 표시 | `text-red-400` | **위반** — `text-destructive` |
| 추가 버튼 | `bg-pastel-lavender text-foreground` | secondary CTA OK |

### 4.6 Related*Link 컴포넌트 (3종 동일 패턴)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 섹션 헤더 | `text-xs text-muted-foreground` + lucide 아이콘 13px | OK |
| 링크 | `text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2` | OK |
| **화살표** | "→" 텍스트 | **위반** — `<ChevronRight aria-hidden>` |

### 4.7 [DeleteConfirmDialog](../../../src/components/timeline/DeleteConfirmDialog.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 트리거 hover | `hover:bg-red-50` | **위반** — `hover:bg-destructive/10` |
| Confirm 버튼 | `bg-red-500 hover:bg-red-600` | **위반** — `bg-destructive` |

---

## 5. 위계 (Typography)

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | 페이지 제목 |
| Sub-section | `<h3>` | `text-lg/600` | 진행률 카드 / 주차 카드 제목 (현재 size override 위반) |
| Card title | `<h4>` | `text-base/600` | UnifiedAddForm 헤더 |
| Body | `<p>` | `text-base/400` | 카드 설명 |
| Caption | `text-xs` | 0.75rem | 타입 배지·메타 |

타임라인은 체크리스트와 같은 인라인 size override 패턴을 공유. 일괄 정리 권장.

---

## 6. 라디우스 / 섀도우 / 보더

- **카드**: `rounded-2xl` 권장. 현재 주차 카드(rounded-xl) 위반 발견.
- **배지·칩**: `rounded` 또는 `rounded-md` (작은 라벨).
- **세로 라인**: 폭 1~2px, 그라디언트.
- **현재 주차 강조**: `ring-2 ring-offset-2` + `scale-110` + `shadow-md` 조합.

---

## 7. 아이콘

- **lucide-react** 단일.
- ChevronDown(펼침), ChevronUp(접힘), Calendar(날짜), Filter(필터), Plus(FAB), Pencil/Trash2(편집/삭제).
- 사이즈: 본문 13~14, 카드 헤더 16~18, FAB 24.
- **이모지 시그니처**: 📦(기타 섹션), 🎉(40주 도달).

---

## 8. 모션

- **Collapsible**: 본문 슬라이드(라이브러리 기본).
- **현재 주차 자동 스크롤**: smooth, 1회. 사용자 스크롤 후엔 발동 안 함.
- **체크 토글**: `transition-all duration-200`.
- **카드 hover**: `hover:shadow-md` (현재 주차는 이미 shadow-md → 더 강조 위해 hover lift 검토).
- **FAB hover**: `hover:bg-pastel-lavender/80 hover:shadow-xl`.

---

## 9. 반응형

- **320px**: 주차 원형 배지(w-14)와 카드 본문이 겹치지 않게 `pl-20` 좌측 오프셋. 좁은 화면에서 본문이 4줄 이상 꺾이지 않는지 검증.
- **375px / 414px**: 동일 패턴.
- **>1024px**: 가운데 자연 정렬. 카드 폭은 모바일 기준 유지.

---

## 10. 알려진 UI 위반

| ID | 위반 | 위치 | 대응 |
|----|------|------|------|
| T-1 | `bg-linear-to-b from-background to-white` | [TimelineContainer.tsx:183](../../../src/components/timeline/TimelineContainer.tsx) | `bg-background` 단색 |
| T-2 | TIMELINE_TYPE_CONFIG.admin = `#E0F0FF` (토큰 외 파랑) | timeline constants | 5-pastel 내 색으로 (lavender? peach?) |
| T-3 | `text-red-400` 필수 표시 | [UnifiedAddForm.tsx:139,170](../../../src/components/timeline/UnifiedAddForm.tsx) | `text-destructive` |
| T-4 | CategoryFilter 활성 `bg-pastel-pink/40` | [CategoryFilter.tsx](../../../src/components/timeline/CategoryFilter.tsx) | `bg-pastel-lavender/40 text-accent-purple` |
| T-5 | Checkbox `border-gray-200` | [WeekChecklistSection.tsx:148](../../../src/components/timeline/WeekChecklistSection.tsx) | `border-black/4` 또는 `border-input` |
| T-6 | 주차 카드 `rounded-xl` | [TimelineAccordionCard.tsx:82](../../../src/components/timeline/TimelineAccordionCard.tsx) | `rounded-2xl` |
| T-7 | 기타 섹션 카드 `rounded-xl` | [TimelineContainer.tsx:328](../../../src/components/timeline/TimelineContainer.tsx) | `rounded-2xl` |
| T-8 | "→" 텍스트 화살표 (Related*Link 3종) | timeline/Related\*Link.tsx | `<ChevronRight aria-hidden>` |
| T-9 | h2/h3 인라인 `text-[15px]` | TimelineAccordionCard, UnifiedAddForm | 글로벌 위계 사용 또는 시맨틱 변경 |
| T-10 | 정보 카드 `shadow-md` (현재 주차·진행률·첫 체크 배너) | TimelineContainer | `shadow-sm` |
| T-11 | 카테고리 배지 인라인 hex `color: "#3D4447"` | [WeekChecklistSection.tsx](../../../src/components/timeline/WeekChecklistSection.tsx) | `text-foreground` 클래스로 |
| T-12 | DeleteConfirmDialog `bg-red-500`, `hover:bg-red-50` | [DeleteConfirmDialog.tsx](../../../src/components/timeline/DeleteConfirmDialog.tsx) | `bg-destructive`, `hover:bg-destructive/10` |

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 카테고리 추가/삭제 (§3 토큰 매핑)
2. TIMELINE_TYPE_CONFIG 색 변경 시
3. 자동 스크롤 / 모션 정책 변경 (§8)
4. 알려진 위반 해소 시 → §10 행 제거

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
