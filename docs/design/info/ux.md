# UX 스펙 — 정보 (블로그 + 영상 + 가이드)

> 대상 영역:
> - 정보 탭 (`/info`) — 블로그 + 영상 통합 목록
> - 아티클 상세 (`/articles/[slug]`)
> - 가이드 라우트 (`/guides/*`) — **별도 UI 없음, 아티클 상세로 301 리다이렉트**
>
> 페르소나/원칙: [../persona.md](../persona.md)
> 시각 토큰/UI 매핑: [ui.md](ui.md)

---

## 1. 한 줄 정의

**임신·출산·육아 관련 글과 영상을 한 화면에서 탐색하고, 클릭 한 번으로 깊은 콘텐츠로 진입하는 콘텐츠 허브.** Phase 4에서 블로그/영상 분리 탭을 통합한 결과물. 가이드 URL(`/guides/*`)은 사용자 멘탈 모델 호환을 위한 alias이며 실제 콘텐츠는 모두 아티클 시스템.

---

## 2. 사용자 목표 (Jobs-to-be-Done)

| 시점 | 사용자 의도 | 정보 영역이 해줘야 하는 것 |
|------|-------------|----------------------------|
| **목적 없는 탐색** | "임신 관련 정보 둘러보고 싶다" | 통합 탭 + 최신순 카드 리스트 |
| **포맷 선호** | "글로 보고 싶다" / "영상으로 보고 싶다" | 탭 분리 (전체 / 블로그 / 영상) |
| **주제 선호** | "영양 관련만 보고 싶다" | unified-tags 필터 (태그 13종) |
| **상세 읽기** | "이 글을 읽고 싶다" | `.article-prose`로 편집적 본문 |
| **읽고 나서** | "관련 콘텐츠 더 보고 싶다" | 아티클 하단 RelatedArticles + RelatedContent |
| **외부 진입** | 검색 엔진에서 가이드 URL로 도달 | `/guides/*` → `/articles/{slug}` 301 |

핵심 행동 = **카드 클릭 → 상세 읽기 → 관련 콘텐츠 클릭** (순환 탐색).

---

## 3. 정보 구조 (IA)

### 3.1 정보 탭

```
/info
├─ Header (h1 "📚 정보" + PageDescription)
├─ 탭 (전체 / 블로그 / 영상) — role="tablist"
├─ 통합 태그 필터 (전체 + 사용 중인 태그 N개) — aria-pressed
├─ 패널 (role="tabpanel")
│   └─ InfoCard × N (article 또는 video, 시간순 정렬)
└─ Empty state (필터 결과 0건)
```

- **탭과 태그 필터는 독립적으로 작동**. 탭 = 포맷, 태그 = 주제. 사용자가 둘을 동시에 좁힐 수 있음.
- **URL 동기화**: `?tab=articles|videos` 쿼리에 따라 초기 탭 결정. 해시(`#video-id`)는 영상 자동 스크롤 + 2초 ring 강조.

### 3.2 아티클 상세

```
/articles/[slug]
├─ 백 링크 ("목록으로" → /info)
├─ Header (h1 + description + 태그 + 메타: 저자·날짜·수정일)
├─ Divider (gradient hr)
├─ ShareButton (우상단)
├─ AuthorNote (조건부, yellow)
├─ MedicalDisclaimer (조건부, mint)
├─ .article-prose 본문 (dangerouslySetInnerHTML)
├─ TimelineCTA (조건부, linked_timeline_weeks 있으면)
├─ ShareButton (중앙 하단, 재출현)
├─ RelatedContent (체크리스트 + 영상)
└─ RelatedArticles (관련 아티클 카드)
```

### 3.3 가이드 라우트

```
/guides/{slug} → 301 redirect → /articles/{slug}
```

- **별도 UI/UX 없음**. 라우트만 존재하는 alias.
- 사용자가 "가이드 페이지 보러가야지"라고 검색·북마크할 때를 위해.
- 신규 가이드 콘텐츠는 모두 `/articles/{slug}`로 작성.

---

## 4. 상태 모델

