/**
 * GA4 커스텀 이벤트 전송 헬퍼
 * 환경변수 미설정 시 noop
 */
export function sendGAEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
    "event",
    eventName,
    params
  );
}
