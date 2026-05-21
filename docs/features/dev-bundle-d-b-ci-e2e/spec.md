# dev-bundle-d-b-ci-e2e 기획서

> 작성일: 2026-05-17  size: M
> 관련 리뷰: [review.md](./review.md)

## review.md 결정사항 참조

1. **자동 배포 게이트**: gh-pages 자동화 도입. `deploy` job은 **main 브랜치 + push 이벤트**에서만 트리거, `build-test` job 통과 후에만 실행. PR 단계 deploy 실행 X.
2. **Secrets 누락 처리**: fail-fast. 워크플로 초반 `verify-secrets` step에서 필수 secret 미설정 시 즉시 실패.
3. **CI 시간 가드레일**: 5분 초과 시 분할 권장. npm cache + Playwright browser cache 1차 최적화. workers 병렬화는 별도 라운드.
4. **회귀 spec 양분기**: 거부 + 수락 + 외부 요청 발생 + 모바일. response status는 미assert.
5. **수락 분기 env 가드**: 환경변수 미설정 시 수락 분기 테스트 `test.skip`. 거부 분기는 항상 실행.
6. **Secrets 가이드 위치**: `docs/ops/github-secrets.md`.
7. **워크플로 통합**: 기존 `deploy-gh-pages.yml` 삭제, `ci.yml` 단일 파일에 build-test + deploy 2 jobs. deploy는 `peaceiris/actions-gh-pages@v4` 채택. PR 머지 게이트는 `deploy.needs: build-test`.
8. **Secret 이름**: 기존 컨벤션 유지 — `GA_MEASUREMENT_ID`/`ADSENSE_CLIENT_ID`/`FEEDBACK_FORM_URL` (NEXT_PUBLIC_ 접두 X). 워크플로 env로 `NEXT_PUBLIC_*` 매핑. 재등록 0건.
9. **npm install**: `npm ci --legacy-peer-deps` (date-fns vs react-day-picker peer 충돌 회피).
10. **Lint 정책**: `npm run lint` step은 `continue-on-error: true` (soft signal). 현재 4건 잔존 부채 (CookieConsentBanner / TimelineContainer×2 / sidebar) — D-Mn1 영역. eslint.config.mjs에 `.claude/**` ignore 추가로 worktree 노이즈 26건 제거. tsc / playwright는 hard fail 유지.

---

## 1. 배경·목적

- **운영자**: phase-4.5 잔여 자동화·회귀 안전망 마감. 수동 `npm run deploy` + `npx serve out -l 3000 → npx playwright test` 2-step 흐름을 1-step로 통합.
- **측정**: D-M3 회귀 spec이 컴플라이언스(쿠키 동의 거부 시 GA·AdSense 미주입) 회귀를 자동 탐지. ConsentGatedScripts/AdUnit/layout.tsx 분기 깨짐 즉시 빨강.
- **차단되는 작업**: phase-4.6 진입 조건 중 하나(D-Data 누적 ~2026-05-26 + D-B 마감). 본 라운드 완료 시 phase-4.5 사실상 마감.

## 2. 사용자 시나리오

운영자(개발자) 관점 시나리오:

- **시나리오 1 (PR 머지 게이트)**: 운영자 feature 브랜치 push → PR 생성 → `build-test` job 자동 실행 (tsc/eslint/build/playwright). 통과 시 머지 가능. 실패 시 PR 단계에서 가로막힘.
- **시나리오 2 (main 자동 배포)**: PR이 main에 머지 → `build-test` job 재실행 + 통과 후 `deploy` job 자동 트리거 → `gh-pages -d out` 푸시 → `pregnancy-checklist.com` 갱신. 수동 `npm run deploy` 불필요.
- **시나리오 3 (Secrets 누락)**: 운영자가 신규 secret을 깜빡 누락 → `verify-secrets` step에서 즉시 실패 → 워크플로 마지막 단계까지 가지 않음. 메시지에 어떤 secret이 빠졌는지 명시.
- **시나리오 4 (E2E 실패 디버깅)**: CI playwright 실패 → screenshot/video/trace가 `playwright-artifacts-<run_id>` 아티팩트로 업로드 → 운영자가 Actions UI에서 다운로드해서 로컬 분석.
- **시나리오 5 (로컬 단독 실행)**: 운영자가 `npx playwright test` 단독 실행 → webServer가 `out/` 부재 시 자동 빌드 + serve 시작 → 테스트 종료 시 자동 종료. 별도 터미널 불필요.
- **시나리오 6 (동의 거부 회귀)**: 누군가 ConsentGatedScripts 분기를 잘못 건드림 → `e2e/consent-rejection.spec.ts` 빨강 → CI 차단 → 컴플라이언스 위반 prod 도달 차단.

