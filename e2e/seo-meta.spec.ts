import { test, expect } from "@playwright/test";

test.describe("SEO 메타 태그 브랜딩 (Step 11)", () => {
  test.describe("루트 레이아웃", () => {
    test("홈 페이지 title에 브랜딩 카피가 포함된다", async ({ page }) => {
      // 무엇을: 루트 title에 "초산 개발자가 직접 만든" 포함 여부
      // 왜: 검색 결과에서 차별화된 CTR 확보
      await page.goto("/");
      await expect(page).toHaveTitle(/초산 개발자가 직접 만든/);
    });

    test("홈 페이지 meta description에 브랜딩 카피가 포함된다", async ({ page }) => {
      // 무엇을: description에 "답답해서 직접 만들었습니다" 포함 여부
      // 왜: 검색 결과 스니펫에서 당사자성 어필
      await page.goto("/");
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain("답답해서 직접 만들었습니다");
    });

    test("홈 페이지 og:description에 브랜딩 카피가 포함된다", async ({ page }) => {
      // 무엇을: og:description 동기화 확인
      // 왜: SNS 공유 시에도 브랜딩 톤 유지
      await page.goto("/");
      const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
      expect(ogDesc).toContain("답답해서 직접 만들었습니다");
    });
  });

  test.describe("서브 페이지 description", () => {
    test("/about description이 브랜딩 톤으로 변경되었다", async ({ page }) => {
      // 무엇을: about 페이지 description
      // 왜: 서브 페이지도 톤 통일
      await page.goto("/about");
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain("답답해서 직접 만든");
    });

    test("/contact description이 브랜딩 톤으로 변경되었다", async ({ page }) => {
      // 무엇을: contact 페이지 description
      // 왜: 서브 페이지도 톤 통일
      await page.goto("/contact");
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain("혼자 만들다 보니");
    });

    test("/timeline description이 브랜딩 톤으로 변경되었다", async ({ page }) => {
      // 무엇을: timeline 페이지 description
      // 왜: 서브 페이지도 톤 통일
      await page.goto("/timeline");
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain("직접 써보며 만든");
    });

    test("/baby-fair description이 브랜딩 톤으로 변경되었다", async ({ page }) => {
      // 무엇을: baby-fair 페이지 description
      // 왜: 서브 페이지도 톤 통일
      await page.goto("/baby-fair");
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain("한곳에서 확인하세요");
    });
  });
});
