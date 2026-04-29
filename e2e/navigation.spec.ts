import { test, expect } from "@playwright/test";

test.describe("하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("5개 네비게이션 항목이 보인다", async ({ page }) => {
    // 무엇을: Phase 4 Step 1에서 '타임라인' 탭이 '체크리스트' 탭으로 교체됨
    // 왜: 사이트 정체성 — 체크리스트 허브가 메인 진입점
    const nav = page.locator("nav").last();
    await expect(nav).toBeVisible();
    await expect(nav.getByText("홈")).toBeVisible();
    await expect(nav.getByText("체크리스트")).toBeVisible();
    await expect(nav.getByText("베이비페어")).toBeVisible();
    await expect(nav.getByText("영상")).toBeVisible();
    await expect(nav.getByText("정보")).toBeVisible();
  });

  test("네비게이션으로 페이지 이동이 된다", async ({ page }) => {
    // 무엇을: 체크리스트 탭 → /checklist 허브
    // 왜: 신규 진입 흐름
    await page.locator("nav").last().getByText("체크리스트").click();
    await expect(page).toHaveURL(/\/checklist\/?$/);

    await page.locator("nav").last().getByText("홈").click();
    await expect(page).toHaveURL(/\/(pregnancy-checklist\/?)?$/);
  });
});
