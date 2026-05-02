# Phase 4 Step 5 — Crosslinks 코드 리뷰

## 리뷰 대상 파일
- `scripts/generate-crosslinks.ts` (신규, ~970줄)
- `src/lib/crosslink-utils.ts` (신규, 119줄)
- `package.json` (스크립트 3개 추가)

---

## Critical 이슈 (즉시 수정 완료)

발견된 Critical 이슈 없음. 타입 안전성·성능·보안·접근성 모두 통과.

리뷰 근거:
- **타입 안전성**: `any` 사용 0건. `as` 단언은 `change.diff.after as string[]` / `as (string|number)[]` 두 곳뿐이며, 둘 다 직전 컴파일러 시점에 `kind` 분기로 보장된 narrowing 결과를 다시 표현한 것이라 안전.
- **보안**: 파일 IO만 수행하는 CLI라 XSS/주입 표면이 없음. `new RegExp(\`^${key}:.*$\`, "m")`의 `key`는 6개 하드코딩된 필드명 중 하나만 들어와서 정규식 인젝션 표면 없음. `dangerouslySetInnerHTML`, `eval`, 환경변수 노출 등 일체 없음.
- **성능**: 콘텐츠 규모(아티클 8 / 영상 70 / 타임라인 36 / 체크리스트 3)에서 모든 페어 점수 계산이 O(n·m)로 합산 ~3,000회 이내. 메모리도 작은 Map 4개. 일회성 CLI라 React 렌더링 비용도 무관.
- **접근성**: UI 없음 (CLI). 해당 사항 없음.

---

## Warning (수정 권장)

### 1. `scripts/generate-crosslinks.ts:764` — change record에서 timeline ID를 라벨 스트링 split으로 복원
- **위치**: `applyChanges` 내부, timeline 변경 적용 루프
- **문제**: `change.itemLabel`이 `"[week 4] week_04_confirm_pregnancy"`라는 사람용 표시 문자열인데, apply 단계에서 마지막 토큰을 `split(" ").slice(-1)[0]`로 잘라 timeline id로 재사용한다. 현재 데이터의 `id` 값은 공백을 포함하지 않아 동작하지만, "표시 라벨에서 ID를 역추출"한다는 점이 의도 파악을 어렵게 하고, 라벨 포맷 변경 시 조용히 깨질 수 있다.
- **권장 수정**: `FileChange["changes"]` 항목 타입에 `targetId?: string` 같은 필드를 추가해 각 change 객체에 `tlId`(또는 article slug, checklist slug)를 함께 저장하고 apply에서 그 값을 직접 사용. 표시 라벨과 식별자 책임을 분리.

### 2. `scripts/generate-crosslinks.ts:493` — week → timeline item 역인덱스가 첫 매치만 사용
- **위치**: 양방향 대칭 루프 내부, `loaded.timeline.find((t) => t.week === week)`
- **문제**: 현재 데이터는 timeline week가 모두 유일하지만(검증함), 미래에 한 주차에 여러 항목이 생길 가능성이 있다. 그 경우 두 번째 이후 항목은 양방향 대칭 보강에서 제외된다. 또한 같은 루프가 N(article) × M(weeks)번 `.find()`를 호출해 O(N·M·T) 성능을 가진다(현재는 작아 무관).
- **권장 수정**: 루프 시작 전 `Map<number, TimelineItem[]>` 인덱스를 한 번 구축하고 lookup. `t.week === week`인 모든 항목에 대해 보강 처리.

### 3. `src/lib/crosslink-utils.ts:39-48` — `tokenize`가 영문 토큰을 불용어 필터하지 않음
- **위치**: `tokenize` 함수
- **문제**: `KOREAN_STOPWORDS`에는 한국어만 등록되어 있고 영문 토큰은 어떤 길이든 통과한다. 우리 콘텐츠에는 "NIPT", "BMI" 같은 의미 있는 영문 약어와 "and", "or" 같은 한국어 도메인에서 무의미한 영문 단어가 섞일 수 있다. 현재는 영문이 거의 등장하지 않아 영향 미미.
- **권장 수정**: 함수명 그대로 두고 stopword 세트만 영문도 포함하도록 확장하거나, "2글자 이상 + 영문은 길이 3 이상" 같은 길이 컷 분리.

---

## Suggestion (개선 아이디어)

### 1. `scripts/generate-crosslinks.ts` — manual 보호 항목을 dry-run 결과에서 가시화
드라이런 실행 시 "변경 예정"만 보여주고 manual 보호로 인해 스킵된 필드는 출력에 나타나지 않는다. 운영자가 "왜 이 항목은 갱신 안 되지?"라고 의문을 가질 수 있으니, dry-run 헤더 또는 항목별로 `🔒` 마커를 함께 표시하면 진단이 쉬워진다. (`--report` 모드에는 이미 `🔒 manual 보호 필드: N개`가 표시되긴 함.)

### 2. `scripts/generate-crosslinks.ts:269-274` — `formatYamlInlineArray`의 정규화 미세 개선
현재는 따옴표만 escape(`\\"`). 슬러그/ID는 백슬래시·줄바꿈을 포함할 수 없는 도메인이라 실용상 문제 없지만, 안전성을 위해 백슬래시도 함께 escape(`\\\\`) 하는 일반화가 가능. 또는 단순히 "허용 문자(영문+숫자+하이픈+언더스코어)"만 통과시키는 화이트리스트 검증을 추가.

### 3. 매칭 임계값/topN 상수의 환경변수 오버라이드
`CROSSLINK_THRESHOLD`, `CROSSLINK_TOP_N`은 utils에 하드코딩. 콘텐츠 늘어나면 튜닝 빈도가 올라갈 수 있으니 `--threshold=0.25 --top=4` 같은 CLI 옵션 또는 `.env` 키로 받게 하면 운영자 워크플로가 매끄러워짐.

### 4. front matter 미니 파서/라이터의 단위 테스트
정규식 기반 in-place 치환은 다양한 엣지케이스(블록 시퀀스 형태, 마지막 줄 개행 유무 등)에서 미묘하게 깨질 수 있다. 통합 테스트는 이미 sandbox에서 검증했지만, `parseSimpleYaml`/`setFrontMatterField`만 따로 단위 테스트하면 회귀를 더 빨리 잡을 수 있다.

### 5. report 출력에 manual 보호 필드 분포를 항목별로 노출
현재는 `🔒 manual 보호 필드: N개`로 총합만 표시. 어떤 콘텐츠의 어떤 필드가 보호 중인지 표를 함께 보여주면 운영자가 "내가 잠근 매핑이 무엇이었지" 환기에 좋다.

---

## 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 (수정 불필요) |
| Warning | 3건 (라벨 기반 ID 역추출, week 인덱스, tokenize 영문 필터) |
| Suggestion | 5건 |
| 빌드 | 미실행 (Critical 없음) |
