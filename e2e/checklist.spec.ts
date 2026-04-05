import { test, expect } from "@playwright/test";

test.describe("체크리스트 페이지 (리다이렉트)", () => {
  test("/checklist 접근 시 /timeline으로 리다이렉트된다", async ({ page }) => {
    // 무엇을: /checklist가 /timeline으로 리다이렉트되는지
    // 왜: Phase 1.5에서 체크리스트가 타임라인에 통합됨
    await page.goto("/checklist");
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
  });
});
