# Phase 4 Step 4 — 공유 기능 코드 리뷰

## 리뷰 대상 파일
- `src/lib/share.ts`
- `src/components/share/ShareButton.tsx`
- `src/components/share/ShareModal.tsx`
- `src/components/articles/ArticleDetail.tsx`
- `src/components/checklist/ChecklistPage.tsx`
- `src/components/timeline/TimelineContainer.tsx`

---

## Critical 이슈 (즉시 수정 완료)

없음.

---

## Warning (수정 권장)

없음.

---

## 추가 변경 (리뷰 후)

### 모바일/데스크톱 분기 도입
- **변경**: `triggerShare`가 `matchMedia("(pointer: coarse) and (hover: none)")`로 모바일/터치 환경을 먼저 판정한 뒤, 그 경우에만 `navigator.share`를 호출. 데스크톱은 항상 모달 fallback.
- **이유**: 데스크톱 Chrome/Edge/Safari도 `navigator.share`를 지원해 기존 분기로는 모달이 거의 노출되지 않음 → PRD의 "데스크톱 모달 fallback" 의도와 어긋남.
- **테스트**: e2e 스펙의 모바일 describe에 `hasTouch: true`를 추가해 `pointer: coarse` 매체 쿼리를 매칭시키고, 데스크톱 케이스는 "navigator.share가 있어도 모달이 우선된다"로 보강.

---

## Suggestion (개선 아이디어)

### 1. `src/lib/share.ts` — `triggerShare`의 catch가 모든 에러를 동일하게 무시
- **위치**: `src/lib/share.ts:33-35`
- **내용**: `navigator.share`가 AbortError를 던지면 무시가 맞지만, 그 외의 일시 오류(권한·네트워크 등)도 함께 swallow된다. 사용자는 어떤 피드백도 못 받음.
- **제안**: `err.name !== "AbortError"`이면 toast 에러를 띄우거나 모달 fallback으로 유도. 현재는 의도적으로 묵음이라 버그는 아님.

### 2. `src/lib/share.ts` — clipboard 미지원과 실제 실패를 동일 토스트로 처리
- **위치**: `src/lib/share.ts:56-58`
- **내용**: `navigator.clipboard` 미지원과 `writeText` 실패가 같은 메시지("링크 복사에 실패했어요…")로 표시됨. 분기 메시지가 다르면 사용자가 원인을 파악하기 쉬움.
- **제안**: 미지원은 "사용 중인 브라우저가 복사를 지원하지 않아요. 입력란을 길게 눌러 복사해 주세요." 같이 분리.

### 3. `src/components/share/ShareModal.tsx` — 복사 실패 시에도 모달이 닫힘
- **위치**: `src/components/share/ShareModal.tsx:30-33`
- **내용**: `await copyShareLink` 직후 무조건 `onOpenChange(false)`. 실패 시 사용자가 모달 안에서 텍스트를 직접 선택해 복사할 기회가 사라짐.
- **제안**: `copyShareLink`가 성공/실패를 boolean으로 반환하도록 바꾸고, 성공일 때만 close.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 |
| 빌드 | 미실행 (Critical 수정 없음) |

### 리뷰 코멘트

- `triggerShare`에서 `await navigator.share(data)`의 `data`(title/text/url)는 모두 앱 내부 상수·메타에서 조립된 값이라 사용자 입력 주입 경로가 없음. XSS·SSRF 등 보안 이슈 없음.
- `ShareButton`이 같은 페이지에 두 개(아티클 본문 상단·하단) 노출되어도 각자 `useState`를 가져 모달 상태가 독립적. 한쪽 모달 열림이 다른 쪽에 영향을 주지 않음 — 의도된 동작.
- `aria-label`과 visible text가 동일한 경우(예: "공유하기"), 스크린 리더는 aria-label을 우선해 동일 음성을 출력 → 중복이지만 문제 없음. 굳이 제거할 이유 없음.
- DOM lib의 `ShareData` 타입을 그대로 사용해 별도 타입 정의를 만들지 않은 점은 깔끔함.
- `BASE_URL` 직접 concat은 `BASE_URL`이 trailing slash 없는 상수이고 slug도 알려진 안전한 문자열만 사용해 URL 인코딩 누락이나 더블 슬래시 위험이 없음.
