import { test, expect } from "@playwright/test";

test.describe("Sticky 헤더", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test("홈이 아닌 페이지에서 헤더가 표시된다", async ({ page }) => {
    // 무엇을: 타임라인 등 서브 페이지에서 sticky 헤더가 보이는지
    // 왜: 유저가 어떤 서비스인지 인지할 수 있는 장치
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByText("출산 준비 체크리스트")).toBeVisible();
  });

  test("헤더에 로고 이미지가 포함되어 있다", async ({ page }) => {
    // 무엇을: 헤더에 로고 아이콘이 렌더링되는지
    // 왜: 브랜드 인지를 위한 시각 요소
    const logo = page.locator("header img");
    await expect(logo).toBeVisible();
  });

  test("홈 페이지에서는 헤더가 표시되지 않는다", async ({ page }) => {
    // 무엇을: 홈(/)에서 sticky 헤더가 숨겨지는지
    // 왜: 홈에는 히어로 영역이 있으므로 헤더 불필요
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toHaveCount(0);
  });

  test("여러 서브 페이지에서 헤더가 표시된다", async ({ page }) => {
    // 무엇을: 타임라인 외 다른 서브 페이지에서도 헤더가 보이는지
    // 왜: 홈 제외 모든 페이지에서 헤더 표시 확인
    for (const path of ["/baby-fair", "/videos", "/articles"]) {
      await page.goto(path);
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("header").getByText("출산 준비 체크리스트")).toBeVisible();
    }
  });

  test("헤더 높이가 44px이다", async ({ page }) => {
    // 무엇을: 헤더 높이가 PRD 스펙(h-11 = 44px)과 일치하는지
    // 왜: 콘텐츠 영역 축소 최소화를 위한 최소 높이 제약
    const header = page.locator("header");
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBe(44);
  });
});
