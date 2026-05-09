# checklist-recommendation-semantics 리뷰

> 작성일: 2026-05-08
> 상태: decided
> size: L
> 관련 스펙: [spec.md](./spec.md) (생성 후)
> 출처: [docs/plan/phase-4.5.md](../../plan/phase-4.5.md) §3.1 P2 + P6 + P7

## 1. 기능 요약

Phase-4.5 P2/P6/P7 결정 묶음. ChecklistItem 한 모델 위에서 (P2) `isHighlighted` "이번 주 추천" UX 부활/삭제, (P6) `recommendedWeek: 0` 시맨틱 정의, (P7) `note` 필드 콘텐츠 타입 분류 — 세 결정이 데이터 모델·시각 위계·측정 wiring에서 서로 얽혀 있다. P5 schema versioning이 phase-5로 빠진 상태에서 phase-4.5의 결정 폭을 어디까지 박을지가 본 리뷰의 본질.

## 2. 적용 페어 + 선택 이유

- **dev × planner**: P6/P7이 ChecklistItem 타입을 건드리는데 P5(schema versioning)가 phase-5로 빠진 상태. dev §6.3과 planner §7.1 모두 "schema 변경 시 migrate 의무"라는 같은 룰을 들고 있지만, **어디까지 phase-4.5에 박을지** 가 갈림.
- **planner × designer**: P2 부활 시 강조 마크 색·위치, P7 도입 시 note_type 시각 분기. planner §7.5 "체크리스트 = 본질 도구"와 designer §3.2 "5-pastel role 절대 교차 금지" + §3.5 "한 화면에 결정 1개"가 정보 위계에서 직접 충돌.
- **planner × marketer**: planner §7.6 "측정 없는 기능 도입 거부"와 marketer §3.6 "이벤트 락인 깨기 금지" + §3.7 "운영자 번아웃 무시 금지"가 phase-4.5에 측정 wiring을 어디까지 박을지에서 갈림. P3(주차 입력 UX) 의존성이 판단축에 포함됨.

**제외 페어**: dev × designer (페어 2의 디자이너 발화로 토큰 디시플린이 충분히 다뤄짐), 그 외 marketer/designer 조합 (이 기능은 GTM·캠페인·전환이 아니라 측정 락인·시각 위계가 본질).

## 3. 페어별 충돌

### 페어 1 — dev × planner

**T0 — 페어 시작 선언**

- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- 인용 후보:
  - dev: "schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. '키 그냥 바꾸자' 답변 안 함" — [docs/tech/persona.md §6.3](../../tech/persona.md)
  - planner: "localStorage 스키마 변경은 zustand persist의 migrate 함수 없이 배포 금지. 항목 ID는 절대 재사용·재배치하지 않는다" — [docs/content/persona.md §7.1](../../content/persona.md)

**T1 — [dev] 단독 입장**

- 잃는 것: P6에서 `recommendedWeek: 0`을 `null` 또는 `alwaysRecommended` 별도 필드로 분리하면 [src/data/checklist_items.json](../../../src/data/checklist_items.json) 외 hospital_bag/partner_prep/pregnancy_prep 4벌 일괄 변경 + ChecklistItem 타입 narrow 코드 갱신. P7 `note_type` 도입 시 ChecklistItem 타입 변경 + JSON 4벌 마이그레이션 + 운영자가 기존 note 100+개 분류. **P5 schema versioning이 phase-5로 빠진 상태**라 zustand `persist`의 `migrate` 옵션을 phase-4.5 안에 단발성으로 박아야 하고, P5 도입 시 같은 코드를 한 번 더 손대게 됨.
- 희생 거부 인용: "schema 변경 시 항상 migrate 핸들러 또는 명시적 fallback. '키 그냥 바꾸자' 답변 안 함" — [docs/tech/persona.md §6.3](../../tech/persona.md)
- 주장: P5 도입 전 phase-4.5에서는 ChecklistItem 타입에 신규 필드(특히 `note_type`)를 박지 말 것. P6의 0→null 시맨틱 변경도 마찬가지. 둘 다 phase-5에서 P5와 함께 가는 게 안전. **phase-4.5에서 박을 수 있는 건 "결정의 시맨틱"이지 "필드·타입·데이터"가 아님**.
- 잔재 자기검증: 이전 페어 없음 — N

