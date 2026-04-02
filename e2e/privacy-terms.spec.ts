import { test, expect } from "@playwright/test";

test.describe("개인정보처리방침 & 서비스 약관", () => {
  test.describe("Happy Path", () => {
    test("개인정보처리방침 페이지가 렌더링된다", async ({ page }) => {
      // 무엇을: /privacy 페이지 정상 접근 및 콘텐츠 표시
      // 왜: AdSense/GA4 필수 요건
      await page.goto("/privacy");
      await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Google Analytics 4/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: /LocalStorage/ })).toBeVisible();
    });

    test("서비스 이용약관 페이지가 렌더링된다", async ({ page }) => {
      // 무엇을: /terms 페이지 정상 접근 및 콘텐츠 표시
      // 왜: AdSense 필수 요건
      await page.goto("/terms");
      await expect(page.getByRole("heading", { name: "서비스 이용약관" })).toBeVisible();
      await expect(page.getByText(/의료 면책/)).toBeVisible();
      await expect(page.getByText(/데이터 저장 및 소실/)).toBeVisible();
    });

    test("Footer에서 개인정보/약관 링크가 동작한다", async ({ page }) => {
      // 무엇을: 모든 페이지 Footer에서 링크가 정상 이동하는지
      // 왜: 법적 페이지 접근성 필수
      await page.goto("/");
      await page.getByRole("link", { name: "개인정보처리방침" }).click();
      await expect(page).toHaveURL("/privacy");

      await page.goto("/");
      await page.getByRole("link", { name: "서비스 이용약관" }).click();
      await expect(page).toHaveURL("/terms");
    });
  });

  test.describe("Footer 면책 고지", () => {
    test("모든 페이지에 의료 면책 문구가 표시된다", async ({ page }) => {
      // 무엇을: Footer의 면책 고지가 각 페이지에 표시되는지
      // 왜: Phase 1 의료 면책 요구사항
      const pages = ["/", "/checklist", "/timeline", "/baby-fair", "/weight", "/videos"];
      for (const path of pages) {
        await page.goto(path);
        await expect(page.getByText("본 서비스는 의료적 조언을 제공하지 않습니다")).toBeVisible();
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 개인정보 페이지가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 법적 페이지 표시
      // 왜: 주요 타겟 기기
      await page.goto("/privacy");
      await expect(page.getByRole("heading", { name: "개인정보처리방침" })).toBeVisible();
    });
  });
});
