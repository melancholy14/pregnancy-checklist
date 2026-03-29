import { test, expect } from "@playwright/test";

test.describe("체중 기록 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/weight");
  });

  test("제목과 설명이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "체중 기록" })).toBeVisible();
    await expect(page.getByText("임신 중 체중 변화를 기록하고 확인하세요")).toBeVisible();
  });

  test("기록이 없으면 빈 상태가 표시된다", async ({ page }) => {
    await expect(page.getByText("아직 기록이 없어요")).toBeVisible();
  });

  test("FAB 버튼이 보인다", async ({ page }) => {
    // FAB 버튼 (Plus 아이콘이 들어있는 고정 버튼)
    const fab = page.locator("button.fixed");
    await expect(fab).toBeVisible();
  });

  test("FAB 클릭 시 추가 폼이 표시된다", async ({ page }) => {
    await page.locator("button.fixed").click();
    await expect(page.getByText("새 기록 추가")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "추가" })).toBeVisible();
  });

  test("체중을 추가하면 목록에 표시된다", async ({ page }) => {
    await page.locator("button.fixed").click();
    await page.locator('input[type="date"]').fill("2026-03-29");
    await page.locator('input[type="number"]').fill("62.5");
    await page.getByRole("button", { name: "추가" }).click();

    await expect(page.getByText("62.5")).toBeVisible();
    await expect(page.getByText(/2026년 3월 29일/)).toBeVisible();
  });
});
