# P11: 콘텐츠 ↔ 체크리스트 매트릭스 1차 산출 — 기획서 (간단판)

> 작성일: 2026-05-07  size: S
> 출처: [docs/plan/phase-4.5.md §3.2 P11](../../plan/phase-4.5.md)

## 결정 사항 (2026-05-07 운영자 확정)

- **(a) 산출물 보관 위치**: Obsidian vault `~/Documents/pregnancy-checklist/30-domain/content-matrix.md`. 기존 `checklist-*.md`·`timeline-birth-prep.md`와 같은 도메인 지식 라인.
- **(b) 첫 그리기 시점**: Phase 4.5 포함 — 운영자가 1회 수기 작성. `search_submit` 데이터 누적 전 휴리스틱 기반 빈칸 sketch.

## 1. 사용자 시나리오

운영자(1인)가 신규 글 발행 우선순위를 정할 때 "지금 어디가 비었는지"를 한눈에 본다. 매트릭스 행은 임신 주차 구간(예: 1~12주, 13~27주, 28주~출산), 열은 토픽 카테고리(영양·검사·운동·정신건강·재무·법·출산준비·산후 등). 셀에는 ① 발행된 글 slug, ② 미발행 백로그 후보, ③ 빈칸이 표시된다. 운영자가 vault에서 매트릭스를 열어 빈칸이 많은 행·열을 신규 글 후보로 채택. Phase 5에서 `search_submit results_count=0` 데이터가 1~2주 누적되면 매트릭스 빈칸과 비교해 보정.

## 2. 기능 요구사항

### must

- **산출물 위치**: `~/Documents/pregnancy-checklist/30-domain/content-matrix.md` (단일 파일)
- **매트릭스 구조**:
  - 행 = 임신 주차 구간 (3~5개 구간으로 묶음 — 운영자 재량). 산후도 한 행 포함.
  - 열 = 토픽 카테고리. 첫 산출 시 [`src/data/checklist_items.json`](../../../src/data/checklist_items.json) 카테고리 6개(`hospital`, `hospital_bag`, `baby_items`, `postpartum`, `admin`, `health`) + [`src/content/articles/`](../../../src/content/articles/) 발행 글 토픽에서 추출한 카테고리 통합. 신규 3종 체크리스트(`hospital_bag_checklist`·`partner_prep_checklist`·`pregnancy_prep_checklist`) 자체 `subcategories`는 행/열 양쪽 어디에 매핑할지 운영자가 결정 (P8 카테고리 두 체계 공존 결정과 정합 — Phase 4.5에서는 결정만, P11 매트릭스 1차에는 운영자가 임시 분류).
  - 셀 = 다음 3가지 중 하나로 분류:
    - **발행됨**: 글 slug를 백틱 인용 (예: `weekly-prenatal-checklist`)
    - **백로그**: 작성 의도 있는 미발행 후보. `[draft]` 표시 + 한 줄 메모
    - **빈칸**: 의도적 빈칸 또는 미인지 갭. `—` 또는 `?`로 표시
- **출처 인용**: 각 셀의 발행 글은 src/content/articles/ 경로 하이퍼링크. 백로그 후보는 src/content/draft/ 또는 keep-out 사유 한 줄.
- **갱신 정책 명시**: 매트릭스 상단에 "**작성일**", "**다음 갱신 예정**(Phase 5 search_submit 데이터 누적 후)" 박음. 매트릭스가 영구 산출물이 아닌 1차 sketch임을 명시.
- **검수 도메인 일관성**: [docs/marketing/persona.md §4.4](../../marketing/persona.md) "면책 문구는 글 주제에 맞춰" 룰과 정합 — 의학·재무·법 토픽이 한 행에 섞이면 발행 시 면책 톤 분리 신호로 활용.

### won't (이번 범위 밖)

- **자동화**: 매트릭스 자동 생성 스크립트 미작성. 1차 산출은 운영자 수기 — Phase 5에서 자동화 검토(§1.9 자동 주간 리포트와 통합 가능성).
- **GA4 이벤트 신설**: P11은 측정 변경 없음. `search_submit` 카탈로그 정의는 §1.5 별도 결정.
- **매트릭스 → 신규 글 작성 가이드 문서화**: P10 운영자 가이드 작업으로 이관.
- **체크리스트 항목별 1:1 매핑 강제**: 매트릭스는 "주차 × 토픽" sketch 수준. 항목별 정밀 매핑은 Phase 5 통합 검색·필터 도입 시 별도.
- **본문 코드 변경**: 0건. 매트릭스는 Obsidian vault 산출물이며 src/ 영역 수정 없음.

## 3. 성공 기준

- `~/Documents/pregnancy-checklist/30-domain/content-matrix.md` 1개 파일 존재 + 매트릭스 표 채워짐.
- 매트릭스 빈칸을 보고 신규 글 후보 **2~3개 식별**(운영자 자가 판단). 식별 결과는 src/content/draft/ 또는 매트릭스 본문에 "다음 발행 후보"로 기록.
- Phase 5에서 `search_submit results_count=0` 데이터 1~2주 누적 후 매트릭스와 비교해 빈칸 보정 — 1차 매트릭스의 휴리스틱 정확도가 점검됨.
- 갱신 이력 한 줄 누적: "2026-05-07 1차 작성 (Phase 4.5)" → 차후 갱신 시 날짜·근거 추가.
