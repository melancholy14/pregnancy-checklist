# faq-jsonld 리뷰

> 작성일: 2026-06-07
> 결정일: 2026-06-08
> 상태: decided
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)

## 1. 기능 요약
글 frontmatter에 `faq: [{q, a}]` 필드 신설 + 글 페이지에 FAQPage JSON-LD 주입. 기존 5개 글 backfill, 신규 글 작성 절차에 FAQ 입력 룰 추가. AEO(AI Overview·Featured Snippet·"사람들이 묻는 질문") 노출이 목표.

## 2. 적용 페어 + 선택 이유
- **dev × planner**: PR-C의 핵심 결정 — frontmatter schema 추가 vs 운영자 1인의 글 작성 부담. 본문 마크다운 FAQ ↔ frontmatter FAQ의 단일 진실(SSOT)을 어디에 둘지가 영구 영향. 가장 첨예.
- **qa × planner**: schema 변경 + 5개 글 backfill + malformed/누락 frontmatter에 대한 가드 강도. strict 가드는 잘못된 JSON-LD가 SERP·AI로 새는 걸 막고, lenient는 1인 운영자의 발행 flow를 막지 않음.

제외:
- dev × designer: 가시 UI 변경 없음 (JSON-LD는 비가시 마크업).
- planner × marketer / dev × marketer: GA4 이벤트 신규 없음 → 충돌 약함.
- dev × qa: schema versioning 축이 qa × planner와 일부 겹쳐 중복.

## 3. 페어별 충돌

### 페어 1: dev × planner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × planner
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev 인용 후보: §3.2 산출물 우선 원칙, §5.2 (planner) 새 필드 디폴트 정책, §6.6 카피 임의 결정 금지
- planner 인용 후보: §7.4 운영자 경험 기반 발행, §7.3 1차 소스 원칙, §5.2 타입 변경 = 운영 룰 변경
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**T1 — [dev] 단독 입장**

- 잃는 것:
  - 본문 ## 자주 묻는 질문 섹션을 두면 본문 ↔ frontmatter 간 SSOT 깨짐. 한쪽만 갱신하면 JSON-LD가 본문과 어긋남.
  - 자동 파싱(`**Q. ...**` 패턴)으로 가면 추출 실패·중복 위험. 5개 글 패턴 균일 보장 없음.
- 희생 거부 인용: "임시로 개발자 추정값을 박지 않는다. 한 번 박힌 추정값은 산출물 결정 후에도 그대로 남는다." — docs/tech/persona.md §3.2
- 주장:
  - FAQ 데이터는 frontmatter `faq: [{q, a}]` 가 **단일 진실**. 본문 섹션은 frontmatter에서 빌드 시 렌더하거나, 제거하고 frontmatter만 남긴다.
  - `faq` 필드 optional. 누락 글은 JSON-LD 미주입.
  - `ArticleMeta`에 `faq?: { q: string; a: string }[]` 추가 + parser 측 minimum-shape validation.
- 잔재 자기검증: 이전 페어 없음 — N

**T2 — [planner] 반박 입장**

- 반박:
  - 본문 ## 자주 묻는 질문 섹션 제거 안 — 반대. 마크다운 본문은 운영자가 톤·문맥과 함께 다듬는 자리. YAML frontmatter는 emphasis·escape·줄바꿈이 빈약 → 작성 흐름 단절.
  - frontmatter → 본문 자동 렌더 안 — 본문에서 "이 단락 위에 박스 한 줄 추가" 같은 운영자 디테일이 막힘.
- 잃는 것:
  - 운영자가 글 발행 절차에서 frontmatter `faq:` 블록을 별도로 채워야 함 → 신규 글당 추가 5~10분.
  - 기존 5개 글 backfill 시 본문 FAQ ↔ frontmatter FAQ 정합 검수가 운영자 수작업.
- 희생 거부 인용:
  - "PERSONAL EXPERIENCE 비어 있는 글은 발행 금지. 운영자가 경험하지 않은 주제의 draft는 의도적으로 홀딩한다." — docs/content/persona.md §7.4
  - "통계·수치·정책 정보는 1차 소스 없이 인용 금지." — docs/content/persona.md §7.3
