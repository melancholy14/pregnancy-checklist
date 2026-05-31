# design-bundle-o-external-link 기획서 (간단판)

> 작성일: 2026-05-10  size: S
> 출처: [docs/plan/phase-4.5.md §2.10 묶음 O](../../plan/phase-4.5.md), §2.8.5 B-5, [docs/design/persona.md §6 (2026-05-03)](../../design/persona.md) 외부 링크 보안 메모
> 라운드: [design-bundle-cleanup-round (phase-4.5 §2.10)](../../plan/phase-4.5.md)

## 0. 사전 확정 결정 (사용자 입력, 2026-05-10)

- **페어 리뷰**: 디자이너 단독 + 개발자 보조. 결정 0건 cleanup.
- **본 묶음 = BabyfairCard 외부 링크 표준 정렬**. 사이트 다른 외부 링크는 이미 `<a target="_blank" rel="noopener noreferrer">` 패턴(VideoCard·ChannelCard·VideoCardCompact·contact·privacy)이라 본 라운드 잔여 1곳.
- **확장 검토**: 외부 링크 grep 결과 BabyfairCard 외에 모두 표준 정렬됨 — 사이트 전반의 추가 정렬 X.
- **AlertDialog confirm 패턴 보존**: 사용자 페이지 이탈 직전 확인 다이얼로그는 의도된 UX. anchor로 단순 치환 X — confirm 후 anchor 클릭 패턴.

## 1. 사용자 시나리오

베이비페어 카드를 탭하면 confirm 다이얼로그가 떠 사용자가 "이동"을 누를 때 외부 사이트로 새 탭이 열린다. 현재 구현은 `window.open(url, "_blank")` + `newWindow.opener = null;` 패턴인데, 안전성은 동등하지만 [docs/design/persona.md §6 (2026-05-03)](../../design/persona.md)이 지적한 대로 "`<a target="_blank" rel="noopener noreferrer">`가 더 표준적이고 의미적"이다. 사이트의 다른 외부 링크 6개 위치(VideoCard·ChannelCard·VideoCardCompact·contact·privacy 다수)는 이미 anchor + rel 패턴이라 BabyfairCard만 표준에서 벗어난 상태.

본 묶음은 BabyfairCard의 confirm 다이얼로그 안 "이동" 버튼을 anchor 패턴으로 정렬한다. confirm UX·시각·GA 이벤트는 그대로. 사용자 관점 변화 0(보안 정책만 표준화).

## 2. 기능 요구사항

### must

#### 2.1 BabyfairCard `handleConfirm` → anchor 패턴

