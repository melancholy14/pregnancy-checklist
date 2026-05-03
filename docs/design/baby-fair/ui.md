# UI 스펙 — 베이비페어

> 대상 영역: 베이비페어 (`/baby-fair`)
> 페르소나/원칙: [../persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)

---

## 1. 적용 범위

BabyfairContainer, BabyfairCard. shadcn AlertDialog 패턴 사용.

---

## 2. 페이지 셸

```tsx
<div className="min-h-screen pb-24 px-4 bg-background">
  <h1 className="mb-2 text-center">베이비페어 일정</h1>
  <PageDescription>...</PageDescription>
  {/* 필터 */}
  {/* 탭 */}
  {/* 패널 */}
  {/* 참관 팁 카드 */}
</div>
```

OK — 단색 배경 사용, 그라디언트 위반 없음.

---

## 3. 토큰 매핑 (영역별 적용)

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 페이지 캔버스 | `--background` | — | — | OK |
| 연도 select | shadcn select 기본 | `rounded-xl` | — | OK |
| 도시 필터 활성 | `bg-pastel-mint/40 text-foreground border-pastel-mint/30` | `rounded-lg` | — | mint 사용 — 검토 (lavender가 secondary 표준) |
| 도시 필터 비활성 | `bg-white text-muted-foreground border-black/4` | `rounded-lg` | — | OK |
| 탭 활성 | `bg-pastel-mint/40 text-foreground border-pastel-mint/30` | `rounded-xl` | — | mint=success 역할 — 정보 탭은 pink 사용. **시스템 컨벤션 미합의** §10 |
| 탭 비활성 | `bg-white text-muted-foreground border-black/4` | `rounded-xl` | — | OK |
| 카드 (BabyfairCard) | `--card + border-black/4` | `rounded-2xl` | `shadow-sm hover:shadow-lg hover:-translate-y-0.5` | hover lift |
| 규모 배지 large | `bg-pastel-pink/40` | `rounded-md` | — | pink가 데이터 라벨 — 검토 |
| 규모 배지 medium | `bg-pastel-yellow/40` | `rounded-md` | — | yellow=info ✓ |
| 규모 배지 small | `#E0F0FF` (토큰 외 파랑) | `rounded-md` | — | **위반** §10 |
| 도시 배지 | `bg-pastel-{pink|lavender|mint|peach|yellow}/40` | `rounded-md` | — | 5-pastel 내 ✓ |
| D-day 배지 | `bg-pastel-mint text-accent-green` | `rounded-md` | — | mint=success ✓ |
| 팁 박스 (카드 내) | `bg-pastel-yellow/20` | `rounded-lg` | — | yellow=info ✓ |
| 카드 푸터 | `border-t border-black/4` | — | — | OK |
| AlertDialog 컨테이너 | shadcn 기본 | `rounded-2xl` | — | OK |
| Dialog 오버레이 | `bg-black/50` | — | — | OK |
| Dialog 취소 | shadcn outline 기본 | `rounded-xl text-sm` | — | OK |
| Dialog 이동 | `bg-accent-purple hover:bg-accent-purple/90 text-white` | `rounded-xl text-sm` | — | DESIGN.md 7.1 dialog action ✓ |
| 참관 팁 카드 | `bg-linear-to-r from-pastel-pink/40 to-pastel-lavender/40` | `rounded-2xl` | `shadow-md` | **shadow 위반** (정보 카드는 `shadow-sm`) §10 |
| 팁 불릿 점 | `bg-pastel-{pink|lavender|mint|peach|yellow}` (5색 순환) | `rounded-full` | — | 5-pastel 균형 사용 OK |

---

## 4. 컴포넌트 인벤토리

### 4.1 [BabyfairContainer](../../../src/components/babyfair/BabyfairContainer.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 페이지 wrapper | `min-h-screen pb-24 px-4` | OK |
| Empty state | `📋` + `text-muted-foreground py-12 text-center` | OK |
| 연도 select | `<select>` + `rounded-xl bg-white border-black/4` | OK |
| 도시 필터 컨테이너 | `flex flex-wrap gap-2 max-h-[5.5rem] → max-h-[500px]` (펼침/접기) | 트랜지션 OK |
| 도시 필터 버튼 | `rounded-lg px-3 py-1.5 text-xs` + 활성/비활성 | mint 활성 검토 |
| 탭 그룹 | `flex justify-center gap-2 mb-6` | role="tablist" |
| 탭 버튼 | `rounded-xl px-4 py-2 text-sm` + 활성/비활성 (mint) | role="tab" |
| 탭 카운트 배지 | inline `text-xs` + 카운트 | ongoing 탭만 |
| 카드 그리드 | `grid grid-cols-1 md:grid-cols-2 gap-4` | 모바일 1열 / 데스크톱 2열 |
| 참관 팁 카드 | `rounded-2xl shadow-md border-black/4 bg-linear-to-r from-pastel-pink/40 to-pastel-lavender/40` | **shadow 위반** |

