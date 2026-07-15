# phase-4-step-5-crosslinks

> 상태: 구현✅ 리뷰✅ 리팩토링✅ | 최종 갱신 —

<!-- STEP:impl -->
## 구현

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| `--dry-run` 모드에서 변경 예정 사항이 정상 출력 | ✅ 완료 | 실측 78개 변경 후보 출력 확인 |
| `--apply` 모드에서 JSON/front matter 정상 갱신 | ✅ 완료 | 12개 파일 갱신 (timeline 1, checklist 3, articles 8) |
| `--report` 모드에서 현재 크로스링크 통계 출력 | ✅ 완료 | 평균/커버리지/manual 보호 카운트 출력 |
| `*_manual: true` 매핑이 보호됨 | ✅ 완료 | 임시로 플래그 추가해 검증 — 해당 필드만 변경 목록에서 제외 |
| 존재하지 않는 콘텐츠에 대한 링크 생성 안 됨 | ✅ 완료 | `existingArticleSlugs/Videos/Weeks` 화이트리스트 필터 |
| 인자 없이 실행하면 사용법 출력 + 비제로 종료 | ✅ 완료 | exit 1 확인 |
| 알 수 없는 인자 → 명확한 에러 + 비제로 종료 | ✅ 완료 | `--bogus` / 다중 모드 모두 처리 |
| `--apply` 후 `npm run build` 성공 | ✅ 완료 | 정적 페이지 29개 생성 성공 |
| 양방향 대칭성 (Timeline ↔ Article) | ✅ 완료 | 한 쪽 top-N에 든 페어는 반대편에도 등록 |

### 생성/수정 파일 목록
#### 신규 생성
- `scripts/generate-crosslinks.ts` — CLI 진입점. 인자 파싱, 데이터 로딩, 매칭, 모드별 디스패치 (`--dry-run` / `--apply` / `--report`)
- `src/lib/crosslink-utils.ts` — 매칭 알고리즘 공용 유틸. `tokenize`, `jaccardSimilarity`, `inferUnifiedTagKeys`, `unifiedTagsForWeek`, `relevanceScore`. 임계값/topN 상수도 export

#### 수정
- `package.json` — `crosslinks`, `crosslinks:apply`, `crosslinks:report` npm 스크립트 3종 추가

#### 실행 산출물 (--apply 시 자동 갱신, 본 커밋에는 포함하지 않음)
- `src/data/timeline_items.json` — `linked_article_slugs`, `linked_video_ids`
- `src/data/{hospital_bag,partner_prep,pregnancy_prep}_checklist.json` — `meta.linked_article_slugs`, `meta.linked_video_ids`
- `src/content/articles/*.md` — front matter `linked_timeline_weeks`, `linked_video_ids`

### 주요 결정 사항
- **`crosslink-utils.ts`의 `unified-tags` import를 `@/lib/...`이 아닌 상대 경로(`./unified-tags`)로 작성**: 기존 `scripts/` 디렉토리는 path alias 없이 동작하는 standalone Node 스크립트 패턴이고, 공용 유틸을 양쪽에서 안전하게 쓰려면 alias 의존을 제거하는 편이 안정적이라고 판단. Next.js 빌드는 상대 경로도 정상 처리.
- **YAML front matter를 `gray-matter`로 재직렬화하지 않고 자체 미니 파서/라이터 구현**: gray-matter+js-yaml은 따옴표/순서를 모두 재포맷해 diff가 폭발함. 대신 정규식 기반으로 대상 필드 라인만 in-place 치환하고, 없으면 closing `---` 직전에 한 줄 append. 본문/공백/다른 필드는 그대로 보존.
- **양방향 대칭은 Timeline ↔ Article에만 적용**: PRD 명시 출력 6개 필드 중 양쪽에 back-link 필드가 있는 페어는 이 한 쌍뿐. Video는 `videos.json`에 back-link 필드가 없어 단방향이 자연스러움. Checklist→Article도 articles 측에 `linked_checklist_slugs`가 없어 단방향 처리.
- **Checklist의 unified tag 추론**: 슬러그 기반 하드코딩 매핑(`hospital-bag → birth-prep`, `partner-prep → birth-prep+postpartum`, `pregnancy-prep → pregnancy-prep+pregnancy-early`)에 더해 메타+아이템 텍스트의 키워드 추론을 합집합. 슬러그 기반 매핑이 없으면 키워드만 사용.
- **항목당 자동 링크 상한 5개**: PRD 5-3 단점 분석의 "임신 공통 태그로 모든 글 연결" 우려 대응. 임계값 0.2 + 점수 desc 정렬 후 상위 5개로 컷. 양방향 대칭으로 인해 일부 항목은 5개를 초과할 수 있음 (의도).
- **stop word 리스트 도메인 특화**: "임신·출산·태아·산모·임산부·아기·엄마·체크리스트·총정리" 등 모든 콘텐츠에 흔하게 등장해 변별력이 없는 한국어 단어를 제거. 리스트는 `crosslink-utils.ts` 안에서 직접 관리.
- **JSON 출력 시 manual 보호된 필드는 변경 목록 자체에서 제외**: `before/after`가 같으면 어차피 diff가 0이지만, 명시적으로 protected 필드는 매핑 단계에서 건너뛰어 의도가 코드에 드러나도록 함.

