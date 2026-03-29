import { test, expect } from "@playwright/test";

test.describe("하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("6개 네비게이션 항목이 보인다", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByText("홈")).toBeVisible();
    await expect(nav.getByText("체크리스트")).toBeVisible();
    await expect(nav.getByText("타임라인")).toBeVisible();
    await expect(nav.getByText("베이비페어")).toBeVisible();
    await expect(nav.getByText("체중")).toBeVisible();
    await expect(nav.getByText("영상")).toBeVisible();
  });

  test("네비게이션으로 페이지 이동이 된다", async ({ page }) => {
    await page.locator("nav").getByText("체크리스트").click();
    await expect(page).toHaveURL("/checklist");

    await page.locator("nav").getByText("타임라인").click();
    await expect(page).toHaveURL("/timeline");

    await page.locator("nav").getByText("홈").click();
    await expect(page).toHaveURL("/");
  });
});
