import { test, expect } from "@playwright/test";

test.describe("하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("4개 네비게이션 항목이 보인다", async ({ page }) => {
    // 무엇을: Phase 4 Step 1에서 '타임라인'→'체크리스트', Step 2에서 '영상' 제거
    // 왜: 사이트 정체성 — 체크리스트 허브 메인 + 영상·블로그는 /info로 통합
    const nav = page.locator("nav").last();
    await expect(nav).toBeVisible();
    await expect(nav.getByText("홈")).toBeVisible();
    await expect(nav.getByText("체크리스트")).toBeVisible();
    await expect(nav.getByText("베이비페어")).toBeVisible();
    await expect(nav.getByText("정보")).toBeVisible();
    // 영상 탭은 Step 2에서 제거됨
    await expect(nav.getByText("영상")).toHaveCount(0);
  });

  test("네비게이션으로 페이지 이동이 된다", async ({ page }) => {
    // 무엇을: 체크리스트 탭 → /checklist 허브, 정보 탭 → /info 통합 허브
    // 왜: 신규 진입 흐름
    await page.locator("nav").last().getByText("체크리스트").click();
    await expect(page).toHaveURL(/\/checklist\/?$/);

    await page.locator("nav").last().getByText("정보").click();
    await expect(page).toHaveURL(/\/info\/?$/);

    await page.locator("nav").last().getByText("홈").click();
    await expect(page).toHaveURL(/\/(pregnancy-checklist\/?)?$/);
  });
});
