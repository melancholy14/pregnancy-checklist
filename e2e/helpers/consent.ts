import type { BrowserContext } from "@playwright/test";

// top frame 가드: addInitScript 는 child frame 부착 시마다 재실행된다 (AdSense about:blank iframe 등).
// 시드는 최초 문서에만 필요하므로 top frame 으로 제한한다. seedStorage.ts 동일 사유.
export async function acceptCookieConsent(context: BrowserContext) {
  await context.addInitScript(() => {
    if (window.top !== window.self) return;
    try {
      window.localStorage.setItem("cookie-consent", "accepted");
    } catch {
      /* ignore */
    }
  });
}
