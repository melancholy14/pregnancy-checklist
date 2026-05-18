# design-bundle-l-image-system 리뷰

> 작성일: 2026-05-09
> 상태: draft
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)

## 1. 기능 요약

phase-4.5.md §2.11 article-prose 이미지 시스템의 잔여 항목 IM-1(article-prose img 토큰 적용)·IM-3(`<img>` → `next/image` 전환 + frontmatter width/height 메타 도입)을 한 라운드에 마감. IM-2·IM-4는 P14에서 이미 완료. IM-5(lightbox/zoom)는 사전 결정으로 "원본 새 탭 열기" 박힘 — 모달·zoom 컴포넌트 도입 없이 `target="_blank" rel="noopener noreferrer"` 한 줄로 처리.

## 2. 적용 페어 + 선택 이유

- **dev × planner**: IM-3 next/image 전환의 핵심 결정(메타 추출 자동 vs 운영자 수기) + 발행 글 2건 마이그레이션 + 신규 글 작성 SOP 변경이 운영자 1인 부담과 콘텐츠 운영 룰 일관성 사이에서 가장 첨예.
- **dev × designer**: IM-1 토큰·next/image 모드·`sizes` 정합·기존 P14 `rehype-article-figure` 플러그인 호환·IM-5 새 탭 열기의 접근성 디테일이 디자이너 N1(WCAG 2.1 AA)·dev §6.6(임의 결정 거부) 사이에서 충돌.

## 3. 페어별 충돌

### 페어 1: dev × planner

**T0 — 페어 시작 선언**: 이전 페어 [없음] 영향 없음. dev §6.5·§6.6 / planner §5.2·§7.5 인용.

**[dev] 단독 입장**:

- **잃는 것**: IM-3를 next/image로 박으면 현재 환경(`output: "export"` + `images.unoptimized: true`)에서 즉시 효과 0. [docs/tech/infra.md §3.2](../../tech/infra.md#L94-L102) 체크리스트가 standalone 전환 시 `images.unoptimized` 제거 + 도메인 등록 + next/image 활성을 한 묶음으로 처리하도록 박혀 있어 인터페이스만 미리 박는 절감 효과 미미. [infra.md L81](../../tech/infra.md#L81): standalone 전환은 "시기 미정 (PoC KPI Go 후 결정)" — 1년+ 무기한 조건부 이연 가능.
- **희생 거부 인용**: "산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다." — docs/tech/persona.md §6.6. + "E2E 빨강을 무시하고 배포 X." — §6.5.
- **주장**: plain `<img width=N height=N loading="lazy">` 다운스코프. `rehype-article-figure`를 빌드 타임에 `image-size`로 width/height 자동 추출하도록 확장. next/image 전환은 standalone 라운드(infra.md §3.2 한 묶음)와 함께. 본 라운드 범위는 코드 변경(rehype 확장 + globals.css 토큰 + 발행 글 2건 자동 마이그레이션)에 한정.
- **잔재 자기검증**: 이전 페어 없음 — N

**[planner] 반박 입장**:

- **A 발언 반박**: dev가 phase-4.5.md §2.11 IM-3 정의 정정·docs 갱신을 본 라운드 범위 외로 분리하지만, 본 라운드 spec이 phase-4.5.md 정의와 어긋난 채 머지되면 phase-4.5.md가 사실과 다른 SoT로 남음 — 운영자 1인 환경에서 코드/docs 책임 분리는 비현실적.
- **잃는 것**: phase-4.5.md §2.11.2 IM-3 정의 정정 추가 작업 1건. infra.md §3.2 연결 메모도 본 라운드에 박아야 함. KPI 임계값 명문화는 양보.
- **희생 거부 인용**: "타입 변경 = 콘텐츠 운영 룰 변경. 데이터 모델 PR 리뷰 시 마이그레이션 동반." — docs/content/persona.md §5.2. + "유입(SEO) → 콘텐츠 → 체크리스트 흐름." — §7.5.
- **주장**: plain img 다운스코프 수용. 단 본 라운드 범위에 (a) phase-4.5.md §2.11.2 IM-3 정의 정정 + (b) "next/image 마이그레이션은 standalone 전환 라운드와 함께"라는 메모(infra.md §3.2 링크) 포함.
- **잔재 자기검증**: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: 양쪽이 plain img 다운스코프에는 수렴(원래 next/image vs plain img 충돌이 사실 확인 — infra.md SoT가 "시기 미정" — 으로 약화). 잔여 충돌은 본 라운드 범위에 phase-4.5.md §2.11.2 IM-3 정의 정정 + standalone 전환 메모를 포함할지(planner) vs 코드 변경만, docs 정정은 별도 PR(dev).
- **숨은 가정**: 양쪽 모두 infra.md L81 "PoC KPI Go 후 결정"의 KPI 임계값이 어딘가에 명문화되어 있다고 묵시 가정. 실제로는 docs/plan에 명문화되지 않음 — 명문화 자체가 빠져 있으면 standalone 전환 시기는 영구 미정.

### 페어 2: dev × designer

**T0 — 페어 시작 선언**: 이전 페어 [페어 1: dev × planner] 영향 없음. dev §6.6·§2.3·§6.5 / designer N1·N2 인용.

**[dev] 단독 입장**:

- **잃는 것**: P14 산출 `rehype-article-figure` 플러그인을 또 확장(width/height 자동 박기 + `<a target="_blank">` 래핑 + 새 탭 표시 시각). 빌드 회귀 표면이 1배 → 3배. designer가 시각 형태·focus ring을 명시 안 하면 개발자가 임의 박지 않음.
- **희생 거부 인용**: "새 색·radius·shadow·면책 문장·CTA 카피를 개발자가 박지 않음." — docs/tech/persona.md §6.6. + "DESIGN.md / globals.css 토큰만 사용." — §2.3.
- **주장**: 코드 진입 전 designer가 spec/design.md에 5개 명시 — (a) img 토큰 확정 (b) 새 탭 시각 형태 (c) figure 내 anchor 마크업 구조 (d) focus-visible ring 토큰 (e) figcaption 부재 케이스 분기 처리.
- **잔재 자기검증**: 이전 페어 [페어 1: dev × planner] 영향 없음 — N — 페어 1의 IM-3 다운스코프 결정이 figure 마크업·시각 표시·focus ring 결정에 영향 없음.

**[designer] 반박 입장**:

- **A 발언 반박**: dev의 (a)~(e) 명시 요구는 합리적이나 (d) `aria-label` 카피는 디자이너 단독 영역 X — 기획자(content persona §5.3) 검토 영역. dev가 카피까지 디자이너에 떠넘기는 패턴은 페르소나 책임 분리 위반.
- **잃는 것**: figure media 슬롯 우상단 아이콘 안은 거부(인포그래픽 텍스트 가림 위험). 양보: figcaption 끝 "· 원본 보기" 텍스트 + figcaption 부재 시 우하단 ExternalLink 아이콘 분기. aria-label 카피는 spec에서 "기획자 검토 후 확정"으로 표시.
- **희생 거부 인용**: "색 대비, 키보드 도달, focus-visible, ARIA 정합성, 시맨틱 HTML, 스크린리더 라벨." — docs/design/persona.md N1 WCAG 2.1 AA. + "`<a>`는 link, `<button>`은 button. role/시맨틱과 시각이 일치." — N2 인터랙티브 의미의 정직성.
- **주장**: design.md에 박을 결정 — (a) `rounded-2xl + shadow-sm + my-6 + max-w-full` 확정 (b) figcaption 끝 "· 원본 보기" 텍스트 권장, figcaption 부재 시 우하단 ExternalLink 아이콘 분기 (c) `<figure><span.article-figure__media><a href={src} target="_blank" rel="noopener noreferrer"><img/></a></span><figcaption/></figure>` (anchor=img만) (d) `focus-visible:ring-2 focus-visible:ring-pastel-lavender focus-visible:ring-offset-2` + aria-label 카피는 기획자 검토 (e) figcaption 부재 분기는 (b)와 통합 처리.
- **잔재 자기검증**: 이전 페어 [페어 1: dev × planner] 영향 없음 — N — 페어 1의 plain img 결정은 figure 내부 마크업·시각 표시·focus ring 결정과 독립.

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: figcaption 부재 케이스에서 새 탭 표시 아이콘과 P14 AI 워터마크 칩이 figure 우하단에서 위치 충돌. 옵션 (가) AI 칩 우하단 고정 + 새 탭 아이콘 우상단(인포그래픽 가림) (나) 새 탭 아이콘 좌하단(좌하단 가림 가능) (다) figcaption 부재 시 새 탭 표시 0(접근성 위반) (라) alt를 figcaption으로 자동 승격(디자인 의도 변경).
- **숨은 가정**: 양쪽 모두 "현재 발행 글 2건은 모두 figcaption(markdown title 슬롯) 보유"를 가정 — 사실. 다만 신규 글 작성 시 운영자가 title 슬롯을 비울 자유 → figcaption 부재 케이스가 미래에 발생. 또한 양쪽 모두 figure 우하단을 빈 공간으로 가정 — P14 산출 AI 워터마크 칩(`article-figure__chip`)이 우하단에 박혀 있어 위치 충돌이 페어 시작 시점에 미인지.

## 4. 미해결 트레이드오프

### 항목 1 — phase-4.5.md §2.11.2 IM-3 정의 정정·standalone 메모를 본 라운드에 포함할지 (페어 1)

본 라운드 결정: IM-3는 phase-4.5.md 정의("`<img>` → `next/image` 전환")가 아니라 **plain `<img width=N height=N loading="lazy">` 다운스코프**로 진행. phase-4.5.md SoT가 사실과 어긋남.

- [x] **옵션 A**: 본 라운드 spec/scope에 phase-4.5.md §2.11.2 갱신 + infra.md §3.2 연결 메모 PR 포함
  - 즉시 비용: spec.md/design.md 외 docs 갱신 PR 한 묶음 (≈10분 작업 추가)
  - 나중 비용: SoT 일치, 다음 라운드 운영자 중복 검토 0, IM-3 결정의 영구 추적성 확보
- [ ] **옵션 B**: 본 라운드는 코드 변경에 집중, phase-4.5.md docs 정정은 별도 PR로 분리
- **결정**: 옵션 A. SoT 무결성 우선. spec.md must에 phase-4.5.md §2.11.2 정정 + infra.md §3.2 연결 메모 갱신 항목 박음.

### 항목 2 — figcaption 부재 케이스에서 새 탭 표시 위치 (페어 2)

배경: P14 산출 AI 워터마크 칩(`article-figure__chip`)이 figure 우하단에 박혀 있음. figcaption 없는 이미지(markdown `![alt](src)` title 슬롯 비움)에서 새 탭 표시 시 위치 충돌.

- [x] **옵션 A**: AI 칩=우하단 고정, 새 탭 아이콘=우상단
  - 즉시 비용: 우상단 인포그래픽 텍스트 가림 위험
  - 나중 비용: 인포그래픽 신규 글마다 우상단 회피 SOP 필요 (운영자 부담)
- [ ] **옵션 B**~**E**: 미선택
- **결정**: 옵션 A. design.md에 (1) AI 칩 우하단 고정 (2) 새 탭 아이콘 우상단 + 인포그래픽 우상단 회피 SOP를 `docs/content/image-sop.md`에 메모 추가 의무화 박음. 인포그래픽 핵심 텍스트는 운영자가 우상단 영역(이미지 폭 720 기준 약 100×100px)을 비워두는 룰 적용.

### 항목 3 — anchor `aria-label` 카피의 본 라운드 처리 (페어 2 designer 양보)

배경: designer가 "aria-label 카피는 디자이너 단독 X, 기획자(content persona §5.3) 검토 영역"으로 거부. 본 라운드에서 처리 방식 결정 필요.

- [ ] **옵션 A**: design.md에 임시 박고 추후 갱신 PR — 미선택
- [x] **옵션 B**: 본 라운드 페이즈 5 진입 전 기획자(content persona) 검토 1회 받기
  - 즉시 비용: 페이즈 5 진입이 1회 사용자 입력 단계만큼 지연
  - 나중 비용: 카피가 spec 처음부터 정합, 갱신 PR 누락 위험 0
- **결정**: 옵션 B. 페이즈 5 진입 전 content persona로 aria-label 카피 검토 1회. 검토 결과를 §5 결정 섹션에 박아 spec/design 작성 시 인용.

## 5. 결정

**사전 박힌 결정 (사용자 입력, 2026-05-09)**:

- **IM-5 (본문 이미지 lightbox/zoom 여부)**: **원본 새 탭 열기**. 모달 lightbox(Radix Dialog 등) 도입 X, 미도입 X. 본문 이미지 탭/클릭 시 새 탭에서 원본 이미지 열기. `target="_blank"` + `rel="noopener noreferrer"` 의무.

**페이즈 4 휴먼 게이트 결정 (사용자 입력, 2026-05-09)**:

- **항목 1 (phase-4.5.md 정정 위치)**: **옵션 A — 본 라운드 spec/scope에 phase-4.5.md §2.11.2 갱신 + infra.md §3.2 연결 메모 PR 포함**. SoT 무결성 우선. spec.md must에 docs 갱신 항목 박음.
- **항목 2 (figcaption 부재 시 새 탭 표시 위치)**: **옵션 A — AI 칩=우하단 고정, 새 탭 아이콘=우상단**. design.md에 우상단 위치 박음. `docs/content/image-sop.md`에 "인포그래픽 우상단 영역(이미지 폭 720 기준 약 100×100px) 핵심 텍스트 회피" SOP 메모 추가 의무.
- **항목 3 (anchor aria-label 카피 처리)**: **옵션 B — 페이즈 5 진입 전 기획자(content persona) 검토 1회**. 검토 결과: **카피 = "원본 이미지 새 창에서 보기"** (content persona §5.5/§6 + WCAG 정합). 사이트 기존 "X로 이동" 컨벤션은 외부 사이트 이동 컨텍스트 한정으로 발현 — 같은 origin 정적 자산엔 "보기"가 의미 정확.

## 6. 우선순위 영향

- phase-4.5.md §2.11 article-prose 이미지 시스템 라운드 종료(잔여 IM-1·IM-3·IM-5 완결). IM-6(alt 가이드라인)은 P10 운영자 가이드와 통합되어 별도 묶음에서 진행.
- 발행 글 2건(`weekly-prenatal-checklist`, `prenatal-insurance-preparation-guide`) frontmatter에 width/height 추가되면 향후 신규 글 작성 SOP에 동일 메타 입력 룰 도입 필요(`docs/content/image-sop.md` 갱신 1회).
