# dev-bundle-d-b-ci-e2e 리뷰

> 작성일: 2026-05-17
> 상태: decided (사용자 사전 결정 + 페어 입장 정합)
> size: M
> 관련 스펙: [spec.md](./spec.md)

## 1. 기능 요약

phase-4.5 §4.3 묶음 D-B — 자동화·회귀 안전망 3건을 한 라운드에 마감.

- **D-M1**: `.github/workflows/ci.yml` 신규 — `actions/checkout` → `setup-node@v4` (node 20, npm cache) → `npm ci` → `tsc --noEmit` → `eslint` → `next build` → `playwright install --with-deps chromium` (캐시) → `playwright test`. main 푸시만 `gh-pages -d out` 별도 job.
- **D-M2**: `playwright.config.ts`의 `webServer` 블록을 `out/` 부재 시 자동 빌드 + `serve` 자동 시작/종료로 보강. CI에서 `screenshot/video/trace`를 `on-failure`로 GitHub Actions 아티팩트 업로드.
- **D-M3**: `e2e/consent-rejection.spec.ts` 신규 — 거부 상태 GA·AdSense 스크립트 0건 + 수락 상태 스크립트 주입 + 외부 네트워크 요청 발생 검증. D-C1 검증 잔여 항목(`adsbygoogle.js` 수락 시 200 OK / 거부 시 미주입) 흡수.

GA·AdSense·Feedback 환경변수는 GitHub Secrets로 이관. 로컬 전용(`GA4_SA_KEY_PATH`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, YouTube API)은 CI에 주입 금지. 본 라운드 종료 시 phase-4.5 §4.3·§4.5 D-B 상태 ✅ 갱신.

## 2. 적용 페어 + 선택 이유

- **dev × QA (라이트)**: 본 묶음은 인프라 작업이라 사용자에게 보이는 UI 변화 0건 — 디자이너·마케터·기획자 무관. 충돌 축은 (a) CI 시간 vs 회귀 커버리지, (b) webServer 자동화 깊이, (c) 회귀 spec 양분기 검증 강도. 모두 개발자 단독 + QA 보조로 처리.

지시: 라운드 인자에서 "개발자 단독 + QA 보조. 페어 리뷰 가벼운 형식 (D-B는 인프라 작업, 결정 0건)" 명시.

## 3. 페어별 충돌

### 페어: dev × QA

#### T0: 페어 시작 선언
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev, QA 의 persona 참조:
  - dev: §6.2 (컴플라이언스), §6.4 (시크릿), §6.5 (안전망 우회 금지) — docs/tech/persona.md
  - QA: persona 파일 없음 — 일반 QA 원칙 기반

#### T1: [dev] 단독 입장
- 잃는 것:
  1. CI 실행 시간 — 빌드+E2E 통합 시 로컬 1분 대비 CI 5분 가능성. PR 머지 마찰 ↑.
  2. webServer 안에 `npm run build` 체이닝 시 로컬 테스트 첫 실행 30s 패널티.
- 희생 거부 인용: "거부 동의 무시하고 GA/AdSense 활성화 X." — docs/tech/persona.md §6.2
- 희생 거부 인용 2: "시크릿을 코드에 박기 X. 환경변수 + Secret Manager." — docs/tech/persona.md §6.4
- 주장:
  1. GitHub Secrets 미설정 시 워크플로 빌드 단계에서 즉시 fail-fast — 명시 check step (`: "${SECRET:?required}"`) 로 런타임 누락 회피.
  2. webServer 명령은 `[ -d out ] || npm run build && ...` 조건부 — 로컬 재실행 시 빌드 스킵하여 30s 패널티 회피.
  3. CI retries는 1회만 (flake 마스킹 최소화). 로컬 0회 유지.
  4. workers는 1 유지 — 기존 spec 30+ 개가 `workers: 1` 가정으로 작성. 병렬화는 별도 라운드.
- 잔재 자기검증: 이전 페어 없음 — N

#### T2: [QA] 반박 입장
- A 발언에 대한 명시 반박:
  1. dev의 "수락 시 스크립트 태그 존재 검증만" 누락 위험 — D-C1 잔여 흡수 목적이라면 외부 네트워크 요청이 실제 발생하는지 `page.waitForRequest`로 검증해야 회귀 가치 있음.
  2. dev의 "workers 1 유지" 보수 결정은 합리적이나, CI 5분 가드레일 초과 시 즉시 분할 권장 — 이 가드를 spec에 미리 박아둬야 사후 대응 가능.
- 잃는 것:
  1. 외부 네트워크 의존 테스트는 CI flake 위험 — adsbygoogle.js URL이 일시 5xx면 spec 실패. retries 1로 흡수되지만 진성 회귀가 가려질 수 있음 → response status는 미assert (request만 검증).
  2. 거부 시 "0건" assert는 시점 의존 false negative 약점 — `waitForLoadState("networkidle")` 필수.
- 희생 거부 인용: (QA persona 파일 없음 — 일반 QA 원칙 기반)
- 주장:
  1. consent-rejection.spec.ts는 4종 시나리오 필수:
     - (a) 거부 → script tag 0건 + `window.gtag` 미정의 + `adsbygoogle` 미정의
     - (b) 거부 → adsbygoogle.js / gtag.js 외부 네트워크 요청 0건
     - (c) 수락 → script tag 2건 + 외부 요청 발생 (response status 미assert)
     - (d) 모바일 375px 거부 회귀
  2. 수락 분기는 빌드 시 env 누락 시 `test.skip` (CI는 secrets로 항상 있음, 로컬은 `.env.local` 없을 수 있음).
  3. CI 워크플로에 `timeout-minutes: 15`, deploy 분리 (build-test 통과 후만 트리거) — fail-fast + 안전.
