# P1: 편집 모드 priority/note 수정 허용 — 리뷰

> 작성일: 2026-05-07
> 상태: **deferred** (Phase 4.5 후속 묶음으로 이관 — 2026-05-07 운영자 결정)
> size: M
> 출처: [docs/plan/phase-4.5.md §3.1 P1, §2.3 C1, §3.1 P5/P7](../../plan/phase-4.5.md)

## ⚠️ Deferred — Phase 4.5 후속 묶음으로 이관

P1 단독 결정은 다음 5개 항목과 얽혀 있어 단독 진행 시 충돌 위험:

| 얽힌 항목 | 얽힘 지점 |
|---|---|
| **§2.3 C1** (priority 배지 5-pastel role) | P1 (a)(d) — priority 시각 표현 다운그레이드 결정 동시 필요 |
| **P5** (localStorage schema versioning) | P1 (a)(d) — customItems 스키마 변경 시 migrate 함수 의무 |
| **P2** (isHighlighted 부활) | P5 인프라 활용, P1과 동일 도메인 UX 결정 |
| **P6** (`recommendedWeek: 0` 의미) | P2 부활 결정 직후 필수 |
| **P7** (note_type 분류) | P1 (c) note 편집 결정 시 사용자 작성 note vs 운영자 note 분리 룰 |

**향후 진행 방식**: Phase 4.5 다른 작업(N묶음 P3·P4, §2.3 C2~C4, §1 GA4 묶음 등) 완료 후 `docs/features/checklist-data-model-bundle/` 신규 feature로 6개 항목 통합 결정. 본 review.md의 §3 페어 충돌·§4 트레이드오프는 묶음 review.md 작성 시 재활용 가능.

본 페이지 이하는 P1 단독 진행 가정으로 작성된 내용이며, 묶음 결정 시 컨텍스트로만 참조.

---

## 1. 기능 요약

