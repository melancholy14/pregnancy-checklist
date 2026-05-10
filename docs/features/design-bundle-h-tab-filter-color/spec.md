# design-bundle-h-tab-filter-color 기획서 (간단판)

> 작성일: 2026-05-09  size: S
> 출처: [docs/plan/phase-4.5.md §2.9 Cross-2](../../plan/phase-4.5.md), §2.8.2 T-4, §2.8.3 I-7, §2.8.5 B-4

## 0. 사전 확정 결정 (사용자 입력, 2026-05-09)

- **Cross-2 (탭/필터 활성색 컨벤션)**: **`lavender/40` 통일** (pink=CTA 전용 헌법, role 정합).
- **범위**: phase-4.5.md 명시 3곳(I-7·T-4·B-4) + 코드 폭넓은 grep으로 발견한 같은 패턴 2곳(articles `TagFilter`, `videos VideosContainer`) **모두 포함**. 한 라운드에 일괄 정정.
- **phase-4.5.md 보강 메모**: §2.8.3 정보 영역에 articles 페이지 `TagFilter`가, videos 영역에 `VideosContainer` 필터 4곳이 누락되어 있음. 본 라운드에서 함께 정정하므로 phase-4.5.md 측 별도 갱신은 불필요.

## 1. 사용자 시나리오

홈을 제외한 5개 영역(timeline·info·articles·videos·baby-fair)의 탭·필터·도시 선택 활성 표시가 모두 `bg-pastel-lavender/40 ... border-pastel-lavender/30` 단일 컨벤션으로 통일된다. 사용자 관점에서 활성 상태는 더 이상 pink(=CTA)·mint(=success)와 시각적으로 섞이지 않고, "이건 내가 선택한 항목이다"라는 secondary surface 의미가 일관된다. 기능·동작·이벤트는 변화 없다.

## 2. 기능 요구사항

### must — 12곳 클래스 변경

> 모든 변경은 동일 패턴: `bg-pastel-{pink|mint}/40 ... border-pastel-{pink|mint}/30` → `bg-pastel-lavender/40 ... border-pastel-lavender/30`. 텍스트 색은 기존대로 `text-foreground`(또는 active 컴포넌트가 사용하던 토큰) 유지. info 탭 컨테이너 라인은 `text-foreground`도 그대로 둔다(태그 필터의 `text-accent-purple`은 이미 lavender 컨벤션이라 변경 없음).

#### phase-4.5.md 명시 (6곳)

| ID | 파일·라인 | 변경 |
|---|---|---|
| I-7 | [src/components/info/InfoContainer.tsx:145](../../../src/components/info/InfoContainer.tsx#L145) | `bg-pastel-pink/40 text-foreground border-pastel-pink/30` → `bg-pastel-lavender/40 text-foreground border-pastel-lavender/30` |
| T-4 | [src/components/timeline/CategoryFilter.tsx:25](../../../src/components/timeline/CategoryFilter.tsx#L25) | 동일 패턴 변경 |
| B-4 (도시) | [src/components/babyfair/BabyfairContainer.tsx:108](../../../src/components/babyfair/BabyfairContainer.tsx#L108) | `bg-pastel-mint/40 border-pastel-mint/30 text-foreground` → `bg-pastel-lavender/40 border-pastel-lavender/30 text-foreground` |
| B-4 (탭1) | [src/components/babyfair/BabyfairContainer.tsx:137](../../../src/components/babyfair/BabyfairContainer.tsx#L137) | `data-[state=active]:bg-pastel-mint/40 ... data-[state=active]:border-pastel-mint/30` → `data-[state=active]:bg-pastel-lavender/40 ... data-[state=active]:border-pastel-lavender/30` |
| B-4 (탭2) | [src/components/babyfair/BabyfairContainer.tsx:143](../../../src/components/babyfair/BabyfairContainer.tsx#L143) | 동일 패턴 변경 |
| B-4 (탭3) | [src/components/babyfair/BabyfairContainer.tsx:149](../../../src/components/babyfair/BabyfairContainer.tsx#L149) | 동일 패턴 변경 |

#### 같은 패턴 추가 발견 (6곳)

| 위치 | 파일·라인 | 변경 |
|---|---|---|
| articles 태그 필터 (전체) | [src/components/articles/TagFilter.tsx:35](../../../src/components/articles/TagFilter.tsx#L35) | `bg-pastel-pink/40 text-foreground border-pastel-pink/30` → `bg-pastel-lavender/40 text-foreground border-pastel-lavender/30` |
| articles 태그 필터 (개별 태그) | [src/components/articles/TagFilter.tsx:48](../../../src/components/articles/TagFilter.tsx#L48) | 동일 패턴 변경 |
| videos 필터 1 | [src/components/videos/VideosContainer.tsx:139](../../../src/components/videos/VideosContainer.tsx#L139) | 동일 패턴 변경 |
| videos 필터 2 | [src/components/videos/VideosContainer.tsx:150](../../../src/components/videos/VideosContainer.tsx#L150) | 동일 패턴 변경 |
| videos 필터 3 | [src/components/videos/VideosContainer.tsx:165](../../../src/components/videos/VideosContainer.tsx#L165) | 동일 패턴 변경 |
| videos 필터 4 | [src/components/videos/VideosContainer.tsx:178](../../../src/components/videos/VideosContainer.tsx#L178) | 동일 패턴 변경 |

### won't (이 라운드에서 안 건드림 — 같은 파일이지만 다른 패턴)

- **`InfoContainer.tsx` L110·L118 `ring-pastel-pink` 해시 하이라이트**: 일시 강조 ring(2초 후 제거). 활성색 아님 — 별도 검토 대상이지만 본 묶음 H의 "탭/필터 활성색" 정의에 해당 안 함.
- **`BabyfairContainer.tsx` L88 `focus:ring-pastel-mint/50`**: 검색 input의 focus ring. 활성색 아니라 키보드 포커스 표시. WCAG focus-visible 정합 별도 검토.
- **`BottomNav.tsx` L63 `bg-pastel-pink/40`**: DESIGN.md L67 "Pink — Primary CTA — active state in `BottomNav`" 명시 정합. 위반 아님.
- **`ChecklistHub.tsx` L126·L138 `bg-pastel-pink/40`**: "37주차" 핀·핀 아이콘 — phase-4.5.md M6 묶음 F 범위.
- **`AllDoneBadge.tsx` L7 `bg-pastel-mint/40`**: 완료 표시. mint=success role 정합. 위반 아님.
- **`BabyfairContainer.tsx` L201·L206·L210·L214 pastel 도트·그라디언트**: 참관 팁 카드의 장식. 활성색 아님.
- **GA4 이벤트 변경 없음**: `category_tab_switch` 등 기존 이벤트 동일 발사.

## 3. 성공 기준

- `grep -rnE "bg-pastel-(pink|mint)/40[^/]" src/components/{info,timeline,babyfair,articles,videos}/` 결과가 본 spec must 표에 적힌 12곳을 한 건도 남기지 않음(전부 `bg-pastel-lavender/40`로 치환됨). `BottomNav`·`ChecklistHub`·`AllDoneBadge` 등 won't 항목은 그대로 유지.
- 5개 영역(timeline·info·articles·videos·baby-fair) 수동 확인 — 활성 탭·필터·도시가 모두 동일한 lavender hue로 표시되고, pink=CTA 토큰은 BottomNav active와 page-level CTA 버튼 외에는 데이터 라벨/필터 활성에 등장하지 않음.
- 기존 E2E 통과(회귀 0건). 활성 상태 토글 후 GA4 이벤트(`category_tab_switch` 등) 정상 발사 확인.
