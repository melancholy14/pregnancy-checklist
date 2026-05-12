# design-bundle-j-share-button-position

> 작성일: 2026-05-10 | 작성자: Claude Code
> 관련 spec: [docs/features/design-bundle-j-share-button-position/spec.md](../features/design-bundle-j-share-button-position/spec.md)

## 개요

ShareButton의 위치 컨벤션을 단정으로 박지 않고, GA4 `share_click` 이벤트에 신규 `position` 파라미터(`top_right` | `bottom_center`)를 동봉해 4주 measurement window 동안 영역×위치별 도달률 데이터를 수집한다. 위치 자체는 현행 유지(articles 우상단+중앙하단, checklist·timeline 우상단 단독). 4주 후 도달률 차이 5%p 이상이면 별도 라운드에서 다운스코프 결정.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `npm run build` 성공 | ✅ 완료 | Next.js 16.2.0 (Turbopack), 32 페이지, TS 에러 0 |
| 4개 호출부 모두 `position` prop 부착 | ✅ 완료 | ArticleDetail×2, TimelineContainer×1, ChecklistPage×1 |
| TypeScript 타입 에러 0 | ✅ 완료 | required prop으로 강제 — 미부착 호출부는 빌드 실패 |
| GA4 DebugView에서 `share_click.position` 노출 | ⏳ 런타임 검증 필요 | 코드상 `position` 동봉 완료, 운영자 GA4 DebugView 확인 |
| design.md 위치 변경 0 | ✅ 완료 | 위치 자체는 손대지 않음 — measurement 추가만 |
| SoT 정합 (`phase-4.5.md §1.5` + `ga4.md`) | ✅ 완료 | `share_click`에 `position` enum 추가 |

### 생성/수정 파일

**신규 생성**
- `docs/implementation/design-bundle-j-share-button-position-impl.md`
- `docs/review/design-bundle-j-share-button-position-review.md`
- `e2e/design-bundle-j-share-button-position.spec.ts`
- `docs/design-bundle-j-share-button-position/README.md` (본 문서)

**수정**
- `src/lib/share.ts` — `SharePosition` 타입 export, `ShareContext`에 `position` 필수 필드 추가, GA 이벤트명 `share` → `share_click`로 SoT 정합, payload에 `position` 동봉(양 분기)
- `src/components/share/ShareButton.tsx` — `position: SharePosition` required prop(기본값 없음), `triggerShare`·`ShareModal`로 전달
- `src/components/share/ShareModal.tsx` — `position: SharePosition` required prop, `copyShareLink`로 전달
- `src/components/articles/ArticleDetail.tsx` — 우상단 `position="top_right"`, 중앙하단 `position="bottom_center"`
- `src/components/timeline/TimelineContainer.tsx` — 우상단 `position="top_right"`
- `src/components/checklist/ChecklistPage.tsx` — 우상단 `position="top_right"`
- `docs/plan/phase-4.5.md` — §1.5 `share_click` 행에 `position` 파라미터 + 묶음 J 메모
- `docs/marketing/ga4.md` — §3.C `share_click` 정의에 `position` enum + 4주 measurement window + enum 다운스코프 정책

### 주요 결정 사항

- **GA 이벤트명 `share` → `share_click`로 정렬**: 기존 코드는 `sendGAEvent("share", ...)`였으나 SoT(ga4.md, phase-4.5.md)는 `share_click`로 정의되어 있었음. spec M1이 `sendGAEvent("share_click", ...)`로 명시했고, spec §5 성공 기준이 "SoT 무결성 회복"을 포함하여 본 라운드에서 정렬. GA4에서 기존 `share` 이벤트 카운트는 cut-over되고 `share_click`로 신규 집계 시작.
- **`method` 파라미터명은 유지**: spec M1은 본문에서 `share_method`로 표기했으나 SoT는 `method`로 정의됨. SoT 우선.
- **`method` enum 값(`web_share_api`/`clipboard`) 유지**: spec won't에 "share_method enum 확장" 제외 — 본 라운드 범위 밖.
- **`position` prop은 기본값 없는 required**: TypeScript 컴파일러가 호출부 누락을 강제하여 런타임 사고 방지. spec M1 "기본값 없음 — 호출부에서 명시 의무" 준수.

### 가정 사항 및 미구현 항목

- spec에 별도 plan 파일(`docs/plan/...-plan.md`)이 없었으나 spec.md 자체가 detailed spec이라 그것을 plan으로 사용.
- `pnpm build`는 spec 표기였으나 본 프로젝트는 npm 기반 — npm으로 검증.
- **GA4 DebugView 실제 발사 검증**: 운영자 수동 검증 항목.
- **measurement window 종료 알림(should)**: phase-4.5.md §1.9 자동 리포트 통합은 묶음 L·M 영역으로 분리.
- **ShareButton 위치 변경 / share_method enum 확장 / 자동 다운스코프 룰**: spec won't에 명시 — 4주 후 별도 라운드.

---

## 코드 리뷰 결과

### Critical 이슈

**해당 없음.** `SharePosition` strict union + required prop 조합으로 enum 무결성이 타입 시스템 레벨에서 강제됨. 4개 호출부 중 하나라도 누락 시 빌드 실패.

### Warning (수정 권장)

**해당 없음.** 본 라운드 변경분에서 any 사용 0건, 새 리렌더 패턴 0건, dangerouslySetInnerHTML/eval/NEXT_PUBLIC_ 추가 0건, a11y 회귀 0건.

### Suggestion (미래 라운드 권장)

- `triggerShare`의 `Promise<void>`가 호출부에서 await/catch되지 않음 — 기존 패턴으로 본 라운드 범위 외.
- e2e 테스트가 `window.dataLayer`를 직접 읽음 — GA SDK 업그레이드 시 깨질 수 있음. 깨지면 `phase-4-step-4-share.spec.ts`와 헬퍼 공유 모듈로 추출하며 정비.
- SoT의 `position`(`top_right`/`bottom_center`)과 기존 `location`(`article-bottom`/`header`) 의미 중복 — 4주 후 다운스코프 라운드에서 SoT의 `location` 정리.

### 전체 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 (모두 미래 라운드 권장) |

---

## 리팩토링 내용

> 📄 문서 없음 — Warning 0건 + 추가 판단 0건으로 리팩토링 작업 없음. 변경분이 처음부터 작고 컨벤션 일치(72/74/74줄, 단일 책임, 메모이제이션 신규 추가 0)였음.

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path (5개: 우상단/중앙하단/타임라인/체크리스트/연속 클릭) | ✅ 5 passed |
| Error/Validation (2개: clipboard 미지원 시 미발사 / position enum 무결성) | ✅ 2 passed |
| 권한/인증 (1개) | ⏭️ 1 skipped (정적 사이트 — 권한 분기 없음) |
| 반응형 Mobile 375px (2개: Web Share API + 중앙하단) | ✅ 2 passed |
| **전체** | **9 passed / 0 failed / 1 skipped (13.4s)** |

📊 상세 리포트: `playwright-report/index.html`

핵심 검증: GA 인라인 init이 `window.gtag`을 덮어쓰는 환경에서도 `window.dataLayer` 직접 읽기 방식으로 `share_click` 이벤트가 4개 호출부 모두에서 올바른 `position` 값과 함께 발사되는지 확인.

---

## 누락된 문서

- `docs/refactor/design-bundle-j-share-button-position-refactor.md` — 리팩토링 작업 0건이라 미작성. refactor 스킬이 "리팩토링할 항목이 없습니다"로 정상 종료.
