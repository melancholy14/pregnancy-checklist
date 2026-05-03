# UI 스펙 — 정보 (블로그 + 영상 + 아티클 상세)

> 대상 영역: `/info`, `/articles/[slug]`, `/guides/*`(redirect)
> 페르소나/원칙: [../persona.md](../persona.md)
> 사용자 흐름·상태 모델: [ux.md](ux.md)
> 디자인 시스템 헌법: [DESIGN.md](../../../DESIGN.md)
> `.article-prose` 룰 정의: [globals.css](../../../src/app/globals.css) (L163-379)

---

## 1. 적용 범위

InfoContainer / InfoCard, ArticleCard / ArticleDetail / RelatedArticles / RelatedContent / TimelineCTA / MedicalDisclaimer, VideoCard / VideoCardCompact / ChannelCard, SearchModal. 본문 prose는 직접 룰 갱신 — 본 문서는 *어디에 적용되는지*만 명시.

---

## 2. 페이지 셸

### 2.1 정보 탭

```tsx
<div className="min-h-screen pb-24 px-4">
  <h1 className="mb-2 text-center"><span>📚</span> 정보</h1>
  <PageDescription>...</PageDescription>
  <Suspense><InfoContainer /></Suspense>
</div>
```

### 2.2 아티클 상세

```tsx
<div className="min-h-screen pb-24 px-4">
  <article>
    <Link>← 목록으로</Link>
    <h1>...</h1>
    ...
    <div className="article-prose" dangerouslySetInnerHTML={...} />
    ...
  </article>
</div>
```

---

## 3. 토큰 매핑 (영역별 적용)

### 3.1 정보 탭

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 탭 활성 | `bg-pastel-pink/40 text-foreground border-pastel-pink/30` | `rounded-xl` | — | **pink가 탭 라벨에 사용** — 일반적으로 OK(전체-탭은 진입 후 핵심 toggle), 단 카테고리 필터와 컨벤션 일관성 점검 |
| 탭 비활성 | `bg-white text-muted-foreground border-black/4` | `rounded-xl` | — | OK |
| 태그 필터 활성 | `bg-pastel-lavender/40 text-accent-purple border-pastel-lavender/30` | `rounded-lg` | — | lavender=secondary ✓ |
| 태그 필터 비활성 | `bg-white text-muted-foreground border-black/4` | `rounded-lg` | — | OK |
| 빈 상태 | 텍스트 only | — | — | 📭 + 안내 |
| Hash 강조 ring | `ring-2 ring-pastel-pink` (2초) | — | — | 시각 피드백 |

### 3.2 아티클 상세

| 영역 | 컬러 토큰 | Radius | Shadow | 비고 |
|------|----------|--------|--------|------|
| 백 링크 | `text-muted-foreground hover:text-foreground` | — | — | + `<ArrowLeft>` |
| h1 / 설명 / 메타 | 글로벌 위계 | — | — | 인라인 size override 없음 ✓ |
| 태그 배지 | `bg-pastel-lavender/30 text-accent-purple text-[11px] rounded-lg border-0` | — | — | DESIGN.md 7.3 표준 |
| Divider | `bg-gradient-to-r from-transparent via-[#F0EBE6] to-transparent` | — | — | **인라인 hex 위반** — `var(--prose-divider)` 또는 토큰화 |
| AuthorNote | `bg-pastel-yellow/20 + border-pastel-yellow/40` | `rounded-xl` | — | yellow=info ✓ + accent-olive 텍스트 |
| MedicalDisclaimer | `bg-pastel-mint/20 + border-pastel-mint/40` | `rounded-xl` | — | mint=success/안전 + accent-green 텍스트 |
| `.article-prose` 본문 | globals.css 정의 (`--prose-*`) | — | — | 직접 오버라이드 금지 |
| TimelineCTA | `bg-pastel-lavender/10 + border-pastel-lavender/40` | `rounded-2xl` | — | secondary surface |
| TimelineCTA 아이콘 박스 | `bg-pastel-lavender` | `rounded-xl` | — | OK |
| RelatedContent 카드 | `--card + border-black/4` | `rounded-2xl` | `shadow-sm` | 정보 카드 표준 |
| RelatedArticles | 섹션 + ArticleCard 재사용 | `rounded-2xl` | `shadow-sm` | OK |

### 3.3 아티클 카드 (목록용)

| 영역 | 토큰 | 비고 |
|------|------|------|
| 카드 | `rounded-2xl shadow-sm hover:shadow-lg border-black/4 hover:-translate-y-0.5` | hover lift |
| 제목 | `<h3 className="text-[15px] leading-snug">` | size override — 검토 |
| 설명 | `text-sm text-muted-foreground line-clamp-2` | OK |
| 태그 | `bg-pastel-lavender/30 text-accent-purple text-xs rounded-lg border-0` | OK |
| 메타 | `text-xs text-muted-foreground` | OK |

