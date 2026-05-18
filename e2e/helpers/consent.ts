import type { BrowserContext } from "@playwright/test";

export async function acceptCookieConsent(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "accepted");
    } catch {
      /* ignore */
    }
  });
}