### 가정 사항
- 실행은 운영자가 수동으로 (`crosslinks` → 검토 → `crosslinks:apply`). CI 자동화는 Phase 5 이연.
- 매칭 임계값 0.2 + topN 5는 현재 콘텐츠 규모(아티클 8 / 영상 70 / 타임라인 36 / 체크리스트 3)에 적합. 향후 콘텐츠 증가 시 재튜닝 가능 (상수 변경만으로 처리).
- `*_manual: true` 플래그는 필드 단위 보호. 부분 manual(일부만 수동 + 일부 자동)은 지원하지 않음.
- Article side에 새로 추가될 수 있는 `linked_video_ids`는 현재 UI 소비처가 없음(연관 영상은 태그 기반 `getRelatedVideos`로 동작). 미래에 직접 매핑 우선 사용으로 전환할 수 있도록 데이터만 먼저 적재.
- `linked_checklist_slugs`(timeline 측)와 `linked_timeline_weeks`(checklist meta 측)는 PRD 출력 명세에 없어 본 스크립트가 관리하지 않음. 수동 관리 유지.

### 미구현 항목
- **TF-IDF 가중치**: PRD 단점 대응에 "필요 시 적용"으로만 언급되어 있고, 현재 콘텐츠 규모에서는 stop word 필터로 충분히 변별 가능. 도입 시점은 콘텐츠 20개+ 이후로 보류.
- **CI/pre-commit 훅 통합**: PRD에 명시되지 않음. 운영자 수동 실행 모델 유지.
- **JSON 키 순서 정규화**: `linked_video_ids` 등 신규 필드를 추가할 때 기존 필드 순서를 그대로 두고 끝에 append. 일부 timeline 항목에서 `seo_slug` 다음에 새 필드가 위치할 수 있으나, 빌드/소비 코드에는 영향 없음.
- **체중 차트 BMI 시각화 / 크로스링크 영역 확장(영상↔타임라인 일괄 등)**: Phase 5로 이연된 별개 작업.

---

<!-- STEP:review -->
## 코드 리뷰

### 리뷰 대상 파일
- `scripts/generate-crosslinks.ts` (신규, ~970줄)
- `src/lib/crosslink-utils.ts` (신규, 119줄)
- `package.json` (스크립트 3개 추가)

---

### Critical 이슈 (즉시 수정 완료)

발견된 Critical 이슈 없음. 타입 안전성·성능·보안·접근성 모두 통과.

리뷰 근거:
- **타입 안전성**: `any` 사용 0건. `as` 단언은 `change.diff.after as string[]` / `as (string|number)[]` 두 곳뿐이며, 둘 다 직전 컴파일러 시점에 `kind` 분기로 보장된 narrowing 결과를 다시 표현한 것이라 안전.
- **보안**: 파일 IO만 수행하는 CLI라 XSS/주입 표면이 없음. `new RegExp(\`^${key}:.*$\`, "m")`의 `key`는 6개 하드코딩된 필드명 중 하나만 들어와서 정규식 인젝션 표면 없음. `dangerouslySetInnerHTML`, `eval`, 환경변수 노출 등 일체 없음.
- **성능**: 콘텐츠 규모(아티클 8 / 영상 70 / 타임라인 36 / 체크리스트 3)에서 모든 페어 점수 계산이 O(n·m)로 합산 ~3,000회 이내. 메모리도 작은 Map 4개. 일회성 CLI라 React 렌더링 비용도 무관.
- **접근성**: UI 없음 (CLI). 해당 사항 없음.

---

### Warning (수정 권장)