- 잔재 자기검증: 이전 페어 없음 — N

#### T3: 핵심 충돌 + 숨은 가정
- 핵심 충돌: 수락 분기 검증 깊이 — dev "스크립트 태그 존재 검증만" vs QA "네트워크 요청 발생까지 검증 + response status는 미assert".
- 숨은 가정: `npm run build` 시점에 `NEXT_PUBLIC_*` 환경변수가 baked-in 되어야 ConsentGatedScripts가 스크립트 태그를 emit한다. CI에서 secrets 누락 시 수락 분기 spec이 false negative로 통과 (스크립트 태그 0건인데 거부가 아닌 빌드 누락 때문). → fail-fast secret check가 방어선.

## 4. 미해결 트레이드오프

본 라운드는 사용자가 라운드 인자에서 결정사항을 인라인 가이드함 (`gh-pages 자동 배포 vs 수동` + `fail-fast` + `캐시 전략·병렬화`). dev/QA 입장도 정합.

라운드 진행 중 **추가 발견** (review.md 결정 7·8): `.github/workflows/deploy-gh-pages.yml`이 이미 존재함을 발견 (phase-4.5 §4.3 "워크플로우 0건" 기술 stale). 사용자 결정 즉시 요청 → 답변 받음. 미해결 0건 유지.

> "결정 0건 예상" 부합. 결정 보호 룰 1회 발동(기존 워크플로 충돌) → 사용자 답변으로 즉시 해결.

## 5. 결정 (사용자 라운드 지시 인용)

1. **자동 배포 게이트**: gh-pages 자동화 도입. 단, `deploy` job은 **main 브랜치 + push 이벤트**에서만 트리거 + `build-test` job 통과 후에만 실행. PR 단계에서는 deploy 실행 X (실수 배포 방지). 사용자 인용: "main 푸시에 PR 머지 게이트 필수".
2. **Secrets 누락 처리**: fail-fast. 워크플로 초반 `verify-secrets` step에서 필수 secret 미설정 시 즉시 워크플로 실패. 사용자 인용: "GitHub Secrets 누락 시 빌드 실패 vs 빌드 통과 후 런타임 누락 — fail-fast 설정 권장".
3. **CI 시간 가드레일**: 5분 초과 시 분할 권장 — npm cache (setup-node@v4 내장) + Playwright browser cache (`~/.cache/ms-playwright`)로 1차 최적화. workers 병렬화는 별도 라운드. 사용자 인용: "E2E CI 실행 시간 5분 vs 로컬 1분 — 캐시 전략 + 병렬화".
4. **회귀 spec 양분기 검증**: 거부 + 수락 + (수락 시 외부 요청 발생) + 모바일 회귀. response status는 미assert (외부 의존 flake 회피).
5. **수락 분기 env 가드**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`/`NEXT_PUBLIC_ADSENSE_CLIENT_ID` 미설정 시 수락 분기 테스트 `test.skip` (skip reason 명시). 거부 분기는 항상 실행.
6. **Secrets 가이드 위치**: `docs/ops/github-secrets.md` 신규 — 기존 `docs/ops/operating-model.md` 옆.
7. **워크플로 통합**: 기존 `deploy-gh-pages.yml` 삭제 + 신규 `ci.yml`에 `build-test` + `deploy` 2 jobs 통합. deploy는 `peaceiris/actions-gh-pages@v4` 채택(npm gh-pages 패키지 아님 — 검증된 액션). PR 머지 게이트는 `deploy.needs: build-test` 로 강제.
8. **Secret 이름 컨벤션**: 기존 컨벤션 유지 — `GA_MEASUREMENT_ID`, `ADSENSE_CLIENT_ID`, `FEEDBACK_FORM_URL` (NEXT_PUBLIC_ 접두 X). 워크플로 env에서 `NEXT_PUBLIC_*` 환경변수로 매핑. 운영자 secret 재등록 0건.
9. **npm install 옵션**: `npm ci --legacy-peer-deps` — 기존 워크플로와 동일 (`date-fns@^4` vs `react-day-picker@8` peer 충돌 회피).
10. **Lint 정책 (라운드 진행 중 추가 결정)**: `npm run lint` step은 `continue-on-error: true` (soft signal). 현재 4건 잔존 부채(CookieConsentBanner / TimelineContainer×2 / sidebar) — D-Mn1 영역, 별도 라운드. `eslint.config.mjs`에 `.claude/**` ignore 추가로 worktree 노이즈 26건 제거. tsc / playwright 는 hard fail 유지. 사용자 결정(2026-05-17): "worktrees ignore + lint soft (Recommended)" 채택.

## 6. 우선순위 영향

- 본 라운드 종료 시 phase-4.5 §4.3 D-M1·D-M2·D-M3 + §4.5 D-B 상태 ✅. phase-4.5 잔여 코드 작업 마감.
- D-Data 누적 마감(~2026-05-26) + 본 라운드 완료가 phase-4.6 진입 조건. 묶음 M (launchd weekly-report 자동 실행) 은 phase-4.6 도중/후 별도 라운드.
- CI 첫 실행 시간이 5분 초과하면 즉시 사용자에게 보고 + 분할 권장. 기존 spec 회귀가 5건 초과면 동일.
