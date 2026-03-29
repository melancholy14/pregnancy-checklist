import { test, expect } from "@playwright/test";

test.describe("베이비페어 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/baby-fair");
  });

  test("제목이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "베이비페어 일정" })).toBeVisible();
  });

  test("행사 카드들이 표시된다", async ({ page }) => {
    await expect(page.getByText("서울 베이비페어")).toBeVisible();
    await expect(page.getByText("코엑스 Hall A")).toBeVisible();
  });

  test("도시 배지가 표시된다", async ({ page }) => {
    await expect(page.getByText("서울").first()).toBeVisible();
    await expect(page.getByText("부산", { exact: true })).toBeVisible();
  });

  test("참관 팁이 표시된다", async ({ page }) => {
    await expect(page.getByText("참관 팁")).toBeVisible();
    await expect(page.getByText(/사전 등록/)).toBeVisible();
  });
});