#### 1. `scripts/generate-crosslinks.ts:764` — change record에서 timeline ID를 라벨 스트링 split으로 복원
- **위치**: `applyChanges` 내부, timeline 변경 적용 루프
- **문제**: `change.itemLabel`이 `"[week 4] week_04_confirm_pregnancy"`라는 사람용 표시 문자열인데, apply 단계에서 마지막 토큰을 `split(" ").slice(-1)[0]`로 잘라 timeline id로 재사용한다. 현재 데이터의 `id` 값은 공백을 포함하지 않아 동작하지만, "표시 라벨에서 ID를 역추출"한다는 점이 의도 파악을 어렵게 하고, 라벨 포맷 변경 시 조용히 깨질 수 있다.
- **권장 수정**: `FileChange["changes"]` 항목 타입에 `targetId?: string` 같은 필드를 추가해 각 change 객체에 `tlId`(또는 article slug, checklist slug)를 함께 저장하고 apply에서 그 값을 직접 사용. 표시 라벨과 식별자 책임을 분리.

#### 2. `scripts/generate-crosslinks.ts:493` — week → timeline item 역인덱스가 첫 매치만 사용
- **위치**: 양방향 대칭 루프 내부, `loaded.timeline.find((t) => t.week === week)`
- **문제**: 현재 데이터는 timeline week가 모두 유일하지만(검증함), 미래에 한 주차에 여러 항목이 생길 가능성이 있다. 그 경우 두 번째 이후 항목은 양방향 대칭 보강에서 제외된다. 또한 같은 루프가 N(article) × M(weeks)번 `.find()`를 호출해 O(N·M·T) 성능을 가진다(현재는 작아 무관).
- **권장 수정**: 루프 시작 전 `Map<number, TimelineItem[]>` 인덱스를 한 번 구축하고 lookup. `t.week === week`인 모든 항목에 대해 보강 처리.

#### 3. `src/lib/crosslink-utils.ts:39-48` — `tokenize`가 영문 토큰을 불용어 필터하지 않음
- **위치**: `tokenize` 함수
- **문제**: `KOREAN_STOPWORDS`에는 한국어만 등록되어 있고 영문 토큰은 어떤 길이든 통과한다. 우리 콘텐츠에는 "NIPT", "BMI" 같은 의미 있는 영문 약어와 "and", "or" 같은 한국어 도메인에서 무의미한 영문 단어가 섞일 수 있다. 현재는 영문이 거의 등장하지 않아 영향 미미.
- **권장 수정**: 함수명 그대로 두고 stopword 세트만 영문도 포함하도록 확장하거나, "2글자 이상 + 영문은 길이 3 이상" 같은 길이 컷 분리.

---

### Suggestion (개선 아이디어)

#### 1. `scripts/generate-crosslinks.ts` — manual 보호 항목을 dry-run 결과에서 가시화
드라이런 실행 시 "변경 예정"만 보여주고 manual 보호로 인해 스킵된 필드는 출력에 나타나지 않는다. 운영자가 "왜 이 항목은 갱신 안 되지?"라고 의문을 가질 수 있으니, dry-run 헤더 또는 항목별로 `🔒` 마커를 함께 표시하면 진단이 쉬워진다. (`--report` 모드에는 이미 `🔒 manual 보호 필드: N개`가 표시되긴 함.)

#### 2. `scripts/generate-crosslinks.ts:269-274` — `formatYamlInlineArray`의 정규화 미세 개선
현재는 따옴표만 escape(`\\"`). 슬러그/ID는 백슬래시·줄바꿈을 포함할 수 없는 도메인이라 실용상 문제 없지만, 안전성을 위해 백슬래시도 함께 escape(`\\\\`) 하는 일반화가 가능. 또는 단순히 "허용 문자(영문+숫자+하이픈+언더스코어)"만 통과시키는 화이트리스트 검증을 추가.

#### 3. 매칭 임계값/topN 상수의 환경변수 오버라이드
`CROSSLINK_THRESHOLD`, `CROSSLINK_TOP_N`은 utils에 하드코딩. 콘텐츠 늘어나면 튜닝 빈도가 올라갈 수 있으니 `--threshold=0.25 --top=4` 같은 CLI 옵션 또는 `.env` 키로 받게 하면 운영자 워크플로가 매끄러워짐.

#### 4. front matter 미니 파서/라이터의 단위 테스트
정규식 기반 in-place 치환은 다양한 엣지케이스(블록 시퀀스 형태, 마지막 줄 개행 유무 등)에서 미묘하게 깨질 수 있다. 통합 테스트는 이미 sandbox에서 검증했지만, `parseSimpleYaml`/`setFrontMatterField`만 따로 단위 테스트하면 회귀를 더 빨리 잡을 수 있다.

#### 5. report 출력에 manual 보호 필드 분포를 항목별로 노출
현재는 `🔒 manual 보호 필드: N개`로 총합만 표시. 어떤 콘텐츠의 어떤 필드가 보호 중인지 표를 함께 보여주면 운영자가 "내가 잠근 매핑이 무엇이었지" 환기에 좋다.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 0건 수정 (수정 불필요) |
| Warning | 3건 (라벨 기반 ID 역추출, week 인덱스, tokenize 영문 필터) |
| Suggestion | 5건 |
| 빌드 | 미실행 (Critical 없음) |

