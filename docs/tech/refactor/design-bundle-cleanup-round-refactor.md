# design-bundle-cleanup-round 리팩토링

> 작성일: 2026-05-10 · 출처: [docs/review/design-bundle-cleanup-round-review.md](../review/design-bundle-cleanup-round-review.md)

review.md Warning 2건(ChevronRight `aria-hidden` 누락)만 정리. Suggestion 3건은 모두 본 라운드 won't 명시 후속 영역(묶음 B/I, role="button" Card wrapper)이라 별도 라운드 트리거.

## 리팩토링한 파일 목록

- `src/components/checklist/ChecklistHub.tsx` (라인 71·132)
- `src/components/home/HomeContent.tsx` (라인 237)

총 2 파일, 3 위치.

---

## 작업별 내용

### 1. ChecklistHub 카드 우측 데코 ChevronRight `aria-hidden` 추가
- **출처**: review.md Warning 1
- **위치**: [src/components/checklist/ChecklistHub.tsx:71](../../../src/components/checklist/ChecklistHub.tsx#L71), [src/components/checklist/ChecklistHub.tsx:132](../../../src/components/checklist/ChecklistHub.tsx#L132)
- **무엇을**: `<ChevronRight size={18} className="text-muted-foreground shrink-0" />` → `<ChevronRight size={18} aria-hidden="true" className="text-muted-foreground shrink-0" />`
- **왜**: 라운드에서 신규 추가한 ChevronRight 11곳은 모두 `aria-hidden="true"` 일관 적용. 본 두 위치만 pre-existing 잔재라 컨벤션에서 어긋남. 데코 인디케이터를 스크린리더에서 잡음으로 읽지 않도록 차단.

### 2. HomeContent 첫 체크 배너 ChevronRight `aria-hidden` 추가
- **출처**: review.md Warning 2
- **위치**: [src/components/home/HomeContent.tsx:237](../../../src/components/home/HomeContent.tsx#L237)
- **무엇을**: `<ChevronRight size={16} className="text-muted-foreground" />` → `<ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />`
- **왜**: 위와 동일 결.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `src/components` 내 `<ChevronRight>` 사용처 | 13개 (3개에 `aria-hidden` 누락) | 13개 (1개만 누락 — DashboardCard.tsx:43, 라운드 SoT 외) |
| ChevronRight `aria-hidden` 누락률 (라운드 + review 영향 영역) | 3/13 | 0/13 |
| public interface | 변경 없음 | 변경 없음 |

DashboardCard.tsx:43은 라운드 영향 파일도 review.md 영향 파일도 아니라 가이드("Warning 2건만 정리")대로 본 단계 SoT 외로 두었음. 별도 cleanup 후속 트리거 후보.

---

## 빌드 결과

`npm run build` 성공 (1회 시도, Next.js 16.2.0 Turbopack, 32 페이지 정적 생성).
