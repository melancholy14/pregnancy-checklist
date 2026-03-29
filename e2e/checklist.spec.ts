import { test, expect } from "@playwright/test";

test.describe("체크리스트 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/checklist");
  });

  test("제목과 진행률 바가 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
    await expect(page.getByText("전체 진행률")).toBeVisible();
    await expect(page.getByText(/\/\d+ 완료/)).toBeVisible();
  });

  test("5개 카테고리 탭이 보인다", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /병원 준비/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /출산 가방/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /신생아 준비/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /산후 준비/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /행정 준비/ })).toBeVisible();
  });

  test("체크리스트 항목이 표시된다", async ({ page }) => {
    // 첫번째 카테고리(병원 준비)의 항목들
    await expect(page.getByText("산부인과 선택")).toBeVisible();
  });

  test("항목 클릭 시 체크 상태가 토글된다", async ({ page }) => {
    const item = page.getByText("산부인과 선택").locator("..");
    await item.click();
    // 체크 후 line-through 스타일이 적용되어야 함
    await expect(page.getByText("산부인과 선택")).toHaveCSS("text-decoration-line", "line-through");
  });

  test("카테고리 탭 클릭 시 해당 카테고리 항목이 표시된다", async ({ page }) => {
    await page.getByRole("tab", { name: /출산 가방/ }).click();
    await expect(page.getByText("산모 속옷 준비", { exact: true })).toBeVisible();
  });

  test("진행률이 체크 상태에 따라 변한다", async ({ page }) => {
    const progressText = page.getByText(/\/\d+ 완료/);
    const before = await progressText.textContent();

    // 첫번째 항목 체크
    await page.getByText("산부인과 선택").locator("..").click();
    const after = await progressText.textContent();

    expect(before).not.toEqual(after);
  });
});
