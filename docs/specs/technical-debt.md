# 기술적 보완 사항 (Technical Debt & Improvements)

> Date: 2026-03-29
> Status: Phase 1 코드 분석 후 도출된 기술적 보완 항목
> 우선순위: P0 (Phase 1 완료 전 필수) → P1 (Phase 2 전) → P2 (Phase 4 전)

---

## A. 아키텍처 & 설계

### A-1. 현재 상태(as-is) 아키텍처 문서 필요 (P2)

`infra/architecture.md`가 Phase 4+ 목표만 기술.
현재 Static Export + localStorage 기반의 아키텍처가 문서화되지 않음.

**대응:**
- Phase 1 완료 시 현재 아키텍처 다이어그램 추가
- `Client (Browser)` → `Static HTML (gh-pages)` → `localStorage` 흐름 도식화

### A-2. 컴포넌트 분리 기준 (P0 — 완료)

**해결됨:** Phase 1 싱크 작업에서 feature별 폴더 구조로 재구성 완료.

```
components/
├── home/        — DueDateInput
├── checklist/   — ChecklistContainer, ChecklistItem, ProgressSummary
├── timeline/    — TimelineContainer, TimelineCard
├── babyfair/    — BabyfairContainer, BabyfairCard
├── weight/      — WeightContainer, WeightChart, WeightForm
├── videos/      — VideosContainer, VideoCard
├── layout/      — BottomNav
└── ui/          — shadcn/ui 컴포넌트
```

**분리 기준:** page.tsx는 데이터 import + Container props 전달만 담당.
UI 로직은 Container 컴포넌트에, 렌더링 단위는 개별 컴포넌트에 위임.

### A-3. 하드코딩 → JSON 마이그레이션 (P0 — 부분 완료)

| 데이터 | 상태 | 비고 |
| ------ | ---- | ---- |
| checklist | ✅ JSON | `checklist_items.json` 120개 |
| timeline | ✅ JSON | `timeline_items.json` 24개 (단, milestone은 컴포넌트에 하드코딩) |
| baby-fair | ✅ JSON | `babyfair_events.json` 8개 이전 완료 |
| videos | ❌ 하드코딩 | `VideosContainer.tsx`에 14개. TODO 주석 추가됨 |

**남은 작업:**
- videos 데이터를 `videos.json`으로 이전 (Phase 1 기능 구현 시)
- timeline milestone 5개를 `timeline_items.json`과 통합 검토

### A-4. Static Export → SSR 전환 전략 (P2)

Phase 4 Cloud Run 전환 시 `output: 'export'` 제거에 따른 breaking change:

| 항목 | Static Export (현재) | SSR (Phase 4) |
| ---- | -------------------- | ------------- |
| `next.config.ts` | `output: 'export'` | `output: 'standalone'` |
| 데이터 로딩 | `import json` (빌드 번들 포함) | `fetch('/api/...')` (런타임) |
| 이미지 | `unoptimized: true` | Next.js Image Optimization 활성화 |
| 라우팅 | 정적 HTML | dynamic routes + API routes 가능 |
| 배포 | gh-pages (정적) | Cloud Run (Docker) |

**전환 체크리스트:**
- [ ] `output: 'export'` → `output: 'standalone'` 변경
- [ ] `images.unoptimized` 제거
- [ ] JSON import → API fetch 전환 (data-source.ts 활용)
- [ ] API Routes 추가 (`/api/checklist`, `/api/timeline` 등)
- [ ] Dockerfile 작성 (plan.md §5-1 참조)
- [ ] basePath 설정 제거 (Cloud Run은 root 배포)

---

## B. 데이터 & 상태관리

### B-5. localStorage 용량/전략 (P1 — 완료)

**해결됨:** Phase 1 plan에 상세 분석 추가.
- 4개 store 독립 key 방식의 설계 이유 문서화
- 용량 추정: ~45KB / 5MB 한도 (1% 미만)
- 스키마 버저닝: Phase 2에서 `version` + `migrate` 추가 예정
- 에러 핸들링: Zustand persist 자동 폴백

