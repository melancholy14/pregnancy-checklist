# Phase 4 Step 5 — Crosslinks

> 작성일: 2026-05-02 | 작성자: Claude Code

## 개요
콘텐츠(타임라인·체크리스트·아티클·영상) 간 크로스링크를 자동 생성하는 CLI 스크립트(`scripts/generate-crosslinks.ts`)와 공용 매칭 유틸(`src/lib/crosslink-utils.ts`)을 도입했다. 통합 태그 매칭과 키워드 유사도 기반으로 양방향 매핑을 만들고, `*_manual: true` 플래그가 붙은 필드는 자동 매핑이 보호한다. `--dry-run` / `--apply` / `--report` 3가지 실행 모드를 지원한다.

---

## 구현 내용

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| `--dry-run` 모드에서 변경 예정 사항이 정상 출력 | ✅ 완료 | 실측 78개 변경 후보 출력 확인 |
| `--apply` 모드에서 JSON/front matter 정상 갱신 | ✅ 완료 | 12개 파일 갱신 (timeline 1, checklist 3, articles 8) |
| `--report` 모드에서 현재 크로스링크 통계 출력 | ✅ 완료 | 평균/커버리지/manual 보호 카운트 출력 |
| `*_manual: true` 매핑이 보호됨 | ✅ 완료 | 필드 단위 보호 — sandbox에서 임시 플래그 추가 후 검증 |
| 존재하지 않는 콘텐츠에 대한 링크 생성 안 됨 | ✅ 완료 | `existingArticleSlugs/Videos/Weeks` 화이트리스트 필터 |
| 인자 없이 실행하면 사용법 + 비제로 종료 | ✅ 완료 | exit 1 |
| 알 수 없는 인자 → 명확한 에러 + 비제로 종료 | ✅ 완료 | `--bogus` / 다중 모드 모두 처리 |
| `--apply` 후 `npm run build` 성공 | ✅ 완료 | 정적 페이지 29개 생성 성공 |
| 양방향 대칭성 (Timeline ↔ Article) | ✅ 완료 | top-N에 든 페어는 반대편에도 등록 |

### 생성/수정 파일
**신규 생성**
- [scripts/generate-crosslinks.ts](../../scripts/generate-crosslinks.ts) — CLI 진입점. 인자 파싱, 데이터 로딩, 매칭, 모드별 디스패치
- [src/lib/crosslink-utils.ts](../../src/lib/crosslink-utils.ts) — 매칭 알고리즘 공용 유틸 (`tokenize`, `jaccardSimilarity`, `inferUnifiedTagKeys`, `unifiedTagsForWeek`, `relevanceScore` + 임계값/topN 상수)

**수정**
- [package.json](../../package.json) — `crosslinks`, `crosslinks:apply`, `crosslinks:report` 3종 npm 스크립트 추가

**실행 산출물 (--apply 시 자동 갱신, 본 커밋에는 포함하지 않음)**
- `src/data/timeline_items.json` — `linked_article_slugs`, `linked_video_ids`
- `src/data/{hospital_bag,partner_prep,pregnancy_prep}_checklist.json` — `meta.linked_article_slugs`, `meta.linked_video_ids`
- `src/content/articles/*.md` — front matter `linked_timeline_weeks`, `linked_video_ids`

### 주요 결정 사항
- **`crosslink-utils.ts`는 `@/lib/...` 대신 상대 경로 import** (`./unified-tags`): `scripts/`는 path alias 없이 동작하는 standalone Node 스크립트 패턴이라 안전성 우선.
- **YAML front matter는 `gray-matter` 재직렬화 대신 자체 미니 파서/라이터**: gray-matter+js-yaml은 따옴표/순서를 모두 재포맷해 diff 폭발. 정규식 in-place 치환으로 본문/공백/다른 필드 보존.
- **양방향 대칭은 Timeline ↔ Article에만 적용**: PRD 출력 6개 필드 중 양쪽 back-link 필드가 있는 페어가 이 한 쌍뿐. Video는 `videos.json`에 back-link 필드가 없어 단방향.
- **항목당 자동 링크 상한 5개**: PRD의 "임신 공통 태그로 모든 글 연결" 우려 대응. 임계값 0.2 + 점수 desc 정렬 후 상위 5개로 컷.
- **stop word는 도메인 특화**: 임신·출산 글 전반에 흔한 한국어 단어 + 일반 영문 stopword(`and`, `the`, ...) 모두 제거. 한국어/영문 길이 컷 분리(2자/3자).

