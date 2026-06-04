import { test, expect, type BrowserContext, type Page } from "@playwright/test";

/** cookie-consent=rejected + gtag spy 를 context.addInitScript 로 주입.
 *  layout.tsx 의 head 인라인 부트스트랩이 `function gtag(){dataLayer.push(arguments)}` 로
 *  window.gtag 를 덮어쓰므로, dataLayer.push 를 가로채는 방식으로 sendGAEvent → gtag → dataLayer
 *  파이프라인을 캡처한다. consent='default'/'update' 등 헤드 부트스트랩 호출도 같이 흘러오지만
 *  c[0]==='event' 필터로 분리된다. (ga4-events.spec.ts / marketing-events-wiring.spec.ts와 같은 패턴)
 */
async function setupGtagSpy(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "rejected");
    } catch {
      /* SSR safe */
    }
    type Win = Record<string, unknown>;
    const calls: unknown[][] = [];
    (window as unknown as Win).__gtagCalls = calls;

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

    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      calls.push(args);
    };
  });
}

async function getGtagCalls(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as Record<string, unknown[]>).__gtagCalls as unknown[][],
  );
}

function filterEvent(calls: unknown[][], eventName: string) {
  return calls.filter((c) => c[0] === "event" && c[1] === eventName);
}

test.describe("axis funnel — phase-4.6 §5 5탭 funnel", () => {
  test.beforeEach(async ({ context }) => {
    await setupGtagSpy(context);
  });

  test.describe("Happy Path", () => {
    test("5탭(홈/체크/체중/페어/정보) 진입 시 axis_enter 5종이 발사된다", async ({
      page,
    }) => {
      // 무엇을: BottomNav 5탭을 순회하며 각 탭에서 axis_enter 발사 확인
      // 왜: phase-4.6 §5.3 5탭 funnel 2단계(axis_enter) wiring 회귀 가드
      await page.goto("/");

      const tabsAfterHome: Array<{ label: string; urlMatch: RegExp }> = [
        { label: "체크리스트", urlMatch: /\/checklist\/?$/ },
        { label: "체중", urlMatch: /\/weight\/?$/ },
        { label: "베이비페어", urlMatch: /\/baby-fair\/?$/ },
        { label: "정보", urlMatch: /\/articles\/?$/ },
      ];

      for (const { label, urlMatch } of tabsAfterHome) {
        await page.locator("nav").getByText(label, { exact: true }).click();
        await expect(page).toHaveURL(urlMatch);
      }

      const calls = await getGtagCalls(page);
      const seenTabs = new Set(
        filterEvent(calls, "axis_enter").map(
          (c) => (c[2] as Record<string, string>).tab,
        ),
      );

      expect(seenTabs).toEqual(
        new Set(["home", "checklist", "weight", "baby-fair", "info"]),
      );
    });

    test("BottomNav 탭 클릭 시 axis_cross_link(from→to)가 발사된다", async ({
      page,
    }) => {
      // 무엇을: /checklist → "체중" 탭 클릭 → axis_cross_link from=checklist to=weight 발사
      // 왜: phase-4.6 §5.3 4단계(axis_cross_link) — 콘텐츠↔도구 흐름 정량화
      await page.goto("/checklist");
      await expect(page).toHaveURL(/\/checklist\/?$/);

      await page.locator("nav").getByText("체중", { exact: true }).click();
      await expect(page).toHaveURL(/\/weight\/?$/);

      const crossLinks = filterEvent(
        await getGtagCalls(page),
        "axis_cross_link",
      );
      expect(crossLinks.length).toBeGreaterThanOrEqual(1);

      const last = crossLinks[crossLinks.length - 1];
      const params = last[2] as Record<string, string>;
      expect(params.from).toBe("checklist");
      expect(params.to).toBe("weight");
    });
  });

  test.describe("Edge — 같은 탭 클릭", () => {
    test("같은 탭 재클릭 시 axis_cross_link는 발사되지 않는다", async ({
      page,
    }) => {
      // 무엇을: /checklist 에서 "체크리스트" 탭 재클릭 → cross_link 카운트 불변
      // 왜: phase-4.6 §5.2 axis_cross_link 정의 (from!==to 조건) — 노이즈 차단
      await page.goto("/checklist");

      const beforeCount = filterEvent(
        await getGtagCalls(page),
        "axis_cross_link",
      ).length;

      await page
        .locator("nav")
        .getByText("체크리스트", { exact: true })
        .click();

      const afterCount = filterEvent(
        await getGtagCalls(page),
        "axis_cross_link",
      ).length;

      expect(afterCount).toBe(beforeCount);
    });
  });

  test.describe("회귀 가드 — V1=A deprecated 잔류 발사 0건", () => {
    test("5탭 동선에서 content_click(type=video)는 발사되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 5탭 클릭으로 정보 탭까지 진입 → content_click(type=video) 0건 확인
      // 왜: phase-4.6 §1 V1=A 영상 자산 폐기 후 deprecated 이벤트 잔류 발사 회귀 가드
      await page.goto("/");
      await page.locator("nav").getByText("정보", { exact: true }).click();
      await expect(page).toHaveURL(/\/articles\/?$/);

      const videoClicks = filterEvent(
        await getGtagCalls(page),
        "content_click",
      ).filter((c) => {
        const params = c[2] as Record<string, string> | undefined;
        return params?.type === "video";
      });

      expect(videoClicks.length).toBe(0);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 5탭 cross-link 발사가 정상 동작한다", async ({ page }) => {
      // 무엇을: 375px 모바일 viewport에서 /weight → "정보" 탭 클릭 → cross_link 발사
      // 왜: BottomNav 5탭이 모바일에서 라벨/터치 타겟이 깨져 onClick 누락되면 funnel 단절
      await page.goto("/weight");
      await expect(page).toHaveURL(/\/weight\/?$/);

      await page.locator("nav").getByText("정보", { exact: true }).click();
      await expect(page).toHaveURL(/\/articles\/?$/);

      const crossLinks = filterEvent(
        await getGtagCalls(page),
        "axis_cross_link",
      );
      const last = crossLinks[crossLinks.length - 1];
      const params = last[2] as Record<string, string>;
      expect(params.from).toBe("weight");
      expect(params.to).toBe("info");
    });
  });
});