- 주장:
  - **본문 ## 자주 묻는 질문 섹션 유지**. frontmatter `faq`는 **JSON-LD 전용 미러**. 운영자가 본문 마크다운에 동일 텍스트를 한 번 더 적는다 (intentional duplication).
  - blog-writer-persona.md에 "FAQ는 frontmatter `faq:`와 본문 ## FAQ 양쪽에 동일 텍스트로 기입. frontmatter가 진실, 본문은 운영자 가독성용" 명시.
  - backfill 범위는 1차 소스가 명확한 글만 우선. 5개 전부 backfill 거부.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**
- **핵심 충돌**: FAQ를 frontmatter ↔ 본문에 **의도적 중복**(planner) vs **frontmatter만 SSOT**(dev). 어느 쪽이든 1인 운영자에게 비용이 새는 방향이 다름.
- **숨은 가정**: 양쪽 다 "운영자가 FAQ를 직접 작성"을 전제. 향후 "기존 본문에서 자동 추출"로 가고 싶어지면 양쪽 안 모두 재설계 필요. 또한 본문 ↔ frontmatter 정합 검증을 빌드 가드로 강제할지 운영자 검수로 둘지 미결.

### 페어 2: qa × planner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: qa × planner
- 이전 페어 [dev × planner] 의 양보·합의는 이 페어에 영향 없음.
- qa 인용 후보: §7.1 빨간 테스트 무시 + skip 사용 시 deadline, §7.4 fs-level grep 가드 보존, §3.6 기존 테스트 영향 분석
- planner 인용 후보: §7.3 1차 소스 원칙, §3.7(마케터) 운영자 번아웃 무시 금지, §5.2 타입 변경 = 운영 룰 변경
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**T1 — [qa] 단독 입장**

- 잃는 것:
  - unit 테스트(`src/lib/__tests__/articles.test.ts` 갱신/추가) + E2E spec(JSON-LD shape 검증) 신규 → 작성 비용 1~2시간.
  - 본문 ⚠️ 박스 금지 가드 등 기존 회귀 가드와 FAQ JSON-LD 텍스트 정합 → 새 패턴이 가드에 잡힐 위험.
- 희생 거부 인용:
  - "schema 변경은 자동으로 §1.2 점검 대상. migration 없으면 spec.md 결정부터 다시." — docs/qa/persona.md §3.6
  - ".skip / xfail로 도배 X. skip 사용 시 제거 조건과 deadline 같이 명시한 TODO 코멘트 필수." — §7.1
  - "fs-level grep 가드는 다른 테스트가 못 잡는 회귀를 막는다. 절대 삭제 X." — §7.4
- 주장:
  - frontmatter `faq` 필드는 minimum-shape validation을 거쳐 parser에서 throw(빌드 fail-fast) 또는 명시적 skip(JSON-LD 미주입). silent corruption(빈 q·a로 JSON-LD 방출) 절대 금지.
  - unit: `parseArticleMeta`가 `faq` 누락/malformed/빈 배열/빈 q·a 4개 시나리오 it.each.
  - E2E: 5개 backfill 글에 FAQPage JSON-LD 주입 + `mainEntity.length === frontmatter.faq.length` 검증. fs-level grep 가드 1개 추가.
  - skip 허용 X. backfill 지연 글은 frontmatter `faq:` 자체를 비워두고 JSON-LD 주입을 skip 분기로만 우회. `test.skip` 금지.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 데이터 위치 결정(SSOT)과 가드 강도 축은 직교.

**T2 — [planner] 반박 입장**

- 반박:
  - "5개 backfill 글에 fs-level grep 가드로 JSON-LD shape를 박는다" — 반대. 1차 소스 검수 전에는 어떤 글이 실제 backfill 될지 미확정. 가드 strict면 backfill마다 가드 수정 동반 → 운영자 번아웃.
  - "parseArticleMeta가 malformed 시 throw" — 반대. 운영자가 글 작성 중 frontmatter 오타 한 줄에 전체 빌드 막힘. silent skip + 콘솔 warn이 1인 운영에 맞는 균형.
- 잃는 것:
  - 가드 약하게 잡으면 ChatGPT/Perplexity가 잘못된 FAQ JSON-LD를 학습해 사이트 신뢰도 깎임.
  - backfill 일정·범위 운영자 통제는 살아나지만, 잘못된 JSON-LD의 책임도 운영자 검수에 의존.
- 희생 거부 인용:
  - "통계·수치·정책 정보는 1차 소스 없이 인용 금지." — docs/content/persona.md §7.3
  - "1인 운영자 지속가능성 = 서비스 지속가능성." — docs/marketing/persona.md §3.7
