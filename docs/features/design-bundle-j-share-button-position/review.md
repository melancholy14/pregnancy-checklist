# design-bundle-j-share-button-position 리뷰

> 작성일: 2026-05-10
> 상태: draft (페이즈 4 휴먼 게이트 대기)
> size: M
> phase_mode: review (운영자 결정 후 별도 라운드에서 spec/design 작성)
> 관련 스펙: [spec.md](./spec.md) (페이즈 5 진입 전 ⚠️ 운영자 답변 필요)

## 1. 기능 요약

phase-4.5.md §2.9 Cross-10·§2.10 묶음 J 마감. 영역별로 ShareButton 위치가 일관되지 않음 — checklist=우상단 단독, articles=우상단+중앙하단, timeline=우상단 단독. **시스템 차원 통일 정책 미정**. 통일안 후보 3종(우상단 단독 / 중앙하단 단독 / 우상단+중앙하단 유지) 중 콘텐츠 길이별 도달률 가설을 깔고 1개 채택 + 일괄 정렬.

⚠️ **사전 인지된 사실**:
- 현재 코드 상태(2026-05-10):
  - [ChecklistPage.tsx:257-265](../../../src/components/checklist/ChecklistPage.tsx#L257-L265) — 우상단 단독 (`flex justify-end mb-4`)
  - [TimelineContainer.tsx:218-226](../../../src/components/timeline/TimelineContainer.tsx#L218-L226) — 우상단 단독 (`flex justify-end mb-4`)
  - [ArticleDetail.tsx:70-78](../../../src/components/articles/ArticleDetail.tsx#L70-L78) — 우상단 + [ArticleDetail.tsx:102-111](../../../src/components/articles/ArticleDetail.tsx#L102-L111) 중앙하단 (라벨 "이 글 공유하기")
- ShareButton 컴포넌트는 `share_click` GA4 이벤트를 발사 ([share/ShareButton.tsx](../../../src/components/share/ShareButton.tsx)). 위치 차등 측정을 위해 `position` 파라미터 도입 가능 여부가 페어 충돌 축의 한 축.
- DESIGN.md 헌법은 ShareButton 위치 컨벤션을 명시하지 않음. 디자이너 페르소나 §6 (2026-05-03) 누적 학습에만 권장 메모.
- 외부 공유 채널은 `navigator.share` 우선 + 실패 시 클립보드 복사 (현재 구현). 위치 결정은 **노출 위치**에만 영향, 공유 메커니즘 자체는 변경 없음.

## 2. 적용 페어 + 선택 이유

- **designer × marketer**: 시각 일관성·헌법 정합 (designer 누적 학습 §6, AP1 5-pastel role 정합) vs 콘텐츠 길이별 도달률·측정 가능성 (marketer §2.2 가설→측정→결정, §5.4 측정 계획 1줄 필수). dev/planner는 본 묶음에 직접 충돌 축이 약함 — 마크업 변경 범위는 작고(SHARE 이동 1~3개 파일), 콘텐츠 정체성에는 영향 없음.

## 3. 페어별 충돌

### 페어 1: designer × marketer

**T0 — 페어 시작 선언**: 이전 페어 [없음] 영향 없음. designer §6 (2026-05-03) 누적 학습·N1·N4 / marketer §2.2·§3.6·§3.7·§5.4 인용.

**[designer] 단독 입장**:

- **잃는 것**: 우상단+중앙하단 유지 시 ShareButton이 한 페이지에 두 번 등장 — 스크린리더 사용자에게 동일 의미 요소 중복 발화(N1 ARIA 정합성 깎임). 또 시각 위계도 평탄해져서 "공유"가 콘텐츠보다 강조되는 시그널을 줄 수 있음(§3 의사결정 원칙 5번 인지 부하 최소화 위반 가능).
- **희생 거부 인용**: "**공유는 콘텐츠 끝에 1회 또는 sticky 우하단 1회 — 둘 중 하나로 통일** 권장" — docs/design/persona.md §6 (2026-05-03). + "색 대비, 키보드 도달, focus-visible, ARIA 정합성, 시맨틱 HTML, 스크린리더 라벨." — N1. + "한 화면에 결정 1개. 같은 정보 중복 표시 금지." — §3 의사결정 원칙 5번.
- **주장**: **(나) 중앙하단 단독** 채택 권장. 근거 — (1) 공유는 "콘텐츠를 보고 가치를 느낀 후"의 행동이라 진입 직후 우상단보다 콘텐츠 끝이 시맨틱 정합. (2) 우상단은 페이지 진입 전 콘텐츠 미인지 상태에서 공유를 권유하는 형태로, 중복 노출 가치가 약함 — 측정 데이터 없이도 사용자 멘탈 모델로 약함. (3) checklist·timeline은 "끝"이 명확하지 않은 페이지지만, "체크 완료" 또는 "주차별 아코디언 닫힘" 끝점에 배치 가능 — 영역별로 "끝"의 정의를 design.md에 박으면 일관성 유지. 측정 가설로 우상단을 살리고 싶다면 marketer가 데이터로 입증할 책임.
- **잔재 자기검증**: 이전 페어 없음 — N

**[marketer] 반박 입장**:

- **A 발언 반박**: designer의 "(나) 중앙하단 단독" 권장은 시각 일관성 측면 OK이나, **검증 데이터 없음** 단계에서 단정하면 §2.2(가설→측정→결정) 위반. 콘텐츠 길이별 도달률 가설은 다음과 같이 비대칭:
  - **체크리스트**(허브 32개 항목 토글 + 진행률 카드, 평균 스크롤 거리 짧음, 행동 목적 페이지): 우상단 1회로 충분. 중앙하단은 "끝"이 사용자 행동 기반(`allDone`)이라 도달률 측정이 산발적.
  - **타임라인**(주차별 아코디언, 사용자가 자기 주차만 펼치고 떠남, "끝" 없음): 우상단 1회. 중앙하단 의미 X.
  - **아티클**(평균 5,000자+ 본문, 완독 시 자연 도달): **중앙하단이 핵심 도달 지점**. 우상단은 진입 직후 노출 — 측정상 두 위치 클릭 비율을 비교하면 콘텐츠 가치 검증 가능.
  - 즉 designer의 "(나) 단독" 일괄 적용은 체크리스트·타임라인에서 도달률을 깎고, 아티클에서만 적정 — 시각 일관성을 위해 **콘텐츠 길이가 짧은 영역의 공유 도달률을 희생**하는 형태.
- **잃는 것**: 영역별 차등 채택 시 시각 일관성 일부 깎임(designer N1 ARIA 정합 양보까진 아님 — 한 영역 안에서 1개 위치 유지하면 중복 발화 0). 또 `share_click` 이벤트에 `position` 파라미터 추가 의무 — phase-4.5.md §1.5 카탈로그 갱신 필요.
- **희생 거부 인용**: "이 가설을 어떤 이벤트로 검증할 수 있는가까지 같이 답한다. 측정 불가능한 제안은 제안하지 않는다." — docs/marketing/persona.md §2.2. + "신규는 추가만, 변경은 신/구 병행 발사 4주 grace period." — §3.6. + "기능 PR에 측정 계획 1줄 필수: 이 기능 가치는 X 이벤트의 발사율 또는 Y 코호트 리텐션 변화로 검증." — §5.4.
- **주장**: 1차 안은 **(다) 우상단+중앙하단 유지** — 단, **`share_click.position` 파라미터 신설**(`top_right` | `bottom_center`)로 영역×위치별 도달률 측정. 4주 데이터 수집 후 영역별 도달률 차이가 5%p 이상이면 그 영역만 (가) 또는 (나)로 다운스코프 — A/B를 운영자 수동 결정으로 떠넘기지 않고 4주 데이터 기반 1회 결정. 공유 자체가 회당 비용 0(navigator.share native), 측정 카탈로그 +1 파라미터.
- **잔재 자기검증**: 이전 페어 없음 — N

**T3 — 핵심 충돌 + 숨은 가정**:

- **핵심 충돌**: 결정 우선순위 = (designer) **시각 일관성·헌법 정합 우선 — 즉시 (나) 단독** vs (marketer) **측정 후 결정 — 일단 (다) 유지 + 4주 후 영역별 다운스코프**. 두 입장이 기간 차이로만 충돌 — designer는 결정 즉시 일관성 회복(중복 0), marketer는 4주 measurement window 내 일관성 위반 허용 후 데이터 기반 결정. **"4주 동안 우상단+중앙하단 중복 허용"이 designer N1 ARIA 정합성 + §3.5 인지 부하를 깎는가**가 충돌 압력의 진짜 정체.
- **숨은 가정**: 양쪽 모두 **`share_click` 이벤트가 이미 발사 중이고 position 차등이 가능하다**고 가정. 실제 [share/ShareButton.tsx](../../../src/components/share/ShareButton.tsx) 검증 필요(현재 `share_click`만 발사 — `position` param은 없음, 추가 필요). 또 designer는 "체크리스트·타임라인의 끝점이 명확히 정의 가능"하다고 가정 — 타임라인은 사용자가 자기 주차만 펼치는 비선형 페이지라 "끝" 정의가 불완전. 이 가정이 깨지면 (나) 단독 채택 시 timeline에서 ShareButton 도달률이 0에 가까워질 수 있음.

## 4. 미해결 트레이드오프

### 항목 J-1 — ShareButton 위치 통일 정책

페어 1에서 designer·marketer가 결정 우선순위(즉시 일관성 vs 측정 후 결정)에서 첨예하게 충돌. 운영자가 어느 가치를 우선할지 직접 결정 필요.

- [ ] **옵션 A — (가) 우상단 단독 일괄**:
  - 즉시 비용: articles의 중앙하단 ShareButton 제거 → 본문 끝 진입 후 공유 행동 마찰 ↑(완독 사용자가 다시 위로 스크롤 필요).
  - 나중 비용: 시각 일관성 회복(영역 4개 모두 우상단). 단, 콘텐츠 길이가 긴 articles에서 공유 도달률 측정 못한 채 다운그레이드.
- [ ] **옵션 B — (나) 중앙하단 단독 일괄** (designer 권장):
  - 즉시 비용: checklist/timeline의 우상단 ShareButton 제거 + 각 영역의 "끝" 슬롯 정의 필요(checklist=`allDone` 직후 또는 페이지 최하단, timeline=마지막 주차 아코디언 아래).
  - 나중 비용: 시맨틱 정합(공유는 콘텐츠 가치 인지 후 행동). N1 ARIA 정합성 회복(중복 0). 단, 짧은 페이지에서 사용자가 끝까지 도달 안 하면 공유 노출 0 — checklist/timeline 도달률 측정 가설 미검증 채로 적용.
- [ ] **옵션 C — (다) 우상단+중앙하단 유지 + `share_click.position` 파라미터 신설** (marketer 권장):
  - 즉시 비용: 일관성 위반 4주간 허용. ShareButton 컴포넌트에 `position` prop 추가 + GA4 카탈로그 +1 파라미터(phase-4.5.md §1.5 갱신).
  - 나중 비용: 4주 후 영역×위치별 도달률 데이터 확보. 도달률 차이 5%p 이상이면 영역별 다운스코프, 미만이면 (나) 단독으로 일괄. 측정 모델 강화 + designer N1 위반은 4주 한정.
- [ ] **옵션 D — 영역별 차등 (체크리스트=우상단, timeline=우상단, articles=중앙하단 단독)**:
  - 즉시 비용: 영역별 다른 위치 — 시각 일관성 깨지지만 콘텐츠 길이 가설에 맞춰 단정 적용. articles 우상단 ShareButton 제거.
  - 나중 비용: 페이지별 멘탈 모델 부담. 단, 콘텐츠 길이가 명확히 다른 페이지군이라 사용자가 "이 페이지는 콘텐츠가 길다 → 끝에서 공유" 학습 가능. designer §3 인지 부하 위반은 영역 간 위치 차이라 단일 페이지 내 중복 0.
- **결정**: ⚠️ **운영자 답변 필요** — 옵션 A/B/C/D 중 1개. 답변 시 함께 결정해야 할 항목: 채택 후보가 (나) 또는 (다)일 때 "끝" 슬롯의 명확한 정의(checklist는 `allDone` 시점 vs 페이지 최하단, timeline은 마지막 아코디언 아래 vs 페이지 최하단).

### 항목 J-2 — `share_click.position` 파라미터 신설 여부 (옵션 C·D 종속)

페어 1에서 marketer가 "위치별 도달률 측정"을 단정 — 옵션 C·D 채택 시 의무. 옵션 A·B 채택 시 위치가 1개로 고정되므로 `position` 파라미터 의미 X.

- [ ] **옵션 A**: 추가 안 함 — J-1이 옵션 A·B로 결정될 경우.
- [ ] **옵션 B**: 추가 — `position: "top_right" | "bottom_center"` enum, share_click 발사 시 의무 파라미터. ga4.md §1.5 카탈로그 갱신 + 4주 grace period 후 분석.
- **결정**: ⚠️ **운영자 답변 필요** — J-1 옵션 결정에 종속. J-1=A/B면 본 항목 자동 옵션 A. J-1=C/D면 본 항목 옵션 B 강력 권장(marketer §3.6 락인 정합 + §5.4 측정 계획 1줄 필수).

### (참고) 페어 합의 사항 — 결정 영역에서 재확인 가능

다음은 페어에서 양쪽이 합의한 사항. 사용자가 뒤집고 싶으면 §5에 명시.

- **페어 1**: 한 영역 안에서 ShareButton은 **1개 위치**만 등장 (단일 페이지 내 중복 0). 옵션 C·D는 영역 간 위치 차이일 뿐 영역 내부는 1개. designer N1 ARIA 정합성·인지 부하 회복.
- **페어 1**: 공유 메커니즘은 변경 없음 — `navigator.share` 우선 + 클립보드 fallback. 본 라운드는 **노출 위치**만 결정.
- **페어 1**: 채택안과 무관하게 ShareButton 시각 토큰(아이콘·radius·hover)은 5-pastel role 정합 유지 — 묶음 H lavender/40 정합 (현재 [share/ShareButton.tsx](../../../src/components/share/ShareButton.tsx) 검증 1회 spec.md 단계에서).

## 5. 결정

**페이즈 4 휴먼 게이트 결정 (운영자 입력, 2026-05-10)**:

- **항목 J-1 (ShareButton 위치 통일 정책)**: **옵션 C — (다) 우상단+중앙하단 유지 + `share_click.position` 파라미터 신설**. marketer §2.2·§5.4 측정 후 결정 우선. articles는 우상단+중앙하단 둘 다 유지(현행), checklist·timeline은 우상단 단독 유지(현행). 4주 데이터 수집 후 영역×위치별 도달률 차이 5%p 이상이면 그 영역만 다운스코프(별도 라운드). 단일 페이지 내 ShareButton 등장 = articles 2개·checklist 1개·timeline 1개. designer N1 ARIA 정합 위반(articles 중복)은 4주 measurement window 한정.
- **항목 J-2 (`share_click.position` 파라미터)**: **옵션 B — 추가**. enum = `top_right` | `bottom_center`. ShareButton 모든 호출부에 position prop 의무. 발사 정책: ShareButton 클릭 시 1회 발사(현행 유지) + position 파라미터 동봉. PII 0(designer N3 + marketer §3.1 정합). phase-4.5.md §1.5 GA4 카탈로그 + ga4.md `share_click` 정의 갱신 의무.

**페어 합의 사항 (사용자 뒤집기 없음, 그대로 채택)**:

- 페어 1: 한 영역 안에서 ShareButton은 1개 위치만 등장 — articles는 옵션 C 한정 예외(우상단+중앙하단 둘 다, 측정 가설 검증 목적). checklist·timeline은 영역 내 1개 유지.
- 페어 1: 공유 메커니즘 변경 없음 — `navigator.share` 우선 + 클립보드 fallback.
- 페어 1: ShareButton 시각 토큰(아이콘·radius·hover)은 5-pastel role 정합 유지 — design.md에서 묶음 H lavender/40 정합 1회 검증.

## 6. 우선순위 영향

- phase-4.5.md §2.10 묶음 J 결정·실행 unblock. §2.9 Cross-10 해소.
- 옵션 C·D 채택 시 phase-4.5.md §1.5 GA4 카탈로그 갱신 — `share_click.position` enum 신설.
- 옵션 B·D 채택 시 design.md에서 영역별 "끝" 슬롯 정의 필요(checklist `allDone` 위치, timeline 페이지 최하단 위치). 영역별 ShareButton 호출부 수정 범위:
  - [ChecklistPage.tsx:257-265](../../../src/components/checklist/ChecklistPage.tsx#L257-L265)
  - [TimelineContainer.tsx:218-226](../../../src/components/timeline/TimelineContainer.tsx#L218-L226)
  - [ArticleDetail.tsx:70-78](../../../src/components/articles/ArticleDetail.tsx#L70-L78), [:102-111](../../../src/components/articles/ArticleDetail.tsx#L102-L111)
- 묶음 K(삭제 패턴 — sonner toast.action 도입)와 독립. 같은 라운드에서 상호 영향 없음.
