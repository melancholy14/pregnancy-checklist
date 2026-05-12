# design-bundle-j-share-button-position 기획서

> 작성일: 2026-05-10  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

- **항목 J-1 결정 (옵션 C)**: 우상단+중앙하단 유지 + `share_click.position` 파라미터 신설. articles는 우상단+중앙하단 둘 다 유지(현행), checklist·timeline은 우상단 단독 유지(현행). 4주 measurement window 한정 — 이후 영역×위치별 도달률 차이 5%p 이상이면 그 영역만 다운스코프(별도 라운드).
- **항목 J-2 결정 (옵션 B)**: `share_click.position` enum = `top_right` | `bottom_center`. 모든 ShareButton 호출부 의무 prop. PII 0.
- **페어 1 합의**: 한 영역 안 ShareButton은 1개 위치 — articles는 옵션 C 한정 예외(측정 가설 검증 목적). 공유 메커니즘 변경 없음. 시각 토큰은 묶음 H 정합 1회 검증.

## 1. 배경·목적

- **운영자**: phase-4.5.md §2.9 Cross-10·§2.10 묶음 J 미해소 상태 해소. ShareButton 위치 컨벤션을 단정으로 박지 않고 `share_click.position` 측정 데이터 기반으로 4주 후 다운스코프 — 운영자가 영역별 위치 결정을 직관 대신 데이터로 결정 가능. marketing persona §2.2(가설→측정→결정) + §5.4(측정 계획 1줄 필수) 정합.
- **사용자**: 행동 표면 변경 0(위치 그대로). articles 본문 끝 도달 시 공유 행동 마찰 0 유지(현행 중앙하단 ShareButton 유지). 4주 후 도달률 데이터 기반 영역별 위치 정리 시 시각 일관성 회복.
- **측정**: GA4 신규 파라미터 1건 — `share_click.position` (`top_right` | `bottom_center`). 신규 이벤트 0건. 기존 `share_click` 발사 정책 유지 + position 동봉.

## 2. 사용자 시나리오

- **시나리오 1 (articles 진입 직후 공유)**: 사용자 A가 [/articles/<slug>](src/app/articles/) 진입 → 페이지 상단 메타 영역 우상단 ShareButton 노출 → 클릭 → `share_click.position=top_right` 발사 + navigator.share 또는 클립보드 복사.
- **시나리오 2 (articles 완독 후 공유)**: 사용자 B가 article 본문 5,000자 읽고 끝까지 스크롤 → 본문 하단 RelatedContent 위 중앙 ShareButton(라벨 "이 글 공유하기") 노출 → 클릭 → `share_click.position=bottom_center` 발사.
- **시나리오 3 (checklist/timeline 단일 위치)**: 사용자 C가 [/checklist/<slug>](src/app/checklist/) 또는 [/timeline](src/app/timeline/) 진입 → 페이지 상단 우상단 ShareButton 단독 노출 → 클릭 → `share_click.position=top_right` 발사. 페이지 끝에는 ShareButton 없음.
- **시나리오 4 (4주 후 데이터 기반 다운스코프)**: 운영자가 GA4 Looker Studio 또는 [60-analytics/weekly/](docs/marketing/) 주간 리포트에서 영역×position별 `share_click` 카운트 확인 → 영역별 도달률 차이 5%p 이상이면 다운스코프 라운드 발의 (별도, 본 라운드 범위 외).

## 3. 기능 요구사항

### must

#### M1. ShareButton 컴포넌트에 `position` prop 추가

- [src/components/share/ShareButton.tsx](src/components/share/ShareButton.tsx) 컴포넌트 props에 `position: "top_right" | "bottom_center"` 의무 prop 추가. 기본값 없음 — 호출부에서 명시 의무.
- 클릭 핸들러에서 `sendGAEvent("share_click", { ..., position })` 호출 — 기존 파라미터(`content_type`, `item_id`, `share_method`)에 `position` 동봉. share_method enum은 변경 없음.

