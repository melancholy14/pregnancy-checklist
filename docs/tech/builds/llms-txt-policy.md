# llms-txt-policy

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 2026-06-10
> plan: [spec](../../features/llms-txt-policy/spec.md)

<!-- STEP:impl -->
## 구현

> 출처: [docs/features/llms-txt-policy/spec.md](../../features/llms-txt-policy/spec.md)
> 구현일: 2026-06-10

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `out/llms.txt` 생성 + 헤더·Articles·Checklists·Hubs·License 5섹션 포함 | ✅ 완료 | 47줄, 15개 글 전부 포함 |
| `out/robots.txt` 에 5개 AI 크롤러 (`GPTBot`/`ClaudeBot`/`PerplexityBot`/`Google-Extended`/`CCBot`) 각각 `Allow: /` + 기본 `User-Agent: *` 유지 | ✅ 완료 | `MetadataRoute.Robots` 의 `rules` 배열로 변경 |
| 배포 후 라이브 응답 (`curl -I /llms.txt` 200·`text/plain`, `curl /robots.txt` 에 5개 블록) | ⏳ 배포 후 검증 | 정적 export 결과는 빌드 단계에서 확인 |
| 기존 e2e (`seo-sitemap-article-jsonld`, `seo-breadcrumb-jsonld`) 회귀 0건 | ⏳ run-e2e 단계에서 검증 | 빌드 성공 |

### 생성/수정 파일 목록

#### 신규 생성

- `public/llms.txt` — 사이트 한 줄 소개 + 운영자 단락 + Articles 15개 + Checklists 4개 + Hubs 5개 + License 4섹션을 갖춘 정적 파일. NoIndex 페이지(`/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep`)는 제외.
- `이 문서` — 본 문서.

#### 수정

- `src/app/robots.ts` — `MetadataRoute.Robots` 의 `rules` 를 단일 객체에서 배열로 변경. `AI_CRAWLER_USER_AGENTS` 상수에 5개 크롤러 user-agent 를 두고 map 으로 각각 `Allow: /` 룰을 생성. 기본 `User-agent: *, allow: /` 룰은 배열 첫 항목으로 유지.

### 주요 결정 사항

- **수동 작성 옵션 A 채택**: 빌드 타임 스크립트 대신 `public/llms.txt` 를 직접 커밋. 글이 30개를 넘어가는 시점에 옵션 B(스크립트 생성) 재검토 — spec.md §운영자 결정 그대로.
- **AI 크롤러 user-agent 를 별도 상수로 분리**: `AI_CRAWLER_USER_AGENTS` 배열을 모듈 최상단에 두어 향후 크롤러 추가/삭제 시 한 줄만 고치면 되도록 함. `rules` 배열은 spread 로 생성.
- **NoIndex 4개 페이지 명시 제외**: `BREADCRUMB_LABELS` 에 등록되지 않은 `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 는 llms.txt 에서도 누락 — robots noindex 정책과 일관.
- **Articles 요약은 frontmatter `description` 의 핵심 문장으로 트림**: 원문 description 은 1~3문장이지만 llms.txt 가독성을 위해 사이트 콘텐츠를 가장 정확히 요약하는 한 문장으로 줄임. `description` 의 키 정보(수치·출처) 는 그대로 유지.
- **`> https://pregnancy-checklist.com` blockquote 라인 추가**: llmstxt.org 컨벤션상 헤더 바로 아래에 사이트 루트 URL 을 인용 형태로 명시하면 크롤러가 사이트 식별을 더 쉽게 함.

### 가정 사항

- llms.txt 는 `public/` 의 정적 파일이므로 Next.js 의 정적 export 시 `out/llms.txt` 로 그대로 복사된다 (이번 빌드에서 검증 완료).
- AI 크롤러는 `MetadataRoute.Robots` 가 생성한 표준 `User-Agent: X / Allow: /` 형식을 인식한다.
- License 문구는 운영자가 spec.md 에서 확정한 기본안 그대로 사용.

### 미구현 항목