## 3. 기능 요구사항

---

### §D-M1. GitHub Actions CI/CD

#### must

- **신규 파일**: `.github/workflows/ci.yml`
- **삭제 파일**: `.github/workflows/deploy-gh-pages.yml` (기존 deploy 워크플로 — ci.yml deploy job으로 흡수)
- **트리거**:
  - `pull_request` (대상 브랜치 무관, 모든 PR)
  - `push: branches: [main]` (deploy job 트리거용)
- **권한 (deploy job 한정)**: `contents: write` (gh-pages 브랜치 푸시)
- **Jobs 구조 (2개)**:
  1. **`build-test`** (모든 트리거)
     - `actions/checkout@v4`
     - `actions/setup-node@v4` (node 20, cache: npm)
     - **verify-secrets step (fail-fast)**: `GA_MEASUREMENT_ID`, `ADSENSE_CLIENT_ID`, `FEEDBACK_FORM_URL` 3종 (NEXT_PUBLIC_ 접두 X — 기존 컨벤션) 미설정 시 워크플로 실패. shell `:` 기본값 누락 패턴 사용.
     - `npm ci --legacy-peer-deps` (date-fns vs react-day-picker peer 충돌 회피, 기존 워크플로와 동일)
     - `npx tsc --noEmit`
     - `npm run lint`
     - `npm run build` (env에서 `NEXT_PUBLIC_*` 로 매핑된 값이 baked-in)
     - **Playwright browser cache**: `actions/cache@v4` — `~/.cache/ms-playwright` 키 `pw-${runner.os}-${@playwright/test version}-chromium`
     - `npx playwright install --with-deps chromium` (캐시 hit 시 system deps만 별도 step)
     - `npx playwright test`
     - **실패 시 아티팩트 업로드**: `actions/upload-artifact@v4` — `test-results/`, `playwright-report/` 14일 retention.
     - `timeout-minutes: 15`
  2. **`deploy`** (main 브랜치 + push 이벤트 한정, `needs: build-test`)
     - 동일 checkout + setup-node + npm ci + verify-secrets
     - `npm run build` (deploy 전용 빌드 — build-test 산출물 미공유, runner 분리 가정)
     - `peaceiris/actions-gh-pages@v4` — `github_token: secrets.GITHUB_TOKEN`, `publish_dir: ./out`, `cname: pregnancy-checklist.com`
     - Lighthouse SEO check 보존 (기존 `deploy-gh-pages.yml` step) — `continue-on-error: true`
     - `timeout-minutes: 10`
- **환경변수 (job 레벨 env)**:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID: ${{ secrets.GA_MEASUREMENT_ID }}`
  - `NEXT_PUBLIC_ADSENSE_CLIENT_ID: ${{ secrets.ADSENSE_CLIENT_ID }}`
  - `NEXT_PUBLIC_FEEDBACK_FORM_URL: ${{ secrets.FEEDBACK_FORM_URL }}`
  - `NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL || 'https://pregnancy-checklist.com' }}` (선택)
  - `CI: "1"` (playwright.config.ts 분기 신호)
- **CI 주입 금지**: `GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, YouTube API 키. weekly-report와 콘텐츠 생성 스크립트는 로컬 전용 — workflow가 이들을 참조하지 않음.

#### should

- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` — 같은 브랜치에 새 push 시 진행 중 워크플로 취소 (시간·과금 절감).
- PR 코멘트에 playwright HTML 리포트 링크 — 별도 라운드 (gh-pages 라이크 도구 필요).
- AdSense 콘솔 사이트 상태 자동 체크 — 별도 라운드 (수동 확인 유지).

#### won't (이번 범위 밖)

- launchd weekly-report 자동 실행 (묶음 M 영역).
- Cloud Run·Cloud Build 마이그레이션 (phase-6 영역).
- Lighthouse CI 통합 — 현재 `npm run lighthouse-check` 로컬 유지.
- `npm run deploy` 인라인 환경변수 제거 — local fallback 경로 보존 (CI가 운영자 primary path가 된 후 별도 라운드에서 정리).
- next.config.ts·tsconfig.json 변경.

#### 영향 파일 (D-M1)

| 파일 | 동작 | 비고 |
|------|------|------|
| `.github/workflows/ci.yml` | 신규 | build-test + deploy 2 jobs |
| `.github/workflows/deploy-gh-pages.yml` | 삭제 | ci.yml deploy job으로 흡수 |
| `package.json` | 무수정 | `deploy` 스크립트 로컬 fallback로 유지 |
| `docs/ops/github-secrets.md` | 신규 | Secret 이름·등록 절차 |

---

### §D-M2. E2E webServer 자동화 + CI 통합

#### must

- **수정 파일**: `playwright.config.ts`
- **webServer 보강**:
  - command: `[ -d out ] || npm run build && ln -sfn . out/pregnancy-checklist && npx serve out -l 3000`
    - `out/` 부재 시 자동 빌드. 존재하면 빌드 스킵 (로컬 재실행 패널티 0).
    - 기존 symlink trick(basePath) 유지.
  - `port: 3000` 유지
  - `reuseExistingServer: !isCI` — 로컬은 재사용, CI는 새 인스턴스 강제
  - `timeout: 180_000` (3분 — 빌드 포함 가능성)
- **CI 분기 동작 (use 블록)**:
  - `trace: isCI ? "retain-on-failure" : "off"`
  - `screenshot: "only-on-failure"`
  - `video: isCI ? "retain-on-failure" : "off"`
  - `retries: isCI ? 1 : 0` — CI flake 흡수, 로컬은 0
- **reporter**: CI는 `[["list"], ["html", { open: "never" }]]` 병행. 로컬은 `"list"` 유지.
- **projects**: `chromium` 단일 유지 (firefox/webkit 추가 X).
- **workers**: `1` 유지 (기존 spec 30+ 개 localStorage 격리 가정 보호). 병렬화는 별도 라운드.

#### should

- webServer stdout/stderr 캡처 옵션 → 디버깅 편의. 단 로그 노이즈 trade-off.
- `globalSetup`으로 `out/` 무결성 검증(`out/index.html` 존재 여부) → fail-fast. 별도 라운드.

#### won't

- workers 병렬화 (회귀 위험 → 별도 라운드).
- firefox/webkit 프로젝트 추가 (1인 운영 chromium만 충분).
- next dev 모드 사용 (production export 동작 검증 목적).

#### 영향 파일 (D-M2)

| 파일 | 동작 | 비고 |
|------|------|------|
| `playwright.config.ts` | 수정 | webServer 보강 + CI 분기 |
| 기존 e2e/*.spec.ts | 무수정 | webServer 동작 변경만 — spec 내부 영향 0 |

---

### §D-M3. 쿠키 동의 거부 시 GA4·AdSense 비활성 회귀 테스트

#### must

- **신규 파일**: `e2e/consent-rejection.spec.ts`
- **시나리오 (4종)**:

  1. **거부 → 스크립트 태그 0건 + window 전역 미정의**
     - localStorage `cookie-consent=rejected` 주입 (`context.addInitScript`)
     - `/` 진입 + `waitForLoadState("networkidle")`
     - `script[src*="googletagmanager.com/gtag/js"]` count === 0
     - `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]` count === 0
     - `window.gtag` typeof !== "function"
     - `window.adsbygoogle` !Array.isArray
     - `ins.adsbygoogle` count === 0 (AdUnit 미렌더)

  2. **거부 → 외부 네트워크 요청 0건**
     - 동일 setup
     - `page.on("request")` 리스너로 `googletagmanager.com` 또는 `adsbygoogle.js` URL 캐치
     - `goto("/")` + `waitForLoadState("networkidle")` 후 캐치된 URL 목록 === []

  3. **수락 → 스크립트 태그 주입 + 외부 요청 발생**
     - `test.skip(!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID, "env 미설정 — skip")` 가드
     - localStorage `cookie-consent=accepted`
     - `page.waitForRequest(url => /adsbygoogle\.js/.test(url))` Promise + `goto("/")`
     - 스크립트 태그 count === 1 (gtag·adsbygoogle 각각)
     - request 객체만 검증, **response status 미assert** (외부 의존 flake 회피)

  4. **모바일 375px 거부 회귀**
     - `test.use({ viewport: { width: 375, height: 812 } })`
     - 거부 시 스크립트 태그 0건 재검증 (주 트래픽 가드)

- **D-C1 검증 잔여 흡수**: 시나리오 3이 "수락 시 adsbygoogle.js 요청 발생"을 자동화로 박음. 시나리오 1/2가 "거부 시 미주입" 자동화. → phase-4.5 §4.2 D-C1 "검증 잔여" 항목 close.

#### should

- 거부 → 수락 동의 시점 전환 시 스크립트 재주입 검증 — `useConsentAccepted` 가 SSR-safe `useSyncExternalStore` 사용하지만 storage 이벤트 구독은 noop. 동의 후 새로고침 필요. 본 라운드 범위 밖 (별도 spec).
- AdUnit 컴포넌트가 렌더되는 정확한 페이지/위치 별도 확인 (현재 페이지에서 ins.adsbygoogle === 0 검증이 약한 negative — 페이지에 AdUnit이 없어서 0일 수도 있음. consent 거부 효과인지 페이지 자체 효과인지 구분 어려움) → 시나리오 1은 script 태그·window 전역 위주로 강화, ins.adsbygoogle 검증은 보조.

#### won't

- consent banner 클릭으로 상태 전환 후 페이지 새로고침 회귀 — 기존 `e2e/cookie-consent.spec.ts` 가 커버.
- GA4 이벤트 발사 검증 — 기존 `e2e/marketing-events-wiring.spec.ts`·`ga4-events.spec.ts`가 커버 (manual spy 패턴).
- AdSense 정책 위반 검사 (광고 차단 콘텐츠 등).

#### 영향 파일 (D-M3)

| 파일 | 동작 | 비고 |
|------|------|------|
| `e2e/consent-rejection.spec.ts` | 신규 | 4 시나리오 |
| `src/lib/consent.ts` | 무수정 | SoT 그대로 |
| `src/components/consent/ConsentGatedScripts.tsx` | 무수정 | SoT 그대로 |
| `src/components/ads/AdUnit.tsx` | 무수정 | SoT 그대로 |

---

## 4. GitHub Secrets 등록 절차

운영자가 본 라운드 산출물 머지 후 1회 수행. 미설정 시 첫 워크플로 실행이 `verify-secrets` step에서 즉시 실패.

### 필수 Secrets (3종)

| Secret 이름 | 현재 값 (package.json deploy 인라인) | 사용처 | 워크플로 env 매핑 |
|---|---|---|---|
| `GA_MEASUREMENT_ID` | `G-HT96X27T4K` | ConsentGatedScripts.tsx | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| `ADSENSE_CLIENT_ID` | `ca-pub-6022771079735605` | ConsentGatedScripts.tsx, AdUnit.tsx, layout.tsx | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` |
| `FEEDBACK_FORM_URL` | `https://forms.gle/iZrqyAd2LtTm7Gtm7` | src/app/contact/page.tsx | `NEXT_PUBLIC_FEEDBACK_FORM_URL` |

