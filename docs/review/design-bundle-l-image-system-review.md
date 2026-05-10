# design-bundle-l-image-system 코드 리뷰

> 리뷰일: 2026-05-10
> 관련 spec: [docs/features/design-bundle-l-image-system/spec.md](../features/design-bundle-l-image-system/spec.md)
> 관련 impl: [docs/implementation/design-bundle-l-image-system-impl.md](../implementation/design-bundle-l-image-system-impl.md)

## 리뷰 대상 파일

- `src/lib/markdown/rehype-article-figure.ts` — PNG/JPEG 헤더 파서 + figure 변환 확장 (anchor 래핑, lazy, ExternalLink 분기, suffix)
- `src/app/globals.css` — `.article-figure*` 토큰 + focus-visible ring CSS

(docs/plan/phase-4.5.md, docs/tech/infra.md, docs/content/image-sop.md 는 문서 갱신이라 코드 리뷰 범위 밖)

---

## Critical 이슈 (즉시 수정 완료)

**없음.** 4가지 관점(타입 안전성·성능·보안·접근성) 모두 사용자 피해 또는 런타임 크래시로 이어지는 결함 발견되지 않음.

---

## Warning (수정 권장)

### 1. `rehype-article-figure.ts` — `path.join` 정규화로 인한 빌드 타임 path traversal 가능성

- **위치**: [src/lib/markdown/rehype-article-figure.ts:21](../../src/lib/markdown/rehype-article-figure.ts#L21)
- **문제**: `src` 값이 `"/../../etc/passwd"` 같은 형식이면 `path.join(PUBLIC_DIR, src)`가 `..`를 정규화하여 PUBLIC_DIR 바깥 파일을 읽을 수 있음. 결과가 PNG/JPEG 헤더 검사를 통과하지 않으면 `undefined`를 반환하므로 실제 정보 누설은 0이지만, 빌드 머신에서 임의 파일 read syscall이 발생.
- **권장 수정**: `fs.readFileSync` 호출 직전에 정규화된 절대 경로가 `PUBLIC_DIR`로 시작하는지 검증.
  ```ts
  const filePath = path.normalize(path.join(PUBLIC_DIR, src));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    console.warn(`[rehype-article-figure] image path escape blocked: ${src}`);
    return undefined;
  }
  ```
- **신뢰 경계**: 빌드 타임 입력은 운영자 1인이 작성하는 markdown이므로 신뢰 경계 안. 실 위험 매우 낮음 — 방어적 코딩 차원의 권장.

### 2. `globals.css` — `outline: none` + focus-visible box-shadow가 focus-visible 미지원 환경에서 키보드 포커스 미표시

- **위치**: [src/app/globals.css:396](../../src/app/globals.css#L396)
- **문제**: `.article-figure__link { outline: none }`로 기본 outline을 제거하고 `:focus-visible` 의사 클래스에서만 box-shadow ring으로 대체. focus-visible를 미지원하는 브라우저(예: IE 11, 일부 구버전 모바일 브라우저)에서는 키보드 사용자가 anchor에 포커스되었는지 시각적으로 인식 불가.
- **권장 수정**: focus-visible 미지원 폴백으로 일반 `:focus`에도 ring 적용 후, `:focus:not(:focus-visible)`로 마우스 클릭 시 ring 제거 (modern 패턴).
  ```css
  .article-figure__link:focus { box-shadow: ...; }
  .article-figure__link:focus:not(:focus-visible) { box-shadow: none; }
  .article-figure__link:focus-visible { box-shadow: ...; }
  ```
- **타겟 브라우저**: 본 프로젝트는 modern 브라우저만 지원하면 acceptable. Chrome 86+ / Safari 15.4+ / Firefox 85+ 모두 focus-visible 지원.

---

## Suggestion (개선 아이디어)

### 1. `rehype-article-figure.ts` — 이미지 dimension 캐싱

같은 이미지가 여러 글에 등장할 때 빌드 타임마다 `fs.readFileSync` 반복. `Map<src, ImageDimensions>` 모듈 스코프 캐시로 disk I/O 절감 가능. 현재 발행 글 2건 + figure 1개씩이라 영향 미미하지만 콘텐츠 증가 시 빌드 시간 단축에 기여.

### 2. `rehype-article-figure.ts` — PNG/JPEG 헤더만 부분 읽기

PNG는 첫 24바이트, JPEG는 SOF 마커까지만 필요. `fs.readFileSync`로 전체 파일을 메모리에 로딩하는 대신 `fs.openSync` + `fs.readSync(buffer, 0, N, 0)`로 부분 읽기 시 빌드 타임 메모리 사용량 감소. 1MB 이미지 2건 환경에서는 무의미한 최적화이고, 코드 복잡도 증가만 초래할 수 있음.

### 3. `rehype-article-figure.ts` — `createExternalLinkSvg()`를 모듈 상수로 추출

매 호출마다 동일한 hast 노드 객체를 새로 생성. 다만 hast tree는 노드 mutation을 허용하므로 동일 인스턴스 공유 시 다른 plugin이 변경할 위험. 안전을 위해 매번 새로 생성하는 현 패턴이 합리적 — 변경 권장하지 않음.

### 4. `rehype-article-figure.ts` — 외부 URL 이미지에도 width/height 운영자 수기 입력 옵션

현재 외부 URL은 width/height 미설정이라 CLS 0 보장 불가. spec §3 should의 외부 이미지 처리 항목과 정합. markdown title 슬롯 외 별도 메타 (예: 확장 syntax `![alt](src "caption" 720x480)`)로 운영자가 명시할 수 있으면 외부 이미지도 CLS 0 달성. 단 운영자 SOP에 외부 이미지 비권장이 이미 박혀 있어 우선순위 낮음.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 완료 |
| Warning | 2건 |
| Suggestion | 4건 |
| 빌드 | 미실행 (Critical 없음) |