| 상태 | 발생 조건 | 처리 |
|------|----------|------|
| **정보 탭 초기 (URL 쿼리)** | `?tab=videos` 등 | 해당 탭 활성으로 초기화 |
| **정보 탭 초기 (해시)** | `#video-id` | 해당 비디오로 scrollIntoView + 2초 ring 강조. 강조 후 자동 제거. |
| **빈 결과** | 필터 적용 후 0건 | 📭 + 안내 메시지 |
| **아티클 상세 진입** | 외부 링크 / 정보 탭 / 관련 콘텐츠 / 가이드 alias | 동일한 ArticleDetail 렌더링 |
| **MedicalDisclaimer 표시** | `article.disclaimer` 존재 | mint 박스, "ℹ️ 안내" |
| **AuthorNote 표시** | `article.authorNote` 존재 | yellow 박스, "💬 만든이의 한마디" |
| **TimelineCTA 표시** | `linked_timeline_weeks` 비어있지 않음 | lavender 박스, 첫 주차로 점프 |

### 4.1 콘텐츠 메타데이터의 신뢰성

- **저자 노트(yellow)**: 운영자의 사적 코멘트·감상.
- **의료 면책(mint)**: 의학·정책 정보를 다루는 글에서 "전문가 상담 필요" 명시.
- 두 박스를 시각적으로 분리해서 **운영자 의견과 의료 조언을 혼동하지 않도록** 함.

---

## 5. 인터랙션 패턴

### 5.1 탭 전환

- **트리거**: 탭 버튼 클릭. ARIA `role="tab"` + `aria-selected`.
- **피드백**: 패널 내용 즉시 교체. URL 쿼리 동기화 검토(현재는 미세하게 다름).
- **GA**: `tab_switch { from, to }`.

### 5.2 태그 필터

- **트리거**: 태그 버튼 클릭. `aria-pressed`.
- **단일 선택**: 한 번에 하나만(or "전체"). 다중 선택은 미지원.
- **피드백**: 패널 내용 필터링. 0건 시 빈 상태.

### 5.3 카드 클릭 → 상세

- **ArticleCard**: `<Link>` 래퍼. SPA navigation.
- **VideoCardCompact**: `<a href={youtube_url} target="_blank">`. 외부 이동.
- **GA**: `content_click { type, title }`.

### 5.4 아티클 본문 인터랙션

- **`.article-prose` 내부**: globals.css 룰 그대로. 인라인 className 오버라이드 금지.
- **링크**: `--prose-accent` 색상으로 자연스러운 강조.
- **이미지**: alt 텍스트 필수.
- **표/코드/blockquote**: 모두 prose 시스템에서 정의됨.

### 5.5 관련 콘텐츠 클릭

- **RelatedArticles**: `<Link>` SPA navigation.
- **RelatedContent → 영상**: hash 포함 cross-page는 `<a>` 풀 내비게이션 (Next.js 16.2 hash bug 회피).
- **TimelineCTA**: `<a href="/timeline#timeline-week-{N}">` 풀 내비게이션.

### 5.6 ShareButton

- 모바일: Web Share API 네이티브 시트.
- 데스크톱: Clipboard API + 토스트.
- GA: `share_click { method, slug }`.

---

## 6. 접근성 스펙

| 항목 | 합격 기준 |
|------|-----------|
| **탭** | role="tablist", role="tab" with aria-selected, role="tabpanel" with aria-labelledby. ✓ |
| **태그 필터** | role="button" + aria-pressed. 키보드 Enter/Space로 토글. |
| **카드** | 전체가 `<Link>` / `<a>` — interactive 요소 중첩 없음 ✓ |
| **`.article-prose`** | 시맨틱 hN/p/ul/ol/strong/em — 시각·시맨틱 일치. globals.css에서 통제. |
| **MedicalDisclaimer** | text-accent-green on `bg-pastel-mint/20` — 대비 측정 필요 |
| **AuthorNote** | text-accent-olive on `bg-pastel-yellow/20` — 대비 측정 필요 |
| **백 링크** | "목록으로" + ArrowLeft 아이콘. 스크린리더에 명확. |
| **빈 상태** | 단순 텍스트 + 이모지 — 추가 가이드(필터 해제 버튼 등) 권장 |

