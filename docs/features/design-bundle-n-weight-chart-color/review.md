# design-bundle-n-weight-chart-color 리뷰

> 작성일: 2026-05-10
> 상태: draft (페이즈 4 휴먼 게이트 대기)
> size: M
> phase_mode: review (운영자 결정 후 별도 라운드에서 spec/design 작성)
> 관련 스펙: [spec.md](./spec.md) (페이즈 5 진입 전 ⚠️ 운영자 답변 필요)

## 1. 기능 요약

phase-4.5.md §2.8.4 W-1·§2.10 묶음 N 마감. 체중 차트([WeightChart.tsx](../../../src/components/weight/WeightChart.tsx)) 라인이 `#FFD4DE`(pastel-pink, **CTA 토큰**)로 그려져 있어 **5-pastel role discipline 위반**. peach=data role과 충돌. 권장안 = peach 라인 + 권장 범위 = mint/peach 톤 재배치 — 단, 충돌 분석 후 다른 안 가능성 검토.

⚠️ **사전 인지된 사실**:
- 현재 코드 상태(2026-05-10), [WeightChart.tsx:36-90](../../../src/components/weight/WeightChart.tsx#L36-L90):
  - **Line stroke** = `#FFD4DE` (pastel-pink, CTA role) — 데이터 시각화에 CTA 토큰 오용. AP1 위반.
  - **linearGradient** = `#FFD4DE` → `#E4D6F0` (pink → lavender). 한 그라디언트에 두 페르소나 역할 섞임 — secondary role과 CTA role 시각적 융합.
  - **ReferenceLine 권장 하한** = `#D0EDE2` (pastel-mint, success role).
  - **ReferenceLine 권장 상한** = `#FFE0CC` (pastel-peach, **data role**) — 데이터 라인이 peach로 옮겨가면 ReferenceLine 상한과 시각 분리 X.
  - dot/activeDot도 `#FFD4DE` 동일 — 라인 변경 시 dot도 동조.
  - 라벨 fill = `#9CA0A4` (muted-foreground), grid stroke = `#F8F6F4` (muted) — chrome 토큰은 정합 OK.
- 디자이너 §6 (2026-05-03) 누적 학습 권장 메모: "**차트 데이터는 peach 계열로, ReferenceLine은 mint(목표 하한)·peach 진한 톤(상한) 같은 역할 매핑이 필요**". → **현재 ReferenceLine 상한이 이미 peach`#FFE0CC`이라 라인을 peach로 이동 시 상한 ReferenceLine 톤 재배치 필수**(시각 분리 회복).
- mint=success role의 의미 재검토: 권장 하한은 "최소 권장 증가량 미달 = 충분히 못 먹은 상태". 임상적으로 이게 success인지 risk인지 — YMYL 영역 (planner §7.2 + designer N5 의료 안전 경계).
- 1차 소스 = [WeightChart.tsx:97](../../../src/components/weight/WeightChart.tsx#L97) "출처: 대한산부인과학회 임신 중 체중 관리 가이드라인" 명시 박힘 (planner §7.3 정합 OK).
- DESIGN.md §10 헌법: "**5-pastel을 reverse하지 않음** — 페이지가 mint로 시작하면 다른 제품으로 보임" + "**6번째 pastel 도입 X**" + AP1 "pink CTA 전용".

## 2. 적용 페어 + 선택 이유

- **designer × planner**: 토큰 헌법 정합·5-pastel role discipline (designer DESIGN.md §2.2 + AP1 + §6 누적 학습) vs YMYL·데이터 가독성·사용자 안전 결정 (planner §7.2·§7.3·§3.4·§5.4). dev/marketer는 본 묶음에 직접 충돌 축이 약함 — 변경 범위는 [WeightChart.tsx](../../../src/components/weight/WeightChart.tsx) 단일 파일 5색 토큰 교체 + 측정 변경 0.

## 3. 페어별 충돌

### 페어 1: designer × planner

**T0 — 페어 시작 선언**: 이전 페어 [없음] 영향 없음. designer DESIGN.md §2.2·AP1·§6 (2026-05-03)·§8 / planner §7.2·§7.3·§3.4·§5.4·§2 사고 프레임 5번 인용.

**[designer] 단독 입장**:

- **잃는 것**: 라인을 peach로 옮기는 권장안은 5-pastel role 정합이지만, **현재 ReferenceLine 상한이 이미 peach** — 라인과 상한이 같은 페르소나 톤이면 시각 분리 X. 이를 회복하려면 (1) 상한을 다른 톤(예: peach 진한 톤 별도 토큰 추가)으로 변경 → 6번째 pastel/톤 도입 위험(§8 거절 1번) + DESIGN.md 헌법 갱신 의무, 또는 (2) 상한을 mint 진한 톤으로 옮기면 mint=success role과 의미 충돌 — "권장 상한"이 success인지 risk인지 명확하지 않음. **결국 라인을 peach로 옮기는 권장안 자체가 토큰 디시플린 경계 안에서 풀리지 않는 결정**.
- **희생 거부 인용**: "**5-pastel role(pink=primary CTA, lavender=secondary, mint=success, peach=data, yellow=info) 절대 교차 금지. 새 hex 인라인 금지.**" — docs/design/persona.md §3 의사결정 원칙 2번. + "AP1: `bg-pastel-pink/60`을 데이터 라벨에 사용. → pink는 CTA 전용. 데이터는 muted/outline 또는 accent-red 텍스트." — §5. + "**차트 데이터는 peach 계열로, ReferenceLine은 mint(목표 하한)·peach 진한 톤(상한) 같은 역할 매핑이 필요**" — §6 (2026-05-03). + "DESIGN.md 6번째 pastel 도입 요청 → **헌법 갱신 제안서 먼저 요구**." — §8 거절 1번. + "**MedicalDisclaimer는 시각적으로 보여야 함 — 접힘·스크롤 아래 숨김·글자 축소로 무력화 금지**" — N5.
- **주장**: 권장안의 시각 분리 문제를 해결하려면 두 가지 경로 — (A) **DESIGN.md 헌법 갱신** = peach 진한 톤(예: `--pastel-peach-deep`)을 데이터 시각화 전용 변형 토큰으로 추가 (5-pastel role 유지, 변형은 OK), 또는 (B) **권장안 수정** = 라인 = peach + 하한 mint(현행) + **상한 = peach 진한 톤 + dashed 패턴 차이 강화**(stroke-dasharray + strokeWidth 변경으로 시각 분리, 색은 같은 페르소나 톤). 본 페르소나는 (B) 우선 권장 — 헌법 갱신 회피 + DESIGN.md AP1 정합 + 시각 분리는 패턴(dash/width)으로 회복. 단 mint=success role 정합성 검토는 planner 영역 — "권장 하한 = mint(success)"가 의학적으로 맞는지 단정 못 함.
- **잔재 자기검증**: 이전 페어 없음 — N

**[planner] 반박 입장**:

- **A 발언 반박**: designer의 "(B) 패턴 차이로 시각 분리" 권장은 토큰 디시플린 정합 OK이나, **mint=success role 적용에 YMYL 의문 누락**:
  - **권장 하한** = "최소 권장 증가량(예: +11.5kg) 미달". 임상적으로 이는 **충분히 못 먹은 상태 = 태아 발달 영양 부족 가능성** — success가 아닌 **주의 신호**에 가까움. mint(success/긍정)로 표시하면 사용자가 "권장 범위 안 = 안심"으로 잘못 학습 가능. 임산부 사용자가 "내가 권장 하한 위에 있으니 OK"라고 인지하는 게 정작 위험한 케이스(예: 임신성 당뇨 + 과도한 증가) 또는 안전한 케이스(예: 정상 BMI + 적정 증가) 구분이 차트 색만으로 안 됨.
  - **권장 상한** = "최대 권장 증가량(예: +16kg) 초과". 임상적으로 이는 **임신성 당뇨·고혈압 위험 신호** — peach(data)도 아닌 **경고**에 가까움. 단 §7.2 "**의학적 단정·진단·처방 절대 금지**" 룰 — 차트 색이 "이 범위 = 위험" 단정 시각 표현이면 단정 표현에 해당.
  - 즉 designer의 "ReferenceLine = mint(하한)·peach 진한 톤(상한)" 매핑은 5-pastel role 헌법은 정합하지만 **YMYL 의미가 잘못 박힐 위험**. mint=success가 의학적 success를 의미하는 게 아니라 "권장 범위 시각 마커"로 사용된다면, 사용자에게 색의 의미가 "권장 표시"임을 명시하는 보조 카피 또는 범례 의무.
- **잃는 것**: peach 진한 톤 + dashed 패턴 차이 권장 양보 가능. 다만 ReferenceLine **색 자체가 의학적 의미 단정**하지 않게 만들고 싶음 — 가장 보수적인 안 = ReferenceLine 양쪽 다 동일한 muted 톤(`#9CA0A4` 등) + 라벨 카피로만 "권장 하한"·"권장 상한" 명시 + 본문 카피에 "권장 범위는 일반적 가이드, 개인 변이 가능"(§3.5 의료 안전 경계 + 출처 명시 OK).
- **희생 거부 인용**: "**의학적 단정·진단·처방·이것만 먹으면 좋아져요 류 카피 절대 금지. 모든 의학 정보 글은 면책 문구 + 1차 소스(학회·식약처·NHS급) 의무.**" — docs/content/persona.md §7.2. + "**통계·수치·정책 정보는 1차 소스 없이 인용 금지.**" — §7.3. + "**DESIGN.md 5-pastel role 디시플린은 콘텐츠 영역에서 가장 잘 무너진다.**" — §5.4. + "**YMYL·법적 리스크가 있는가? (의료·금융·정부 정책 — 면책 + 출처 + 검증 일자)**" — §2 사고 프레임 5번. + "**임산부 대상 공포 마케팅 거부 — '이거 모르면 큰일 나요' / '지금 안 사면 후회해요' 류 거부**" — §7.7 (관련: 차트 색이 공포·안심 단정 시그널이면 §7.7 위반 가능).
- **주장**: 권장안 수정 — **(C) 라인 = peach + ReferenceLine 양쪽 = muted 톤 + dashed 패턴 + 범례/라벨에 "권장 범위는 정상 BMI 기준 가이드, 개인 변이 가능" 보조 카피**. 색이 의학적 단정 시그널이 되지 않도록 **모든 의학 의미는 카피에 위임**. 출처(이미 명시)·면책 문구는 유지(§7.2·§7.3 정합 OK). 차트 색 자체는 데이터 가독성 + 5-pastel role 헌법만 충족하고, "권장/위험" 의미 표현은 텍스트가 책임.
- **잔재 자기검증**: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: designer는 **5-pastel role discipline 헌법** 우선 + ReferenceLine 양쪽을 mint·peach 페르소나 톤 매핑으로 시각 분리 — planner는 **YMYL 의학적 단정 회피** 우선 + ReferenceLine을 색이 아닌 muted+카피로 의미 분리. 양쪽이 라인 = peach에는 합의하지만 **ReferenceLine 색 매핑에서 첨예** — designer는 "mint=success role의 헌법 정합"으로 박고 싶고, planner는 "mint=success가 의학적 success를 단정하면 §7.2 위반"으로 거부. 정확히 **시각 시스템 헌법 vs 의학적 단정 회피**가 충돌하는 케이스.
- **숨은 가정**: 양쪽 모두 **현재 그라디언트(`#FFD4DE` → `#E4D6F0`)는 모두 제거** 동의. 그러나 **그라디언트 fill 자체를 유지할지**(area chart 시각 강조)에 대한 결정 누락 — 단순 라인으로 다운그레이드할지, peach 그라디언트로 교체할지(`#FFE0CC` → 투명) 미정. 또 designer가 권장한 (B) "dashed 패턴 차이" 시 stroke-dasharray 명세(현재 양쪽 다 `5 5`) 미정 — 페이즈 5 spec 단계에서 결정 필요. planner의 "muted 톤" 권장은 ReferenceLine이 차트 grid(`#F8F6F4`)와 시각 융합 위험.

## 4. 미해결 트레이드오프

### 항목 N-1 — Line stroke 색 변경

페어 1에서 양쪽이 라인 = peach에 합의(designer AP1 정합 + planner peach=data role 정합 OK). 운영자 재확인 필요 — pink 유지·다른 톤 채택 대안 고려.

- [ ] **옵션 A — 현상 유지** (pink #FFD4DE):
  - 즉시 비용: 0.
  - 나중 비용: AP1 위반 영구화. CTA 토큰 데이터 오용. §2.9 W-1 미해소.
- [x] **옵션 B — peach (`pastel-peach` `#FFE0CC`)** (페어 권장, 사용자 명시 권장안):
  - 즉시 비용: stroke + dot fill + linearGradient 색 교체. linearGradient는 peach → 투명(`#FFE0CC` `stopOpacity={0.8}` → `stopOpacity={0}`)으로 전환.
  - 나중 비용: peach=data role 정합. AP1 회복. 단, 현재 ReferenceLine 상한이 같은 peach라 시각 분리 회복 종속 (N-2 결정).
- [ ] **옵션 C — accent-red 텍스트 톤** (`#B04060`):
  - 즉시 비용: stroke 톤 어두움 — 라인이 무거움. peach=data role 사용 안 하므로 5-pastel 헌법 정합 회피 가능.
  - 나중 비용: accent-red는 "destructive accent + warning emphasis 텍스트 전용"(DESIGN.md §2.3) — 차트 라인에 사용 시 또 다른 토큰 오용. 권장 X.
- [ ] **옵션 D — DESIGN.md 헌법 갱신 + 새 데이터 시각화 전용 토큰 추가**:
  - 즉시 비용: 헌법 갱신 PR 별도 + 토큰 신설(`--chart-data-1` 등).
  - 나중 비용: 차트 시스템 확장 시 정합. 단, 본 라운드 범위 외(designer §8 거절 1번).
- **결정**: ⚠️ **운영자 답변 필요** — 옵션 A/B/C/D 중 1개. (페어 권장 = B, 사용자 명시 권장안 = B)

### 항목 N-2 — ReferenceLine 색 매핑 (N-1=B 종속)

페어 1 핵심 충돌 — designer는 "mint(하한)·peach 진한 톤(상한) + dashed 패턴 차이로 시각 분리", planner는 "양쪽 muted 톤 + 카피에 의학 의미 위임"으로 첨예 대립.

- [ ] **옵션 A — designer (B) 안: 하한=mint, 상한=peach 진한 톤 (DESIGN.md 헌법 갱신 0)**:
  - 시각: 하한 = `pastel-mint` `#D0EDE2` (현행), 상한 = peach 진한 톤(예: `pastel-peach`의 `/80` 또는 `accent-olive` `#8B7520`로 텍스트 라벨만 진하게 + 라인은 peach `/60`).
  - 즉시 비용: 5-pastel role 정합. 시각 분리 = 색 + dashed 패턴 + strokeWidth 차이.
  - 나중 비용: **mint=success role이 의학적 "권장 하한 = success"로 단정 시그널 위험** (planner §7.2 위반 가능). "권장 하한 위 = success" 학습 시 사용자가 잘못 안심.
- [ ] **옵션 B — planner (C) 안: 양쪽 muted 톤 + dashed + 카피로 의미 위임**:
  - 시각: 하한·상한 모두 muted-foreground `#9CA0A4` 또는 `#7A7F83` 같은 톤, dashed `5 5` 유지, strokeWidth 1.5 유지. 라벨 fill도 muted. 본문에 "권장 범위는 정상 BMI 기준 가이드, 개인 변이 가능" 보조 카피 추가.
  - 즉시 비용: 시각 분리 약함 — 양쪽이 같은 톤이라 사용자가 "어느 게 하한·상한인지" 라벨로만 식별. dashed 패턴 차이(예: 하한 `5 5`, 상한 `8 4 2 4`)로 보강 권장.
  - 나중 비용: YMYL 단정 회피 정합. designer 5-pastel role 헌법 정합도 OK(muted-foreground는 chrome 토큰, role 외).
- [ ] **옵션 C — 절충안: 하한=peach 옅은 톤(예: `pastel-peach/40`), 상한=peach 진한 톤(예: `pastel-peach/80`) + dashed 차이**:
  - 시각: 양쪽 모두 peach 페르소나 안에서 명도 차이로 분리. 하한·상한이 동일 페르소나 = 동일 의미 카테고리("권장 가이드 마커") 시그널.
  - 즉시 비용: 5-pastel role 정합 OK(peach=data role + 명도 변형). YMYL 단정 회피 OK(peach 자체는 success/위험 시그널 X).
  - 나중 비용: 시각 분리 약함 — 명도 차이 + dashed 패턴 의존. 라벨 카피 의무.
- **결정**: ⚠️ **운영자 답변 필요** — N-1=B일 때만. 페어 합의 없음(첨예). 운영자가 시각 시스템 헌법 vs YMYL 의학적 단정 회피 중 어느 쪽을 우선할지 결정.

### 항목 N-3 — linearGradient fill 처리 (N-1=B 종속)

페어 1 T3 숨은 가정 — fill 자체 유지 여부 미결.

- [ ] **옵션 A**: peach 그라디언트로 교체 — `#FFE0CC` `stopOpacity={0.8}` → `stopOpacity={0}` (현재 패턴 그대로 색만 교체).
- [ ] **옵션 B**: fill 제거 — 단순 라인 차트로 다운그레이드. 시각 무게 ↓, 데이터 자체에 집중. peach=data role의 area fill이 peach 페르소나의 "data 강조" 시그널과 정합 OK.
- **결정**: ⚠️ **운영자 답변 필요** — N-1=B일 때만. 권장 = 옵션 A — 현재 area chart의 시각 강조 패턴 유지하되 페르소나 정합.

### 항목 N-4 — 보조 카피 추가 여부 (N-2=A·C 종속)

페어 1에서 planner가 "권장 범위는 정상 BMI 기준 가이드, 개인 변이 가능" 카피 의무 박음 (§7.2 단정 회피). N-2=B 채택 시 자동 의무 — N-2=A·C 채택 시 운영자 결정.

- [ ] **옵션 A**: 추가 안 함 — 현재 [WeightChart.tsx:92-101](../../../src/components/weight/WeightChart.tsx#L92-L101)의 "권장 범위: 임신 전 체중 기준 +11.5~16kg (정상 BMI 기준)" + "본 정보는 참고용이며 의료적 조언이 아닙니다" 카피로 충분.
- [ ] **옵션 B**: 추가 — 현재 카피에 "**개인 변이 가능. 임상 상황에 따라 권장 범위가 달라질 수 있습니다.**" 한 줄 보강. content persona 검토 위임.
- **결정**: ⚠️ **운영자 답변 필요** — N-2=A·C일 때만. 권장 = 옵션 A — 현재 카피로 §7.2 정합 충분(이미 면책·출처·BMI 기준 명시). 보강은 미세 차이.

### (참고) 페어 합의 사항 — 결정 영역에서 재확인 가능

다음은 페어에서 양쪽이 합의한 사항. 사용자가 뒤집고 싶으면 §5에 명시.

- **페어 1**: 라인·dot 색 = peach (`pastel-peach` `#FFE0CC`) — N-1 옵션 B. AP1 회복 + peach=data role 정합.
- **페어 1**: 현재 그라디언트 stop2(lavender `#E4D6F0`) 제거. lavender=secondary role과 충돌 회피.
- **페어 1**: chrome 토큰(grid stroke `#F8F6F4`, 라벨 fill `#9CA0A4`)은 정합 OK — 변경 없음.
- **페어 1**: 1차 소스(대한산부인과학회) + 면책 카피는 유지. planner §7.3 정합.
- **페어 1**: DESIGN.md 헌법 갱신 회피 — 본 라운드는 토큰 디시플린 안에서 해결(designer §8 거절 1번 정합).

## 5. 결정

**페이즈 4 휴먼 게이트 결정 (운영자 입력, 2026-05-10)**:

- **항목 N-1 (Line stroke 색 변경)**: **옵션 B — peach (`pastel-peach` `#FFE0CC`)**. stroke + dot fill + linearGradient 색 모두 교체. AP1 회복 + peach=data role 정합.
- **항목 N-2 (ReferenceLine 색 매핑)**: **옵션 B — planner 안: 양쪽 muted 톤 + dashed + 카피로 의미 위임**. 하한·상한 모두 muted-foreground (`#9CA0A4`) stroke + dashed 패턴 차이로 시각 분리(하한 `5 5`, 상한 `8 4 2 4`로 dasharray 차등) + strokeWidth 1.5 유지. 라벨 fill도 muted. mint=success role의 의학적 단정 시그널 회피(planner §7.2 정합). 색이 의미를 가지지 않고 라벨 카피("권장 하한"·"권장 상한")에 의학적 의미 위임.
- **항목 N-3 (linearGradient fill 처리)**: **옵션 A — peach 그라디언트로 교체**. `<stop offset="5%" stopColor="#FFE0CC" stopOpacity={0.8} />` → `<stop offset="95%" stopColor="#FFE0CC" stopOpacity={0} />`. 현행 area chart 시각 강조 패턴 유지하되 페르소나 정합. lavender stop 제거.
- **항목 N-4 (보조 카피 추가)**: **옵션 A — 현상 유지**. 현재 [WeightChart.tsx:92-101](../../../src/components/weight/WeightChart.tsx#L92-L101)의 "권장 범위: 임신 전 체중 기준 +11.5~16kg (정상 BMI 기준)" + 출처(대한산부인과학회) + 면책("본 정보는 참고용이며 의료적 조언이 아닙니다") 카피로 §7.2·§7.3·§3.5 정합 충분. 보강 미세 차이.

**페어 합의 사항 (사용자 뒤집기 없음, 그대로 채택)**:

- 페어 1: 라인·dot 색 = peach (`pastel-peach` `#FFE0CC`).
- 페어 1: 현재 그라디언트 stop2(lavender `#E4D6F0`) 제거. lavender=secondary role 충돌 회피.
- 페어 1: chrome 토큰(grid stroke `#F8F6F4`, 라벨 fill `#9CA0A4`)은 정합 OK — 변경 없음.
- 페어 1: 1차 소스(대한산부인과학회) + 면책 카피 유지. planner §7.3 정합.
- 페어 1: DESIGN.md 헌법 갱신 회피 — 본 라운드는 토큰 디시플린 안에서 해결.

## 6. 우선순위 영향

- phase-4.5.md §2.10 묶음 N 결정·실행 unblock. §2.8.4 W-1 해소.
- 변경 파일 = [src/components/weight/WeightChart.tsx](../../../src/components/weight/WeightChart.tsx) 단일 파일. 토큰 교체 5색 + 카피 1줄(N-4=B 시).
- 측정 변경 0. GA4 카탈로그 갱신 0.
- DESIGN.md 헌법 갱신 0 (designer §8 거절 1번 회피). 단, 페이즈 7 design.md에서 5-pastel role discipline의 차트 시각화 적용 메모를 [DESIGN.md §6.2](../../../DESIGN.md) 또는 §11에 한 줄 추가 검토 (헌법 본문 변경이 아닌 누적 학습 메모).
- 묶음 J(ShareButton 위치)·묶음 K(삭제 패턴)와 독립. 같은 라운드에서 상호 영향 없음.
