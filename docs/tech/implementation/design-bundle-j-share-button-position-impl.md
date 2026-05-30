# design-bundle-j-share-button-position Implementation

> 작성일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-j-share-button-position/spec.md](../features/design-bundle-j-share-button-position/spec.md)

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `npm run build` 성공 | ✅ 완료 | Next.js 16.2.0 (Turbopack), 32 페이지, TS 에러 0 |
| 4개 호출부 모두 `position` prop 부착 | ✅ 완료 | ArticleDetail×2, TimelineContainer×1, ChecklistPage×1 |
| TypeScript 타입 에러 0 | ✅ 완료 | required prop으로 강제 — 미부착 호출부는 빌드 실패 |
| GA4 DebugView에서 `share_click.position` 노출 | ⏳ 런타임 검증 필요 | 코드상 `position` 동봉 완료, 실제 발사는 운영자가 GA4 DebugView로 확인 |
| design.md 위치 변경 0 | ✅ 완료 | 위치 자체는 손대지 않음 — measurement 추가만 |
| SoT 정합 (`phase-4.5.md §1.5` + `ga4.md`) | ✅ 완료 | `share_click`에 `position` enum 추가 |

## 생성/수정 파일 목록

### 신규 생성
- `docs/implementation/design-bundle-j-share-button-position-impl.md` — 본 문서

### 수정
- `src/lib/share.ts` — `SharePosition` 타입 export, `ShareContext`에 `position` 필수 필드 추가, GA 이벤트명 `share` → `share_click`로 SoT 정합, payload에 `position` 동봉(양 분기)
- `src/components/share/ShareButton.tsx` — `position: SharePosition` required prop 추가(기본값 없음), `triggerShare`·`ShareModal`로 전달
- `src/components/share/ShareModal.tsx` — `position: SharePosition` required prop 추가, `copyShareLink`로 전달
- `src/components/articles/ArticleDetail.tsx` — 우상단 ShareButton에 `position="top_right"`, 중앙하단 ShareButton에 `position="bottom_center"`
- `src/components/timeline/TimelineContainer.tsx` — 우상단 ShareButton에 `position="top_right"`
- `src/components/checklist/ChecklistPage.tsx` — 우상단 ShareButton에 `position="top_right"`
- `docs/plan/phase-4.5.md` — §1.5 `share_click` 행에 `position` 파라미터 + 묶음 J measurement 메모 추가
- `docs/marketing/ga4.md` — §3.C `share_click` 정의에 `position` enum + 4주 measurement window 정책 + enum 다운스코프 정책 추가

## 주요 결정 사항

- **GA 이벤트명 `share` → `share_click`로 정렬**: 기존 코드는 `sendGAEvent("share", ...)`였으나 SoT(ga4.md, phase-4.5.md)는 `share_click`로 정의되어 있었음. spec M1이 `sendGAEvent("share_click", { ..., position })`로 명시했고, spec §5 성공 기준에 "SoT 무결성 회복"이 포함되어 본 라운드에서 정렬. 영향: GA4에서 기존 `share` 이벤트 카운트는 중단되고 `share_click`로 신규 집계가 시작됨 — 운영자 측 히스토리 연속성 단절은 measurement window 시작 시점에 맞춰진 의도된 cut-over로 간주.
- **`method` 파라미터명은 유지**: spec M1은 본문에서 `share_method`로 표기했으나 SoT(ga4.md §3.C, §6.5)는 `method`로 정의됨. SoT 우선으로 `method` 유지. spec 표기는 단순 inconsistency로 판단.
- **`method` enum 값(`web_share_api`/`clipboard`) 유지**: SoT는 `web-share`/`copy-link`로 다른 표기를 사용하나, spec won't에 "share_method enum 확장" 제외 명시 — 본 라운드 범위 밖으로 두고 손대지 않음.
- **`position` prop은 기본값 없는 required**: spec M1 "기본값 없음 — 호출부에서 명시 의무" 준수. TypeScript 컴파일러가 호출부 누락을 강제하여 런타임 사고 방지.

## 가정 사항

- spec에 plan-feature 산출물(`docs/plan/design-bundle-j-share-button-position-plan.md`)이 별도로 존재하지 않았으나, spec.md 자체가 AC·파일 경로·구현 순서·가정을 모두 포함한 detailed spec이므로 spec.md를 plan으로 사용.
- `pnpm build`는 spec 표기였으나 본 프로젝트는 npm 기반(`package-lock.json`, `npm run build`) — npm으로 검증.
- GA4 측 ramp-up은 운영자가 별도 처리(이벤트명 cut-over).

## 미구현 항목

- **GA4 DebugView 실제 발사 검증**: 코드 상 `position` 동봉 완료. 실 디바이스에서 GA4 DebugView로 `top_right`/`bottom_center` 파라미터 노출 확인은 운영자 수동 검증 항목.
- **ShareButton 시각 토큰 정합(M5)**: 본 라운드는 검증만 — 토큰 변경 0. ShareButton의 `bg-muted` 사용은 묶음 H lavender/40 활성색 정합과 별개 영역(보조 액션). design.md §시각 토큰 위반 없음 확인.
- **measurement window 종료 알림(should)**: phase-4.5.md §1.9 자동 리포트 통합은 본 spec 범위에서 phase-4.5.md §1.5 갱신으로 한정 — §1.9 리포트 스키마 변경은 묶음 L·M 영역으로 분리.
- **ShareButton 위치 변경 / share_method enum 확장 / 자동 다운스코프 룰**: spec won't에 명시 — 4주 후 별도 라운드.