- 주장:
  - backfill 범위는 운영자가 글 단위로 결정. 5개 중 frontmatter `faq:` 비어 있는 상태도 정상 분기.
  - parser는 malformed → silent skip + 콘솔 warn. 빌드 fail-fast 거부.
  - E2E 가드는 "5개에 FAQ JSON-LD 있어야" absolute count 거부. "frontmatter `faq:`가 있으면 JSON-LD 주입되어야" if-then 가드만 허용.
  - skip 정책: qa의 "frontmatter 비워두기" 방식 OK. blog-writer-persona.md에 "FAQ는 1차 소스 확인 후 추가, 미확인이면 비워둔다" 룰 추가.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 페어 1은 데이터 위치, 페어 2는 가드 강도. 직교.

**T3 — 핵심 충돌 + 숨은 가정**
- **핵심 충돌**: malformed/누락 FAQ에 대한 가드를 **strict**(qa: 빌드 fail-fast + fs-level grep + skip 금지) vs **lenient**(planner: silent skip + 콘솔 warn + if-then 가드).
- **숨은 가정**: GitHub Actions 빌드는 push마다 자동이므로 fail-fast가 운영자에게 즉시 도달하는 강도는 다름. "콘솔 warn"이 Vercel 빌드 로그를 보지 않으면 운영자에게 도달 안 됨 — 확인 안 됨.

## 4. 미해결 트레이드오프

- [ ] **항목 1: FAQ 데이터의 단일 진실 위치**
  - 옵션 A — **frontmatter SSOT + 본문 자동 렌더 제거**: 본문 `## 자주 묻는 질문` 섹션 삭제, frontmatter `faq:` 만 보유, ArticleDetail에서 그 데이터로 본문 렌더.
    - 즉시 비용: 5개 글 본문에서 FAQ 마크다운 섹션 제거, ArticleDetail 렌더링 로직 추가, 운영자 기존 글 흐름 깨짐.
    - 나중 비용: 운영자가 본문 톤·박스·강조를 frontmatter YAML에서 작성해야 함 → 작성 자유도 ↓, 신규 글 작성 부담 영구.
  - 옵션 B — **frontmatter SSOT + 본문 중복 작성 (intentional duplication)**: 본문 `## 자주 묻는 질문` 유지, frontmatter `faq:` 별도 기입, frontmatter가 진실(JSON-LD 전용), 본문은 운영자 가독성용.
    - 즉시 비용: 신규 글당 운영자가 동일 텍스트 2번 적음 → 글당 5~10분 추가.
    - 나중 비용: 본문 ↔ frontmatter 정합성 운영자 검수 의존 (또는 빌드 가드 — 항목 3과 연동).
  - 옵션 C — **본문 SSOT + 자동 파싱**: 본문 `**Q. ... ?**` 패턴을 빌드 시 파싱해 JSON-LD 생성. frontmatter `faq` 필드 없음.
    - 즉시 비용: 파싱 로직 작성 + 5개 글 패턴 균일화 + edge case 처리.
    - 나중 비용: 추출 실패·중복 위험 (PR-C 원 plan에서 명시적으로 거부한 안). 운영자가 본문 포맷을 바꾸면 silent break.
  - **결정:** A

- [ ] **항목 2: backfill 범위와 발행 게이트**
  - 옵션 A — **5개 글 동시 backfill (PR-C 일괄)**: 원 plan 5개 후보 모두 한 PR에 backfill. 1차 소스 검수도 PR 안에서.
    - 즉시 비용: 운영자가 PR 안에서 5개 글 FAQ 답변의 1차 소스 일괄 검수 → 2~3시간 집중 작업.
    - 나중 비용: 한 글의 1차 소스 부족으로 backfill 어긋나면 PR 진행이 그 글에 묶임.
  - 옵션 B — **글 단위 점진 backfill (인프라 PR + 글 PR 분리)**: PR-C는 schema·parser·JSON-LD 주입 인프라만. 글별 backfill은 별도 PR(또는 글 갱신 시).
    - 즉시 비용: PR 수 2~6개로 분산. 인프라 PR 단독 머지 시 JSON-LD가 0개 글에 주입됨 (AEO 효과 지연).
    - 나중 비용: 글 단위 backfill이 운영자 다른 작업에 묻혀 long-tail로 흐를 위험 (산후 휴면 직전).
  - 옵션 C — **의학 글만 backfill 우선 (1차 소스 확보 명확)**: early-pregnancy-tests, early-pregnancy-fatigue-reasons, pregnancy-foods-to-avoid 3개부터. 정부·이벤트성 글(2026-parental-leave-guide, babyfair-survival-guide)은 별도 PR로 후순위.
    - 즉시 비용: 3개 글 우선 검수. 인프라 + 3개 backfill 1 PR.
    - 나중 비용: 정부 정책·이벤트 글은 시점 변동성이 크므로 별도 일정 필요. 산후 휴면 들어가면 후순위 backfill이 발행 안 될 수 있음.
  - **결정:** A