- **`public/llms-full.txt`**: spec §won't 에 따라 본문 통째 노출은 만들지 않음.
- **AI 크롤러 disallow 추가**: 인용 효과 우선 정책에 따라 차단 없음.
- **llms.txt 동적 라우트 (`src/app/llms.txt/route.ts`)**: 정적 파일로 충분, 미도입.
- **GA4 이벤트 추가**: 정적 파일 접근은 GA4 측정 불가, 효과 측정은 GSC·외부 referrer 모니터링으로 한정.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰 대상: [docs/features/llms-txt-policy/spec.md](../../features/llms-txt-policy/spec.md)
> 구현 산출물: [docs/implementation/llms-txt-policy-impl.md](#구현)
> 리뷰일: 2026-06-10

### 리뷰 대상 파일

- `src/app/robots.ts` (수정 — `rules` 배열화 + AI 크롤러 5개 추가)
- `public/llms.txt` (신규 — 정적 텍스트 파일, 47줄)
- `e2e/llms-txt-policy.spec.ts` (신규 — 회귀 가드 9 케이스)

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

없음. 변경 면적이 작고(라우트 함수 + 정적 텍스트) 4가지 관점(타입·성능·보안·접근성) 모두 회색지대 없음.

---

### Suggestion (개선 아이디어)

#### 1. `AI_CRAWLER_USER_AGENTS` 타입 좁히기

- **파일**: `src/app/robots.ts:7-13`
- **현재**: `const AI_CRAWLER_USER_AGENTS = [ ... ]` → `string[]` 추론
- **아이디어**: `as const` 또는 `readonly string[]` 으로 좁히면 향후 오타 방지·중복 추가 방지에 도움
- **판단**: 5개짜리 상수 + 빌드 타임 1회 실행이라 ROI 낮음. 1인 운영 비용 기준상 현 상태 유지 권장 (페르소나 §3.3).

#### 2. llms.txt 갱신 누락 회귀 가드

- **파일**: `e2e/llms-txt-policy.spec.ts:57`
- **현재**: 15개 슬러그를 spec 안 상수에 직접 박아 검증
- **아이디어**: 글이 추가될 때 슬러그 상수 갱신을 잊으면 가드가 안 도는 점. 글 30개 넘어가는 시점에 옵션 B(빌드 타임 스크립트 + `fs.readdirSync(src/content/articles)` 기반 가드)로 전환 검토 — spec §운영자 결정 사항과도 정렬.

#### 3. License 섹션 다국어화

- **파일**: `public/llms.txt:43-46`
- **현재**: 한국어 단문 3줄
- **아이디어**: 영어 병기. AI 크롤러는 다국어 처리하지만 영어 안내가 인용 정책 인식률을 더 높일 수 있음. 효과 측정 어려워 보류.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |

리뷰 종합: 변경 면적 최소(라우트 함수 1개 + 정적 파일 1개), 회귀 가드 9건 통과, 외부 의존성·동적 입력·접근성 surface 모두 해당 없음. 추가 정정 불요.

---

<!-- STEP:refactor -->
## 리팩토링

> 출처: [docs/review/llms-txt-policy-review.md](#코드-리뷰) Suggestion §1
> 리팩토링일: 2026-06-10

### 리팩토링한 파일 목록

- `src/app/robots.ts`

---

### 작업별 내용

#### 1. src/app/robots.ts — `AI_CRAWLER_USER_AGENTS` 타입 좁히기

- **출처**: 추가 판단 (code-review Suggestion §1 승격)
- **무엇을**: `const AI_CRAWLER_USER_AGENTS = [...]` → `const AI_CRAWLER_USER_AGENTS = [...] as const` 한 단어 추가. 추론 타입이 `string[]` → `readonly ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]` 로 좁혀짐.
- **왜**: 동작 변경 없음. 향후 user-agent 오타·중복 추가를 컴파일 타임에서 잡고, IDE 자동완성 시 5개 리터럴이 그대로 표시되어 가독성 향상. 1인 운영 ROI 기준상 한 단어 = 무비용 변경이라 적용.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1 | 1 |
| 최대 파일 줄 수 | 26 | 26 |
| `AI_CRAWLER_USER_AGENTS` 추론 타입 | `string[]` | `readonly ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]` |
| Public interface (`default export`) | `MetadataRoute.Robots` 반환 | 동일 |

---

### 빌드 결과

성공 (1회 시도). `out/robots.txt` 응답 형식 변동 없음.
