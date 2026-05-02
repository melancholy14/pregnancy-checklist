# Phase 4 Step 5 — Crosslinks Implementation

## 완료 조건 충족 여부
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

## 생성/수정 파일 목록
### 신규 생성
- `scripts/generate-crosslinks.ts` — CLI 진입점. 인자 파싱, 데이터 로딩, 매칭, 모드별 디스패치 (`--dry-run` / `--apply` / `--report`)
- `src/lib/crosslink-utils.ts` — 매칭 알고리즘 공용 유틸. `tokenize`, `jaccardSimilarity`, `inferUnifiedTagKeys`, `unifiedTagsForWeek`, `relevanceScore`. 임계값/topN 상수도 export

### 수정
- `package.json` — `crosslinks`, `crosslinks:apply`, `crosslinks:report` npm 스크립트 3종 추가

### 실행 산출물 (--apply 시 자동 갱신, 본 커밋에는 포함하지 않음)
- `src/data/timeline_items.json` — `linked_article_slugs`, `linked_video_ids`
- `src/data/{hospital_bag,partner_prep,pregnancy_prep}_checklist.json` — `meta.linked_article_slugs`, `meta.linked_video_ids`
- `src/content/articles/*.md` — front matter `linked_timeline_weeks`, `linked_video_ids`

## 주요 결정 사항
- **`crosslink-utils.ts`의 `unified-tags` import를 `@/lib/...`이 아닌 상대 경로(`./unified-tags`)로 작성**: 기존 `scripts/` 디렉토리는 path alias 없이 동작하는 standalone Node 스크립트 패턴이고, 공용 유틸을 양쪽에서 안전하게 쓰려면 alias 의존을 제거하는 편이 안정적이라고 판단. Next.js 빌드는 상대 경로도 정상 처리.
- **YAML front matter를 `gray-matter`로 재직렬화하지 않고 자체 미니 파서/라이터 구현**: gray-matter+js-yaml은 따옴표/순서를 모두 재포맷해 diff가 폭발함. 대신 정규식 기반으로 대상 필드 라인만 in-place 치환하고, 없으면 closing `---` 직전에 한 줄 append. 본문/공백/다른 필드는 그대로 보존.
- **양방향 대칭은 Timeline ↔ Article에만 적용**: PRD 명시 출력 6개 필드 중 양쪽에 back-link 필드가 있는 페어는 이 한 쌍뿐. Video는 `videos.json`에 back-link 필드가 없어 단방향이 자연스러움. Checklist→Article도 articles 측에 `linked_checklist_slugs`가 없어 단방향 처리.
- **Checklist의 unified tag 추론**: 슬러그 기반 하드코딩 매핑(`hospital-bag → birth-prep`, `partner-prep → birth-prep+postpartum`, `pregnancy-prep → pregnancy-prep+pregnancy-early`)에 더해 메타+아이템 텍스트의 키워드 추론을 합집합. 슬러그 기반 매핑이 없으면 키워드만 사용.
- **항목당 자동 링크 상한 5개**: PRD 5-3 단점 분석의 "임신 공통 태그로 모든 글 연결" 우려 대응. 임계값 0.2 + 점수 desc 정렬 후 상위 5개로 컷. 양방향 대칭으로 인해 일부 항목은 5개를 초과할 수 있음 (의도).
- **stop word 리스트 도메인 특화**: "임신·출산·태아·산모·임산부·아기·엄마·체크리스트·총정리" 등 모든 콘텐츠에 흔하게 등장해 변별력이 없는 한국어 단어를 제거. 리스트는 `crosslink-utils.ts` 안에서 직접 관리.
- **JSON 출력 시 manual 보호된 필드는 변경 목록 자체에서 제외**: `before/after`가 같으면 어차피 diff가 0이지만, 명시적으로 protected 필드는 매핑 단계에서 건너뛰어 의도가 코드에 드러나도록 함.

## 가정 사항
- 실행은 운영자가 수동으로 (`crosslinks` → 검토 → `crosslinks:apply`). CI 자동화는 Phase 5 이연.
- 매칭 임계값 0.2 + topN 5는 현재 콘텐츠 규모(아티클 8 / 영상 70 / 타임라인 36 / 체크리스트 3)에 적합. 향후 콘텐츠 증가 시 재튜닝 가능 (상수 변경만으로 처리).
- `*_manual: true` 플래그는 필드 단위 보호. 부분 manual(일부만 수동 + 일부 자동)은 지원하지 않음.
- Article side에 새로 추가될 수 있는 `linked_video_ids`는 현재 UI 소비처가 없음(연관 영상은 태그 기반 `getRelatedVideos`로 동작). 미래에 직접 매핑 우선 사용으로 전환할 수 있도록 데이터만 먼저 적재.
- `linked_checklist_slugs`(timeline 측)와 `linked_timeline_weeks`(checklist meta 측)는 PRD 출력 명세에 없어 본 스크립트가 관리하지 않음. 수동 관리 유지.

## 미구현 항목
- **TF-IDF 가중치**: PRD 단점 대응에 "필요 시 적용"으로만 언급되어 있고, 현재 콘텐츠 규모에서는 stop word 필터로 충분히 변별 가능. 도입 시점은 콘텐츠 20개+ 이후로 보류.
- **CI/pre-commit 훅 통합**: PRD에 명시되지 않음. 운영자 수동 실행 모델 유지.
- **JSON 키 순서 정규화**: `linked_video_ids` 등 신규 필드를 추가할 때 기존 필드 순서를 그대로 두고 끝에 append. 일부 timeline 항목에서 `seo_slug` 다음에 새 필드가 위치할 수 있으나, 빌드/소비 코드에는 영향 없음.
- **체중 차트 BMI 시각화 / 크로스링크 영역 확장(영상↔타임라인 일괄 등)**: Phase 5로 이연된 별개 작업.