### 3.4 비디오 카드

| 영역 | 토큰 | 비고 |
|------|------|------|
| **VideoCardCompact** 카드 | `rounded-2xl shadow-sm hover:shadow-md border-black/4 p-3` | OK |
| VideoCardCompact 썸네일 | `w-28 aspect-video rounded-xl overflow-hidden bg-muted` | OK |
| VideoCardCompact 플레이 버튼 | `w-7 h-7 rounded-full bg-white/85 shadow-sm` | OK |
| **VideoCard** 카드 | `rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border-black/4 hover:-translate-y-0.5` | hover 동작 Compact와 불일치 |
| VideoCard 플레이 버튼 | `w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg` | **backdrop-blur 위반** — DESIGN.md 6.3에서 BottomNav 전용 |

### 3.5 채널 카드 / 검색

| 영역 | 토큰 | 비고 |
|------|------|------|
| ChannelCard | `rounded-2xl shadow-sm hover:shadow-lg border-black/4` | OK |
| ChannelCard 이미지 | `w-14 h-14 rounded-full` | OK |
| SearchModal | shadcn Dialog 기본 | OK |
| 검색 결과 활성 | `bg-accent text-accent-foreground` | OK |

---

## 4. 컴포넌트 인벤토리

### 4.1 [InfoContainer](../../../src/components/info/InfoContainer.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 탭 컨테이너 | `flex justify-center gap-2 mb-6` | role="tablist" |
| 태그 필터 컨테이너 | `flex flex-wrap justify-center gap-2 mb-6` | |
| 패널 | `space-y-3` | role="tabpanel" |

### 4.2 [ArticleCard](../../../src/components/articles/ArticleCard.tsx)

→ §3.3 표 참조. `text-[15px]` 제목 size override 검토.

### 4.3 [ArticleDetail](../../../src/components/articles/ArticleDetail.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 페이지 wrapper | `min-h-screen pb-24 px-4` | OK |
| 백 링크 | `text-sm text-muted-foreground hover:text-foreground` | OK |
| h1 | `text-xl mb-2` | DESIGN.md h1=text-2xl/700인데 상세 페이지에서 `text-xl` 사용 — 의도된 작은 변형이라면 명시 필요 |
| Divider | `h-px bg-gradient-to-r from-transparent via-[#F0EBE6] to-transparent` | **인라인 hex 위반** |
| AuthorNote | `bg-pastel-yellow/20 border-pastel-yellow/40 rounded-xl px-4 py-3.5 mb-8` | OK |
| MedicalDisclaimer | `bg-pastel-mint/20 border-pastel-mint/40 rounded-xl px-4 py-3.5 mb-8` | OK |
| ShareButton 위치 | `flex justify-end mb-6` (상단) + `flex justify-center mt-10` (하단) | 위치 정책 결정 필요 (UX §10) |

### 4.4 [RelatedContent](../../../src/components/articles/RelatedContent.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 카드 | `mt-6 rounded-2xl shadow-sm border-black/4` | OK |
| 섹션 헤더 | `text-xs text-muted-foreground font-medium` + lucide 아이콘 | OK |
| 링크 | `text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg` | OK |
| **화살표** | "→" 텍스트 | **위반** — `<ChevronRight aria-hidden>` |

### 4.5 [TimelineCTA](../../../src/components/articles/TimelineCTA.tsx)

| 요소 | 토큰 | 비고 |
|------|------|------|
| 박스 | `mt-10 rounded-2xl border-pastel-lavender/40 bg-pastel-lavender/10 p-5` | OK |
| 아이콘 박스 | `w-9 h-9 rounded-xl bg-pastel-lavender` | OK |
| 링크 화살표 | "→" 텍스트 | **위반** — 아이콘 |

### 4.6 [VideoCard](../../../src/components/videos/VideoCard.tsx) / [VideoCardCompact](../../../src/components/videos/VideoCardCompact.tsx)

→ §3.4 표 참조. backdrop-blur·hover 동작 불일치 검토.

### 4.7 [SearchModal](../../../src/components/search/SearchModal.tsx)

기본 shadcn Dialog 패턴 + 키보드 nav 구현. 위반 없음.

---

## 5. 위계 (Typography)

| 위계 | 시맨틱 | 시각 (글로벌) | 어디 |
|------|--------|---------------|------|
| Display | `<h1>` | `text-2xl/700` | 정보 탭 페이지 제목 |
| ArticleDetail h1 | `<h1>` | `text-xl mb-2` (현재) | DESIGN.md 글로벌과 다름 — 의도 명시 필요 |
| `.article-prose h2` | `<h2>` | `1.125rem/700` + bottom-border | prose 내부 |
| `.article-prose h3` | `<h3>` | `1rem/600` | prose 내부 |
| 섹션 헤더 | `<h2>` | `text-base font-semibold` | RelatedArticles "📰 관련 콘텐츠" |
| 카드 제목 | `<h3>` | `text-[15px] leading-snug` | ArticleCard, VideoCard — size override 검토 |
| 본문 | `<p>` | `text-base/400` | |
| Caption | `text-xs` | 0.75rem | 메타·날짜 |