### 4.2 [BabyfairCard](../../../src/components/babyfair/BabyfairCard.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 (role="button") | `rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 border-black/4 group cursor-pointer` | OK ✓ |
| 카드 키보드 핸들러 | `tabIndex={0}` + onKeyDown(Enter/Space) | OK ✓ |
| 배지 영역 | `flex items-center gap-1.5 mb-3` | |
| 규모 배지 | `style={{ backgroundColor: SCALE_CONFIG.color }}` 인라인 | small 색이 토큰 외 |
| 도시 배지 | `style={{ backgroundColor: CITY_COLORS[city] + "40" }}` 인라인 | 토큰 hex이지만 인라인 — 토큰 클래스로 |
| D-day 배지 | `bg-pastel-mint text-accent-green rounded-md text-xs px-2 py-1 border-0` | OK |
| 이벤트명 | `<h3 className="mb-3 group-hover:text-muted-foreground">` | hover 시 색 변경 — 의도된 미세 모션 |
| 날짜 행 | `<Calendar size={15} />` + `text-sm` | OK |
| 장소 행 | `<MapPin size={15} />` + `text-sm` | OK |
| 부가 정보 (시간/입장료/주차) | 이모지 + `text-sm text-muted-foreground` | 조건부 |
| 하이라이트 | bullet 점 + `text-xs text-muted-foreground` | 최대 3개 |
| 팁 박스 | `mt-3 p-3 rounded-lg bg-pastel-yellow/20 text-xs text-muted-foreground` | OK |
| 푸터 | `mt-4 pt-4 border-t border-black/4 text-xs text-muted-foreground` | OK |

### 4.3 AlertDialog (BabyfairCard 내)

| 요소 | 토큰 | 비고 |
|------|------|------|
| Content | shadcn 기본 + `rounded-2xl` | OK |
| Title | `text-base` | DESIGN.md 권장 위계와 일치 검토 |
| Description | `text-sm text-muted-foreground` | OK |
| Cancel | shadcn outline + `rounded-xl text-sm` | OK |
| Action (이동) | `bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl text-sm` | DESIGN.md 7.1 dialog primary ✓ |

---

## 5. 위계 (Typography)

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | "베이비페어 일정" |
| Sub-section | `<h3>` | `text-lg/600` | 카드 이벤트명 (현재 글로벌 사용) |
| Card title | `<h4>` | `text-base/600` | 참관 팁 카드 헤더(있다면) |
| Body | text-sm / text-base | 0.875~1rem | 본문 |
| Caption | text-xs | 0.75rem | 메타·푸터 |

베이비페어는 **인라인 size override 위반 없음** ✓

---

## 6. 라디우스 / 섀도우 / 보더

- **카드**: `rounded-2xl` ✓ (BabyfairCard, AlertDialogContent, 참관 팁)
- **버튼**: `rounded-xl` (탭) / `rounded-lg` (도시 필터)
- **배지**: `rounded-md` (5-pastel 내)
- **whisper border**: `border-black/4` ✓
- **참관 팁 shadow-md**: 정보 카드 위반 — `shadow-sm` 권장

---

## 7. 아이콘

- **lucide-react**: Calendar(날짜), MapPin(장소). 사이즈 15.
- **이모지 시그니처**: 🕐(운영시간), 🎟️(입장료), 🅿️(주차), 💬(팁), 📋(빈 상태).
- 카드 내 모든 메타 정보가 시각 구분되도록 아이콘+텍스트 일관 적용.

---

## 8. 모션

- **카드 hover lift**: `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`. 통일성 있음.
- **카드 hover 시 이벤트명 색 변경**: `group-hover:text-muted-foreground` — 미세하지만 클릭 가능함을 시사.
- **도시 필터 펼침/접기**: max-height transition.
- **AlertDialog**: shadcn 기본 (fade + scale).

---

## 9. 반응형

- **320px**: 카드 1열. 메타 행이 줄바꿈 안 되도록 truncate 검증.
- **375px / 414px**: 단일 컬럼.
- **md (≥768px)**: 카드 2열 그리드.
- **참관 팁 그라디언트**: 모바일에서도 가독성 유지.

---

## 10. 알려진 UI 위반

| ID | 위반 | 위치 | 대응 |
|----|------|------|------|
| B-1 | 규모 "소형" 배지 색 `#E0F0FF` (토큰 외 파랑) | [BabyfairCard.tsx:26](../../../src/components/babyfair/BabyfairCard.tsx) `SCALE_CONFIG` | 5-pastel 내로 (예: lavender 또는 muted) |
| B-2 | 참관 팁 카드 `shadow-md` (정보 카드) | [BabyfairContainer.tsx:201](../../../src/components/babyfair/BabyfairContainer.tsx) | `shadow-sm` |
| B-3 | 도시·규모 배지 인라인 hex `style={{ backgroundColor }}` | [BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) | Tailwind 토큰 클래스로 (`bg-pastel-pink/40` 등) |
| B-4 | 탭 활성 색 `bg-pastel-mint/40` (다른 영역은 pink/40) | [BabyfairContainer.tsx](../../../src/components/babyfair/BabyfairContainer.tsx) | 시스템 차원 결정 — 정보 탭(pink), 베이비페어 탭(mint), 카테고리 필터(pink) 통일 정책 필요 |
| B-5 | window.open 시 `rel="noopener noreferrer"` 미명시 | [BabyfairCard.tsx:74](../../../src/components/babyfair/BabyfairCard.tsx) | window.open은 `rel` 적용 불가 → `<a target="_blank" rel="noopener noreferrer">`로 패턴 변경 검토 |
| B-6 | `official_url` 없는 카드의 시각 구분 부재 | [BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) | 비활성 시각(회색조·cursor-default) 추가 |

> 위반 빈도 낮음. AlertDialog 패턴은 모범적.

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. SCALE_CONFIG / CITY_COLORS 변경 (§3, §10 B-1·B-3)
2. 탭/필터 활성색 시스템 합의 (§10 B-4)
3. 외부 링크 보안 패턴 변경 (§10 B-5)
4. AlertDialog 콘텐츠/카피 변경 (§4.3)
5. 결정 대기 항목 해소 시 → §10 행 제거

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
