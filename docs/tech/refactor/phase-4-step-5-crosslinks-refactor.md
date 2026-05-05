# Phase 4 Step 5 — Crosslinks 리팩토링

## 리팩토링한 파일 목록
- `scripts/generate-crosslinks.ts`
- `src/lib/crosslink-utils.ts`

---

## 작업별 내용

### 1. `scripts/generate-crosslinks.ts` — `FileChange.changes`에 `targetId` 추가
- **출처**: Warning #1
- **무엇을**: change 객체 타입에 `targetId: string` 필드 추가. `computeChanges`의 timeline/checklist/article 분기에서 각각 `tl.id`, `meta.slug`, `a.slug`를 명시적으로 저장. `applyChanges`의 timeline 적용 루프는 `change.itemLabel.split(" ").slice(-1)[0]` 대신 `change.targetId`를 사용하고, `data.find()` 대신 `Map<string, TimelineItem>`(`byId`)으로 lookup.
- **왜**: 표시 라벨에서 ID를 역추출하는 패턴은 라벨 포맷 변경 시 silently 깨질 수 있고, 사람용 출력과 식별 책임이 한 필드에 섞여 있어 의도가 불명확. 동작은 동일하지만 의도가 코드에 드러나고 future-proof.

### 2. `scripts/generate-crosslinks.ts` — week → timeline 인덱스를 Map으로 미리 구축
- **출처**: Warning #2
- **무엇을**: 양방향 대칭 보강 루프(`for (const a of loaded.articles) ... for (const week of weeks) ...`)에서 매번 `loaded.timeline.find((t) => t.week === week)`를 호출하던 코드를 한 번만 빌드되는 `timelineByWeek: Map<number, TimelineItem[]>`로 교체. 같은 week에 여러 항목이 있을 경우 모두 보강하도록 inner loop 적용.
- **왜**: ① 미래에 한 주차에 여러 timeline 항목이 추가될 수 있는데 기존 `.find()`는 첫 매치만 사용해 누락 가능. ② N(article) × M(weeks) 매번 선형 탐색 → O(1) 조회로 단축. 현재 데이터 규모에서는 둘 다 미세하지만 의도는 명확해짐.

### 3. `scripts/generate-crosslinks.ts` — 단방향 매칭 4회 → `bipartiteMatch` 헬퍼 추출
- **출처**: 추가 판단
- **무엇을**: Timeline→Videos / Article→Videos / Checklist→Articles / Checklist→Videos의 동일 패턴 4번 반복(점수 매기기 → top-N → Map 저장)을 제네릭 헬퍼 `bipartiteMatch<L, R>(left, right, leftFeats, rightFeats, leftKey, rightKey)`로 추출. 각 호출부는 6줄 → 8줄짜리 함수 호출 한 번으로 축약.
- **왜**: 동일 흐름이 거의 변수명만 바꿔 4번 등장. 추출 후 매칭 정책 변경(예: 임계값/topN 옵션 추가)이 한 곳에서만 일어남. 30+줄 중복 → 헬퍼 1개로 정리.

### 4. `src/lib/crosslink-utils.ts` — `tokenize`에 영문 stopword + 길이 컷 분리
- **출처**: Warning #3
- **무엇을**: `ENGLISH_STOPWORDS` 세트(`and`, `the`, `for`, `with`, `from`, `this`, `that`, `your`, `you`, `vs`) 추가. 토큰 검사 시 한국어/영문을 정규식으로 분기해 `KOREAN_TOKEN_MIN_LEN=2`, `ENGLISH_TOKEN_MIN_LEN=3`로 길이 컷을 다르게 적용.
- **왜**: 기존에는 영문 토큰이 어떤 길이든 통과해서 콘텐츠에 점차 추가될 영문 약어/일반어 노이즈에 취약. 한국어는 2글자도 의미 단위가 되지만 영문 2글자는 거의 stopword(of, in, on 등)라 컷이 다름.

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `generate-crosslinks.ts` 줄 수 | 967 | 985 (+18, 헬퍼 + Map 구축) |
| 단방향 매칭 코드 중복 | 4회 (~30줄) | `bipartiteMatch` 1개 (4번 호출) |
| timeline ID 식별 방식 | itemLabel 문자열 split | `change.targetId` 명시 필드 |
| week → timeline 조회 | 매번 `.find()` 선형 탐색 | `Map<week, TimelineItem[]>` O(1) |
| 영문 stopword | 없음 | 10개 + 길이 컷 3 |

---

## 빌드 결과
성공 (1회 시도). E2E 회귀 테스트 14/14 모두 통과.
