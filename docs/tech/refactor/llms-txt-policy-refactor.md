# llms-txt-policy 리팩토링

> 출처: [docs/review/llms-txt-policy-review.md](../review/llms-txt-policy-review.md) Suggestion §1
> 리팩토링일: 2026-06-10

## 리팩토링한 파일 목록

- `src/app/robots.ts`

---

## 작업별 내용

### 1. src/app/robots.ts — `AI_CRAWLER_USER_AGENTS` 타입 좁히기

- **출처**: 추가 판단 (code-review Suggestion §1 승격)
- **무엇을**: `const AI_CRAWLER_USER_AGENTS = [...]` → `const AI_CRAWLER_USER_AGENTS = [...] as const` 한 단어 추가. 추론 타입이 `string[]` → `readonly ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]` 로 좁혀짐.
- **왜**: 동작 변경 없음. 향후 user-agent 오타·중복 추가를 컴파일 타임에서 잡고, IDE 자동완성 시 5개 리터럴이 그대로 표시되어 가독성 향상. 1인 운영 ROI 기준상 한 단어 = 무비용 변경이라 적용.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 1 | 1 |
| 최대 파일 줄 수 | 26 | 26 |
| `AI_CRAWLER_USER_AGENTS` 추론 타입 | `string[]` | `readonly ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]` |
| Public interface (`default export`) | `MetadataRoute.Robots` 반환 | 동일 |

---

## 빌드 결과

성공 (1회 시도). `out/robots.txt` 응답 형식 변동 없음.
