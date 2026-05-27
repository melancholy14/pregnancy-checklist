import { test, expect } from "@playwright/test";

test.describe("Step 6: 체중 ↔ 블로그 크로스 링크", () => {
  test.describe("체중 → 블로그 (기존 확인)", () => {
    test("체중 페이지 하단에 블로그 링크 카드가 표시된다", async ({ page }) => {
      // 무엇을: 체중 페이지에 "임신 중 체중 관리 가이드" 카드
      // 왜: 체중 → 블로그 크로스 링크 정상 확인
      await page.goto("/weight");
      await expect(page.getByText("임신 중 체중 관리 가이드")).toBeVisible();
      await expect(page.getByRole("link", { name: /임신 중 체중 관리 가이드/ })).toBeVisible();
    });

    test("블로그 링크 클릭 시 아티클 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 카드 클릭 → /articles/pregnancy-weight-management 이동
      // 왜: 링크 동작 확인
      await page.goto("/weight");
      await page.getByRole("link", { name: /임신 중 체중 관리 가이드/ }).click();
      await expect(page).toHaveURL(/\/articles\/pregnancy-weight-management/);
    });
  });

  test.describe("블로그 → 체중 (신규)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles/pregnancy-weight-management");
    });

    test("체중 관리 아티클 본문에 체중 기록 도구 CTA가 표시된다", async ({ page }) => {
      // 무엇을: 💡 블록쿼트 CTA가 렌더링되는지
      // 왜: 블로그 → 체중 역방향 크로스 링크 핵심 동작
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).toBeVisible();
      await expect(page.getByRole("link", { name: /체중 기록 도구/ })).toBeVisible();
    });

    test("체중 기록 도구 링크 클릭 시 체중 페이지로 이동한다", async ({ page }) => {
      // 무엇을: CTA 링크 클릭 → /weight 이동
      // 왜: 역방향 링크가 실제로 동작하는지 검증
      await page.getByRole("link", { name: /체중 기록 도구/ }).click();
      await expect(page).toHaveURL(/\/weight/);
    });

    test("다른 아티클에는 체중 CTA가 없다", async ({ page }) => {
      // 무엇을: hospital-bag 아티클에 체중 CTA가 없는지
      // 왜: 체중 CTA는 체중 관리 아티클에만 존재해야 함
      await page.goto("/articles/hospital-bag");
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 체중 CTA가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 CTA 표시
      // 왜: 모바일에서 UI 깨짐 없이 표시 확인
      await page.goto("/articles/pregnancy-weight-management");
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).toBeVisible();
      await expect(page.getByRole("link", { name: /체중 기록 도구/ })).toBeVisible();
    });
  });
});
