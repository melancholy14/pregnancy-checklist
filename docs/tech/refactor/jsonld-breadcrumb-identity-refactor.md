# jsonld-breadcrumb-identity 리팩토링

> 리팩토링일: 2026-06-09
> 관련 review: [docs/review/jsonld-breadcrumb-identity-review.md](../review/jsonld-breadcrumb-identity-review.md)

## 리팩토링한 파일 목록

- `src/lib/breadcrumb-labels.ts`

---

## 작업별 내용

### 1. `src/lib/breadcrumb-labels.ts` — `HOME_LABEL` 상수 제거 + dead 매핑 통합

- **출처**: 추가 판단 (review.md Suggestion #1 — 본 PR scope 내).
- **무엇을**:
  - 모듈 상단의 `const HOME_LABEL = "홈"` 선언 제거.
  - `homeItem()` 헬퍼가 `BREADCRUMB_LABELS["/"]` 를 직접 참조하도록 변경.
- **왜**:
  - 변경 전: `"홈"` 리터럴이 `HOME_LABEL` 과 `BREADCRUMB_LABELS["/"]` 두 곳에 중복. 라벨 변경 시 두 군데 동기화 필요.
  - 변경 전: `BREADCRUMB_LABELS["/"]` 항목이 dead entry 였음 — 런타임에 루트 분기는 `homeItem()` 으로만 처리(line 44), 매핑 dictionary 의 `"/"` 키는 읽히지 않음.
  - 변경 후: `BREADCRUMB_LABELS` 가 모든 라벨의 단일 SoT. `homeItem()` 도 이를 참조 → 라벨 변경 시 한 곳만 갱신.
- **동작 변화**: 0. unit 20/20, e2e 32/32 통과 그대로.

---

## review.md Warning 처리 사유

review.md 의 Warning 3건은 모두 본 PR 범위 밖으로 명시되어 있어 본 refactor 작업에서 처리하지 않음.

| Warning | 사유 |
|---|---|
| #1 JSON.stringify XSS hardening | codebase-wide 패턴 — 기존 `ArticleJsonLd`/`FaqPageJsonLd`/GA 스크립트도 같은 패턴. 별도 PR 에서 공통 helper 일괄 도입 권장. |
| #2 about 페이지 WebSite/Person 중복 | spec.md §7 가 BreadcrumbJsonLd 추가만 지시, 기존 `AboutJsonLd` 제거 명시 X. 운영자 SNS 공개 결정과 함께 후속 PR. |
| #3 `BREADCRUMB_LABELS["/articles"]` 직접 접근 | `Record<string, string>` 타입 → `as const` literal union 으로 변경하려면 함수 시그니처/index 접근 패턴 전체 재구성 필요. 본 PR scope 밖 cleanup. |

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1개 | 1개 (변경 없음) |
| 라인 수 | 84줄 | 81줄 |
| `"홈"` 리터럴 출현 | 2회 (HOME_LABEL + BREADCRUMB_LABELS["/"]) | 1회 (BREADCRUMB_LABELS["/"] 단일 SoT) |
| dead 매핑 항목 | 1개 (BREADCRUMB_LABELS["/"] 읽히지 않음) | 0개 (homeItem 이 참조) |

---

## 빌드 결과

✅ 성공 (1회 시도)
- `next build` 완료, 36 페이지 prerender 정상.
- TypeScript strict 통과.

## 테스트 회귀 (다음 단계 run-e2e 에서 재검증 예정)

- Unit: `src/lib/__tests__/breadcrumb-labels.test.ts` — Phase 5 (직전 run-e2e) 기준 20/20 통과. 본 refactor 는 public API 변경 0 이므로 통과 유지 예상.
- E2E: `seo-breadcrumb-jsonld.spec.ts` + 갱신 spec 2 개 — Phase 5 기준 32/32 통과. 동일.
