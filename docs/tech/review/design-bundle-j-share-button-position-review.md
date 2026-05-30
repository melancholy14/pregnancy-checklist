# design-bundle-j-share-button-position 코드 리뷰

> 작성일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-j-share-button-position/spec.md](../../features/design-bundle-j-share-button-position/spec.md)
> 관련 impl: [docs/implementation/design-bundle-j-share-button-position-impl.md](../implementation/design-bundle-j-share-button-position-impl.md)

## 리뷰 대상 파일

- `src/lib/share.ts`
- `src/components/share/ShareButton.tsx`
- `src/components/share/ShareModal.tsx`
- `src/components/articles/ArticleDetail.tsx` (2개 호출부)
- `src/components/timeline/TimelineContainer.tsx`
- `src/components/checklist/ChecklistPage.tsx`
- `e2e/design-bundle-j-share-button-position.spec.ts`
- (SoT 문서, 리뷰 범위 외) `docs/plan/phase-4.5.md` §1.5, `docs/marketing/ga4.md` §3.C

---

## Critical 이슈 (즉시 수정 완료)

**해당 없음.** Critical 분류 기준(런타임 크래시, 보안 취약점, 잘못된 로직)에 해당하는 항목이 없음.

핵심 안전망 두 가지가 잘 박혀 있음:
- `SharePosition`이 `"top_right" | "bottom_center"` strict union으로 정의되어 enum 외 값은 컴파일 단계에서 차단됨.
- ShareButton의 `position` prop이 default 없는 required로 선언되어 4개 호출부 중 하나라도 누락 시 빌드 실패 — 실제 spec M1 "기본값 없음 — 호출부에서 명시 의무"가 타입 시스템 레벨에서 강제됨.

---

## Warning (수정 권장)

**해당 없음.** 본 라운드 변경분에서 Warning 분류(any, 리렌더 패턴, 미명시 alt/aria-label 등) 항목 미발견.

검토 항목별 결과:
- **타입 안전성**: `any` 사용 0건, `as` 단언 1건(`e2e/...spec.ts:70`의 `(entry[2] as Record<string, unknown>)`) — Playwright의 `IArguments` 인덱스 접근 타입이 opaque하므로 테스트 파일 한정에서 불가피. 비테스트 코드에는 단언 없음.
- **성능**: `triggerShare`/`copyShareLink`는 사용자 클릭 1회당 1회 호출 — 메모이제이션 불필요. 4개 호출부에서 ShareButton은 모달이 닫힌 동안 자식이 없으므로 `handleClick`을 useCallback으로 감싸도 이득 없음.
- **보안**: `position` 값은 컴파일 타임 string literal로만 주입됨(ArticleDetail/TimelineContainer/ChecklistPage 모두 인라인 리터럴) — 사용자 입력이 GA payload에 흘러들 가능성 0. 새로 추가된 `dangerouslySetInnerHTML`/`eval`/`new Function` 없음. NEXT_PUBLIC_ env 추가 없음.
- **접근성**: ShareButton의 `aria-label={label}`, ShareModal의 `aria-label="공유 링크"`/"링크 복사" 기존 유지. 본 라운드는 시각/마크업 변경 0이므로 a11y 회귀 영역 없음.

---

## Suggestion (개선 아이디어)

### 1. `src/lib/share.ts` — `triggerShare`의 `Promise<void>`가 호출부에서 await되지 않음
- `ShareButton.handleClick`에서 `triggerShare(...)`를 호출하지만 await/catch하지 않음. `navigator.share`가 reject되면 (e.g. NotAllowedError) 내부 try/catch가 흡수하므로 unhandled rejection은 발생하지 않지만, 미래에 `triggerShare` 외부에서 throw하는 코드가 추가될 경우 무음 실패 가능성. 본 라운드 변경분이 아니라 기존 패턴이므로 손대지 않음.
- **개선 시점**: 만약 GA 전송 실패에 대한 retry/alert를 추가하게 된다면 그때 함께 변경.

### 2. `e2e/design-bundle-j-share-button-position.spec.ts` — dataLayer 읽기 방식의 부수효과
- `window.dataLayer`를 직접 읽으면 `gtag('js', new Date())`·`gtag('config', ...)` 같은 GA 초기화 entry도 같이 들어 있음. 현재 `entry[0] === "event" && entry[1] === "share_click"` 필터로 안전하게 분리되지만, 향후 SDK가 dataLayer 스키마를 바꾸면 깨질 수 있음.
- **개선 시점**: 만약 SDK 업그레이드 후 테스트가 깨지면 `phase-4-step-4-share.spec.ts`와 헬퍼를 공유 모듈로 추출하면서 함께 정비.

### 3. `docs/marketing/ga4.md` — `position`과 기존 `location` 파라미터의 의미 중복
- SoT의 `share_click`은 이미 `location`(`article-bottom`/`header`) 파라미터를 가지고 있고, 본 라운드가 `position`(`top_right`/`bottom_center`)을 추가함. 두 enum이 의미적으로 겹치지만 vocabulary가 달라 분석 단계에서 혼란 가능. 본 라운드 spec이 명시적으로 `position`을 신설하라고 했으므로 그대로 추가했으나, 실제 코드는 `location`을 발사하지 않음(payload에 없음). 4주 후 다운스코프 라운드에서 `location`은 제거하고 `position`만 남기는 것이 자연스러움.
- **개선 시점**: 4주 measurement window 종료 시점(2026-06-07 전후) 다운스코프 라운드에서 SoT의 `location` 정의를 함께 청소.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 (모두 미래 라운드 권장) |
| 빌드 | 미실행 (Critical 수정 없음 — implement-feature 단계의 빌드 결과 유지) |
| E2E | 9 passed, 1 skipped (run-e2e 단계에서 검증 완료) |