### B-6. 데이터 스키마 버저닝 (P1)

현재 persist에 `version` 옵션 미사용.
Phase 1에서는 스키마가 안정적이므로 불필요하나,
Phase 2에서 커스텀 항목 필드 추가 등이 예상됨.

**대응 시점:** Phase 2 착수 시 각 store에 `version: 1` 추가.
마이그레이션 패턴은 Phase 1 plan에 문서화 완료.

### B-7. data-source.ts 추상화 (P0 — 완료)

**해결됨:** GCS 분기 코드 제거, 로컬 전용으로 단순화.
Phase 4 전환 시 GCS 분기 재추가 예정 (plan.md §4-3 참조).

---

## C. 성능 & 배포

### C-8. 번들 사이즈 관리 (P2)

현재 heavy 의존성:
- `recharts` (~200KB gzipped) — 체중 차트
- `@radix-ui/*` (28패키지) — shadcn/ui 기반, tree-shaking 적용됨
- `motion` (~30KB) — 설치됨이나 사용처 미확인

**대응:**
- Phase 3 SEO 작업 시 `@next/bundle-analyzer` 추가
- 미사용 패키지 정리 (`motion`, `canvas-confetti` 등 확인)
- Recharts dynamic import 검토 (체중 페이지만 사용)

### C-9. 이미지 최적화 (P2)

현재 `images: { unoptimized: true }` (static export 제약).
videos 페이지에서 Unsplash 외부 이미지 직접 사용 중.

**대응:**
- Phase 4 SSR 전환 시 `next/image` 활성화
- 외부 이미지 도메인 `images.unsplash.com` 설정
- 또는 YouTube 썸네일 (`img.youtube.com/vi/{id}/mqdefault.jpg`) 직접 사용

### C-10. CI/CD 파이프라인 (P2)

Phase 5에 CI/CD 언급만 있고 상세 없음.

**Phase 1 (gh-pages) CI 구성안:**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build
      - name: E2E Tests
        run: |
          npx serve out -l 3000 &
          npx wait-on http://localhost:3000
          npx playwright install --with-deps chromium
          npx playwright test
```

**Phase 4 (GCS 연동 시) CI 테스트 전략:**

GCS를 도입할 경우 CI 환경에서는 실제 GCS에 접근할 수 없으므로:

1. **환경변수 분기**: CI에서는 `DATA_SOURCE=local` 유지 → JSON 직접 import로 테스트
2. **GCS Mock**: `data-source.ts`의 `fetchFromGCS`를 jest mock으로 대체
3. **Integration Test 분리**: GCS 연동 테스트는 별도 workflow로 분리, staging 환경에서만 실행

```yaml
# .github/workflows/integration.yml (Phase 4)
name: Integration Tests
on:
  push:
    branches: [main]
jobs:
  gcs-test:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - run: npm ci
      - run: DATA_SOURCE=gcs npm test -- --testPathPattern=integration