---

<!-- STEP:refactor -->
## 리팩토링

### 리팩토링한 파일 목록
- `scripts/generate-crosslinks.ts`
- `src/lib/crosslink-utils.ts`

---

### 작업별 내용

#### 1. `scripts/generate-crosslinks.ts` — `FileChange.changes`에 `targetId` 추가
- **출처**: Warning #1
- **무엇을**: change 객체 타입에 `targetId: string` 필드 추가. `computeChanges`의 timeline/checklist/article 분기에서 각각 `tl.id`, `meta.slug`, `a.slug`를 명시적으로 저장. `applyChanges`의 timeline 적용 루프는 `change.itemLabel.split(" ").slice(-1)[0]` 대신 `change.targetId`를 사용하고, `data.find()` 대신 `Map<string, TimelineItem>`(`byId`)으로 lookup.
- **왜**: 표시 라벨에서 ID를 역추출하는 패턴은 라벨 포맷 변경 시 silently 깨질 수 있고, 사람용 출력과 식별 책임이 한 필드에 섞여 있어 의도가 불명확. 동작은 동일하지만 의도가 코드에 드러나고 future-proof.

#### 2. `scripts/generate-crosslinks.ts` — week → timeline 인덱스를 Map으로 미리 구축
- **출처**: Warning #2
- **무엇을**: 양방향 대칭 보강 루프(`for (const a of loaded.articles) ... for (const week of weeks) ...`)에서 매번 `loaded.timeline.find((t) => t.week === week)`를 호출하던 코드를 한 번만 빌드되는 `timelineByWeek: Map<number, TimelineItem[]>`로 교체. 같은 week에 여러 항목이 있을 경우 모두 보강하도록 inner loop 적용.
- **왜**: ① 미래에 한 주차에 여러 timeline 항목이 추가될 수 있는데 기존 `.find()`는 첫 매치만 사용해 누락 가능. ② N(article) × M(weeks) 매번 선형 탐색 → O(1) 조회로 단축. 현재 데이터 규모에서는 둘 다 미세하지만 의도는 명확해짐.

#### 3. `scripts/generate-crosslinks.ts` — 단방향 매칭 4회 → `bipartiteMatch` 헬퍼 추출
- **출처**: 추가 판단
- **무엇을**: Timeline→Videos / Article→Videos / Checklist→Articles / Checklist→Videos의 동일 패턴 4번 반복(점수 매기기 → top-N → Map 저장)을 제네릭 헬퍼 `bipartiteMatch<L, R>(left, right, leftFeats, rightFeats, leftKey, rightKey)`로 추출. 각 호출부는 6줄 → 8줄짜리 함수 호출 한 번으로 축약.
- **왜**: 동일 흐름이 거의 변수명만 바꿔 4번 등장. 추출 후 매칭 정책 변경(예: 임계값/topN 옵션 추가)이 한 곳에서만 일어남. 30+줄 중복 → 헬퍼 1개로 정리.

#### 4. `src/lib/crosslink-utils.ts` — `tokenize`에 영문 stopword + 길이 컷 분리
- **출처**: Warning #3
- **무엇을**: `ENGLISH_STOPWORDS` 세트(`and`, `the`, `for`, `with`, `from`, `this`, `that`, `your`, `you`, `vs`) 추가. 토큰 검사 시 한국어/영문을 정규식으로 분기해 `KOREAN_TOKEN_MIN_LEN=2`, `ENGLISH_TOKEN_MIN_LEN=3`로 길이 컷을 다르게 적용.
- **왜**: 기존에는 영문 토큰이 어떤 길이든 통과해서 콘텐츠에 점차 추가될 영문 약어/일반어 노이즈에 취약. 한국어는 2글자도 의미 단위가 되지만 영문 2글자는 거의 stopword(of, in, on 등)라 컷이 다름.

---

### 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `generate-crosslinks.ts` 줄 수 | 967 | 985 (+18, 헬퍼 + Map 구축) |
| 단방향 매칭 코드 중복 | 4회 (~30줄) | `bipartiteMatch` 1개 (4번 호출) |
| timeline ID 식별 방식 | itemLabel 문자열 split | `change.targetId` 명시 필드 |
| week → timeline 조회 | 매번 `.find()` 선형 탐색 | `Map<week, TimelineItem[]>` O(1) |
| 영문 stopword | 없음 | 10개 + 길이 컷 3 |

---

### 빌드 결과
성공 (1회 시도). E2E 회귀 테스트 14/14 모두 통과.
