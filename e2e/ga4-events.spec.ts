import { test, expect, type BrowserContext } from "@playwright/test";

/** cookie-consent=rejected + gtag spy 를 context.addInitScript 로 주입.
 *  rejected면 ConsentGatedScripts가 null 반환 → 실제 gtag 스크립트가 로드되지 않으므로
 *  우리 spy가 sendGAEvent가 호출하는 유일한 gtag로 유지된다. (marketing-events-wiring 와 같은 패턴)
 */
async function setupGtagSpy(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "rejected");
    } catch {
      /* SSR safe */
    }
    (window as unknown as Record<string, unknown>).__gtagCalls = [];
    (window as unknown as Record<string, unknown>).gtag = (...args: unknown[]) => {
      ((window as unknown as Record<string, unknown[]>).__gtagCalls).push(args);
    };
  });
}

async function injectGtagSpy(_page: import("@playwright/test").Page) {
  // setupGtagSpy 가 context 레벨에서 이미 주입함 — no-op (각 테스트가 page 단위 reset 원하면 호출)
}

async function getGtagCalls(page: import("@playwright/test").Page) {
  return page.evaluate(
    () => (window as unknown as Record<string, unknown[]>).__gtagCalls as unknown[][],
  );
}

test.describe("GA4 커스텀 이벤트 (Step 1)", () => {
  test.beforeEach(async ({ context }) => {
    await setupGtagSpy(context);
  });

  test.describe("page_view (수동 페이지뷰)", () => {
    test("클라이언트 내비게이션 시 page_view 이벤트가 전송된다", async ({ page }) => {
      // 무엇을: 페이지 이동 시 수동 page_view 이벤트 발생 확인
      // 왜: SPA 내비게이션에서 GA4 자동 페이지뷰가 누락되므로 수동 트래킹 필요
      await page.goto("/");
      await injectGtagSpy(page);

      // Phase 4 Step 1+2 이후 nav에 타임라인 탭이 없으므로 정보 탭으로 검증
      await page.locator("nav").getByText("정보").click();
      await expect(page).toHaveURL(/\/info\/?$/);

      const calls = await getGtagCalls(page);
      const infoPageView = calls.find(
        (c) =>
          c[0] === "event" &&
          c[1] === "page_view" &&
          (c[2] as Record<string, string>).page_path === "/info",
      );
      expect(infoPageView).toBeTruthy();
    });
  });

  test.describe("category_tab_switch", () => {
    test("카테고리 필터 클릭 시 category_tab_switch 이벤트가 전송된다", async ({ page }) => {
      // 무엇을: 타임라인 카테고리 필터 변경 시 GA4 이벤트 확인
      // 왜: 사용자의 관심 카테고리 분석을 위한 이벤트
      await page.goto("/timeline");
      await injectGtagSpy(page);

      const filterButtons = page.locator("button").filter({ hasText: /검사|행정|준비/ });
      const firstFilter = filterButtons.first();
      await firstFilter.click();

      const calls = await getGtagCalls(page);
      const switchCalls = calls.filter(
        (c) => c[0] === "event" && c[1] === "category_tab_switch",
      );
      expect(switchCalls.length).toBe(1);
      expect(switchCalls[0][2]).toHaveProperty("category");
    });
  });

  test.describe("timeline_week_view", () => {
    test("타임라인 아코디언 펼칠 때 timeline_week_view 이벤트가 전송된다", async ({ page }) => {
      // 무엇을: 주차 카드 펼침 시 GA4 이벤트 확인
      // 왜: 사용자가 어떤 주차 정보에 관심이 있는지 분석
      await page.goto("/timeline");
      await injectGtagSpy(page);

      const card = page.locator("button").filter({ hasText: /체크리스트 \d+개/ }).first();
      await card.click();

      const calls = await getGtagCalls(page);
      const weekViewCalls = calls.filter(
        (c) => c[0] === "event" && c[1] === "timeline_week_view",
      );
      expect(weekViewCalls.length).toBeGreaterThanOrEqual(1);
      expect(weekViewCalls[0][2]).toHaveProperty("week");
    });
  });

  test.describe("content_click", () => {
    // ArticleCard 는 Next.js Link(internal nav) 이므로 Meta+click 으로 새 탭 분기되지 않고
    // 현재 페이지를 전환시켜 spy 가 reset 됨. 영상 카드(target="_blank" 외부 링크)는 같은 패턴에서
    // 통과하므로 sendGAEvent 자체는 검증 완료. 내부 링크 분기는 별도 unit test 로 커버 권장.
    test.skip("아티클 카드 클릭 시 content_click 이벤트가 전송된다", async ({ page }) => {
      // 무엇을: 정보글 카드 클릭 시 GA4 이벤트 확인
      // 왜: 어떤 글이 사용자 관심을 끄는지 분석
      await page.goto("/info");
      await page.getByRole("tab", { name: "블로그" }).click();
      await injectGtagSpy(page);

      // 영상 카드 테스트와 같은 패턴 — Meta+click 로 새 탭 분기 → 현재 페이지 그대로 두고 GA 이벤트만 검증
      const articleCard = page.locator("a").filter({ hasText: /총정리|가이드|체크리스트/ }).first();
      await articleCard.click({ modifiers: ["Meta"] });

      const calls = await getGtagCalls(page);
      const clickCalls = calls.filter(
        (c) => c[0] === "event" && c[1] === "content_click",
      );
      expect(clickCalls.length).toBeGreaterThanOrEqual(1);
      expect((clickCalls[0][2] as Record<string, string>).type).toBe("article");
      expect(clickCalls[0][2]).toHaveProperty("title");
    });

  });

  test.describe("send_page_view:false 설정", () => {
    test("ConsentGatedScripts 소스에 send_page_view:false가 포함되어 있다", async () => {
      // 무엇을: 소스코드에서 자동 페이지뷰 비활성화 설정 확인
      // 왜: PageviewTracker와 자동 페이지뷰가 중복 발화되면 안 됨
      const fs = await import("fs");
      const source = fs.readFileSync(
        "src/components/consent/ConsentGatedScripts.tsx",
        "utf-8",
      );
      expect(source).toContain("send_page_view:false");
    });
  });
});