**T2 — [planner] 반박 입장**

- A 발언 반박:
  1. P5는 인프라이고 P6/P7은 시맨틱·운영 룰. **시맨틱은 P5 없이도 결정해 박을 수 있어야** P5 도입 시 단방향 마이그레이션이 가능. 미루면 P5 시점에 "이전 데이터 0이 무슨 의미였지?"가 다시 미해결.
  2. planner §5.1 본문이 "새 필드 도입 시 기존 데이터의 디폴트 값 정책도 같이 결정 — 예: `recommendedWeek: 0`이 '미정'인지 '항상'인지"라고 P6을 **이미 차단 항목으로 명시**. 결정 자체를 미룬다는 옵션은 없음.
  3. P7 시맨틱 분류는 §2.4 M4(체크 후 노트 보존)와 §2.6 UX #5(노트 자동 액션 분리)를 차단. 결정 미루면 phase-4.5의 다른 결정도 같이 멈춤.
- 잃는 것: P5 인프라 없이 P7 신규 필드를 도입하면 zustand `persist` 호환성 책임을 운영자가 짐. "P5와 같이"로 미루면 phase-4.5 콘텐츠 신뢰도 작업(특히 `legal` note 시각 분기) 일부 지연.
- 희생 거부 인용: "데이터 모델 변경은 사용자 데이터 마이그레이션을 동반한다... 새 필드를 도입하면 기존 데이터의 디폴트 값 정책도 같이 결정해야 한다 (예: `recommendedWeek: 0`이 '미정'인지 '항상'인지)" — [docs/content/persona.md §5.1·§5.2](../../content/persona.md); "localStorage 스키마 변경은 zustand persist의 migrate 함수 없이 배포 금지" — §7.1
- 주장: P6은 phase-4.5에서 **시맨틱 결정 + JSON 데이터 정정**까지. P7은 **시맨틱 분류 결정만** 박고 필드 도입은 P5와 함께 phase-5. P2 부활/삭제는 P6 결정 직후 가볍게 결정 가능.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**

- 핵심 충돌: P5 인프라 부재 상태에서 ChecklistItem 데이터 모델을 어디까지 변경할지. **시맨틱 결정만 박을지, 코드/데이터/필드까지 박을지** — phase-4.5의 폭이 갈림.
- 숨은 가정: 양쪽 다 "P5는 phase-5에 반드시 들어간다"고 가정. P5가 더 늦어지면 P6/P7 결정만 박힌 채 인프라 없이 운영해야 하는 기간이 늘어남.

---

### 페어 2 — planner × designer

**T0 — 페어 시작 선언**

- 이전 페어 [dev × planner] 의 양보·합의는 이 페어에 영향 없음.
- 인용 후보:
  - planner: "체크리스트 = 도구 = 본질" — [docs/content/persona.md §3.2](../../content/persona.md); "체크리스트와 분리된 콘텐츠 페이지 양산 거부" — §7.5
  - designer: "5-pastel role(...) 절대 교차 금지" — [docs/design/persona.md §3.2](../../design/persona.md); "한 화면에 결정 1개. 같은 정보 중복 표시 금지" — §3.5; "ChecklistItem.tsx의 isHighlighted 같은 미사용 prop을 발견하면, 부활/삭제 결정 없이 두지 말 것" — §6 2026-05-02

**T1 — [planner] 단독 입장**

