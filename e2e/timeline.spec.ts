import { test, expect } from "@playwright/test";

test.describe("타임라인 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test("제목이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
    await expect(page.getByText("주차별 중요한 순간들을 확인하세요")).toBeVisible();
  });

  test("5개 마일스톤이 표시된다", async ({ page }) => {
    await expect(page.getByText("초기 검진")).toBeVisible();
    await expect(page.getByText("중기 검사")).toBeVisible();
    await expect(page.getByText("후기 준비")).toBeVisible();
    await expect(page.getByText("출산 준비")).toBeVisible();
    await expect(page.getByText("최종 점검")).toBeVisible();
  });

  test("각 마일스톤에 주차 배지가 있다", async ({ page }) => {
    await expect(page.getByText("12주")).toBeVisible();
    await expect(page.getByText("20주")).toBeVisible();
    await expect(page.getByText("28주")).toBeVisible();
    await expect(page.getByText("32주")).toBeVisible();
    await expect(page.getByText("36주")).toBeVisible();
  });

  test("마지막에 40주 메시지가 보인다", async ({ page }) => {
    await expect(page.getByText(/40주차/)).toBeVisible();
  });

  test("각 마일스톤에 task 목록이 있다", async ({ page }) => {
    await expect(page.getByText("산부인과 첫 방문")).toBeVisible();
    await expect(page.getByText("정밀 초음파")).toBeVisible();
  });
});
