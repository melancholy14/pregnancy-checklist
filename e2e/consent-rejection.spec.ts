import { test, expect, type BrowserContext, type Request } from "@playwright/test";

const GA_SCRIPT_RE = /googletagmanager\.com\/gtag\/js/;
const ADSENSE_SCRIPT_RE = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/;

const GA_SCRIPT_SELECTOR = 'script[src*="googletagmanager.com/gtag/js"]';
const ADSENSE_SCRIPT_SELECTOR =
  'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';

async function setConsent(
  context: BrowserContext,
  value: "accepted" | "rejected",
) {
  await context.addInitScript((v) => {
    try {
      window.localStorage.setItem("cookie-consent", v);
    } catch {
      /* SSR / restricted storage — best-effort */
    }
  }, value);
}

test.describe("쿠키 동의 거부 시 GA4·AdSense 비활성화 회귀 (D-M3)", () => {
  test.describe("Happy Path — 동의 거부", () => {
    test("거부 상태로 진입하면 GA·AdSense 스크립트 태그가 DOM에 없고 window 전역도 미정의된다", async ({
      page,
      context,
    }) => {
      // 무엇을: cookie-consent=rejected 일 때 ConsentGatedScripts.tsx 가 null 을 반환해
      //   googletagmanager.com/gtag/js, pagead2.googlesyndication.com/pagead/js/adsbygoogle.js 스크립트가 DOM에 0건이고
      //   window.gtag / window.adsbygoogle 전역도 정의되지 않음을 검증.
      // 왜: D-M3 회귀 안전망 — useConsentAccepted() === false 분기가 깨지면 거부 사용자에게도 추적·광고 스크립트가 흘러감 (개인정보보호법 / AdSense 동의 정책 위반).
      await setConsent(context, "rejected");
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await expect(page.locator(GA_SCRIPT_SELECTOR)).toHaveCount(0);
      await expect(page.locator(ADSENSE_SCRIPT_SELECTOR)).toHaveCount(0);
      await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);

      const gtagDefined = await page.evaluate(
        () => typeof (window as unknown as { gtag?: unknown }).gtag === "function",
      );
      expect(gtagDefined).toBe(false);

      const adsbygoogleDefined = await page.evaluate(() =>
        Array.isArray((window as unknown as { adsbygoogle?: unknown }).adsbygoogle),
      );
      expect(adsbygoogleDefined).toBe(false);
    });

    test("거부 상태에서 GA·AdSense 외부 네트워크 요청이 발생하지 않는다", async ({
      page,
      context,
    }) => {
      // 무엇을: 거부 상태에서 googletagmanager.com / adsbygoogle.js URL 로 outbound request 가 0건임을 검증.
      // 왜: D-C1 검증 잔여 항목 "거부 시 미주입" 을 자동화로 흡수. 컴플라이언스는 "스크립트 태그 부재" 만으로 부족하고,
      //   네트워크 요청이 실제 차단되는지가 본질.
      await setConsent(context, "rejected");

      const observed: string[] = [];
      page.on("request", (req: Request) => {
        const url = req.url();
        if (GA_SCRIPT_RE.test(url) || ADSENSE_SCRIPT_RE.test(url)) {
          observed.push(url);
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      expect(observed).toEqual([]);
    });
  });

  test.describe("Happy Path — 동의 수락", () => {
    test("동의 수락 상태로 진입하면 GA·AdSense 스크립트가 DOM에 주입되고 외부 요청이 발생한다", async ({
      page,
      context,
    }) => {
      // 무엇을: cookie-consent=accepted + NEXT_PUBLIC_* env 가 baked-in 된 빌드일 때, 두 스크립트 태그가 1건씩 주입되고
      //   외부 네트워크로 요청이 한 번 발생함을 검증. response status 는 미assert (외부 의존 flake 회피).
      // 왜: D-M3 양분기 검증 — 거부 분기만 검증하면 항상 통과하는 trivial 테스트로 퇴화. 수락 분기가 깨지면 추적·광고 자체가 작동하지 않음.
      // 전제: 빌드 시점에 NEXT_PUBLIC_ADSENSE_CLIENT_ID 와 NEXT_PUBLIC_GA_MEASUREMENT_ID 가 주입되어야 함. 미설정 시 skip.
      test.skip(
        !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
          !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        "NEXT_PUBLIC_ADSENSE_CLIENT_ID 또는 NEXT_PUBLIC_GA_MEASUREMENT_ID 미설정 — CI 는 GitHub Secrets, 로컬은 .env.local 필요.",
      );

      await setConsent(context, "accepted");

      const adsenseRequestPromise = page.waitForRequest(
        (req) => ADSENSE_SCRIPT_RE.test(req.url()),
        { timeout: 10_000 },
      );
      const gaRequestPromise = page.waitForRequest(
        (req) => GA_SCRIPT_RE.test(req.url()),
        { timeout: 10_000 },
      );

      await page.goto("/");

      const adsenseRequest = await adsenseRequestPromise;
      const gaRequest = await gaRequestPromise;
      expect(adsenseRequest.url()).toMatch(ADSENSE_SCRIPT_RE);
      expect(gaRequest.url()).toMatch(GA_SCRIPT_RE);

      // DOM 에도 스크립트 태그가 1건씩 존재
      await expect(page.locator(GA_SCRIPT_SELECTOR)).toHaveCount(1);
      await expect(page.locator(ADSENSE_SCRIPT_SELECTOR)).toHaveCount(1);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 거부 상태에서 스크립트 미주입이 유지된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 모바일 뷰포트에서도 거부 분기가 동일하게 동작.
      // 왜: 주 트래픽이 모바일이므로 회귀 방지.
      await setConsent(context, "rejected");
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await expect(page.locator(GA_SCRIPT_SELECTOR)).toHaveCount(0);
      await expect(page.locator(ADSENSE_SCRIPT_SELECTOR)).toHaveCount(0);
    });
  });
});
