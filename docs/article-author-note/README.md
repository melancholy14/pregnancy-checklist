# 아티클 authorNote 필드 추가 (Step 14)

> 작성일: 2026-04-11 | 작성자: Claude Code

## 개요

모든 아티클이 동일한 "정보 전달" 톤이었던 것에서, 선택적으로 **만든이의 한마디**(authorNote)를 추가하여 당사자성을 부여합니다. authorNote가 있는 아티클에서는 제목과 본문 사이에 따뜻한 톤의 카드가 표시됩니다.

---

## 구현 내용

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| ArticleMeta 타입에 `authorNote?: string` 추가 | ✅ 완료 | optional 필드 |
| frontmatter에서 authorNote 파싱 | ✅ 완료 | 기존 패턴과 동일하게 falsy 체크 |
| 5개 아티클에 authorNote 추가 | ✅ 완료 | PRD 초안 그대로 적용 |
| ArticleDetail에 authorNote 카드 UI 추가 | ✅ 완료 | 조건부 렌더링 |
| authorNote 없는 아티클에서 미렌더링 | ✅ 완료 | `article.authorNote &&` 가드 |

### 생성/수정 파일

#### 수정

- `src/types/article.ts` — `authorNote?: string` 필드 추가
- `src/lib/articles.ts` — `parseArticleMeta`에서 `authorNote` 파싱
- `src/components/articles/ArticleDetail.tsx` — authorNote 카드 UI (제목~본문 사이)
- `src/content/articles/hospital-bag.md` — authorNote frontmatter 추가
- `src/content/articles/baby-items-cost.md` — authorNote frontmatter 추가
- `src/content/articles/early-pregnancy-tests.md` — authorNote frontmatter 추가
- `src/content/articles/postpartum-care.md` — authorNote frontmatter 추가
- `src/content/articles/pregnancy-weight-management.md` — authorNote frontmatter 추가

#### 신규 생성

- `e2e/article-author-note.spec.ts` — E2E 테스트 11개

### authorNote 적용 아티클

| slug | authorNote |
|------|-----------|
| `hospital-bag` | "실제로 입원가방 쌌을 때, 블로그마다 리스트가 달라서 짜증났어요. 3개 이상 블로그에서 겹치는 것만 추렸습니다." |
| `baby-items-cost` | "스프레드시트로 정리했던 걸 그대로 옮겼어요. 가격은 2026년 기준입니다." |
| `early-pregnancy-tests` | "임신 초기에 어떤 검사를 언제 받아야 하는지 너무 헷갈렸어요. 병원마다 다른 것도 정리했습니다." |
| `postpartum-care` | "산후조리원 고를 때 뭘 기준으로 비교해야 하는지 몰라서 한참 헤맸어요." |
| `pregnancy-weight-management` | "체중계 올라갈 때마다 불안해서, 정상 범위가 어디까지인지 정리해봤습니다." |

### authorNote 미적용 아티클

`weekly-prep`, `newborn-bath-tips`, `infant-vaccination-schedule`, `postpartum-diet` — 직접 경험 기반이 약하여 PRD 기준으로 미적용.

### UI 스타일

- 배경: `bg-[#FFF4D4]/15`
- 보더: `border border-[#FFF4D4]/40`
- 라운드: `rounded-xl`
- 텍스트: `text-sm text-[#8B7520] italic`
- 제목: `💬 만든이의 한마디` (text-xs font-medium)

### 주요 결정 사항

- **텍스트 노드 렌더링**: authorNote는 `dangerouslySetInnerHTML`이 아닌 텍스트 노드로 렌더링하여 XSS 위험 없음
- **기존 패턴 준수**: `updated`, `linked_timeline_weeks`와 동일한 optional 필드 패턴 사용

---

## 코드 리뷰 결과

### Critical 이슈

없음

### Warning

없음

---

## E2E 테스트

### 테스트 파일

`e2e/article-author-note.spec.ts` — 11개 테스트

### 테스트 구성

| 카테고리 | 테스트 수 | 내용 |
|----------|-----------|------|
| Happy Path | 7개 | 5개 아티클 개별 authorNote 표시 + 카드 위치 + 스타일 |
| Error / Validation | 2개 | authorNote 미설정 아티클에서 카드 미렌더링 |
| 반응형 (Mobile 375px) | 2개 | 모바일 표시/미표시 검증 |

### 테스트 결과

```
11 passed (5.9s)
```

---

## 리팩토링

리팩토링 대상 없음. 코드 리뷰에서 Warning 0건으로 변경 사항이 기존 패턴과 완벽히 일치.