### 가정 사항 및 미구현 항목
- 실행은 운영자 수동 (`crosslinks` → 검토 → `crosslinks:apply`). CI 자동화는 Phase 5 이연.
- 매칭 임계값 0.2 + topN 5는 현재 콘텐츠 규모(아티클 8 / 영상 70 / 타임라인 36 / 체크리스트 3)에 적합. 콘텐츠 증가 시 재튜닝 가능 (상수 변경만).
- TF-IDF 가중치, CI/pre-commit 훅 통합, 영상↔타임라인 일괄 매핑은 Phase 5 이연.
- Article에 추가되는 `linked_video_ids`는 현재 UI 소비처 없음(연관 영상은 태그 기반 `getRelatedVideos`로 동작). 데이터만 먼저 적재.

---

## 코드 리뷰 결과

### Critical 이슈 (수정 완료)
없음. 타입 안전성·보안·성능·접근성 모두 통과.

### Warning (수정 권장 → 리팩토링 단계에서 모두 처리)
1. **`applyChanges`가 표시 라벨에서 timeline ID 역추출** — 라벨 포맷 변경 시 silently 깨짐. → 리팩토링에서 `change.targetId` 명시 필드로 교체.
2. **week → timeline 인덱스가 `.find()` 단일 매치** — 미래에 같은 week 다중 항목 시 누락 가능 + 선형 탐색 반복. → `Map<week, TimelineItem[]>` O(1) 조회로 교체.
3. **`tokenize`가 영문 stopword 미적용** — 영문 약어/일반어 노이즈 가능. → 영문 stopword 추가 + 한·영 길이 컷 분리.

### 전체 요약
| 구분 | 건수 |
|------|------|
| Critical | 0건 발견, 수정 불필요 |
| Warning | 3건 (모두 리팩토링에서 처리) |
| Suggestion | 5건 (보류) |

---

## 리팩토링 내용

### 작업 목록
1. **`FileChange.changes`에 `targetId` 추가** — Warning #1. label 문자열 split으로 ID 역추출하던 패턴을 명시 필드로 교체. apply 단계는 `Map<id, item>` lookup 사용.
2. **week → timeline 인덱스 Map 구축** — Warning #2. 양방향 대칭 보강 루프에서 매번 호출되던 `.find()`를 한 번 빌드되는 Map으로 교체. 같은 week 다중 항목 보강 가능.
3. **단방향 매칭 4회 → `bipartiteMatch` 헬퍼** — 추가 판단. Timeline→Videos / Article→Videos / Checklist→Articles / Checklist→Videos의 동일 패턴을 제네릭 헬퍼로 추출.
4. **`tokenize` 영문 stopword + 길이 컷 분리** — Warning #3. `ENGLISH_STOPWORDS` 세트 추가, 한국어 2자 / 영문 3자 분기.

### 변경 전/후 구조
| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `generate-crosslinks.ts` 줄 수 | 967 | 985 (+18, 헬퍼 + Map 구축) |
| 단방향 매칭 코드 중복 | 4회 (~30줄) | `bipartiteMatch` 1개 (4번 호출) |
| timeline ID 식별 방식 | itemLabel 문자열 split | `change.targetId` 명시 필드 |
| week → timeline 조회 | 매번 `.find()` 선형 탐색 | `Map<week, TimelineItem[]>` O(1) |
| 영문 stopword | 없음 | 10개 + 길이 컷 3 |

---

## E2E 테스트 결과

테스트 파일은 UI가 아닌 CLI 스크립트라 통상의 "Happy Path / Validation / 권한 / 반응형" 4분류 대신 인프라·인자·모드별·보호 시나리오로 재구성했다(기존 `fetch-channel-thumbs.spec.ts` 패턴 답습). `--apply`는 임시 sandbox 디렉토리에서 격리 실행해 실제 데이터를 더럽히지 않는다.

| 시나리오 (describe) | 결과 |
|---------------------|------|
| 크로스링크 스크립트 인프라 | ✅ 3 passed |
| CLI 인자 처리 | ✅ 3 passed |
| --report 모드 | ✅ 1 passed |
| --dry-run 모드 | ✅ 2 passed |
| --apply 모드 (sandbox) | ✅ 3 passed |
| manual 플래그 보호 | ✅ 2 passed |
| **전체** | **14 passed / 0 failed (5.0s)** |

📊 상세 리포트: `playwright-report/index.html`

---

## 관련 문서
- 구현 명세: [../implementation/phase-4-step-5-crosslinks-impl.md](../implementation/phase-4-step-5-crosslinks-impl.md)
- 코드 리뷰: [../review/phase-4-step-5-crosslinks-review.md](../review/phase-4-step-5-crosslinks-review.md)
- 리팩토링: [../refactor/phase-4-step-5-crosslinks-refactor.md](../refactor/phase-4-step-5-crosslinks-refactor.md)
- E2E 테스트: [../../e2e/phase-4-step-5-crosslinks.spec.ts](../../e2e/phase-4-step-5-crosslinks.spec.ts)
- Phase 4 전체 계획: [../phase-4/plan.md](../phase-4/plan.md)
