# GitHub Secrets 등록 절차

> 본 사이트 CI(`.github/workflows/ci.yml`) 가 사용하는 GitHub Secrets 의 단일 진실.
> 신규 secret 추가·이름 변경 시 본 문서 + ci.yml + spec 동시에 갱신.

---

## 1. 등록되어야 하는 Secrets

### 1.1 필수 (3종) — 미설정 시 워크플로 `verify-secrets` step 에서 즉시 실패

| Secret 이름 | 값 (현재 운영) | 사용처 | 워크플로 env 매핑 |
|---|---|---|---|
| `GA_MEASUREMENT_ID` | `G-HT96X27T4K` | [ConsentGatedScripts.tsx](../../src/components/consent/ConsentGatedScripts.tsx) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| `ADSENSE_CLIENT_ID` | `ca-pub-6022771079735605` | [ConsentGatedScripts.tsx](../../src/components/consent/ConsentGatedScripts.tsx), [AdUnit.tsx](../../src/components/ads/AdUnit.tsx), [layout.tsx](../../src/app/layout.tsx) | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` |
| `FEEDBACK_FORM_URL` | `https://forms.gle/iZrqyAd2LtTm7Gtm7` | [src/app/contact/page.tsx](../../src/app/contact/page.tsx) | `NEXT_PUBLIC_FEEDBACK_FORM_URL` |

### 1.2 선택 (1종) — 미설정 시 코드 기본값 사용

| Secret 이름 | 기본값 (코드) | 사용처 | 워크플로 env 매핑 |
|---|---|---|---|
| `SITE_URL` | `https://pregnancy-checklist.com` | [src/app/robots.ts](../../src/app/robots.ts), [src/app/sitemap.ts](../../src/app/sitemap.ts) | `NEXT_PUBLIC_SITE_URL` |

### 1.3 등록 금지 (로컬 전용)

다음 secrets 는 **CI 에 절대 등록하지 않음**. 운영자 로컬 `.env.local` 또는 macOS keychain 으로만 관리. 워크플로가 우연히도 참조하지 않도록 ci.yml 에 명시 X.

| Secret 이름 | 이유 | 사용처 |
|---|---|---|
| `GA4_SA_KEY_PATH` | Google Service Account JSON 절대경로. CI 환경에 SA JSON 자체가 존재하지 않음 | scripts/weekly-report (로컬 실행만) |
| `ANTHROPIC_API_KEY` | Claude API 키. weekly-report 비용은 운영자 개인 청구 | scripts/weekly-report |
| `OPENAI_API_KEY` | Claude 백업 경로. 동일 사유 | scripts/weekly-report (fallback) |
| `YOUTUBE_API_KEY` | 채널·영상 메타 수집. 콘텐츠 갱신 시점에 로컬 실행 후 JSON 커밋 | scripts/fetch-channel-thumbs, fetch-video-metadata |

---

## 2. 등록 절차

### 2.1 gh CLI (권장)

### 2.2 GitHub 웹 UI

`Settings → Secrets and variables → Actions → Repository secrets → New repository secret`

각각 위 표의 "Secret 이름" / "값" 으로 등록.

### 2.3 등록 검증

main 브랜치 무관 dummy PR 1개 또는 빈 푸시(`git commit --allow-empty`) 1회로 CI 워크플로를 트리거. `verify-secrets` step 통과 여부 확인.

```bash
# dummy 푸시로 워크플로 트리거
git commit --allow-empty -m "ci: verify secrets"
git push origin feat/some-branch  # PR 또는 main 외 브랜치
```

`Actions` 탭에서 `verify-secrets` step 이 `✓` 면 등록 OK. 실패 메시지에 어떤 secret 이 빠졌는지 표시됨.

---

## 3. 운영 룰

### 3.1 값 회전 (rotation)

| 항목 | 회전 주기 | 절차 |
|---|---|---|
| `GA_MEASUREMENT_ID` | 미회전 (GA4 property 단위) | GA4 property 재생성 시만 변경 |
| `ADSENSE_CLIENT_ID` | 미회전 (AdSense 계정 단위) | 계정 변경 시만 |
| `FEEDBACK_FORM_URL` | 폼 폐기 시 | Google Forms URL 재발급 시 즉시 갱신 |
| `SITE_URL` | 도메인 변경 시 | 거의 변경 없음 |

### 3.2 추가 금지 룰

- **NEXT_PUBLIC_ 접두 X**: secret 이름은 `GA_MEASUREMENT_ID` 식, 환경변수 이름만 `NEXT_PUBLIC_*`. 워크플로 env 블록에서 매핑.
- **로컬 전용 키를 CI 에 추가 X**: 위 §1.3 목록 외 키를 ci.yml 에 추가하기 전에 본 문서 §1.1·1.2 와 동일 형식으로 행 추가하고 PR 리뷰.
- **시크릿 출력 X**: `echo $SECRET` 또는 build artifact 에 평문으로 노출되는 step 추가 X. GitHub Actions 가 자동으로 mask 처리하지만 우회 가능성 있는 패턴 피함.

### 3.3 코드에 인라인 X

- `package.json` `deploy` 스크립트의 인라인 `NEXT_PUBLIC_*=...` 는 **로컬 fallback 경로** 로만 유지. CI 가 운영자의 primary deploy path 가 된 후 별도 라운드에서 정리 예정.
- 새 `.tsx`/`.ts` 코드에 secret 값 하드코딩 발견 시 즉시 PR 차단 + 해당 값 회전 검토.

---

## 4. 트러블슈팅

### Q. `verify-secrets` 가 실패하는데 secret 은 등록되어 있다

- GitHub Secrets 는 **fork 된 PR 에서 노출 X**. fork 기반 PR 은 workflow 가 secret 없이 실행됨 (정상 동작).
- 본인 fork 가 아닌 원본 repo PR 이라면 `gh secret list` 로 실제 등록 여부 재확인.

### Q. `ADSENSE_CLIENT_ID` 만 값을 바꿔야 한다

```bash
gh secret set ADSENSE_CLIENT_ID --body "ca-pub-NEW_VALUE"
```

기존 값 덮어쓰기. push 후 워크플로 재실행으로 반영.

### Q. CI 가 통과했는데 사이트에서 AdSense 가 안 뜬다

1. `pregnancy-checklist.com` 페이지 source view 에서 `<script src*="adsbygoogle.js">` 존재 여부 확인.
2. 없으면: 빌드 시점 env 누락 의심 → `Actions` 의 deploy job 로그에서 `verify-secrets` 통과했는지 확인 + `Build` step 실패 안 했는지.
3. 있으면: 쿠키 동의 거부 상태일 가능성 → 브라우저 localStorage `cookie-consent` 값 확인.

---

## 5. 변경 이력

| 날짜 | 변경 | 라운드 |
|---|---|---|
| 2026-05-17 | 신규. ci.yml 통합 + verify-secrets fail-fast | [dev-bundle-d-b-ci-e2e](../features/dev-bundle-d-b-ci-e2e/spec.md) |