---

## 6. 라디우스 / 섀도우 / 보더

- **카드**: `rounded-2xl` 일관 ✓
- **태그 칩**: `rounded-lg` (정보 탭) / `rounded-lg border-0` (아티클 상세 태그)
- **버튼/필터**: `rounded-xl`
- **shadow**: 정보 카드 `shadow-sm`, hover `shadow-md`. ArticleCard와 VideoCard hover는 `shadow-lg` (강조 OK).
- **whisper border**: `border-black/4` 일관 ✓
- **pastel 카드 보더**: yellow/40, mint/40, lavender/40 사용 — 각 surface와 통일 ✓

---

## 7. 아이콘

- lucide-react 단일.
- ArrowLeft(백링크), Calendar(타임라인 CTA), ListChecks·Play(섹션 헤더), ChevronRight(권장 — 현재 텍스트 "→").
- 사이즈: 메타 13, 본문 동반 14~16, 카드 헤더 18.
- **이모지 시그니처**: 📚(정보 탭 h1), 📰(관련 콘텐츠), 💬(만든이 한마디), ℹ️(안내).

---

## 8. 모션

- **카드 hover lift**: ArticleCard·VideoCard·ChannelCard `hover:-translate-y-0.5 transition-all duration-300` (Compact는 lift 없음 — 통일 검토).
- **이미지 zoom**: VideoCard `group-hover:scale-105 duration-500`.
- **Hash 강조 ring**: 2초 후 자동 제거.
- **`.article-prose` 본문**: 모션 없음.

---

## 9. 반응형

- **320px**: 탭/필터 그룹이 한 줄 못 들어가면 자연스럽게 wrap. ArticleCard 패딩 줄이지 않음(`p-4` 유지).
- **VideoCardCompact**: 썸네일 `w-28` 고정. 타이틀 영역이 어떻게 줄어드는지 점검.
- **VideoCard**: `aspect-video` 풀 너비. 모바일 일관.
- **ArticleDetail prose**: globals.css에서 max-width·line-height·letter-spacing 통제. 컨테이너 폭은 `px-4`.

---

## 10. 알려진 UI 위반

| ID | 위반 | 위치 | 대응 |
|----|------|------|------|
| I-1 | "→" 텍스트 화살표 | [RelatedContent.tsx:33,55](../../../src/components/articles/RelatedContent.tsx), [TimelineCTA.tsx:32](../../../src/components/articles/TimelineCTA.tsx) | `<ChevronRight aria-hidden>` |
| I-2 | Divider 인라인 hex `via-[#F0EBE6]` | [ArticleDetail.tsx:68](../../../src/components/articles/ArticleDetail.tsx) | `--prose-divider` 토큰 사용 (이미 존재) |
| I-3 | VideoCard `backdrop-blur-sm` | [VideoCard.tsx](../../../src/components/videos/VideoCard.tsx) | DESIGN.md 6.3 — BottomNav 전용. 제거 또는 단순 white opacity |
| I-4 | VideoCard vs VideoCardCompact hover 동작 불일치 | videos/VideoCard\*.tsx | 한쪽으로 통일 결정 |
| I-5 | ArticleCard 제목 `text-[15px]` | [ArticleCard.tsx:14](../../../src/components/articles/ArticleCard.tsx) | `<h3>` 글로벌 위계 사용 또는 의도 명시 |
| I-6 | ArticleDetail h1 `text-xl` (글로벌은 text-2xl) | [ArticleDetail.tsx](../../../src/components/articles/ArticleDetail.tsx) | DESIGN.md 명시 또는 글로벌과 정렬 |
| I-7 | 정보 탭 활성 색이 pink (CTA 토큰) | [InfoContainer.tsx](../../../src/components/info/InfoContainer.tsx) | 결정 — 컨벤션화하려면 DESIGN.md에 "탭 활성 = pink/40" 명시 |

> 위반 빈도 낮은 영역. 체크리스트·타임라인보다 시스템 정합성 양호.

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 탭/필터 시각 변경 (§3.1, §4.1)
2. 아티클 상세 layout 변경 (§3.2, §4.3)
3. 비디오 카드 변형 추가/통일 (§3.4, §10 I-4)
4. `.article-prose` 룰 변경 시 → DESIGN.md 7.6 + globals.css 직접. 이 문서는 *적용 위치*만.
5. 알려진 위반 해소 시 → §10 행 제거

UX 흐름·상태·접근성은 [ux.md](ux.md)에서 관리.