- [ ] **항목 3: malformed/누락 frontmatter `faq:` 처리 정책**
  - 옵션 A — **strict (빌드 fail-fast + fs-level grep 가드 + skip 금지)**: parser에서 schema 위반 시 throw → GitHub Actions 빌드 실패. fs-level grep 가드로 5개 글에 FAQPage JSON-LD 주입 확인. `test.skip` 금지.
    - 즉시 비용: 운영자가 글 한 줄 오타로 전체 배포 막힘. 가드 작성 비용.
    - 나중 비용: 빌드 실패가 즉시 운영자에게 도달(GitHub Actions notification) → 디버깅 흐름 명확. JSON-LD 무결성 강력 보장.
  - 옵션 B — **lenient (silent skip + 콘솔 warn + if-then 가드)**: parser는 malformed → 해당 글의 `faq` 필드를 무시(미주입). 콘솔 warn만. E2E 가드는 "frontmatter `faq:`가 있으면 JSON-LD 주입"의 if-then만.
    - 즉시 비용: 운영자 발행 flow가 막히지 않음. 가드 작성 비용 낮음.
    - 나중 비용: Vercel 빌드 로그 안 보면 silent break — 잘못된 형식이 frontmatter에 들어가도 모르고 발행. AEO 효과 누락 알아채는 게 늦음.
  - 옵션 C — **hybrid (parser는 lenient, 별도 빌드 사전 점검 스크립트)**: parser는 옵션 B처럼 silent skip + warn. 별도 `npm run check:faq` 스크립트가 frontmatter `faq:` 유효성을 보고하지만 배포 차단은 안 함. 운영자가 발행 전 수동 호출.
    - 즉시 비용: 점검 스크립트 1개 작성. 운영자 사용 룰을 blog-writer-persona.md에 추가.
    - 나중 비용: 운영자가 스크립트 호출을 잊으면 옵션 B와 같음. 자동 실행 안 됨.
  - **결정:** A

## 5. 결정
> 페이즈 4 휴먼 게이트에서 운영자가 §4의 결정란을 모두 A/A/A로 확정 (2026-06-08).

- **항목 1 결정: A** — frontmatter SSOT + 본문 자동 렌더 제거. 5개 글 본문에서 `## 자주 묻는 질문` 섹션 제거하고 `ArticleDetail`에서 frontmatter `faq:` 배열로 본문 FAQ 영역을 렌더한다.
- **항목 2 결정: A** — 5개 글 동시 backfill (PR-C 일괄). 1차 소스 검수도 PR 안에서 수행하고, 한 글이라도 1차 소스 부족이면 그 글 자체를 발행 전에 보강한다.
- **항목 3 결정: A** — strict 정책. parser는 schema 위반 시 throw하고 GitHub Actions 빌드를 fail-fast 시킨다. fs-level grep 가드로 5개 backfill 글에 `FAQPage` JSON-LD 주입을 강제 확인한다. `test.skip` / `it.skip` 금지(skip 필요 시 제거 deadline + 조건 TODO 코멘트 필수, qa 페르소나 §7.1).

## 6. 우선순위 영향
- 항목 1이 옵션 A(SSOT + 자동 렌더)로 결정되면 ArticleDetail.tsx 렌더링 변경이 동반 → spec.md "기능 요구사항"에 본문 렌더링 로직 추가 + 향후 PR-B(BreadcrumbList) 작업 시 ArticleDetail 인터페이스 안정성 가정에 영향.
- 항목 2가 옵션 B/C(점진 backfill)로 결정되면 PR-C는 인프라 PR만 머지되고 AEO 효과 발현이 1~2주 추가 지연 → 산후 휴면 시작 전 측정 데이터 부족 가능성. update-seo-aeo-geo.md "권장 실행 순서" 표 갱신 필요.
- 항목 3이 옵션 A(strict)로 결정되면 GitHub Actions에 `npm run test:unit` 게이트가 강화됨 → 같은 빌드 파이프라인에서 다른 PR들의 머지 속도에 영향.
