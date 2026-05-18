import { toast } from "sonner";
import { sendGAEvent } from "@/lib/analytics";

export type ShareContentType = "article" | "checklist" | "timeline";
export type ShareLocation = "header" | "article-bottom";
export type SharePosition = "top_right" | "bottom_center";

export interface ShareContext {
  contentType: ShareContentType;
  itemId: string;
  position: SharePosition;
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

function locationFromPosition(position: SharePosition): ShareLocation {
  return position === "top_right" ? "header" : "article-bottom";
}

export async function triggerShare({
  data,
  contentType,
  itemId,
  position,
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
      // legacy keep (4주 grace) — cleanup 라운드에서 제거.
      sendGAEvent("share", {
        method: "web_share_api",
        content_type: contentType,
        item_id: itemId,
        position,
      });
      sendGAEvent("share_click", {
        slug: itemId,
        method: "web-share",
        location: locationFromPosition(position),
        content_type: contentType,
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
    // legacy keep (4주 grace) — cleanup 라운드에서 제거.
    sendGAEvent("share", {
      method: "clipboard",
      content_type: ctx.contentType,
      item_id: ctx.itemId,
      position: ctx.position,
    });
    sendGAEvent("share_click", {
      slug: ctx.itemId,
      method: "copy-link",
      location: locationFromPosition(ctx.position),
      content_type: ctx.contentType,
    });
  } catch {
    toast.error("링크 복사에 실패했어요. 직접 선택해 복사해 주세요.");
  }
}