- 잃는 것: P2 부활 안 하면 [ChecklistItem.tsx:68-72](../../../src/components/checklist/ChecklistItem.tsx#L68-L72)의 `isHighlighted` prop과 모든 항목의 `recommendedWeek` 데이터가 **dead weight**가 되어 코드·데이터에 죽은 신호로 남음 (디자이너 §6 2026-05-02 누적 학습이 이미 경고). §2.6 UX #2(D-day 컨텍스트 라벨)와 시너지 상실. P7 note_type 시각 분기 안 하면 "도로교통법 제50조"(legal) 주의 문구가 "병원 전화 확인"(action)과 똑같이 보여 **신뢰 신호가 평탄화** — §7.2 YMYL 의학적 책임 한계의 운영 표면이 약해짐.
- 희생 거부 인용: "체크리스트는 본질 도구이고, 콘텐츠는 신뢰·유입을 보강하는 자산. 우선순위가 뒤집히면 '위젯이 붙은 블로그'로 분류된다" — [docs/content/persona.md §7.5](../../content/persona.md); "체크리스트 = 도구 = 본질" — §3.2
- 주장: P2 부활은 본질 도구 강화. P7은 적어도 `legal` 분류만이라도 시각 분기 도입 — `aria-hidden` 아이콘 + 마이크로 라벨이면 충분. 시각 영향이 작아도 신뢰 신호는 살아남.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 직전 페어는 데이터 모델·인프라 비용이었고, 이 발언은 UX 시각 위계 가치만 다룸. "마이그레이션 비용 때문에 시각 분기 줄이자" 잔재 묻지 않음.

**T2 — [designer] 반박 입장**

- A 발언 반박:
  1. "본질 도구 강화"가 시각 추가의 정당화 근거가 될 수 없음. ChecklistHub 카드는 우선순위 배지 + 노트 + 액션 버튼이 한 행에 다 붙은 상태로 phase-4.5 §2.4 M3에서 **정보 과밀로 별도 지적**됨. "이번 주 추천" 강조 마크 + note_type별 시각 분기를 더 얹으면 §3.5 "한 화면에 결정 1개" 위반.
  2. `isHighlighted`를 mint(success)로 그리면 체크 완료 색과 충돌(AP1, 5-pastel role 교차). pink면 CTA 영역 침범. peach(data)도 §2.4 M1·M3의 행(row) 자체 인터랙션 위반과 겹쳐 row 시각이 더 무거워짐.
  3. P7 4가지 시각 분기 일괄 도입은 같은 카드 안에서 다른 시각 톤이 4번 등장 → 인지 부하 폭발. designer §6 2026-05-02 누적 학습은 "부활/삭제 결정 없이 두지 말 것"이지 "부활하라"가 아님 — **삭제도 동등한 결정 옵션**.
- 잃는 것: P2 부활 거부하면 dead weight 신호가 코드에 남아 다음 디자이너가 잘못 읽음. P7 시각 분기 거부하면 노트 신뢰도 신호 부재.
- 희생 거부 인용: "5-pastel role(pink=primary CTA, lavender=secondary, mint=success, peach=data, yellow=info) 절대 교차 금지" — [docs/design/persona.md §3.2](../../design/persona.md); "한 화면에 결정 1개. 같은 정보 중복 표시 금지" — §3.5; "ChecklistItem.tsx의 isHighlighted 같은 미사용 prop을 발견하면, 부활/삭제 결정 없이 두지 말 것" — §6 2026-05-02
- 주장:
  - (a) **ChecklistHub 카드 정보 과밀(M3) 정리 선행**이 P2 부활/P7 시각 분기 도입의 전제 조건.
  - (b) 토큰은 5-pastel 안에서 — peach(data role)가 가장 정합 ("추천 주차" = 데이터 매칭 결과). 새 토큰 도입은 DESIGN.md 헌법 갱신 후.
  - (c) P7은 4가지 시각 분기 대신 `legal`만 별도 시각 — 분기 수 최소화.
  - (d) **삭제도 진지한 옵션** — 부활/삭제는 같은 무게.
- 잔재 자기검증: 이전 페어 [dev × planner] 영향 없음 — N — 직전 페어의 "phase-4.5는 시맨틱만, 필드는 phase-5" 결론을 빌려와 "그러니 시각도 줄이자"가 아니라, **시각 노이즈·5-pastel role 자체로 반박**. designer §3.2·§3.5는 데이터 비용과 무관한 독립 룰.

**T3 — 핵심 충돌 + 숨은 가정**

- 핵심 충돌: 신뢰·맥락 신호 강화(planner) vs 시각 노이즈·정보 과밀(designer). **P2 부활을 위한 토큰 선택 + P7 시각 분기 깊이 + ChecklistHub M3 정리 선행 여부**.
- 숨은 가정: 양쪽 다 "ChecklistHub 카드 정보 과밀(M3)은 별도 작업으로 정리될 것"으로 가정. M3 정리 일정이 확정되지 않으면 P2 부활은 노이즈만 추가하는 형태로 끝남.

---

### 페어 3 — planner × marketer

**T0 — 페어 시작 선언**

- 이전 페어 [planner × designer] 의 양보·합의는 이 페어에 영향 없음.
- 인용 후보:
  - planner: "측정 없는 기능 도입 거부" — [docs/content/persona.md §7.6](../../content/persona.md); "새 UI/기능은 GA4 이벤트와 같이 들어간다" — §5.3
  - marketer: "이벤트명·파라미터 키·user_property 정의 임의 변경/삭제. 신규는 추가만, 변경은 신/구 병행 발사 4주 grace period" — [docs/marketing/persona.md §3.6](../../marketing/persona.md); "1인 운영자 지속가능성 = 서비스 지속가능성" — §3.7

**T1 — [planner] 단독 입장**

- 잃는 것: P2 부활을 측정 이벤트 없이 진행하면 "이번 주 추천"이 사용자 가치인지 검증 불가. P7 분류 결정도 빈 결정으로 박혀 사용자 행동 영향을 모름. 측정 빠진 결정은 다음 결정의 근거를 못 쌓아 직관 운영으로 떨어짐. §7.6은 예외 없는 룰이라 "이번엔 측정 없이"가 정당화되지 않음.
- 희생 거부 인용: "새 UI/기능은 GA4 이벤트와 같이 들어간다... 측정 없이 기능을 쌓으면 다음 결정의 근거가 사라진다" — [docs/content/persona.md §7.6](../../content/persona.md); "측정 이벤트 없이 기능을 새로 만들지 않는다... 기능만 들어가고 이벤트는 나중에 — 이러면 데이터가 비어서 의사결정 못함" — §5.3
- 주장: P2 부활 시 `recommended_item_view`(이번 주 추천 항목 노출) + `recommended_item_check`(추천 항목 체크 클릭) 신규 이벤트 동반 도입. P7 도입 시 기존 `checklist_check`에 `note_type` 파라미터를 **추가만** (락인 룰 §3.6 준수). P6은 데이터 시맨틱이라 직접 측정 이벤트 불필요.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 직전은 시각 위계 결정이었고 이번은 측정 인프라. "디자이너가 시각 분기 줄이자고 했으니 측정도 줄이자" 잔재 묻지 않음. P2 부활 자체를 전제로 측정 의무를 별도 축에서 주장.

**T2 — [marketer] 반박 입장**

- A 발언 반박:
  1. **측정 의무 자체에는 동의하나 P3 의존성이 핵심** — `recommended_item_view`는 사용자의 현재 주차 ↔ 항목의 `recommendedWeek` 매칭이 전제. P3(주차 입력 UX) 미정 상태에서는 익명 사용자 절대 다수 → **데이터 노이즈만 누적, 락인은 발생**.
  2. `note_type` 파라미터 추가는 ga4.md 등재 + DebugView 검증 + 향후 변경 시 신/구 병행 4주 grace period(§3.6)를 묶어 짊어짐. P7 분류 카테고리가 1년 안에 안정되지 않으면 락인 비용을 운영자가 흡수.
  3. phase-4.5에 P2 측정·P7 측정·자동 주간 리포트 운영(§1.9)·(P14 후속) AI 이미지 SOP까지 욱여넣으면 §3.7 운영자 번아웃 발동. **운영자 1인 임신 24주차** — 마케팅 wiring을 한 phase에 다 박는 게 옳지 않음.
- 잃는 것: 측정 도입 미루면 P2 부활 의사결정 데이터 부재 1~2 phase. 그러나 P3 결정 후 묶어 도입하면 user_property 정합성 + 신규 이벤트 락인을 한 번에 회수.
- 희생 거부 인용: "신규는 추가만, 변경은 신/구 병행 발사 4주 grace period, 삭제는 사실상 금지" — [docs/marketing/persona.md §3.6](../../marketing/persona.md); "1인 운영자에게... 마케팅이 운영자를 갈아 만든 단기 성장은 곧 서비스 종료. 본인 임신·출산 시즌에는 더더욱" — §3.7
- 주장: phase-4.5에서는 (a) P6 시맨틱 결정 + JSON 정정, (b) P7 분류 시맨틱 결정만. **신규 측정 이벤트 도입은 P3 결정과 묶어 phase-5로** (락인 비용 일괄 회수). P2 부활은 측정 없이 진행할 수 없으므로 **부활 자체도 P3와 묶어 phase-5**, phase-4.5에선 **부활/삭제 결정만** 박음.
- 잔재 자기검증: 이전 페어 [planner × designer] 영향 없음 — N — 직전의 "M3 정리 선행" 합의를 이용해 "M3 안 정리됐으니 측정도 미루자"가 아니라, 측정 락인 비용·운영자 번아웃 자체로 반박. P3 의존성은 페어 2의 M3와 무관한 별도 축.

**T3 — 핵심 충돌 + 숨은 가정**

- 핵심 충돌: 측정 의무(planner §7.6)와 측정 락인·운영자 부담(marketer §3.6·§3.7) — phase-4.5에서 어디까지 측정 wiring을 박을지. **P2 부활 자체를 phase-4.5에 둘지 P3와 묶어 phase-5로 미룰지** 가 같이 결정 필요.
- 숨은 가정: 양쪽 다 "P3는 phase-4.5 또는 phase-5 중 하나에 결정될 것"으로 가정. P3가 영구 미해결로 빠지면 P2 부활은 측정 없이 박히거나 영구 보류.

## 4. 미해결 트레이드오프

- [x] **항목 1 — P6 시맨틱 결정 깊이** (페어 1)
  - 옵션 A: phase-4.5에서 시맨틱 결정만(0 = "미정" 또는 "항상" 중 택1을 텍스트로 명시), JSON·코드·필드 변경은 P5와 묶어 phase-5.
  - 옵션 B: phase-4.5에서 코드까지 — 0을 `null` 변경 또는 `alwaysRecommended` 필드 도입.
  - 옵션 C: 결정 자체를 P5 도입까지 미룸.
  - **결정: A** — `recommendedWeek: 0` = "**미정/주차 무관 (P2 매칭 대상 아님)**" 으로 시맨틱 명문화. 데이터·필드 변경 없음. 현행 [checklist-week-map.ts:39](../../../src/lib/checklist-week-map.ts#L39)의 `if (item.recommendedWeek === 0) continue;` 로직이 이미 이 시맨틱을 반영하므로 즉시 비용은 ChecklistItem 타입 JSDoc + 운영자 가이드 1줄 추가뿐. 신규 3종 슬러그(hospital_bag/partner_prep/pregnancy_prep)는 슬러그 자체가 컨텍스트라 항목별 주차가 의미 없어 일괄 0이고, 메인 [checklist_items.json](../../../src/data/checklist_items.json) 92개는 모두 명시 주차 — 데이터 분포가 결정 시맨틱과 일치.

- [x] **항목 2 — P7 note_type 도입 깊이** (페어 1·2)
  - 옵션 A: phase-4.5에서 분류 시맨틱만, 필드·시각 분기는 phase-5.
  - 옵션 B: phase-4.5에서 `legal`만 시각 분기 (필드 없이 텍스트 패턴 기반). 다른 분류는 phase-5.
  - 옵션 C: phase-4.5에서 `note_type` 필드 + 4가지 시각 분기 풀세트.
  - **결정: B** — 분류 시맨틱은 **action / context / legal** 세 가지로 텍스트 정의:
    - `action`: 운영자가 시키는 행동 — 예: "병원 전화 확인"
    - `context`: 부연 설명·맥락 — 예: "제왕절개 시"
    - `legal`: 법령·규정 인용 — 예: "도로교통법 제50조"

    phase-4.5에서는 **`legal`만 시각 분기 도입** — `note_type` 필드 추가 없이 텍스트 패턴 기반으로 식별. 정확한 패턴(접두어 토큰 vs 정규식 등)은 design.md에서 결정. 다른 두 분류는 phase-5에서 `note_type` 필드와 함께 도입 (P5 schema versioning에 묶음).

- [x] **항목 3 — P2 isHighlighted 부활 시점** (페어 2·3)
  - 옵션 A: phase-4.5에서 부활 + 측정 이벤트 동시 도입.
  - 옵션 B: 결정만 박고 실제 부활은 phase-5로.
  - 옵션 C: 삭제.
  - **결정: A** — phase-4.5에서 부활. P3(주차 입력 UX)가 [pregnancy-week-onboarding](../pregnancy-week-onboarding/spec.md) 으로 이미 완료되어 user_property `current_pregnancy_week` 가 [PageviewTracker.tsx:18](../../../src/components/analytics/PageviewTracker.tsx#L18) 에 흐르고 있음. P3 spec.md `won't` 라인이 P2 unblock을 P3의 명시 의도로 박아둠. 페어 3에서 marketer가 든 핵심 반박(P3 미정 → 데이터 노이즈)이 사라져 옵션 A의 외부 차단 사라짐.

- [x] **항목 4 — P2 부활 시 시각 토큰** (페어 2)
  - 옵션 A: peach (data role).
  - 옵션 B: 새 토큰 도입 (DESIGN.md 6번째 pastel 헌법 갱신).
  - 옵션 C: 색 없이 마이크로 라벨/아이콘만.
  - **결정: C** — 색 없이 마이크로 라벨 + lucide 아이콘. 5-pastel role 교차 회피 (designer §3.2 정합). 현재 [ChecklistItem.tsx:30](../../../src/components/checklist/ChecklistItem.tsx#L30)에 박혀 있던 `bg-pastel-yellow/20 border-pastel-yellow/40` 시각은 **제거**하고 마이크로 라벨로 교체. 정확한 라벨 텍스트·아이콘·위치는 design.md.

- [x] **항목 5 — ChecklistHub 카드 정보 과밀(M3) 정리 선행 여부** (페어 2 숨은 가정)
  - 옵션 A: M3 정리 선행.
  - 옵션 B: M3은 별도 작업, P2/P7은 평행 진행.
  - **결정: A** — phase-4.5 본 묶음에 [ChecklistItemRow.tsx:117-138](../../../src/components/checklist/ChecklistItemRow.tsx#L117-L138)의 정보 과밀(우선순위 배지 + 노트 + 액션 버튼이 한 행에 다 붙음) 정리를 **선행 작업**으로 포함. P2 마이크로 라벨과 P7 `legal` 시각 분기를 추가하기 전에 행을 차분하게 만든 뒤 새 신호를 얹음.

- [x] **항목 6 — 측정 이벤트 도입 정책** (페어 3, 항목 3 결정 연동)
  - 옵션 A: 신규 이벤트 2개 phase-4.5 동시 도입.
  - 옵션 B: phase-5로.
  - 옵션 C: 삭제 무관.
  - **결정: A** — `recommended_item_view`(이번 주 추천 항목 노출) + `recommended_item_check`(추천 항목 체크 클릭) 신규 이벤트 phase-4.5 도입. P7 분류는 기존 `checklist_check` 에 `note_type` 파라미터를 **추가만** (락인 룰 §3.6 — 시그니처 보존). user_property `current_pregnancy_week` 가 없는(미입력) 사용자에서는 이벤트 미발사 가드.

## 5. 결정

> 2026-05-08 사용자 결정 완료.

| # | 결정 | 핵심 근거 |
|---|---|---|
| 1 | **P6 시맨틱 = "0은 미정/주차 무관, P2 매칭 대상 아님"** 명문화. 데이터·코드 변경 없음. | 현행 [checklist-week-map.ts:39](../../../src/lib/checklist-week-map.ts#L39)가 이미 시맨틱을 반영. JSON 데이터 분포(메인 92/0, 신규 3종 82/82)와 정합. |
| 2 | **P7 분류 = action / context / legal 텍스트 정의 + `legal`만 시각 분기**. 필드 도입은 phase-5(P5와 묶음). | planner §7.2 YMYL 신뢰 신호와 designer §3.5 인지 부하 사이 타협 — 시각 분기 1개로 한정. |
| 3 | **P2 부활 — phase-4.5에서 진행**. | P3 unblock 의도가 P3 spec.md `won't` 라인에 명시. user_property가 이미 흐르고 있어 측정이 의미 있음. |
| 4 | **부활 시 시각 = 색 없이 마이크로 라벨 + lucide 아이콘**. 기존 yellow 시각 제거. | designer §3.2 5-pastel role 교차 금지 정합. |
| 5 | **ChecklistItemRow M3 정리 선행** (본 묶음 첫 작업). | designer §3.5 "한 화면에 결정 1개" — 빈 캔버스 확보 후 새 신호 추가. |
| 6 | **신규 이벤트 2개 + `note_type` 파라미터 추가** phase-4.5 동시 도입. | planner §7.6 측정 의무 + marketer §3.6 시그니처 보존 — 둘 다 충족. |

### 작업 순서 (페이즈 5에서 spec.md로 옮김)
1. ChecklistItemRow M3 정리 (행 차분히)
2. P6 시맨틱 명문화 (타입 JSDoc + 운영자 가이드 — P10 본 phase 잔여분에 흡수)
3. P2 isHighlighted 부활 + 마이크로 라벨/아이콘
4. P7 `legal` 텍스트 패턴 + 시각 분기
5. GA4 이벤트 wiring (`recommended_item_view`, `recommended_item_check`, `checklist_check.note_type` 파라미터)

## 6. 우선순위 영향

이 결정 묶음은 phase-4.5 다른 결정들과 강하게 얽힘:

- **P3 (주차 입력 UX)** — 항목 3=A 선택 시 P3도 phase-4.5로 끌려옴. B/C 선택 시 P3는 phase-5로 자연 정렬.
- **P5 (localStorage schema versioning)** — 항목 1=B 선택 시 phase-5 P5 도입 시 이중 마이그레이션 위험. A/C 선택 시 P5와 함께 깔끔히 진행 가능.
- **§2.4 M3 (ChecklistHub 카드 정보 과밀)** — 항목 5=A 선택 시 phase-4.5 묶음 확장. B 선택 시 디자이너 §3.5 위반 위험을 감수.
- **§2.6 UX #2 (D-day 컨텍스트 라벨), UX #5 (노트 자동 액션 분리)** — 항목 3=A·항목 2=B 또는 C 선택 시 함께 진행 가능. 다른 조합에선 phase-5로 자연 미룸.
- **phase-5 워크로드** — A 옵션이 많을수록 phase-4.5 부담 ↑, B/C 많을수록 phase-5 부담 ↑. marketer §3.7 운영자 번아웃 룰이 본 결정 묶음의 안전장치.