[BabyfairCard.tsx:72-83](../../../src/components/babyfair/BabyfairCard.tsx#L72-L83), [BabyfairCard.tsx:208-213](../../../src/components/babyfair/BabyfairCard.tsx#L208-L213).

| 영역 | 현재 | → 변경 |
|---|---|---|
| 외부 이동 메커니즘 | `window.open(url, "_blank")` + `newWindow.opener = null;` | `<AlertDialogAction asChild>` 안에 `<a href={url} target="_blank" rel="noopener noreferrer">` |
| GA `outbound_click` 발사 시점 | `handleConfirm` 함수 안 (window.open 호출 직전) | anchor의 `onClick` 핸들러 (anchor 기본 navigation 전) |
| 팝업 차단 fallback toast | `if (newWindow) { ... } else { toast(...) }` | anchor 클릭 → 브라우저가 직접 새 탭 처리. 팝업 차단은 브라우저 UX로 위임 (별도 toast 제거 또는 보존 결정) |
| `setOpen(false)` 다이얼로그 닫기 | `handleConfirm` 마지막 줄 | anchor `onClick` 핸들러 안 (또는 AlertDialog의 `onSelect` prop) |

권장 구현 (단일 패턴):

```tsx
<AlertDialogAction asChild>
  <a
    href={event.official_url}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => {
      sendGAEvent("outbound_click", { url: event.official_url, event_name: event.name });
      setOpen(false);
    }}
    className="rounded-xl text-sm bg-accent-purple hover:bg-accent-purple/90 text-white inline-flex items-center justify-center px-4 py-2 transition-colors"
  >
    이동
  </a>
</AlertDialogAction>
```

- `<AlertDialogAction asChild>`로 shadcn primitive를 anchor로 polymorphic하게 렌더(Radix 권장 패턴).
- `target="_blank"` + `rel="noopener noreferrer"` — 이 둘이 표준 보안 조합. `noreferrer`는 자동으로 `noopener` 의미 포함하지만 명시적으로 둘 다 두는 것이 IE/구형 브라우저 호환.
- `handleConfirm` 함수와 unused `useState` 외부 의존성(toast import)이 제거 가능하면 정리.

#### 2.2 팝업 차단 fallback toast 처리

| 옵션 | 결정 |
|---|---|
| (a) toast 제거 (anchor는 브라우저 navigation 자체이므로 팝업 차단 거의 발생 X) | **권장**. 단순화. |
| (b) toast 보존 (사용자 클릭 트래킹용으로 fallback 유지) | 비권장. anchor `target="_blank"`는 브라우저가 직접 처리. 차단 시 브라우저 자체 UX. |

**must 결정**: (a) 권장. `toast`·`sonner` import가 BabyfairCard 안 다른 곳에서 안 쓰이면 제거. 다른 곳에서 쓰이면 import만 보존.

### should

- 변경 후 [/baby-fair](../../../src/app/baby-fair) 페이지에서:
  - 카드 탭 → confirm 다이얼로그 정상 등장 (변화 없음).
  - "이동" 클릭 → 새 탭 열림 + GA `outbound_click` 발사 + 다이얼로그 닫힘.
  - 키보드 navigation(Enter·Space)로 "이동" 버튼 활성화 시 동일 흐름.
  - 모바일 Safari에서 새 탭 열림 정상 동작 (anchor `target="_blank"`는 popup blocker 대상 외).
- 페르소나 §3 N2(인터랙티브 의미의 정직성) 정합 회복: anchor가 anchor로 보이고 anchor로 동작 — `window.open` JS 우회 제거.
- E2E 회귀 0: outbound_click 이벤트 트래킹 + 다이얼로그 confirm/cancel 흐름 보존.

### won't

- **사이트의 다른 외부 링크 audit X** — VideoCard·ChannelCard·VideoCardCompact·contact·privacy 6개 위치 이미 표준 패턴. grep으로 확인됨.
- **`role="button"` Card wrapper 마크업 변경 X** ([BabyfairCard.tsx:90-100](../../../src/components/babyfair/BabyfairCard.tsx#L90-L100)) — 페르소나 §3 N2 위반 후보(Card에 role="button" + 내부 inner button)이지만 본 라운드 SoT(외부 링크 보안만)에 포함 X. 별도 라운드(Cross-5와 같은 결).
- **CITY_COLORS / SCALE_CONFIG 인라인 hex X** — Cross-4 묶음 I.
- **AlertDialog 패턴 자체 변경 X** — confirm UX는 의도된 안전장치(외부 사이트 이탈 직전 확인). 보존.
- **GA 이벤트 이름·파라미터 변경 X** — `outbound_click`, `{url, event_name}` 그대로.

## 3. 성공 기준

- `grep -n "window.open" src/components/babyfair/BabyfairCard.tsx` 결과 0건.
- `grep -n "rel=\"noopener noreferrer\"" src/components/babyfair/BabyfairCard.tsx` 결과 1건 이상.
- 사이트 외부 링크 표준 정합: `grep -rEn "target=\"_blank\"" src/` 결과의 모든 위치에 `rel="noopener noreferrer"` 동행.
- E2E `babyfair confirm flow` 시나리오 회귀 0건.
- `npm run build` 통과.
