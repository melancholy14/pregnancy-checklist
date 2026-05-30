# design-bundle-f-hub-icon 기획서 (간단판)

> 작성일: 2026-05-10  size: S
> 출처: [docs/plan/phase-4.5.md §2.10 묶음 F](../../plan/phase-4.5.md), §2.4 M5
> 라운드: [design-bundle-cleanup-round (phase-4.5 §2.10)](../../plan/phase-4.5.md)

## 0. 사전 확정 결정 (사용자 입력, 2026-05-10)

- **페어 리뷰**: 디자이너 단독 + 개발자 보조. 결정 0건 cleanup.
- **본 묶음 = M5만** — M6("37주차" 핀)는 P3 산출(예정일 onboarding)에서 store 값 치환으로 이미 완료. §2.10 SoT의 "M5만" 명시 그대로.
- **방향 = 타임라인 카드를 다른 3장과 같은 큰 이모지 단독 패턴으로 정렬** (다른 3장을 컨테이너+lucide로 통일하는 역방향 옵션은 변경 면적 크고 컨테이너 색 5-pastel 분배가 추가 결정 발생 — 변경 면적 최소 원칙으로 다른 3장 패턴에 맞춤).

## 1. 사용자 시나리오

체크리스트 허브에 4장의 카드(타임라인·출산가방·남편준비·임신준비)가 나란히 떠 있는데, **4장 중 3장은 큰 이모지 단독**(`text-3xl`)이고 **타임라인 카드 1장만 컨테이너+lucide 아이콘**(`w-12 h-12 rounded-2xl bg-pastel-pink/40` + `<Calendar size={24}>`)을 쓴다. 시각 패턴이 깨져 타임라인 카드가 화면에서 가장 강하게 튀고, 컨테이너 배경이 `bg-pastel-pink/40`이라 페르소나 §5 AP1("pink는 CTA 전용. 데이터 라벨에 사용 X")까지 함께 위반한다.

본 묶음은 **타임라인 카드 1장**의 마크업을 다른 3장과 같은 큰 이모지 단독 패턴으로 정렬한다. 사용자 관점에서는 타임라인 카드 좌측의 핑크 사각 컨테이너가 사라지고 다른 3장과 동일한 톤의 이모지(예: 🗓️)로 대체된다. 카드 4장의 시각 리듬이 한 줄로 정돈된다.

## 2. 기능 요구사항

### must

#### 2.1 타임라인 카드 아이콘 마크업 정렬

| 위치 | 파일 | 현재 | → 변경 |
|---|---|---|---|
| 타임라인 카드 아이콘 슬롯 | [ChecklistHub.tsx:126-128](../../../src/components/checklist/ChecklistHub.tsx#L126-L128) | `<span className="w-12 h-12 rounded-2xl bg-pastel-pink/40 flex items-center justify-center shrink-0">`<br/>`  <Calendar size={24} className="text-foreground" />`<br/>`</span>` | `<span className="text-3xl shrink-0" aria-hidden>🗓️</span>` |

- 다른 3장(`ChecklistCard` 함수, [ChecklistHub.tsx:65-67](../../../src/components/checklist/ChecklistHub.tsx#L65-L67))과 정확히 동일한 패턴: `<span className="text-3xl shrink-0" aria-hidden>{icon}</span>`.
- 사용 이모지는 `🗓️` 권장 (lucide `Calendar` 메타포의 자연스러운 이모지 대응). 이미 [ChecklistHub.tsx:177](../../../src/components/checklist/ChecklistHub.tsx#L177)의 페이지 h1이 "✅ 체크리스트"라 이모지와 캘린더 이모지가 한 페이지에 자연스럽게 공존.
- 변경 후 `<Calendar>` import가 다른 곳에서 사용되지 않으면 [ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx) 파일의 lucide import에서 제거 (트리쉐이킹 정합).

### should

- 변경 후 [/checklist](../../../src/app/checklist) 허브에서 4장 카드가 **시각 리듬 일치**:
  - 좌측 아이콘 슬롯 = 큰 이모지 단독, 사이즈 동일(text-3xl).
  - 카드 본문(타이틀·설명·태그·진행률) 동일 구조.
  - 모바일 320px 폭에서 카드 내부 줄바꿈·들여쓰기 변화 없음 검증.
- 페르소나 §3 N2(인터랙티브 의미의 정직성)와 무관 — 본 변경은 시각 슬롯 단순화이고 인터랙티브 시맨틱은 그대로 `<Link>`.
- pink 토큰(CTA) 침범 해소 — `bg-pastel-pink/40` 사용처가 ChecklistHub에서 1곳 줄어든다.

### won't

- **다른 3장(ChecklistCard)을 컨테이너+lucide 패턴으로 정렬 X** — 변경 면적 크고, 4장 컨테이너 색을 5-pastel role(lavender·peach·yellow·mint 등)에 맞게 분배하는 추가 결정이 발생. 변경 면적 최소 원칙으로 거꾸로 갔다.
- **M6("37주차" 핀) 처리 X** — P3 산출(`pregnancy-week-onboarding`) 라운드에서 store 값 치환 완료. [ChecklistHub.tsx:138-140](../../../src/components/checklist/ChecklistHub.tsx#L138-L140) 현재 코드에서 `weekLabel`이 `currentPregnancyWeek`에 의존하는 store 값.
- **다른 카드 컨테이너의 `bg-pastel-pink/40` 사용처 검색 X** — 본 라운드는 ChecklistHub의 타임라인 카드 한 곳만. 페이지 전반의 pink 사용처 audit는 별도 라운드.
- **이모지 대신 다른 lucide 아이콘으로 변경 X** — 다른 3장이 이모지라 이모지 통일이 정합.
- **GA4 이벤트 변경 없음.**

## 3. 성공 기준

- [ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx)에서 `<Calendar` import / 사용 0건 (다른 곳에서 안 쓰면 import 제거).
- [ChecklistHub.tsx](../../../src/components/checklist/ChecklistHub.tsx)에서 `bg-pastel-pink/40` 컨테이너 사용처 0건. (배지 사용처는 별도 — F 영향 외.)
- 4장 카드 시각 리듬 수동 확인 OK + 기존 E2E 통과(회귀 0건).
- `npm run build` 통과.
