# faq-jsonld 리팩토링

> 작성일: 2026-06-08
> 관련 리뷰: [docs/review/faq-jsonld-review.md](../review/faq-jsonld-review.md)
> 관련 기획: [docs/features/faq-jsonld/spec.md](../../features/faq-jsonld/spec.md)

## 리팩토링한 파일 목록

- `src/lib/articles.ts` — FAQ 답변 처리용 remark processor 를 module scope 로 lift + `.freeze()` 재사용

---

## 작업별 내용

### 1. `src/lib/articles.ts` — `faqAnswerProcessor` module-scope 캐싱

- **출처**: 리뷰 Warning #2
- **무엇을**: `getArticleBySlug` 안에서 `Promise.all(meta.faq.map(async (item) => remark()...))` 패턴을 호출마다 새 processor 를 만들지 않도록 module 최상단의 `faqAnswerProcessor`(remark 체인 `.freeze()` 결과)로 lift. 콜사이트는 `await faqAnswerProcessor.process(item.a)` 로 단순화.
- **왜**: 빌드 시점 글 1편에 답변 5~6 items × 18 articles = 약 25~30 회 processor 생성을 1회로 축소. 빌드 시간 회귀는 미관찰이지만 동일 패턴이 반복되는 코드의 중복을 제거하고 향후 본문 processor 와 통일할 때 같은 SoT 를 따르게 함.

---

## 유보된 리뷰 Warning (의도적 미실행)

### Warning #1 — JSON-LD `</script>` 이스케이프

- **이유**: 같은 page.tsx 의 기존 `ArticleJsonLd` 도 동일 패턴(`dangerouslySetInnerHTML={{__html: JSON.stringify(...)}}`)을 사용. FAQ 만 hardening 하면 두 컴포넌트의 패턴이 어긋남. 운영자 1인 컨트롤 + AdSense 게이트 영역이라 실제 위험도 0 에 가까움. 리뷰 문서에 PR-外 일괄 정리 권장으로 기록.

### Warning #3 — `faqHtmlAnswers` length invariant

- **이유**: `Article` 타입을 `Omit<ArticleMeta, 'faq'> & { faq: Rendered[] }` 로 override 하는 패턴 도입 필요. ArticleMeta 가 sitemap / listing 등 비동기 안 거치는 경로에서도 호출되므로 raw 와 rendered 표현 분리는 합리적이지만, 타입 시스템 강제는 별도 PR 범위.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| FAQ 답변 processor 인스턴스화 | 답변 1개당 1회 (~25~30회/빌드) | module load 1회 + `.freeze()` 재사용 |
| `src/lib/articles.ts` 줄 수 | 200줄 | 196줄 (-4) |
| `getArticleBySlug` 답변 처리 블록 | 12줄 | 7줄 |
| 빌드 시간 (`npm run build`) | ~3.6s | ~3.2s (체감 변화 미미, 측정 변동 범위) |

## 빌드 결과

✓ 성공 (1회 시도). 5개 backfill 글 모두 `"@type":"FAQPage"` 1회 유지 (정적 출력 grep 재검증 완료).
