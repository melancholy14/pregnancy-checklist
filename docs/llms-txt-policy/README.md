# llms-txt-policy

> 작성일: 2026-06-10 | 작성자: Claude Code
> 출처: [docs/features/llms-txt-policy/spec.md](../features/llms-txt-policy/spec.md) (PR-F · GEO)

## 개요

AI 크롤러(ChatGPT Search · Perplexity · Claude · Google AI Overview)가 사이트에 도달했을 때 인용해야 할 핵심 페이지를 명시적으로 안내하기 위한 정책 파일을 도입한다. `public/llms.txt` 정적 파일에 사이트 소개·핵심 URL 목록·인용 라이선스를 두고, `src/app/robots.ts` 에 5개 AI 크롤러(GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot) 각각의 `Allow: /` 룰을 추가한다. 비용 0·downside 0 (인용 받기 위해 차단은 풀어둠).

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `out/llms.txt` 생성 + 헤더·Articles·Checklists·Hubs·License 5섹션 포함 | ✅ 완료 | 47줄, 15개 글 전부 포함 |
| `out/robots.txt` 에 5개 AI 크롤러 각각 `Allow: /` + 기본 `User-Agent: *` 유지 | ✅ 완료 | `MetadataRoute.Robots` 의 `rules` 배열로 변경 |
| 배포 후 라이브 응답 (`curl -I /llms.txt` 200·`text/plain`, `curl /robots.txt` 5개 블록) | ⏳ 배포 후 검증 | 정적 export 결과는 빌드 단계에서 확인 |
| 기존 e2e (`seo-sitemap-article-jsonld`, `seo-breadcrumb-jsonld`) 회귀 0건 | ✅ 완료 | 19 passed / 0 failed |

### 생성/수정 파일

**신규 생성**
- `public/llms.txt` — 사이트 소개 + Articles 15개 + Checklists 4개 + Hubs 5개 + License 5섹션.
- `e2e/llms-txt-policy.spec.ts` — 회귀 가드 9 케이스.
- `docs/implementation/llms-txt-policy-impl.md` · `docs/review/llms-txt-policy-review.md` · `docs/refactor/llms-txt-policy-refactor.md`.

**수정**
- `src/app/robots.ts` — `MetadataRoute.Robots` 의 `rules` 단일 객체 → 배열. `AI_CRAWLER_USER_AGENTS` 상수에 5개 user-agent. 기본 `*` 룰 첫 항목으로 유지.

### 주요 결정 사항

- **수동 작성 옵션 A 채택**: 빌드 타임 스크립트 대신 `public/llms.txt` 를 직접 커밋. 글 30개 넘어가는 시점에 옵션 B(스크립트 생성) 재검토.
- **AI 크롤러 user-agent 를 별도 상수로 분리**: 향후 크롤러 추가/삭제 시 한 줄만 고치면 되도록 `AI_CRAWLER_USER_AGENTS` 배열 + spread 패턴.
- **NoIndex 4개 페이지 명시 제외**: `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 는 llms.txt 에서도 누락 — robots noindex 정책과 일관.
- **Articles 요약은 description 핵심 문장으로 트림**: 가독성 우선, 수치·출처 정보는 보존.

### 가정 사항 및 미구현 항목

- 가정: llms.txt 는 `public/` 의 정적 파일이라 Next.js 정적 export 시 `out/llms.txt` 로 그대로 복사된다 (이번 빌드에서 검증).
- 미구현 (spec §won't): `public/llms-full.txt`, AI 크롤러 disallow, 동적 라우트(`src/app/llms.txt/route.ts`), GA4 이벤트 추가.

---

## 코드 리뷰 결과

### Critical 이슈
없음.

### Warning (수정 권장)
없음. 변경 면적이 작고(라우트 함수 + 정적 텍스트) 타입·성능·보안·접근성 회색지대 없음.

### 전체 요약
| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 (`as const` 적용·글 30+ 시점 동적 가드 전환·License 영문 병기) |

---

## 리팩토링 내용

### 작업 목록

1. **`src/app/robots.ts` — `AI_CRAWLER_USER_AGENTS` 타입 좁히기**
   - 무엇을: `as const` 한 단어 추가. 추론 타입이 `string[]` → `readonly ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]` 로 좁혀짐.
   - 왜: 동작 변경 없음. 향후 user-agent 오타·중복 추가를 컴파일 타임에서 잡음. 한 단어 = 무비용 변경.

### 변경 전/후 구조

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1 | 1 |
| 최대 파일 줄 수 | 26 | 26 |
| `AI_CRAWLER_USER_AGENTS` 추론 타입 | `string[]` | `readonly ["GPTBot", ...]` |
| Public interface | `MetadataRoute.Robots` 반환 | 동일 |

---

## E2E 테스트 결과

| 시나리오 | 결과 |
|----------|------|
| Happy Path | ✅ 6개 passed (llms.txt 200/text-plain · 5 섹션 · 15 articles · checklists+hubs · robots 5 블록 · Sitemap 라인) |
| Error/Validation (회귀 가드) | ✅ 3개 passed (NoIndex 4 페이지 제외 · llms-full.txt 404 · AI 크롤러 Disallow 부재) |
| 권한/인증 | — (정적 텍스트, 인증 분기 없음) |
| 반응형 | — (text/plain, viewport 무관) |
| **전체** | **9 passed / 0 failed (1.0s)** |

회귀 검증: `seo-sitemap-article-jsonld` + `seo-breadcrumb-jsonld` 19 passed / 2 skipped(권한 분기 없음) / 0 failed.

📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서
없음.
