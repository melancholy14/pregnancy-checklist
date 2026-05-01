# info-tab-integration 리팩토링

> Phase 4 Step 2 — 정보 탭 통합 (블로그 + 영상)
> Review: [../review/info-tab-integration-review.md](../review/info-tab-integration-review.md)
> Date: 2026-05-01

---

## 리팩토링한 파일 목록

- `src/components/info/InfoContainer.tsx` — 2건 적용

---

## 작업별 내용

### 1. InfoContainer — hash-scroll useEffect 의존성 축소 + 처리 후 hash 제거

- **출처**: Warning #1
- **무엇을**:
  - useEffect 의존성을 `[activeTab, visibleItems]` → `[activeTab]`로 축소
  - 스크롤·하이라이트 적용 직후 `window.history.replaceState`로 hash를 제거
- **왜**: 통합 태그 칩을 적용/해제할 때마다 `visibleItems` 참조가 바뀌어 hash-scroll 효과가 반복 실행되고 ring 하이라이트가 깜빡일 수 있었음. 의존성을 `activeTab`만 두면 탭 전환 시 1회 실행되며, 처리 후 hash를 제거하면 같은 탭 안에서 필터링하더라도 재진입이 차단됨

### 2. InfoContainer — ARIA 탭 패턴 완성 (`aria-controls`/`tabpanel`/`aria-labelledby`)

- **출처**: Warning #2
- **무엇을**:
  - 각 탭 버튼에 `id={`info-tab-${tab}`}`, `aria-controls="info-panel"` 부여
  - 콘텐츠 영역(빈 상태/리스트 공통)을 새 wrapper `<div>`로 감싸 `id="info-panel"`, `role="tabpanel"`, `aria-labelledby={`info-tab-${activeTab}`}` 부여
- **왜**: 기존에는 `role="tab"`만 마크되어 스크린리더가 "이 탭이 어느 영역을 제어하는지" 알 수 없는 반쪽짜리 ARIA 패턴이었음. 패널이 활성 탭의 `id`를 참조하도록 연결해 SR 사용자도 콘텐츠 변경을 명확히 인지

---

## 보류한 Warning 항목

### Warning #3 — searchParams useEffect와 useState 초기화 중복

- **결정**: 보류 (제거하지 않음)
- **사유**: 표면상 마운트 시 `setActiveTab`이 한 번 더 호출되지만, React가 동일 값에 대해 재렌더를 bail-out하므로 실비용 0. 더 중요한 것은 이 useEffect가 **브라우저 뒤로가기/앞으로가기로 `?tab=` 쿼리가 변할 때 activeTab을 동기화**하는 역할을 함. 제거하면 URL과 UI 불일치(예: `/info?tab=videos`에서 뒤로가기로 `/info`에 도달했는데 영상 탭이 그대로 활성)라는 동작 회귀가 발생함. 따라서 코드 모양상의 "중복"보다 동작 보존 우선

### Warning #4 — JSON 임포트 `as VideoItem[]` 타입 단언

- **결정**: 보류 (범위 밖)
- **사유**: 진짜 해결책은 `src/types/video.ts`의 `VideoCategory` union을 실데이터 7종(`pregnancy_health`, `prenatal_checkup`, `nutrition`, `policy` 포함)에 맞춰 확장하거나 zod 런타임 검증을 도입하는 것. 둘 다 본 기능 범위(Phase 4 Step 2) 밖이며 프로젝트 전반의 타입 정합성 작업으로 별도 진행이 적절. Phase 5 이월 권장

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 15개 | 15개 (수정 1) |
| InfoContainer 줄 수 | 204줄 | 213줄 (panel wrapper + history.replaceState 추가) |
| hash-scroll 트리거 | 탭/필터 변경 시마다 | 탭 변경 시 1회 + hash 자동 제거 |
| ARIA 탭 패턴 완성도 | 절반 (role="tab" 만) | 완전 (controls·tabpanel·labelledby) |

---

## 빌드 결과

성공 (1회 시도)
