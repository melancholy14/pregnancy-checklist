# llms-txt-policy 코드 리뷰

> 리뷰 대상: [docs/features/llms-txt-policy/spec.md](../features/llms-txt-policy/spec.md)
> 구현 산출물: [docs/implementation/llms-txt-policy-impl.md](../implementation/llms-txt-policy-impl.md)
> 리뷰일: 2026-06-10

## 리뷰 대상 파일

- `src/app/robots.ts` (수정 — `rules` 배열화 + AI 크롤러 5개 추가)
- `public/llms.txt` (신규 — 정적 텍스트 파일, 47줄)
- `e2e/llms-txt-policy.spec.ts` (신규 — 회귀 가드 9 케이스)

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

없음. 변경 면적이 작고(라우트 함수 + 정적 텍스트) 4가지 관점(타입·성능·보안·접근성) 모두 회색지대 없음.

---

## Suggestion (개선 아이디어)

### 1. `AI_CRAWLER_USER_AGENTS` 타입 좁히기

- **파일**: `src/app/robots.ts:7-13`
- **현재**: `const AI_CRAWLER_USER_AGENTS = [ ... ]` → `string[]` 추론
- **아이디어**: `as const` 또는 `readonly string[]` 으로 좁히면 향후 오타 방지·중복 추가 방지에 도움
- **판단**: 5개짜리 상수 + 빌드 타임 1회 실행이라 ROI 낮음. 1인 운영 비용 기준상 현 상태 유지 권장 (페르소나 §3.3).

### 2. llms.txt 갱신 누락 회귀 가드

- **파일**: `e2e/llms-txt-policy.spec.ts:57`
- **현재**: 15개 슬러그를 spec 안 상수에 직접 박아 검증
- **아이디어**: 글이 추가될 때 슬러그 상수 갱신을 잊으면 가드가 안 도는 점. 글 30개 넘어가는 시점에 옵션 B(빌드 타임 스크립트 + `fs.readdirSync(src/content/articles)` 기반 가드)로 전환 검토 — spec §운영자 결정 사항과도 정렬.

### 3. License 섹션 다국어화

- **파일**: `public/llms.txt:43-46`
- **현재**: 한국어 단문 3줄
- **아이디어**: 영어 병기. AI 크롤러는 다국어 처리하지만 영어 안내가 인용 정책 인식률을 더 높일 수 있음. 효과 측정 어려워 보류.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 없음) |

리뷰 종합: 변경 면적 최소(라우트 함수 1개 + 정적 파일 1개), 회귀 가드 9건 통과, 외부 의존성·동적 입력·접근성 surface 모두 해당 없음. 추가 정정 불요.
