# 기술 부채 (Technical Debt)

> Phase 1 코드 분석 후 도출된 항목 + 이후 phase에서 새로 인지된 항목.
> **해소된 항목·다른 phase로 이전된 항목은 즉시 삭제**. 이 문서는 항상 "현재 살아있는 부채"만 담는다.
>
> 우선순위: **P2** (Phase 5+) · **P3** (Phase 6+ 운영 전환 시)
>
> Phase 5 이전(=즉시) 작업 대상은 [docs/plan/phase-4.5.md §4](../plan/phase-4.5.md) 개발 개선 섹션으로 이전됨.

---

## A. 아키텍처 & 설계

### A-4. Static Export → SSR 전환 전략 (P3)

운영 전환 시 breaking change 체크리스트는 [docs/tech/infra.md](infra.md) §3.2에 통합. 추가 미확정 항목:

- `basePath` 처리: 현재 제거된 상태(custom domain). Cloud Run도 root 배포라 추가 변경 불필요.
- 정적 import한 JSON을 fetch로 전환할 때 동기 → 비동기 컴포넌트 시그니처 변경 영향 평가.

---

## B. 데이터 & 상태관리

### B-6. 데이터 스키마 버저닝 (P2)

- 현재 모든 Zustand persist에 `version` 옵션 미사용.
- 누적된 store 종류:
  - `useDueDateStore`·`useChecklistStore`·`useTimelineStore`·`useWeightStore`·`useSearchStore`
  - `createChecklistStore`로 생성된 슬러그별 store 3종
  - `useConsentStore`
- **위험**: 기존 사용자의 localStorage 스키마와 신규 코드의 기대치가 어긋날 때 silent corruption.
- **대응 시점**: Phase 5 zod 도입과 함께 각 store에 `version: 1` + `migrate` 핸들러 추가.

---

## C. 성능 & 배포

### C-8. 번들 사이즈 분석·관리 (P2)

- heavy 의존성: `recharts` (~200KB gzipped, weight 페이지 전용), `@radix-ui/*` (28+ 패키지, tree-shaking 적용).
- **참고**: 미사용 shadcn ui 컴포넌트 30종 일괄 제거는 [docs/plan/phase-4.5.md §4 D-Mn1](../plan/phase-4.5.md)로 이전.
- **남은 작업 (P2)**:
  - `@next/bundle-analyzer` 도입, 페이지별 first-load JS 측정.
  - Recharts dynamic import 검토 (체중 페이지만 사용).
  - 기준선 기록 후 회귀 알림 (1MB 초과 시 빌드 실패 등).

### C-9. 이미지 최적화 (P3)

- 현재 `images: { unoptimized: true }` (static export 제약).
- `videos` 카드는 `img.youtube.com/vi/{id}/mqdefault.jpg` 직접 사용 → 최적화 불필요.
- `articles`의 hero 이미지는 정적 자산. `next/image`는 Phase 6 SSR 전환 후에만 활성화 가능.

---

## D. 테스트 & 품질

### D-11. Unit Test 확장 (P2)

- **선행**: Phase 5 §5-0b에서 vitest 도입 + 핵심 lib 5종 첫 라운드.
- **이후 확장 대상 (P2)**:
  - Zustand store 액션(`toggle`·`addCustomItem`·`removeCustomItem`·체중 `addLog` 정렬).
  - `lib/share.ts`의 `isMobileTouchEnvironment` mock 분기.
  - `lib/consent.ts` 동의 상태 변경 → GA4·AdSense 활성/비활성 토글.
  - 컴포넌트 테스트(@testing-library/react): `ChecklistItemRow`·`ShareModal`·`SearchModal`.

---

## E. SEO & 수익화

### E-15. SEO 메타데이터 최적화 (P2)

- 모든 페이지 `export const metadata`로 title/description/OG/canonical 적용 완료.
- **남은 작업**:
  - JSON-LD structured data: 아티클 `Article` schema 부분 적용 → 전체 적용.
  - 체크리스트 페이지 `HowTo` schema 추가 검토.
  - `Article.author` / `Article.publisher` 필드 보강.

---

## F. 보안 & 운영

### F-18. 접근성(a11y) 측정 (P2)

- Radix UI 사용으로 ARIA 기본 지원.
- info-tab-integration에서 ARIA tab 패턴 보강 완료.
- **남은 작업**:
  - Lighthouse a11y 90+ 자동 검증 (`scripts/lighthouse-check.sh`에 추가).
  - 키보드 네비게이션 회귀 테스트 (Playwright `tab` 시뮬레이션).
  - 색상 대비 검증 (파스텔 + 흰색 배경 → text-foreground 대비 측정).
  - VoiceOver 수동 테스트 라운드.

---

## 우선순위 요약

| 우선순위 | 항목 | 비고 |
| ------- | ---- | ---- |
| **P2** | B-6 schema 버저닝 | Phase 5 zod 도입과 함께 |
| **P2** | C-8 번들 사이즈 분석 | bundle-analyzer + Recharts dynamic |
| **P2** | D-11 Unit Test 확장 | Phase 5 vitest 첫 라운드 후 |
| **P2** | E-15 JSON-LD 확장 | Article·HowTo schema |
| **P2** | F-18 a11y 자동 측정 | Lighthouse + 키보드 회귀 |
| **P3** | A-4 SSR 전환 (Phase 6) | next.config·data-source·이미지·routes |
| **P3** | C-9 이미지 최적화 | next/image 활성 (SSR 후) |

---

## 변경 이력

| 시점 | 변경 |
|------|------|
| 2026-03-29 | 최초 작성 (Phase 1 코드 분석) |
| 2026-05-03 | tech/로 이동. 해소된 7건 삭제: A-2 컴포넌트 분리, A-3 videos JSON, B-5 localStorage 용량, B-7 data-source.ts, E-13 GA4 구현, E-14 AdSense 슬롯 스펙, F-16 ADMIN_SECRET. |
| 2026-05-03 | A-1(현재 아키텍처 문서)는 [tech/infra.md](infra.md) §1로 갈음 후 제거. |
| 2026-05-03 | P1 5건 → [phase-4.5/plan.md §4](../plan/phase-4.5.md): E-13a AdSense 스크립트·ads.txt, E-13b reviewed_by 빈 필드, C-10 GitHub Actions CI/CD, D-12 E2E webServer 자동화, F-19 쿠키 동의 회귀 테스트. |
| 2026-05-03 | Phase 5로 이전: D-11 vitest 도입(첫 라운드), Video 타입 정비/zod, BMI 차트. 이 문서엔 P2 확장 분량만 잔존. |
| 2026-05-03 | Phase 6으로 이전: F-17 에러 모니터링 SaaS(Sentry/Cloud Error Reporting). |
