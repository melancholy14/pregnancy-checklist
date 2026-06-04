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

/** 헤드 인라인 부트스트랩이 호출하는 gtag('consent','default',...) 를 캡처하기 위해
 *  dataLayer.push 를 미리 가로채는 spy. layout.tsx 의 `window.dataLayer = window.dataLayer || []`
 *  은 우리 배열을 그대로 사용하므로 push override 가 유지된다.
 */
async function installDataLayerSpy(context: BrowserContext) {
  await context.addInitScript(() => {
    type Win = Record<string, unknown>;
    const calls: unknown[][] = [];
    (window as unknown as Win).__dataLayerCalls = calls;

    const dl: unknown[] = [];
    const origPush = Array.prototype.push;
    Object.defineProperty(dl, "push", {
      value(this: unknown[], ...args: unknown[]) {
        for (const a of args) {
          if (a && typeof a === "object" && "length" in (a as Record<string, unknown>)) {
            calls.push(Array.from(a as ArrayLike<unknown>));
          }
        }
        return origPush.apply(this, args);
      },
      configurable: true,
      writable: true,
    });
    (window as unknown as Win).dataLayer = dl;
  });
}

async function getConsentCall(
  page: import("@playwright/test").Page,
  command: "default" | "update",
) {
  return page.evaluate((cmd) => {
    const calls = (window as unknown as { __dataLayerCalls?: unknown[][] })
      .__dataLayerCalls;
    if (!Array.isArray(calls)) return undefined;
    const hit = calls.find((c) => c[0] === "consent" && c[1] === cmd);
    return hit ? (hit[2] as Record<string, string>) : undefined;
  }, command);
}

test.describe("쿠키 동의 정책 회귀 — Consent Mode v2 (D-M3)", () => {
  test.describe("Happy Path — 동의 거부", () => {
    test("거부 상태로 진입하면 AdSense 미주입 + GA consent default=denied 가 dataLayer에 기록된다", async ({
      page,
      context,
    }) => {
      // 무엇을: cookie-consent=rejected 일 때
      //   1) AdSense (pagead2.googlesyndication.com/.../adsbygoogle.js) 스크립트·전역·네트워크 0건
      //   2) GA gtag.js 는 로드되되, 헤드 인라인 부트스트랩이 gtag('consent','default',{...:'denied'}) 를 발사
      // 왜: D-M3 회귀 안전망 — Consent Mode v2 도입 이후 GA 는 cookieless ping 을 위해 default 로드되지만
      //   동의 거부 시 ad/analytics storage 가 'denied' 로 유지되어야 컴플라이언스 정합.
      await installDataLayerSpy(context);
      await setConsent(context, "rejected");

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // AdSense: 스크립트·전역·DOM 0건
      await expect(page.locator(ADSENSE_SCRIPT_SELECTOR)).toHaveCount(0);
      await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
      const adsbygoogleDefined = await page.evaluate(() =>
        Array.isArray((window as unknown as { adsbygoogle?: unknown }).adsbygoogle),
      );
      expect(adsbygoogleDefined).toBe(false);

      // GA: gtag.js 는 default 로드 (Consent Mode v2)
      await expect(page.locator(GA_SCRIPT_SELECTOR)).toHaveCount(1);

      // consent default = denied 가 dataLayer 에 기록되었는지
      const defaultParams = await getConsentCall(page, "default");
      expect(defaultParams).toBeTruthy();
      expect(defaultParams!.ad_storage).toBe("denied");
      expect(defaultParams!.ad_user_data).toBe("denied");
      expect(defaultParams!.ad_personalization).toBe("denied");
      expect(defaultParams!.analytics_storage).toBe("denied");

      // 거부 상태에서는 consent update 가 발사되지 않음
      const updateParams = await getConsentCall(page, "update");
      expect(updateParams).toBeUndefined();
    });

    test("거부 상태에서 AdSense 외부 네트워크 요청이 발생하지 않는다", async ({
      page,
      context,
    }) => {
      // 무엇을: 거부 상태에서 pagead2.googlesyndication.com/.../adsbygoogle.js URL 로 outbound 0건
      // 왜: AdSense 동의 정책 — 거부 시 광고 SDK 자체가 로드되면 안 됨.
      //   GA gtag.js 는 Consent Mode v2 표준상 default 로드되어 cookieless ping 을 보내므로 별도 검증.
      await setConsent(context, "rejected");

      const observedAdsense: string[] = [];
      page.on("request", (req: Request) => {
        const url = req.url();
        if (ADSENSE_SCRIPT_RE.test(url)) {
          observedAdsense.push(url);
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      expect(observedAdsense).toEqual([]);
    });
  });

  test.describe("Happy Path — 동의 수락", () => {
    test("동의 수락 상태로 진입하면 GA·AdSense 스크립트가 DOM에 주입되고 consent update=granted 가 발사된다", async ({
      page,
      context,
    }) => {
      // 무엇을: cookie-consent=accepted + NEXT_PUBLIC_* env 가 baked-in 된 빌드일 때,
      //   1) GA·AdSense 스크립트 태그 1건씩 + 외부 요청 1건씩
      //   2) 헤드 인라인 부트스트랩이 gtag('consent','update',{...:'granted'}) 를 발사
      // 왜: D-M3 양분기 검증 — 거부 분기만 검증하면 항상 통과하는 trivial 테스트로 퇴화.
      // 전제: 빌드 시점에 NEXT_PUBLIC_ADSENSE_CLIENT_ID 와 NEXT_PUBLIC_GA_MEASUREMENT_ID 가 주입되어야 함. 미설정 시 skip.
      test.skip(
        !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
          !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        "NEXT_PUBLIC_ADSENSE_CLIENT_ID 또는 NEXT_PUBLIC_GA_MEASUREMENT_ID 미설정 — CI 는 GitHub Secrets, 로컬은 .env.local 필요.",
      );

      await installDataLayerSpy(context);
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

      // consent update = granted
      const updateParams = await getConsentCall(page, "update");
      expect(updateParams).toBeTruthy();
      expect(updateParams!.ad_storage).toBe("granted");
      expect(updateParams!.ad_user_data).toBe("granted");
      expect(updateParams!.ad_personalization).toBe("granted");
      expect(updateParams!.analytics_storage).toBe("granted");
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 거부 상태에서 AdSense 미주입 + consent default=denied 가 유지된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 모바일 뷰포트에서도 거부 분기가 동일하게 동작.
      // 왜: 주 트래픽이 모바일이므로 회귀 방지.
      await installDataLayerSpy(context);
      await setConsent(context, "rejected");
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await expect(page.locator(ADSENSE_SCRIPT_SELECTOR)).toHaveCount(0);

      const defaultParams = await getConsentCall(page, "default");
      expect(defaultParams).toBeTruthy();
      expect(defaultParams!.analytics_storage).toBe("denied");
      expect(defaultParams!.ad_storage).toBe("denied");
    });
  });
});
