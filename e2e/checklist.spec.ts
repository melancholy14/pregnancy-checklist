import { test, expect } from "@playwright/test";

test.describe("체크리스트 허브 (Phase 4 Step 1 이후)", () => {
  test("/checklist 접근 시 허브 페이지가 직접 표시된다", async ({ page }) => {
    // 무엇을: Phase 4 Step 1에서 /checklist → /timeline 리다이렉트가 제거되고
    //          허브 페이지(체크리스트 4종 카드)로 교체됨을 확인
    // 왜: 사이트 정체성 — 도메인 이름과 일치하는 허브 진입점
    await page.goto("/checklist");
    await expect(page).toHaveURL(/\/checklist\/?$/);
    await expect(page.getByRole("heading", { name: /체크리스트/, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "주차별 타임라인" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "출산가방 체크리스트" })).toBeVisible();
  });
});
