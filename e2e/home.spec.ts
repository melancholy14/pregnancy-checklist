import { test, expect } from "@playwright/test";

test.describe("홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("히어로 섹션이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
    await expect(page.getByText("소중한 아기를 위한 완벽한 준비")).toBeVisible();
  });

  test("출산 예정일 입력 카드가 보인다", async ({ page }) => {
    await expect(page.getByText("출산 예정일을 입력하세요")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test("출산 예정일을 입력하면 임신 주차가 표시된다", async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 100);
    const dateStr = futureDate.toISOString().split("T")[0];

    await page.locator('input[type="date"]').fill(dateStr);
    await expect(page.getByText(/현재 임신/)).toBeVisible();
    await expect(page.getByText(/\d+주/)).toBeVisible();
  });

  test("5개 기능 카드가 보인다", async ({ page }) => {
    const grid = page.locator(".grid");
    await expect(grid.getByRole("link", { name: "체크리스트" })).toBeVisible();
    await expect(grid.getByRole("link", { name: "타임라인" })).toBeVisible();
    await expect(grid.getByRole("link", { name: "베이비페어" })).toBeVisible();
    await expect(grid.getByRole("link", { name: "체중 기록" })).toBeVisible();
    await expect(grid.getByRole("link", { name: "영상" })).toBeVisible();
  });

  test("기능 카드 클릭 시 해당 페이지로 이동한다", async ({ page }) => {
    await page.getByRole("link", { name: "체크리스트" }).first().click();
    await expect(page).toHaveURL("/checklist");
  });
});
