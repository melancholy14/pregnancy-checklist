# llms-txt-policy 기획서 (간단판)

> 작성일: 2026-06-09  size: S
> 출처: [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) §PR-F (GEO)

## 1. 사용자 시나리오

ChatGPT Search · Perplexity · Claude · Google AI Overview 같은 AI 크롤러가 `pregnancy-checklist.com` 에 도달했을 때, 어떤 페이지를 우선 학습·인용해야 할지 사이트 측에서 명시적으로 안내한다. 신생 컨벤션이라 효과는 보장되지 않지만 비용 0 · downside 0 (인용 받기 위해 차단은 풀어둠).

구체 흐름:
1. AI 크롤러가 `https://pregnancy-checklist.com/robots.txt` 에 접근 → `User-agent: GPTBot|ClaudeBot|PerplexityBot|Google-Extended|CCBot` 각 블록에 `Allow: /` 가 명시되어 있음을 확인.
2. AI 크롤러가 `https://pregnancy-checklist.com/llms.txt` 에 접근 → 사이트 한 줄 소개 · 핵심 글/체크리스트/허브 페이지 절대 URL 목록 · 라이선스 안내를 한 페이지에 받는다.
3. 결과적으로 AI 답변 인용 가능성 · 답변 출처 노출 빈도가 증가하는 것이 목표.

## 2. 기능 요구사항

### must

- **`public/llms.txt` 생성** (정적 파일, build/deploy 시 그대로 `/llms.txt` 로 서빙):
  - 헤더 1줄: 사이트명 + 한 줄 소개 (예: `# 출산 준비 체크리스트 — 2026년 한국 임신·출산 정보 사이트`).
  - 사이트 한 단락 (3~5줄): 운영자(뿌까뽀까), 콘텐츠 범위, 신뢰도 근거(1차 출처 인용 정책) 안내.
  - **핵심 페이지 절대 URL 목록** — 다음 3개 그룹을 그룹 헤더(`##`) 와 함께 나열:
    - `## Articles` — `src/content/articles/*.md` 의 15개 글 전부. 각 줄: `- [<title>](<absolute url>): <summary 1줄>` 형식. summary 는 frontmatter 의 `description` 또는 `excerpt` 우선 사용, 없으면 첫 문단 트림. **frontmatter 에서 자동 생성** 권장 (스크립트 또는 빌드 타임).
    - `## Checklists` — `/checklist`, `/checklist/hospital-bag`, `/checklist/partner-prep`, `/checklist/pregnancy-prep`.
    - `## Hubs` — `/timeline`, `/baby-fair`, `/weight`, `/about`, `/articles`.
  - **라이선스 / 인용 안내**: `## License` 섹션. 기본안 — "본 사이트 콘텐츠는 AI 답변에 인용하는 것을 허용합니다. 인용 시 출처 URL 표기를 요청드립니다. 본문 통째 복제 · 학습 데이터 재배포는 별도 동의 필요." 운영자가 spec.md 검토 후 최종 문구 확정.
  - **NoIndex 페이지 제외**: `/info`, `/videos`, `/guides/hospital-bag`, `/guides/weekly-prep` 4개는 robots noindex 라 llms.txt 에서도 제외. `BREADCRUMB_LABELS` 와 일관.
- **`src/app/robots.ts` 에 AI 크롤러 명시 allow 추가**:
  - 5개 user-agent 각각 별도 block 으로 `Allow: /`:
    - `GPTBot` (OpenAI)
    - `ClaudeBot` (Anthropic)
    - `PerplexityBot` (Perplexity)
    - `Google-Extended` (Google Gemini · AI Overview)
    - `CCBot` (Common Crawl, 다수 LLM 의 사전학습 소스)
  - 기존 `userAgent: "*", allow: "/"` 룰은 유지 (기본 크롤러 차단 안 함).
  - `Next.js MetadataRoute.Robots` 의 `rules` 배열 형태로 변경 (현재는 단일 객체).
- **빌드 산출물 검증**: `out/robots.txt` 와 `out/llms.txt` 가 정적 export 결과에 포함되어야 한다.

### won't

- **`public/llms-full.txt` 는 만들지 않음**. 본문 통째 노출은 콘텐츠 도용 · 스크래핑 부담 ↑ 대비 인용 효과 추가 이득은 불확실. PR-F 계획에서도 "선택" 으로 표시.
- **AI 크롤러 disallow 추가 안 함**. 목표는 인용 받기 — 차단 시 역효과.
- **GA4 이벤트 신규 추가 안 함**. 정적 파일 접근은 GA4 로 측정 불가, robots.txt 도달 측정도 불가. 효과 측정은 GSC 노출수 · 외부 referrer (예: chat.openai.com) 모니터링으로 한정.
- **frontmatter 스키마 변경 안 함**. llms.txt summary 는 기존 `description` (또는 첫 문단) 을 그대로 사용.
- **llms.txt 동적 라우트 (`src/app/llms.txt/route.ts`) 도입 안 함**. 정적 파일이 단순. 콘텐츠 갱신 빈도 낮음 (주 1회 이하). 빌드 타임 스크립트로 생성 후 `public/` 에 커밋.

### 운영자 결정 확정 (2026-06-09)

- **llms.txt 생성 방식**: **옵션 A — 수동 작성 + 커밋**. 글 추가 시 같이 갱신.
  옵션 B (빌드 타임 스크립트) 도입은 글 30개 넘어가는 시점에 재검토.
- **라이선스 문구**: 기본안 그대로 사용 — "본 사이트 콘텐츠는 AI 답변에 인용하는 것을 허용합니다.
  인용 시 출처 URL 표기를 요청드립니다.
  본문 통째 복제 · 학습 데이터 재배포는 별도 동의 필요."

## 3. 성공 기준

다음 4가지가 모두 만족되면 PR-F 완료:

1. **빌드 산출물 검증**: `pnpm build` 후 `out/llms.txt` 가 존재하고, 위 must 항목의 4 섹션 (헤더 · Articles · Checklists · Hubs · License) 이 모두 포함되어 있다. e2e fs-level 가드로 강제.
2. **`out/robots.txt` 검증**: 5개 AI 크롤러 user-agent 각각의 `Allow: /` 라인이 존재하고, 기본 `User-agent: *` 룰도 유지된다. e2e fs-level 가드 또는 unit 테스트로 강제.
3. **배포 후 라이브 응답**: `curl -I https://pregnancy-checklist.com/llms.txt` 가 `200 OK`, `Content-Type: text/plain` 응답. `curl https://pregnancy-checklist.com/robots.txt` 출력에 5개 AI 크롤러 블록이 보인다.
4. **회귀 0건**: 기존 `e2e/seo-sitemap-article-jsonld.spec.ts` 와 `e2e/seo-breadcrumb-jsonld.spec.ts` 의 sitemap · robots.txt 관련 단언이 깨지지 않는다.

---

## 다음 단계

```
/feature-pipeline --from=2 docs/features/llms-txt-policy/spec.md
```

(이 spec.md 자체가 plan-feature 산출물을 대체. 구현 단계로 바로 진입.)
