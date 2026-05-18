# design-bundle-o-external-link — 디자인 변경표

> 작성일: 2026-05-10
> 시각 시안 없음. 마크업·핸들러 before→after만.
> spec: [./spec.md](./spec.md)

## 1. handleConfirm 함수 제거 + anchor 패턴

[BabyfairCard.tsx:72-83](../../../src/components/babyfair/BabyfairCard.tsx#L72-L83), [BabyfairCard.tsx:208-213](../../../src/components/babyfair/BabyfairCard.tsx#L208-L213).

### before

```tsx
// line 72-83
const handleConfirm = () => {
  sendGAEvent("outbound_click", { url: event.official_url, event_name: event.name });
  const newWindow = window.open(event.official_url, "_blank");
  if (newWindow) {
    newWindow.opener = null;
  } else {
    toast("팝업이 차단되었습니다", {
      description: "브라우저 설정에서 팝업을 허용해주세요",
    });
  }
  setOpen(false);
};

// line 208-213
<AlertDialogAction
  onClick={handleConfirm}
  className="rounded-xl text-sm bg-accent-purple hover:bg-accent-purple/90 text-white"
>
  이동
</AlertDialogAction>
```

### after

```tsx
// handleConfirm 함수 제거. (sendGAEvent / setOpen은 anchor onClick으로 인라인)

// line 208-213 (변경)
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

### import 정리

[BabyfairCard.tsx:1-21](../../../src/components/babyfair/BabyfairCard.tsx#L1-L21) 상단:

before
```tsx
import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
```

after (toast 다른 곳 사용 X 가정)
```tsx
import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
```

`toast` import는 [BabyfairCard.tsx](../../../src/components/babyfair/BabyfairCard.tsx) 안 다른 곳에서 사용되지 않음을 grep으로 확인 후 제거. (사용처 검색 후 결정.)

---

## 2. 사이트 다른 외부 링크 (참조 — 이미 표준)

본 라운드 변경 X. 표준 패턴 정합 확인용.

| 파일·라인 | 패턴 |
|---|---|
| [VideoCard.tsx:18-19](../../../src/components/videos/VideoCard.tsx#L18-L19) | `target="_blank" rel="noopener noreferrer"` |
| [ChannelCard.tsx:23-24](../../../src/components/videos/ChannelCard.tsx#L23-L24) | 동일 |
| [VideoCardCompact.tsx:18-19](../../../src/components/videos/VideoCardCompact.tsx#L18-L19) | 동일 |
| [contact/page.tsx:37-38](../../../src/app/contact/page.tsx#L37-L38) | 동일 |
| [privacy/page.tsx](../../../src/app/privacy/page.tsx) (다수) | 동일 |

본 라운드 변경 후 BabyfairCard도 동일 패턴으로 합류 — 사이트 전 외부 링크 1개 표준.

---

## 3. 보안 동등성 (현재 ↔ 변경 후)

| 항목 | 현재 (`window.open` + `opener=null`) | 변경 후 (`anchor + rel="noopener noreferrer"`) |
|---|---|---|
| reverse tabnabbing 차단 | ✅ (opener null) | ✅ (rel="noopener") |
| referer 노출 차단 | ❌ | ✅ (rel="noreferrer") |
| 팝업 차단 영향 | popup blocker 대상 가능 | anchor navigation, popup blocker 대상 외 |
| 시맨틱 정합 | JS open (anchor 외관 시뮬레이션) | 진짜 anchor (페르소나 N2 인터랙티브 의미의 정직성 정합) |
| 표준 정렬 | site 6곳 중 1곳 비표준 | site 7곳 모두 표준 |

`rel="noreferrer"` 추가는 보안 강화 + 표준 정렬의 부가 효과.

---

## 4. 토큰 매핑 요약

본 묶음은 토큰 변경 없음. 마크업·핸들러 정렬만.

| 영역 | 변경 |
|---|---|
| 외부 이동 메커니즘 | JS `window.open` → 진짜 anchor |
| 보안 옵션 | `opener=null` (런타임) → `rel="noopener noreferrer"` (속성) |
| 시맨틱 | `<button>` (Action) | `<a>` (Action via asChild) |
| 클래스(시각) | `bg-accent-purple ...` 그대로 (anchor에서도 동일) |

새로 도입되는 토큰 0개.
