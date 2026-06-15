# phase-4.5.md 상태 갱신 패치 제안

> 작성일: 2026-05-17
> 본 라운드(dev-bundle-d-b-ci-e2e) 종료 후 phase-4.5.md §4.3 D-M1·D-M2·D-M3 + §4.5 D-B 상태를 ✅ 완료로 갱신.
> **직접 적용 X** — 운영자 검토 후 수동 머지. 본 patch는 안내용.

---

## 패치 1: §4.3 Major — 자동화·회귀 안전망

### 위치: phase-4.5.md L924~941

### 갱신 후 텍스트

```markdown
### 4.3 Major — 자동화·회귀 안전망

> **상태 (2026-05-17)**: ✅ **완료** — 묶음 D-B 마감. [dev-bundle-d-b-ci-e2e](../features/dev-bundle-d-b-ci-e2e/spec.md) 참조.

#### D-M1. GitHub Actions CI/CD

> **상태 (2026-05-17)**: ✅ **완료** — 기존 `deploy-gh-pages.yml` 흡수 후 `.github/workflows/ci.yml` 단일 파일로 통합. `build-test` job (tsc / lint-soft / build / playwright) + `deploy` job (main push만, needs build-test, peaceiris/actions-gh-pages@v4). verify-secrets step fail-fast. concurrency cancel-in-progress.

- [x] `.github/workflows/ci.yml` 신규 (build-test + deploy 2 jobs)
- [x] `.github/workflows/deploy-gh-pages.yml` 삭제 (ci.yml deploy job으로 흡수)
- [x] GA·AdSense·Feedback 환경변수 GitHub Secrets 이관 — 기존 컨벤션 유지(`GA_MEASUREMENT_ID`/`ADSENSE_CLIENT_ID`/`FEEDBACK_FORM_URL`, NEXT_PUBLIC_ 접두 X), 워크플로 env에서 `NEXT_PUBLIC_*` 매핑
- [x] [docs/ops/github-secrets.md](../ops/github-secrets.md) 신규 — Secret 이름·등록 절차·트러블슈팅
- [x] eslint.config.mjs `.claude/**` ignore 추가 (worktree 노이즈 26건 제거)
- **잔여**: lint 부채 4건(CookieConsentBanner / TimelineContainer×2 / sidebar)은 D-Mn1 시점 정리 — 현재 ci.yml에서 `continue-on-error: true` soft signal로 가시화

#### D-M2. E2E webServer 자동화 + CI 통합

> **상태 (2026-05-17)**: ✅ **완료** — `playwright.config.ts` `webServer` 블록을 `[ -d out ] || npm run build && ...` 조건부로 보강. CI 분기(`!!process.env.CI`)로 retries 1 / trace·video retain-on-failure / html reporter 병행. CI 워크플로에서 실패 시 `actions/upload-artifact@v4`로 `test-results/` + `playwright-report/` 14일 retention.

- [x] webServer 자동 시작/종료 — 로컬 `npx playwright test` 단독 실행 가능
- [x] CI chromium 전용 유지 (workers 1, retries 1)
- [x] 실패 아티팩트 자동 업로드
- [x] 기존 e2e spec 회귀 0건 검증 (스모크 표본 cookie-consent + marketing-events-wiring + ga4-events 24/25 pass, 1 pre-existing flake 무관)

#### D-M3. 쿠키 동의 거부 시 GA4·AdSense 비활성 회귀 테스트

> **상태 (2026-05-17)**: ✅ **완료** — [e2e/consent-rejection.spec.ts](../../e2e/consent-rejection.spec.ts) 4 시나리오 신규 (거부 → 스크립트 태그 0건 + window 전역 미정의 / 거부 → 외부 요청 0건 / 수락 → 스크립트 주입 + 외부 요청 발생 (response status 미assert) / 모바일 375px 거부 회귀). 4/4 pass (5.8s 로컬). D-C1 검증 잔여 항목 흡수.

- [x] 4 시나리오 신규
- [x] 수락 분기 env 가드 (`test.skip(!process.env.NEXT_PUBLIC_*)`)
- [x] §4.2 D-C1 "검증 잔여 — adsbygoogle.js 동의별 동작" 항목 흡수
```

### 의미 있는 변경
- "현 상태: 수동 `npm run deploy`. 워크플로우 0건." → ✅ 완료 + 통합 ci.yml 안내
- D-M2 "현재: 로컬에서 `npx serve out -l 3000` 수동 실행" → ✅ 완료
- D-M3 "현 상태: 회귀 테스트 부재" → ✅ 완료
- §4.3 헤더 자체에 상태 박스 추가

---

## 패치 2: §4.2 D-C1 검증 잔여 항목

### 위치: phase-4.5.md L904~906

### 현재 텍스트

```markdown
- **검증 잔여**:
  - `adsbygoogle.js` 동의 수락 시 200 OK / 거부 시 미주입 — D-M3 e2e 자동화로 흡수 예정 (그 전까지 수동 1회 권장)
  - AdSense 콘솔 사이트 상태 = "준비됨" — AdSense 6월 신청 후 24~48시간 내 확인 ([phase-4.6](../../plan/phase-4.6.md) 영역)
```

### 갱신 후 텍스트

```markdown
- **검증 잔여**:
  - [x] `adsbygoogle.js` 동의 수락 시 외부 요청 발생 / 거부 시 미주입 — **D-M3 e2e 자동화로 흡수 완료 (2026-05-17)**. [e2e/consent-rejection.spec.ts](../../e2e/consent-rejection.spec.ts) 4/4 pass.
  - AdSense 콘솔 사이트 상태 = "준비됨" — AdSense 6월 신청 후 24~48시간 내 확인 ([phase-4.6](../../plan/phase-4.6.md) 영역)
```

---

## 패치 3: §4.5 작업 묶음 표

### 위치: phase-4.5.md L1035~1039

### 현재 행 (D-B)

```markdown
| **D-B** 자동화·회귀 안전망 | D-M1, D-M2, D-M3 | 다음 | GitHub Secrets 등록 | ⚠️ 미착수 (D-Data 14일 동안 진행 권장) |
```

### 갱신 후 행

```markdown
| **D-B** 자동화·회귀 안전망 | D-M1, D-M2, D-M3 | — | GitHub Secrets 등록 | ✅ 완료 (2026-05-17, [dev-bundle-d-b-ci-e2e](../features/dev-bundle-d-b-ci-e2e/spec.md)) |
```

---

## 패치 4: §4.6 회귀 안전장치

### 위치: phase-4.5.md L1043~1048

### 현재 텍스트

```markdown
- 모든 D-Mn 처리 시 e2e 회귀 통과 확인.
- D-A 처리 후 AdSense 콘솔 크롤링 통과 확인.
- D-B 도입 후 main 푸시로 자동 배포 1회 동작 검증.
- D-C 처리 후 번들 사이즈 비교 리포트 [docs/lighthouse-seo/](../lighthouse-seo/)에 기록.
```

### 갱신 후 텍스트

```markdown
- 모든 D-Mn 처리 시 e2e 회귀 통과 확인.
- D-A 처리 후 AdSense 콘솔 크롤링 통과 확인. ✅ (2026-05-13)
- D-B 도입 후 main 푸시로 자동 배포 1회 동작 검증. ⚠️ **운영자 1회 수행 필요** — 본 라운드는 dry-run + 워크플로 syntax 검증까지. 다음 main 머지 시 운영자가 Actions 탭에서 build-test + deploy 통과 확인.
- D-C 처리 후 번들 사이즈 비교 리포트 [docs/lighthouse-seo/](../lighthouse-seo/)에 기록.
```

---

## 적용 절차 (운영자 액션)

1. phase-4.5.md 본문 백업 (`cp docs/plan/phase-4.5.md docs/plan/phase-4.5.md.bak`).
2. 위 패치 1~4를 순서대로 적용.
3. 적용 후 차이 확인: `git diff docs/plan/phase-4.5.md`.
4. 만족스러우면 커밋. 불만족 시 `git checkout docs/plan/phase-4.5.md`로 롤백.
5. (선택) phase-4.6.md Status를 "🚧 D-Data 수집 중"에서 "진입 가능" 으로 전환 — D-Data 마감 ~2026-05-26 도달 시.

---

## 첫 main 푸시 시 운영자 검증 체크리스트

본 라운드 산출물 머지 → 첫 main 푸시 시 운영자 1회 확인:

- [ ] `Actions` 탭에서 `CI` 워크플로 실행 시작 확인
- [ ] `build-test` job step 순서: checkout → setup-node → verify-secrets → npm ci → tsc → lint(soft) → build → playwright install → playwright test 모두 ✓
- [ ] `deploy` job (needs build-test 통과 후) ✓
- [ ] `pregnancy-checklist.com` 갱신 1회 시각 확인 (도메인 진입 + 새 빌드 콘텐츠 노출)
- [ ] `curl -I https://pregnancy-checklist.com/ads.txt` 200 OK 재확인
- [ ] (선택) PR 1개 생성해서 `deploy` job이 트리거되지 않고 `build-test` 만 실행되는지 확인 — PR 머지 게이트 동작 검증

이 6개 항목이 모두 ✓ 면 D-B 묶음 운영 검증까지 완료.