```

---

## D. 테스트 & 품질

### D-11. Unit Test 전략 (P1)

현재 E2E(Playwright)만 존재. 로직 레이어 단위 테스트 부재.

**우선 테스트 대상:**

| 대상 | 파일 | 테스트 내용 |
| ---- | ---- | ---------- |
| 주차 계산 | `week-calculator.ts` | 경계값 (1주, 40주), 과거/미래 날짜 |
| 체크리스트 store | `useChecklistStore.ts` | toggle, addCustomItem, removeCustomItem |
| 체중 store | `useWeightStore.ts` | addLog 정렬, removeLog |
| 타임라인 store | `useTimelineStore.ts` | addCustomItem, removeCustomItem |

**도구:** Vitest (Next.js 호환, Jest 대비 빠름)

```bash
npm install -D vitest @testing-library/react
```

### D-12. E2E 테스트 환경 (P1)

현재 `npx serve out -l 3000`으로 정적 빌드 서빙.
CI 환경에서의 실행 전략은 C-10에서 정의.

**추가 개선:**
- Playwright `webServer` 설정 활용 (자동 서버 시작/종료)
- CI에서 Chromium만 사용 (현재 설정과 동일)
- 스크린샷/비디오 아티팩트 GitHub Actions에 업로드

---

## E. SEO & 수익화

### E-13. GA4 구현 가이드 (P1)

Phase 1 plan에 이벤트 목록은 있으나 구현 세부사항 부재.

**추가 필요:**
- GTM 사용 여부: 미사용. `@next/third-parties` 직접 사용
- Consent Mode: PoC에서는 미적용. Phase 3 SEO 작업 시 쿠키 동의 배너 추가 검토
- 개인정보보호법: `/privacy` 페이지에 GA4/AdSense 데이터 수집 고지 (Phase 1 scope)

### E-14. AdSense 슬롯 스펙 (P1)

Phase 1 plan에 4개 슬롯 위치만 명시.

**추가 필요:**
- 반응형 광고: `data-ad-format="auto"` + `data-full-width-responsive="true"`
- CLS 방지: 광고 영역에 `min-height` 예약 (250px 권장)
- Lazy Loading: 뷰포트 진입 시 로드 (`IntersectionObserver`)
- Static Export 호환: AdSense JS는 클라이언트 사이드 로드이므로 문제 없음

### E-15. SEO 메타데이터 구현 스펙 (P2)

Phase 3 범위이나 기본 구조는 Phase 1에서 준비.

**현재 상태:** `layout.tsx`에 기본 `<title>` 만 설정.

**Phase 3 작업:**
- 각 페이지 `generateMetadata()` 또는 `export const metadata` 추가
- OpenGraph + Twitter Card 메타 태그
- JSON-LD structured data (HowTo schema for 체크리스트)
- `sitemap.ts`, `robots.ts` 파일 생성

---

## F. 보안 & 운영

### F-16. ADMIN_SECRET (P0 — 완료)

**해결됨:** PoC에서 불필요. `.env.example`, `.env.local`, `data-source.ts`에서 제거.
Phase 4 Admin UI 구현 시 인증 방식 재설계.

### F-17. 에러 모니터링 (P2)

PoC에서는 불필요. Phase 4 프로덕션 전 추가.

**후보:**
- Sentry (무료 티어 10K events/month)
- Cloud Error Reporting (GCP 네이티브)

**최소 설정:**
- 클라이언트 에러 캡처 (React Error Boundary)
- Zustand persist 실패 로깅
- 404/에러 페이지 트래킹 (GA4 이벤트)

### F-18. 접근성(a11y) 테스트 (P2)

Radix UI 사용으로 기본 ARIA 지원.

**Phase 3 작업:**
- Lighthouse a11y 점수 목표: 90+
- 키보드 네비게이션 테스트 (탭 순서, 포커스 관리)
- 색상 대비 검증 (파스텔 색상 + 흰색 배경 → 텍스트 대비 확인)
- 스크린리더 테스트 (VoiceOver)

---

## 우선순위 요약

| 우선순위 | 항목 | Phase |
| -------- | ---- | ----- |
| **P0 완료** | A-2 컴포넌트 분리, B-7 GCS 분기 제거, F-16 ADMIN_SECRET 제거 | 1 |
| **P0 진행 중** | A-3 하드코딩→JSON (videos 남음) | 1 |
| **P1** | B-6 스키마 버저닝, D-11 Unit Test, D-12 E2E CI, E-13 GA4, E-14 AdSense | 1~2 |
| **P2** | A-1 as-is 아키텍처, A-4 SSR 전환, C-8 번들, C-9 이미지, C-10 CI/CD, E-15 SEO, F-17 모니터링, F-18 a11y | 3~4 |