#### M2. 호출부 4개 position prop 부착

- [src/components/articles/ArticleDetail.tsx:71-77](src/components/articles/ArticleDetail.tsx#L71-L77) (우상단) → `position="top_right"`.
- [src/components/articles/ArticleDetail.tsx:103-110](src/components/articles/ArticleDetail.tsx#L103-L110) (중앙하단) → `position="bottom_center"`.
- [src/components/timeline/TimelineContainer.tsx:219-225](src/components/timeline/TimelineContainer.tsx#L219-L225) (우상단) → `position="top_right"`.
- [src/components/checklist/ChecklistPage.tsx:258-264](src/components/checklist/ChecklistPage.tsx#L258-L264) (우상단) → `position="top_right"`.

#### M3. 위치 자체 변경 0

- 모든 영역의 ShareButton 위치는 현행 유지. 본 라운드는 **measurement 추가**만 — 위치 변경은 4주 후 별도 라운드.

#### M4. phase-4.5.md §1.5 GA4 카탈로그 갱신

- [docs/plan/phase-4.5.md](docs/plan/phase-4.5.md) §1.5 `share_click` 정의에 `position` 파라미터 추가 — enum: `top_right` | `bottom_center`. 발사 시점·PII 정책은 기존 그대로 명시.
- [docs/marketing/ga4.md](docs/marketing/ga4.md) `share_click` 섹션에 동일 갱신.
- enum 확장 정책 메모: "위치 컨벤션이 다운스코프되어 단일 위치로 통일되면 enum도 다운스코프 — 4주 grace period 후 신/구 병행 종료." (marketing persona §3.6 정합)

#### M5. ShareButton 시각 토큰 정합 검증

- ShareButton 컴포넌트가 묶음 H lavender/40 활성색 정합인지 design.md에서 1회 검증. 본 라운드에서 토큰 변경 없음 — 검증만.

### should

- **measurement window 종료 알림**: 운영자에게 4주 후(2026-06-07) 도달률 데이터 확인 알림 — phase-4.5.md §1.9 자동 리포트에서 `share_click.position` 분포 카운트 포함.

### won't (이번 범위 밖)

- **ShareButton 위치 변경** — 4주 후 데이터 기반 별도 라운드.
- **share_method enum 확장** — 기존 그대로(navigator.share + clipboard).
- **위치 다운스코프 결정 룰 자동화** — 운영자 수동 결정 (5%p 임계값 자체도 가설).
- **ShareButton 시각 디자인 변경** — 묶음 H 정합 검증만.

## 4. 예외·엣지 케이스

- **navigator.share 미지원**: 클립보드 복사 fallback. position 파라미터는 양쪽 모두 동봉 — 측정 정책 일관성.
- **사용자 동일 페이지에서 우상단·중앙하단 둘 다 클릭 (articles)**: 각 클릭 별개 발사. position별 카운트 합산은 분석 단계에서 처리. 양쪽 발사 시 사용자 의도 = "강한 공유 의지" 가설 가능 (별도 검증).
- **localStorage·예정일 영향**: 무관 — 본 라운드는 측정 파라미터 추가만.

## 5. 성공 기준

- **기능 동작**:
  - `pnpm build` 성공 + 4개 호출부 모두 position prop 부착 + TypeScript 타입 에러 0.
  - GA4 DebugView에서 `share_click` 발사 시 `position` 파라미터 노출 확인 (`top_right`/`bottom_center`).
- **측정 지표**:
  - 4주 measurement window 후 영역×position별 `share_click` 카운트 ≥ 영역당 10건 (도달률 차이 5%p 의미 있는 표본).
- **사용자 경험**: design.md 와 일치 — 위치 변경 0. 시각 토큰 묶음 H 정합 유지.
- **SoT 정합**: phase-4.5.md §1.5 + ga4.md `share_click` 정의 갱신. SoT 무결성 회복.
