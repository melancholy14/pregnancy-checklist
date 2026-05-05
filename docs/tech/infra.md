# 인프라

> 현재 운영 인프라 + Phase별 진행 예정 사항.
> 이 문서가 인프라의 단일 진실 (legacy `docs/infra/` 폴더는 2026-05-05 정리 시 삭제, 본 문서로 갈음).

---

## 1. 현재 (As-Is) — Static Export + gh-pages

```text
                                 ┌────────────────────────┐
                                 │  GitHub Repository     │
                                 │  main branch           │
                                 └──────────┬─────────────┘
                                            │  npm run deploy
                                            ▼
┌────────────────────┐    HTTPS    ┌────────────────────┐
│  사용자 브라우저   │ ◄─────────► │  GitHub Pages      │
│                    │             │  (정적 HTML/JS/CSS)│
│  ─ localStorage    │             │                    │
│    - dueDate       │             │  Custom Domain:    │
│    - checkedIds    │             │  pregnancy-        │
│    - weight logs   │             │    checklist.com   │
│    - 커스텀 항목   │             │  + Cloudflare DNS  │
└────────────────────┘             └────────────────────┘
                                            ▲
                                            │  gh-pages 패키지
                                            │  build → out/ 디렉토리
                                            │
                                 ┌──────────┴─────────────┐
                                 │  로컬 빌드             │
                                 │  next build            │
                                 │  (output: "export")    │
                                 │  → out/                │
                                 │  + CNAME / .nojekyll   │
                                 └────────────────────────┘
```

### 1.1 컴포넌트 인벤토리

| 영역 | 도구 | 역할 |
|------|------|------|
| 호스팅 | GitHub Pages | 정적 자산 서빙 |
| DNS·CDN | 커스텀 도메인 `pregnancy-checklist.com` (CNAME) | TLS·CDN |
| 빌드 | `next build` (`output: "export"`) | 정적 HTML 26+ 페이지 생성 |
| 배포 | `gh-pages` npm 패키지 | `out/` → `gh-pages` 브랜치 푸시 |
| 분석 | Google Analytics 4 | 클라이언트 사이드 |
| 광고 | Google AdSense | 클라이언트 사이드 (`<meta>` + AdUnit 컴포넌트) |
| 콘텐츠 데이터 | `src/data/*.json` (빌드 번들) | 런타임 fetch 없음 |
| 사용자 상태 | 브라우저 localStorage | Zustand persist |

### 1.2 데이터 흐름
1. 사용자가 도메인 진입 → CDN에서 정적 HTML 응답.
2. JS 번들 hydrate → Zustand store가 localStorage에서 dueDate 등 복원.
3. 컴포넌트 import한 JSON으로 콘텐츠 렌더.
4. 사용자가 체크/입력 → 즉시 localStorage 반영.

### 1.3 외부 데이터 갱신
- YouTube 채널·영상 메타: `npm run fetch-channel-thumbs`·`fetch-video-metadata`로 로컬 실행 → JSON 갱신 → 커밋 → 재배포.
- 베이비페어 일정·블로그 콘텐츠: 운영자가 수동 편집 → 커밋 → 재배포.

### 1.4 환경 변수
- `.env.local` (커밋 안 함): GA·AdSense·피드백 폼 ID, YouTube API 키.
- 배포 시: `package.json`의 `deploy` 스크립트가 인라인 주입.

---

## 2. 가까운 (To-Be) — Phase 5: 베이비페어 크롤러 (로컬 실행)

> 로컬 CLI 자동화. 인프라 변경 없음.

- `scripts/crawl-babyfair.ts` (미구현, [docs/plan/specs/babyfair_crawler_spec.md](../plan/specs/babyfair_crawler_spec.md) 참조)
- 모드: `full` / `incremental` / `verify`. confidence score 산출 → pending 상태로 저장.
- `scripts/review-babyfair.ts` Admin CLI로 승인/반려 → JSON 갱신 → 재배포.
- API Routes 없음 (static export 유지).

---

## 3. 중기 (Phase 6) — GCP 인프라 세팅

> 트래픽·기능 확장 시 전환. 현재는 시기 미정 (PoC KPI Go 후 결정).

### 3.1 도입할 GCP 서비스

