# llms-txt-policy Implementation

> 출처: [docs/features/llms-txt-policy/spec.md](../../features/llms-txt-policy/spec.md)
> 구현일: 2026-06-10

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| `out/llms.txt` 생성 + 헤더·Articles·Checklists·Hubs·License 5섹션 포함 | ✅ 완료 | 47줄, 15개 글 전부 포함 |
| `out/robots.txt` 에 5개 AI 크롤러 (`GPTBot`/`ClaudeBot`/`PerplexityBot`/`Google-Extended`/`CCBot`) 각각 `Allow: /` + 기본 `User-Agent: *` 유지 | ✅ 완료 | `MetadataRoute.Robots` 의 `rules` 배열로 변경 |
| 배포 후 라이브 응답 (`curl -I /llms.txt` 200·`text/plain`, `curl /robots.txt` 에 5개 블록) | ⏳ 배포 후 검증 | 정적 export 결과는 빌드 단계에서 확인 |
| 기존 e2e (`seo-sitemap-article-jsonld`, `seo-breadcrumb-jsonld`) 회귀 0건 | ⏳ run-e2e 단계에서 검증 | 빌드 성공 |

## 생성/수정 파일 목록

### 신규 생성

- `public/llms.txt` — 사이트 한 줄 소개 + 운영자 단락 + Articles 15개 + Checklists 4개 + Hubs 5개 + License 4섹션을 갖춘 정적 파일. NoIndex 페이지(`/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep`)는 제외.
- `docs/tech/implementation/llms-txt-policy-impl.md` — 본 문서.

### 수정

- `src/app/robots.ts` — `MetadataRoute.Robots` 의 `rules` 를 단일 객체에서 배열로 변경. `AI_CRAWLER_USER_AGENTS` 상수에 5개 크롤러 user-agent 를 두고 map 으로 각각 `Allow: /` 룰을 생성. 기본 `User-agent: *, allow: /` 룰은 배열 첫 항목으로 유지.

## 주요 결정 사항

- **수동 작성 옵션 A 채택**: 빌드 타임 스크립트 대신 `public/llms.txt` 를 직접 커밋. 글이 30개를 넘어가는 시점에 옵션 B(스크립트 생성) 재검토 — spec.md §운영자 결정 그대로.
- **AI 크롤러 user-agent 를 별도 상수로 분리**: `AI_CRAWLER_USER_AGENTS` 배열을 모듈 최상단에 두어 향후 크롤러 추가/삭제 시 한 줄만 고치면 되도록 함. `rules` 배열은 spread 로 생성.
- **NoIndex 4개 페이지 명시 제외**: `BREADCRUMB_LABELS` 에 등록되지 않은 `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 는 llms.txt 에서도 누락 — robots noindex 정책과 일관.
- **Articles 요약은 frontmatter `description` 의 핵심 문장으로 트림**: 원문 description 은 1~3문장이지만 llms.txt 가독성을 위해 사이트 콘텐츠를 가장 정확히 요약하는 한 문장으로 줄임. `description` 의 키 정보(수치·출처) 는 그대로 유지.
- **`> https://pregnancy-checklist.com` blockquote 라인 추가**: llmstxt.org 컨벤션상 헤더 바로 아래에 사이트 루트 URL 을 인용 형태로 명시하면 크롤러가 사이트 식별을 더 쉽게 함.

## 가정 사항

- llms.txt 는 `public/` 의 정적 파일이므로 Next.js 의 정적 export 시 `out/llms.txt` 로 그대로 복사된다 (이번 빌드에서 검증 완료).
- AI 크롤러는 `MetadataRoute.Robots` 가 생성한 표준 `User-Agent: X / Allow: /` 형식을 인식한다.
- License 문구는 운영자가 spec.md 에서 확정한 기본안 그대로 사용.

## 미구현 항목

- **`public/llms-full.txt`**: spec §won't 에 따라 본문 통째 노출은 만들지 않음.
- **AI 크롤러 disallow 추가**: 인용 효과 우선 정책에 따라 차단 없음.
- **llms.txt 동적 라우트 (`src/app/llms.txt/route.ts`)**: 정적 파일로 충분, 미도입.
- **GA4 이벤트 추가**: 정적 파일 접근은 GA4 측정 불가, 효과 측정은 GSC·외부 referrer 모니터링으로 한정.
