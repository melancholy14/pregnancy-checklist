import { test, expect } from "@playwright/test";

const ARTICLES = [
  "hospital-bag",
  "baby-items-cost",
  "early-pregnancy-tests",
  "weekly-prenatal-checklist",
  "pregnancy-weight-management",
  "postpartum-care",
  "prenatal-insurance-preparation-guide",
];

const BASE = "https://pregnancy-checklist.com";

test.describe("canonical URL 플레이스홀더 수정 (Step 0c)", () => {
  test.describe("Happy Path", () => {
    for (const slug of ARTICLES) {
      test(`/articles/${slug} 에 올바른 canonical URL이 설정된다`, async ({
        page,
      }) => {
        // 무엇을: 각 아티클 페이지의 <link rel="canonical"> href 값 확인
        // 왜: AdSense 승인 + SEO 정규화에 정확한 canonical 필수
        await page.goto(`/articles/${slug}`);
        const link = page.locator('link[rel="canonical"]');
        await expect(link).toHaveAttribute(
          "href",
          `${BASE}/articles/${slug}`,
        );
      });
    }
  });

  test.describe("Error / Validation", () => {
    for (const slug of ARTICLES) {
      test(`/articles/${slug} canonical에 {{SITE_URL}} 플레이스홀더가 없다`, async ({
        page,
      }) => {
        // 무엇을: canonical href에 미치환 플레이스홀더가 남아있지 않은지
        // 왜: 완료 조건 — {{SITE_URL}} 전체 코드베이스 0건
        await page.goto(`/articles/${slug}`);
        const href = await page
          .locator('link[rel="canonical"]')
          .getAttribute("href");
        expect(href).not.toContain("{{SITE_URL}}");
        expect(href).toMatch(/^https:\/\/pregnancy-checklist\.com\/articles\//);
      });
    }
  });

  test.describe("canonical 형식 일관성", () => {
    test("모든 아티클의 canonical이 동일 도메인·경로 패턴을 따른다", async ({
      page,
    }) => {
      // 무엇을: 전체 아티클 canonical URL 패턴 일관성 검증
      // 왜: 도메인/프로토콜 불일치 시 SEO 크롤링 문제 발생
      const canonicals: string[] = [];

      for (const slug of ARTICLES) {
        await page.goto(`/articles/${slug}`);
        const href = await page
          .locator('link[rel="canonical"]')
          .getAttribute("href");
        expect(href).toBeTruthy();
        canonicals.push(href!);
      }

      for (const url of canonicals) {
        expect(url).toMatch(
          /^https:\/\/pregnancy-checklist\.com\/articles\/[\w-]+$/,
        );
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서도 canonical URL이 동일하게 출력된다", async ({
      page,
    }) => {
      // 무엇을: 모바일 뷰포트에서 canonical 메타태그 동일 확인
      // 왜: 뷰포트에 따라 다른 canonical이 렌더되면 SEO 불이익
      await page.goto("/articles/hospital-bag");
      const link = page.locator('link[rel="canonical"]');
      await expect(link).toHaveAttribute(
        "href",
        `${BASE}/articles/hospital-bag`,
      );
    });
  });
});