| 서비스 | 역할 |
|--------|------|
| Cloud Run | Next.js Fullstack 컨테이너 호스팅 (`output: "standalone"`) |
| Cloud Storage (GCS) | JSON 콘텐츠 데이터 (체크리스트·타임라인·베이비페어·영상) |
| Artifact Registry | Docker 이미지 저장소 (asia-northeast3) |
| Secret Manager | YouTube API 키 등 시크릿 |
| Cloud Logging | 에러·트래픽 모니터링 |
| Cloud Scheduler | 베이비페어 크롤러 cron (`0 6 * * *` Asia/Seoul) |

### 3.2 전환 체크리스트
- [ ] `next.config.ts`: `output: "export"` → `output: "standalone"`
- [ ] `images.unoptimized` 제거 → `next/image` 활성, `images.unsplash.com`·`img.youtube.com` 도메인 등록
- [ ] JSON `import` → `data-source.ts`의 `fetchFromGCS<T>()` 분기 (`DATA_SOURCE=gcs`)
- [ ] API Routes 추가: `/api/checklist`·`/api/timeline`·`/api/baby-fair` 등 + `revalidate` 캐시
- [ ] Admin API Routes: 베이비페어 승인·거부·크롤 트리거
- [ ] Dockerfile (multi-stage, node:20-alpine)
- [ ] `scripts/deploy.sh`로 빌드·푸시·배포 일괄
- [ ] GitHub Actions `Deploy to Cloud Run` 워크플로우 추가
- [ ] basePath 제거 (Cloud Run은 root 배포)

### 3.3 캐시 전략 (Phase 6 ↔ API Routes)
- `revalidate = 86400` (24h): checklist, timeline, videos
- `revalidate = 21600` (6h): babyfair (행사 상태 변동 빈번)

### 3.4 비용 모델
- Cloud Run: `min-instances 0` → 트래픽 없을 때 0원
- GCS: 소량 JSON, 비용 무시 수준
- Cloud Scheduler: 1 job → 무료 티어

---

## 4. 장기 (Phase 7) — 운영 배포

- Cloud Run 정식 배포 + CI/CD (`main` push → 자동 빌드·배포).
- 베이비페어 크롤 cron 활성.
- 에러 모니터링 (Sentry 또는 Cloud Error Reporting).
- 사이트 백업·DR 계획.

---

## 5. CI/CD 현재 상황

- **현재**: 수동. `npm run deploy` 로컬 실행 → gh-pages 푸시.
- **개선 후보 (Phase 5 이내)**: GitHub Actions
  ```yaml
  # .github/workflows/ci.yml (제안)
  - npm ci
  - npx tsc --noEmit
  - npm run lint
  - npm run build
  - playwright install --with-deps chromium
  - playwright test
  - (main 브랜치) gh-pages -d out
  ```
- **Phase 7**: GCP 인증 + Cloud Run 배포 워크플로우.

---

## 6. 모니터링·관측 (현재 + 미래)

| 항목 | 현재 | 미래 |
|------|------|------|
| 트래픽 | GA4 | + Cloud Run 메트릭 |
| 에러 | 없음 (수동 사용자 신고) | Sentry / Cloud Error Reporting (Phase 6 §6-1) |
| 성능 | Lighthouse 수동 (`npm run lighthouse-check`) | + Cloud Run 레이턴시·인스턴스 수 |
| 베이비페어 크롤러 | — | Cloud Logging + Slack 알림 |

---

## 7. 보안

- 시크릿: `.env.local` (커밋 X) + Phase 6에서 Secret Manager.
- 클라이언트 노출 환경변수는 `NEXT_PUBLIC_` prefix만.
- AdSense·GA4 모두 클라이언트 사이드 → 쿠키 동의 거부 시 비활성.
- 정적 사이트 → 백엔드 공격 표면 없음. Phase 6 이후 API Routes 추가 시 인증 재설계 필요.

---

## 8. 의도적으로 안 한 것

| 항목 | 이유 |
|------|------|
| 자체 백엔드 / DB | PoC 단계 회원가입 없음 |
| API Routes | static export 모드 호환 X |
| 이미지 최적화 (`next/image`) | static export 제약 (`unoptimized: true`) |
| Edge functions | 정적 호스팅이면 충분 |
| GraphQL / tRPC | 데이터 모델 단순 |

> 모니터링 SaaS(Sentry/Cloud Error Reporting) 도입은 Phase 6 §6-1로 이전 — [plan.md](../plan/plan.md) 참조.
