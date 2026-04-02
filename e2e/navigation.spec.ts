import { test, expect } from "@playwright/test";

test.describe("하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("4개 네비게이션 항목이 보인다", async ({ page }) => {
    // 무엇을: Phase 1.5에서 4탭으로 축소된 네비게이션 확인
    // 왜: 체크리스트 탭 제거, 통합 페이지로 대체
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByText("홈")).toBeVisible();
    await expect(nav.getByText("타임라인")).toBeVisible();
    await expect(nav.getByText("체중")).toBeVisible();
    await expect(nav.getByText("더보기")).toBeVisible();
  });

  test("네비게이션으로 페이지 이동이 된다", async ({ page }) => {
    await page.locator("nav").getByText("타임라인").click();
    await expect(page).toHaveURL("/timeline");

    await page.locator("nav").getByText("홈").click();
    await expect(page).toHaveURL("/");
  });
});
