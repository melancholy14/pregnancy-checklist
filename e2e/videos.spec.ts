import { test, expect } from "@playwright/test";

test.describe("영상 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/videos");
  });

  test("제목이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "영상 콘텐츠" })).toBeVisible();
  });

  test("3개 카테고리 탭이 보인다", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "임산부 운동" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "출산 준비" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "신생아 케어" })).toBeVisible();
  });

  test("비디오 카드들이 표시된다", async ({ page }) => {
    await expect(page.getByText("임산부 요가 - 20분 루틴")).toBeVisible();
  });

  test("카테고리 탭 클릭 시 해당 영상이 표시된다", async ({ page }) => {
    await page.getByRole("tab", { name: "신생아 케어" }).click();
    await expect(page.getByText("신생아 목욕 시키는 법")).toBeVisible();
  });

  test("YouTube 안내 카드가 보인다", async ({ page }) => {
    await expect(page.getByText(/YouTube로 연결됩니다/)).toBeVisible();
  });
});
