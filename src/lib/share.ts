import { toast } from "sonner";
import { sendGAEvent } from "@/lib/analytics";

export type ShareContentType = "article" | "checklist" | "timeline";

export interface ShareContext {
  contentType: ShareContentType;
  itemId: string;
}

interface TriggerShareOptions extends ShareContext {
  data: ShareData;
  onFallback: () => void;
}

function isMobileTouchEnvironment(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse) and (hover: none)").matches;
}

export async function triggerShare({
  data,
  contentType,
  itemId,
  onFallback,
}: TriggerShareOptions): Promise<void> {
  // 모바일/터치 환경에서만 Web Share API 사용. 데스크톱(마우스+호버)은 일관된 모달 fallback을 보여준다.
  if (
    isMobileTouchEnvironment() &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(data);
      sendGAEvent("share", {
        method: "web_share_api",
        content_type: contentType,
        item_id: itemId,
      });
    } catch {
      // AbortError(사용자가 시트 닫음)·일시 오류는 무시. 자동 모달 노출은 사용자 의도와 어긋날 수 있음.
    }
    return;
  }
  onFallback();
}

export async function copyShareLink(
  url: string,
  ctx: ShareContext,
): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("clipboard not supported");
    }
    await navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다");
    sendGAEvent("share", {
      method: "clipboard",
      content_type: ctx.contentType,
      item_id: ctx.itemId,
    });
  } catch {
    toast.error("링크 복사에 실패했어요. 직접 선택해 복사해 주세요.");
  }
}