기존 `deploy-gh-pages.yml`이 이미 동일 이름으로 사용 중. 본 라운드는 **재등록 불필요** (있다고 가정 + verify-secrets로 검증).

### 선택 Secret (1종)

| Secret 이름 | 기본값 (코드 default) | 사용처 | 워크플로 env 매핑 |
|---|---|---|---|
| `SITE_URL` | `https://pregnancy-checklist.com` | src/app/robots.ts, src/app/sitemap.ts | `NEXT_PUBLIC_SITE_URL` |

### 등록 절차 (gh CLI 또는 웹 UI)

상세 절차는 [docs/ops/github-secrets.md](../../ops/github-secrets.md) 참조. 신규 등록 시 (기존 비어 있을 때만):

```bash
gh secret set GA_MEASUREMENT_ID --body "G-HT96X27T4K"
gh secret set ADSENSE_CLIENT_ID --body "ca-pub-6022771079735605"
gh secret set FEEDBACK_FORM_URL --body "https://forms.gle/iZrqyAd2LtTm7Gtm7"
# 선택
gh secret set SITE_URL --body "https://pregnancy-checklist.com"
```

기존 deploy-gh-pages.yml이 이미 같은 이름을 참조했으므로, 등록되어 있는 secrets 그대로 ci.yml이 사용 가능.