---

## 7. 마이크로카피 원칙

- **탭 라벨**: "전체 / 블로그 / 영상" (콘텐츠 양 카운트 추가 검토).
- **태그 라벨**: unified-tags의 한국어 라벨 사용. 영문 키 노출 금지.
- **빈 상태**: "📭 해당 조건의 콘텐츠가 없어요" + 필터 해제 액션 검토.
- **메타 행**: "{저자} · {날짜}" + 수정 시 "수정 {수정일}". 점(·) 구분자 일관.
- **AuthorNote**: "💬 만든이의 한마디" — 격식 있되 친근.
- **MedicalDisclaimer**: "ℹ️ 안내" — "정확한 진단·치료는 전문가와 상담하세요"(고정 카피 + 글별 보충).

---

## 8. 데이터·저장 모델 (UX 관점)

- **아티클 콘텐츠**: `/src/content/articles/*.md` (MDX) → `gray-matter` → `Article` 타입.
- **영상 데이터**: `/src/data/videos.json` 정적.
- **태그**: `/src/lib/unified-tags`에서 13종 + 동의어 흡수 매핑.
- **관련 콘텐츠 매핑**: 정적 (front matter `linked_*` 필드) + 자동 (태그 교집합).
- **저장**: 사용자 데이터 없음 (탭/필터 상태 페이지 이탈 시 초기화).
- **URL state**: `?tab=`, `#hash`만 동기화.

---

## 9. 성공 측정

| UX 가설 | 측정 이벤트 |
|---------|-------------|
| 탭 전환이 일어난다 | `tab_switch` |
| 태그 필터가 쓰인다 | `filter_apply { tag }` (현재 미정의 — 검토) |
| 카드 클릭 → 상세 읽기 | `content_click` + `article_view` |
| 본문이 끝까지 읽힌다 | `article_read_complete` (scroll 75% + dwell 60s) |
| 관련 콘텐츠로 분기한다 | `related_article_click` / `related_video_click` |
| 가이드 alias가 살아있다 | `/guides/*` 도착 → 301 redirect 통계 |
| 영상 → 정보 탭 hash navigation 동작 | hash 도달 후 `video_highlight_view` |

---

## 10. 알려진 UX 이슈 / 결정 대기

> UI 측 위반 트래커: [ui.md §10](ui.md)

- [ ] **(M)** 태그 필터 다중 선택 지원 여부 — 한 사용자가 "영양 + 운동" 같이 좁히고 싶을 수 있음
- [ ] **(M)** 빈 상태에서 "필터 해제" 단축 버튼 추가
- [ ] **(L)** 읽기 시간 표시(reading time) — 데이터 필드 추가 필요. 콘텐츠 깊이 신호.
- [ ] **(M)** TimelineCTA가 항상 보이는데, **이미 본 사용자에게는 노이즈**일 수 있음 — dismiss 옵션 검토
- [ ] **(L)** ShareButton 우상단 + 하단 중앙 두 번 — 하나로 줄일지, 위치 변경 (체크리스트 동일 이슈)
- [ ] **(M)** 가이드 alias의 SEO 정합성 — 검색엔진이 `/guides/*`를 캐시한 상태에서 301이 충분히 forwarding되는지 확인
- [ ] **(L)** 영상 카드(VideoCard vs VideoCardCompact) hover 동작 불일치 — 통일 결정

---

## 11. 변경 가이드

이 문서를 갱신하는 시점:

1. 탭 구성 변경 (§3 IA, §5.1)
2. unified-tags 추가/삭제 (§5.2)
3. 아티클 메타데이터 필드 추가 (§4·§7)
4. `.article-prose` 룰 변경 시 → DESIGN.md 7.6 + globals.css 직접 수정 (이 문서는 어디서 쓰이는지만 기록)
5. 결정 대기 항목 해소 시 → §10 정리

UI 토큰·시각 적용은 [ui.md](ui.md)에서 별도 관리.
