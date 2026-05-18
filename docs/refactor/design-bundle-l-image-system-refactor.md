# design-bundle-l-image-system 리팩토링

> 리팩토링일: 2026-05-10
> 관련 review: [docs/review/design-bundle-l-image-system-review.md](../review/design-bundle-l-image-system-review.md)

## 리팩토링한 파일 목록

- `src/lib/markdown/rehype-article-figure.ts` — path traversal 방어 추가
- `src/app/globals.css` — focus / focus-visible 폴백 패턴 적용

(추가 판단 항목 없음 — 중복·큰 컴포넌트·커스텀 훅·과다 메모이제이션 모두 해당 없음)

---

## 작업별 내용

### 1. `rehype-article-figure.ts` — path traversal 방어

- **출처**: Warning 1
- **무엇을**: `readImageDimensions()` 내부에서 `fs.readFileSync` 호출 직전에 정규화된 절대 경로가 `PUBLIC_DIR + path.sep`로 시작하는지 검증. 검증 실패 시 경고 로그 + `undefined` 반환으로 fallback 분기. `path.join`을 `path.normalize(path.join(...))`로 감싸 `..` 정규화 결과를 명시적으로 검사.
- **왜**: `src` 값이 `"/../../etc/passwd"` 형식이면 빌드 머신에서 PUBLIC_DIR 바깥 파일에 read syscall이 발생할 가능성. 결과가 PNG/JPEG 헤더 검사를 통과하지 않으면 width/height attribute에 실 정보 누설은 0이지만, 방어적 코딩으로 외부 파일 접근 자체를 차단. 신뢰 경계는 운영자 1인이라 실 위험 매우 낮지만 보안 경계 명확화에 기여.

### 2. `globals.css` — focus / focus-visible 폴백 패턴

- **출처**: Warning 2
- **무엇을**: 기존 `.article-figure__link { outline: none }` + `:focus-visible { box-shadow: ... }` 조합을 다음 3단 패턴으로 확장:
  1. `:focus` — outline 제거 + box-shadow ring (focus-visible 미지원 환경 대상 폴백)
  2. `:focus:not(:focus-visible)` — box-shadow 제거 (focus-visible 지원 + 마우스 클릭 시 ring 안 보이게)
  3. `:focus-visible` — outline 제거 + box-shadow ring (focus-visible 지원 + 키보드 포커스)
- **왜**: focus-visible를 미지원하는 브라우저에서도 키보드 사용자가 anchor 포커스를 시각적으로 인식. 동시에 modern 브라우저의 focus-visible 동작(키보드만 ring 표시, 마우스 클릭은 ring 미표시)도 보존. WCAG 2.1 AA 키보드 도달 가시성을 더 넓은 환경에서 충족.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 2개 | 2개 (변동 없음) |
| `rehype-article-figure.ts` 줄 수 | 270줄 | 275줄 (+5: path 검증 분기) |
| `globals.css` `.article-figure__link` 블록 줄 수 | 11줄 | 22줄 (+11: 3단 focus 폴백) |
| Warning 처리 | 0/2 | 2/2 ✅ |
| 동작 변경 | 없음 (구조·폴백만 추가) |

---

## 빌드 결과

성공 (1회 시도). TypeScript 타입 검사 통과, static export 32 페이지 생성 완료.