[ChecklistItemRow.tsx](../../../src/components/checklist/ChecklistItemRow.tsx)의 편집 모드는 현재 title만 수정 가능. [ChecklistAddForm.tsx:44](../../../src/components/checklist/ChecklistAddForm.tsx#L44)는 priority를 받지 않고 `medium` 하드코딩. P1은 (a) 편집 허용 여부, (b) 적용 범위, (c) note 동시 편집 여부, (d) §2.3 C1 시각 다운그레이드·P5 schema versioning 묶음 도입 4개 축의 결정 항목. customItems 스키마 변경이 동반되므로 P5와 직결.

## 2. 적용 페어 + 선택 이유

- **planner × designer** — 충돌 축: "사용자 자율성·데이터 일관성" vs "폼 단순성·시각 정직성". P1 결정 (a)·(b)의 핵심 충돌.
- **dev × planner** — 충돌 축: "단계적 도입·기술부채 회피" vs "본질 도구 가치 보호·측정 동반". P1 결정 (c)·(d)의 핵심 충돌.

제외한 페어:
- planner × marketer / designer × marketer: P1은 콘텐츠 노출이 아니라 도구 편집 UX — 마케팅 영향 미약.
- dev × designer: priority 셀렉터 UI 형태(드롭다운 vs segmented vs 라디오)는 디자인 시스템 컴포넌트로 자동 결정 — 충돌 약함.
- dev × marketer: 측정·이벤트 변경 없음 (단 페어 ② 결과로 GA4 이벤트 신설 가능성 있음 — 그건 spec.md 단계에서 확정).

## 3. 페어별 충돌

### 3.1 planner × designer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: planner × designer
- 이전 페어 [없음 — P1 첫 페어] 의 양보·합의는 이 페어에 영향 없음.
- planner, designer 의 persona.md "양보 거부" 섹션을 다시 참조함.
  · planner 인용 후보: 7.1 사용자 데이터 무결성, 7.5 체크리스트=본질 도구 우선, 7.6 측정 없는 기능 도입 거부
  · designer 인용 후보: §3 원칙 5 "한 화면 결정 1개", N4 다크 패턴 거부, N7 사용자 데이터 무결성, "신체 변화·민감 시기 — 빨간 경고색·과도한 알림 지양"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[planner] 단독 입장**
- 잃는 것: 폼 단순함, "custom 항목과 기본 항목의 priority 의미 차이" 명료성, P5 schema versioning 동시 도입 부담을 떠안음
- 양보 거부 인용: "**7.1 사용자 데이터 무결성 — localStorage 스키마 변경은 zustand `persist`의 `migrate` 함수 없이 배포 금지. 항목 ID는 절대 재사용·재배치하지 않는다**" — docs/content/persona.md §7.1. priority 편집 허용은 customItems 스키마 변경이라 P5와 동반 도입 의무. "**7.5 체크리스트 = 본질 도구 우선**" — §7.5. 본질 도구의 핵심 행동(체크) 옆에 결정 부담이 늘면 본질이 깎임. "**7.6 측정 없는 기능 도입 거부**" — §7.6. 신규 priority 변경 발생률을 GA4 이벤트로 측정하지 않으면 가치 입증 불가.
- 주장: (a) **허용 — 단 custom 항목만**. (b) 기본 항목 priority 편집 거부 — checklist_items.json은 운영자 단일 진실(SoT)이고 사용자가 override하면 항목 정의가 사용자별로 갈라져 데이터 무결성 깨짐. P10 운영자 가이드의 ID 변경 룰과도 일관. (c) note는 별도 결정(페어 ② 영역). (d) **P5 schema versioning 동시 도입 의무** — 분리 거부.
- 잔재 자기검증: 이전 페어 없음 — N

**[designer] 반박 입장**
- A 발언 명시 반박: "custom만 허용"은 절반 해법. 사용자가 폼에서 priority 셀렉터를 보면 "기본 항목 priority도 바꿀 수 있을 것"이라 기대 → 못 바꾸면 비대칭 좌절. 디자인 관점에서는 **둘 다 허용 또는 둘 다 미허용** 중 하나가 정직함. 또 **§3 원칙 5 "한 화면 결정 1개"** 관점에서 priority 셀렉터 + note textarea가 동시 들어가면 "title·priority·note" 3개 결정 강요 — 모바일 320px 폼 높이 폭증 + 인지 부하.
- 잃는 것: 사용자 자율성 일부 차단(미허용으로 가면), priority 시각 표현(C1)의 의미 가치
- 희생 거부 인용: "**§3 원칙 5 — 인지 부하 최소화. 한 화면에 결정 1개. 같은 정보 중복 표시 금지**" — docs/design/persona.md §3 원칙 5. "**N4 다크 패턴 거부 — 의도적 시각 위계 왜곡**" — N4. priority 색이 강제되는데 사용자는 못 바꾸면 가짜 인터랙티브. "**도메인 컨텍스트 — 신체 변화·민감 시기. 빨간 경고색·과도한 알림 지양**" — §2 표.
- 주장: (a) **미허용 권장** — 단 §2.3 C1과 묶어서 진행. C1이 priority를 색에서 아이콘/약식 텍스트로 다운그레이드하면 priority의 시각 강제가 약해지고, 사용자가 직접 고를 가치도 자연스럽게 낮아짐 → 폼에 안 넣어도 비대칭 좌절 안 생김. (d) **§2.3 C1과 P1을 한 묶음** — 분리하면 priority가 "색으로 강조되는데 사용자는 못 바꾸는 가짜 인터랙티브"로 굳음.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **사용자 자율성·데이터 일관성** (planner: custom만 허용 + P5 동시 도입) vs **폼 단순성·시각 정직성** (designer: 미허용 + §2.3 C1 시각 다운그레이드 묶음)
- 숨은 가정: 양쪽 다 "사용자가 priority 편집을 실제로 원한다"고 암묵 가정. 측정 데이터 부재 — `custom_item_priority_set` 이벤트로 1~2주 사용률 측정 후 결정 옵션 가능 (planner §7.6 룰과 정합).

### 3.2 dev × planner

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × planner
- 이전 페어 [planner × designer] 의 양보·합의는 이 페어에 영향 없음.
- dev, planner 의 persona.md "희생 거부 / 양보 거부" 섹션을 다시 참조함.
  · dev 인용 후보: 6.3 localStorage 데이터 무결성, 6.5 안전망 우회, 6.6 임의 결정 X
  · planner 인용 후보: 7.1 데이터 무결성, 7.5 본질 도구 우선, 7.6 측정 없는 기능 도입 거부
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[dev] 단독 입장**
- 잃는 것: 신규 작업 범위(P5 schema versioning 코드 + customItems migration + 폼 UI 컨트롤 2~3개), P7(note_type 분류) 결정 없이 note 편집 도입 시 향후 분류 부담
- 희생 거부 인용: "**6.3 localStorage 사용자 데이터 무결성 — schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. '키 그냥 바꾸자' 답변 안 함**" — docs/tech/persona.md §6.3. customItems에 priority 편집 노출은 마이그레이션 의무 발생. "**6.5 안전망 우회 — `--no-verify` X, E2E 빨강 무시 X**" — §6.5. P5 versioning 안 박고 출시 = 회복 불가능 부채. "**6.6 디자인 시스템·면책 문구·콘텐츠 카피의 임의 결정 X**" — §6.6. §2.3 C1 시각 결정 전에 priority 라벨/색을 셀렉터에 그대로 노출하면 시각 위계가 굳음.
- 주장: (c) **note 편집은 P7 결정 후로 미룸** — note_type 분류 부재 상태에서 textarea 노출 시 향후 type 도입 시 사용자 데이터 재분류 부담. priority만 먼저. (d) **P5 + §2.3 C1 + P1 한 묶음 도입 의무** — 시각 표현 결정 없이 priority 셀렉터를 폼에 박으면 C1 결정이 P1 잔재에 끌려옴.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 페어 ①은 (a)(b) 허용·범위 축이고 이번 페어는 (c)(d) 구현·묶음 축으로 발화 동기 분리.

**[planner] 반박 입장**
- A 발언 명시 반박: "note 편집을 P7 후로 미룸"은 합리적이지만, **§7.5 본질 도구 우선** 관점에서 사용자가 추가한 항목의 note가 영원히 못 바뀌면 본질 도구 가치 훼손. 새 항목 추가 시 note 오타를 못 고치는 시나리오는 N7 사용자 데이터 무결성(designer 측)과 직접 충돌. dev의 "note_type 분류 부재"는 사실이지만 **현재 customItems의 note는 사용자 자유 작성 string** — 운영자 데이터(P7 분류 대상)와 다름. P7은 운영자 노트 한정 결정으로 좁힐 수 있음.
- 잃는 것: 구현 부담(폼 UI 컨트롤 +1, store update path +1), P7 향후 분리 시 "사용자 작성 note는 분류 안 함" 룰을 명시 박아야 함
- 양보 거부 인용: "**7.5 체크리스트 = 본질 도구 우선**" — docs/content/persona.md §7.5. 사용자 추가 항목의 note가 못 고쳐지면 본질 도구 가치 훼손. "**7.6 측정 없는 기능 도입 거부**" — §7.6. `custom_item_priority_set`·`custom_item_note_set` 이벤트 신설로 사용률 측정 의무. "**7.1 사용자 데이터 무결성**" — §7.1. P5 동시 도입 + customItems 스키마에 `priority?`, `note?` 모두 optional 유지로 기존 사용자 영향 0.
- 주장: (c) **priority + note 둘 다 편집 허용** — note 편집은 사용자 작성 자유 텍스트 한정, P7 분류 대상에서 명시 제외. (d) **P5 + §2.3 C1 + P1 한 묶음 — dev 의견 인정**, 단 묶음 도입 시점은 같지만 PR은 분리 가능 (P5 인프라 → C1 시각 다운그레이드 → P1 폼 노출 순). 신규 GA4 이벤트 `custom_item_priority_set` / `custom_item_note_set` 동시 도입 의무.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 이전 페어는 designer 시각·인지 부하 축, 이번 페어는 dev 구현 부담·측정·P5 묶음 축에 한정.

**T3 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **단계적 도입·기술부채 회피** (dev: priority만 먼저, note는 P7 후, P5 인프라 우선) vs **본질 도구 가치 보호·측정 동반** (planner: priority + note 둘 다, 사용자 작성 note는 P7 제외)
- 숨은 가정: 양쪽 다 "사용자가 customItems를 자주 추가·수정한다"고 암묵 가정. 운영 데이터 부재 — 측정 우선이 정직. "note는 자유 텍스트로 충분"이라는 가정도 검증 안 됨 — 링크·구조 요구 등장 시 P7과 별개로 사용자 note 콘텐츠 타입 결정이 다시 필요.

## 4. 미해결 트레이드오프

### 4.1 편집 허용 여부 (P1-a)
- [ ] **결정**:
  - 옵션 A: **허용** (priority 셀렉터·note textarea 노출)
    - 즉시 비용: 폼 UI 컨트롤 +1~+2, store update path +1, P5 schema versioning 동시 도입 의무
    - 나중 비용: 사용자 자율성↑. 측정 이벤트로 가치 입증 가능
  - 옵션 B: **미허용** (§2.3 C1 시각 다운그레이드와 묶어서 가짜 인터랙티브 해소)
    - 즉시 비용: §2.3 C1 결정 의무 — priority 색을 아이콘/약식 텍스트로 다운그레이드. P1 단독 작업 0
    - 나중 비용: 사용자 자율성 절반 차단. 향후 "왜 못 바꾸냐" 피드백 발생 시 결정 재오픈
  - 옵션 C: **측정 먼저** — `custom_item_priority_set` 이벤트 신설 → 1~2주 사용률 보고 결정
    - 즉시 비용: GA4 이벤트 1~2개 신설(custom_item_priority_set / custom_item_note_set 잠재). UI 변경 0
    - 나중 비용: 의사결정 1~2주 지연. 다른 묶음(O묶음 P5) 작업 일정 영향
- **결정:** _(사용자 작성 영역)_

### 4.2 적용 범위 (P1-b, a=허용 시)
- [ ] **결정**:
  - 옵션 A: **custom 항목만** (운영자 SoT 보호)
    - 즉시 비용: 폼 분기 단순. 기본 항목은 priority 읽기 전용
    - 나중 비용: 사용자가 폼에서 비대칭 인지("custom은 되는데 기본은 안 됨") — 카피로 보완 필요
  - 옵션 B: **custom + 기본 항목** (override 레이어 신설, SoT는 default fallback)
    - 즉시 비용: override 레이어 도입 (`overrides: Record<string, Partial<ChecklistItem>>` 신규 store 키). 운영자가 기본 항목 priority 변경 시 override가 막아야 할지 갱신해야 할지 룰 결정 의무
    - 나중 비용: 운영자 데이터 변경(P10 ID 변경 룰)과 사용자 override의 dangling reference 처리 부채
- **결정:** _(사용자 작성 영역)_

### 4.3 note 편집 (P1-c, a=허용 시)
- [ ] **결정**:
  - 옵션 A: **priority만 편집** — note는 P7 결정 후 도입
    - 즉시 비용: 폼 UI 컨트롤 +1로 단순. textarea 디자인 보류
    - 나중 비용: 사용자 추가 항목 note 오타 수정 불가 — 본질 도구 가치 훼손 가능성
  - 옵션 B: **priority + note 둘 다** — 사용자 작성 note는 P7 분류 제외 명시
    - 즉시 비용: textarea UI + store update path. P7 분리 룰 ("사용자 작성 note는 type 분류 안 함") 문서화 의무
    - 나중 비용: 향후 note에 링크·구조 요구 등장 시 별도 결정 — 현재 의사결정 부담은 작음
  - 옵션 C: **priority + note + type 분류 사용자에게도 노출** — 가장 무거움, P7과 동시 결정 강요
    - 즉시 비용: P7 결정 미정 상태에서 도입 불가 — 옵션 사실상 무효
    - 나중 비용: N/A
- **결정:** _(사용자 작성 영역)_

### 4.4 묶음 도입 (P1-d)
- [ ] **결정**:
  - 옵션 A: **P5 + §2.3 C1 + P1 한 묶음** (dev/designer 합치 의견)
    - 즉시 비용: 작업 범위 가장 큼 — P5 schema versioning 인프라 + C1 시각 다운그레이드 + P1 폼 노출. PR은 분리 가능
    - 나중 비용: 부채 0. 향후 P2(isHighlighted 부활), P6(recommendedWeek 0 의미) 등 후속 결정에 인프라 활용
  - 옵션 B: **P5만 동시 도입, §2.3 C1 분리** — priority 색 강제 유지
    - 즉시 비용: 작업 작음. C1 의사결정 미룸
    - 나중 비용: priority가 "색으로 강조되는데 사용자가 셀렉터로 직접 고름" — 시각·인터랙션 정합성은 OK이지만 designer가 우려한 "신체 민감 시기 빨간색 강조" 톤 과잉 잔존
  - 옵션 C: **P1만 단독** — P5·C1 모두 후속
    - 즉시 비용: 가장 작음, P1 단독 PR
    - 나중 비용: customItems 스키마 변경이 migrate 함수 없이 배포 — dev §6.3·planner §7.1 양쪽 양보 거부 위반. 사실상 채택 불가 옵션.
- **결정:** _(사용자 작성 영역)_

## 5. 결정

> 페이즈 4 휴먼 게이트에서 사용자가 채우는 영역. Claude 추측 금지.

- 4.1 편집 허용 여부: _(미정)_
- 4.2 적용 범위: _(미정)_
- 4.3 note 편집: _(미정)_
- 4.4 묶음 도입: _(미정)_

## 6. 우선순위 영향

- **P5 localStorage schema versioning** — 4.1=A 또는 4.4=A 선택 시 직접 unblock. 4.4=C는 P5 양보 거부 위반으로 사실상 무효.
- **§2.3 C1 우선순위 시각 표현 다운그레이드** — 4.4=A 선택 시 함께 의사결정. 4.1=B 선택은 C1 결정 의무화.
- **P2 isHighlighted "이번 주차 추천" 부활** — P5 인프라 도입 시 동일 인프라 활용 가능 (별도 결정).
- **P6 `recommendedWeek: 0` 의미 정의** — 4.1=A + 4.2=B(기본 항목 override) 선택 시 영향 — 사용자가 기본 항목 recommendedWeek도 override 할 수 있는지 별도 결정.
- **P7 note_type 분류** — 4.3=B 선택 시 "사용자 작성 note는 분류 제외" 룰 추가. P10 운영자 가이드에도 박힘.
- **§1.5 GA4 이벤트 카탈로그** — 4.1=A 또는 C 선택 시 `custom_item_priority_set` / `custom_item_note_set` 이벤트 신설.
