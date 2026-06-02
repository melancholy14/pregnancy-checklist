/**
 * GA4 커스텀 이벤트 전송 헬퍼
 * 환경변수 미설정 시 noop
 */
export function sendGAEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | null>
) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
    "event",
    eventName,
    params
  );
}

export function setUserProperties(
  properties: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
    "set",
    "user_properties",
    properties
  );
}

export type TabId = "home" | "checklist" | "weight" | "baby-fair" | "info";

// pathname → BottomNav 5탭 매핑 (phase-4.6 §5 axis_enter 발화용).
// /articles 와 /info 는 둘 다 "정보" 탭 — alsoMatchPrefixes 정합.
// 매핑 외 경로(/timeline, /articles/[slug] 등)는 null = axis_enter 발화 안 함.
export function pathToTab(pathname: string): TabId | null {
  if (pathname === "/") return "home";
  if (pathname === "/checklist" || pathname.startsWith("/checklist/")) {
    return "checklist";
  }
  if (pathname === "/weight" || pathname.startsWith("/weight/")) {
    return "weight";
  }
  if (pathname === "/baby-fair") return "baby-fair";
  if (pathname === "/articles" || pathname.startsWith("/articles/")) {
    return "info";
  }
  if (pathname === "/info" || pathname.startsWith("/info/")) {
    return "info";
  }
  return null;
}