웹 UI: `Settings → Secrets and variables → Actions → Repository secrets → New repository secret`.

### CI 주입 금지 Secrets

`GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, YouTube API 키는 **GitHub Secrets에 등록하지 않음**. 이유: weekly-report와 콘텐츠 생성은 로컬 전용. CI가 우연히도 이들을 참조하지 않도록 워크플로에 명시 X.

## 5. 예외·엣지 케이스

- **첫 push 시 Secrets 미설정**: `verify-secrets` step에서 fail-fast. 워크플로 로그에 어떤 secret이 빠졌는지 표시.
- **CI 빌드 시간 5분 초과**: spec.md "성공 기준 §6.1"의 가드. 초과 시 즉시 사용자에게 보고 + 분할 권장 (npm cache 효과 측정, workers 병렬화 검토).
- **`actions/cache` miss**: Playwright 버전 변경 시 캐시 키 자동 갱신 (key에 version 포함). 첫 실행만 느림.
- **gh-pages 브랜치 first run**: gh-pages 패키지가 자동 생성. 별도 사전 셋업 불필요.
- **deploy job에서 secrets 누락**: build-test가 같은 secrets로 통과한 후라 미발생 가정. 보수적으로 deploy job도 verify-secrets step 동일 적용.
- **로컬 `npx playwright test` 첫 실행 + out/ 없음**: webServer가 `npm run build` 자동 실행 (~30s). `timeout: 180_000` 안에 완료.
- **수락 분기 spec, 로컬 env 미설정**: `test.skip` + skip reason 명시. 거부 분기는 항상 실행.
- **외부 adsbygoogle.js 일시 5xx**: response status 미assert로 회피. request 발생만 검증.

## 6. 성공 기준

### 6.1 기능 동작
- main 푸시 1회 → CI 워크플로 통과 → `pregnancy-checklist.com` 갱신 1회 자동 확인 (실제 트리거는 별도 라운드, 본 라운드는 dry-run + 워크플로 syntax 검증까지).
- PR 1회 → `build-test` job 통과 → 머지 가능 상태로 표시.
- 로컬 `npx playwright test` 1회 (별도 터미널 없이) — webServer 자동 시작·종료. `out/` 부재 시 자동 빌드.
- `e2e/consent-rejection.spec.ts` 4 시나리오 단독 실행 모두 통과 (또는 수락 분기 skip 명시).

### 6.2 회귀
- 기존 e2e spec 30+ 개 회귀 5건 이하 (목표 0건). 5건 초과 시 즉시 사용자 보고 + 분할 권장.
- D-C1 검증 잔여 항목(`adsbygoogle.js` 동의별 동작) 본 spec으로 close.

### 6.3 시간·자원
- CI `build-test` job 5분 이내 (목표). 초과 시 사용자 보고.
- CI `deploy` job 3분 이내.
- 로컬 `npx playwright test` 첫 실행 (with build) 2분 이내, 재실행 (cached out) 1분 이내.

### 6.4 보안
- 환경변수 하드코딩 0건 (CI 워크플로 내).
- 로컬 전용 시크릿(`GA4_SA_KEY_PATH` 등) CI 누수 0건.
- gh-pages deploy 분기 PR 단계 트리거 0건.

## 7. 회귀 안전장치

- 본 라운드 종료 시 phase-4.5 §4.5 D-B 상태 ✅ 갱신.
- ConsentGatedScripts/AdUnit 분기 변경 시 D-M3 spec 빨강으로 자동 회귀 탐지.
- 신규 e2e spec 추가 시 webServer 동작 무영향 — `[ -d out ] || npm run build` 가드.
- 첫 main 푸시 후 gh-pages 자동 배포 결과를 운영자 1회 시각 확인 (`pregnancy-checklist.com` + `https://pregnancy-checklist.com/ads.txt` 200 OK 재확인).
