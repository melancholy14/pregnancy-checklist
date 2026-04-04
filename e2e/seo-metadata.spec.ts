import { test, expect } from "@playwright/test";

test.describe("SEO 메타데이터 & OG 태그", () => {
  test.describe("페이지별 title 확인", () => {
    const pages = [
      { path: "/", title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드" },
      { path: "/timeline", title: "임신 주차별 타임라인 & 체크리스트" },
      { path: "/baby-fair", title: "베이비페어 일정 모음" },
      { path: "/weight", title: "임신 체중 기록 & 변화 그래프" },
      { path: "/videos", title: "임산부 추천 영상 모음" },
      { path: "/about", title: "서비스 소개" },
      { path: "/guides/hospital-bag", title: "출산 가방 필수 준비물 총정리" },
      { path: "/guides/weekly-prep", title: "임신 주차별 검사 & 준비 가이드" },
    ];

    for (const { path, title } of pages) {
      test(`${path} 페이지에 고유 title이 설정된다`, async ({ page }) => {
        // 무엇을: 페이지별 고유 <title> 태그 확인
        // 왜: AdSense 승인 + SEO에 페이지별 고유 메타데이터 필수
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(title));
      });
    }
  });

  test.describe("OG 메타태그 확인", () => {
    test("홈 페이지에 og:title이 설정된다", async ({ page }) => {
      // 무엇을: 홈 페이지 og:title 메타태그
      // 왜: SNS 공유 시 미리보기 표시에 필수
      await page.goto("/");
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute("content", /출산 준비 체크리스트/);
    });

    test("홈 페이지에 og:description이 설정된다", async ({ page }) => {
      // 무엇을: og:description 메타태그
      // 왜: SNS 공유 시 설명 표시
      await page.goto("/");
      const ogDesc = page.locator('meta[property="og:description"]');
      await expect(ogDesc).toHaveAttribute("content", /임신 주차에 맞춘/);
    });

    test("홈 페이지에 og:image가 설정된다", async ({ page }) => {
      // 무엇을: og:image 메타태그 존재
      // 왜: SNS 공유 시 썸네일 이미지 표시
      await page.goto("/");
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveAttribute("content", /og-image/);
    });
  });

  test.describe("canonical URL 확인", () => {
    const pages = [
      { path: "/", canonical: "https://pregnancy-checklist.com" },
      { path: "/timeline", canonical: "https://pregnancy-checklist.com/timeline" },
      { path: "/baby-fair", canonical: "https://pregnancy-checklist.com/baby-fair" },
      { path: "/guides/hospital-bag", canonical: "https://pregnancy-checklist.com/guides/hospital-bag" },
      { path: "/guides/weekly-prep", canonical: "https://pregnancy-checklist.com/guides/weekly-prep" },
    ];

    for (const { path, canonical } of pages) {
      test(`${path} 페이지에 canonical URL이 설정된다`, async ({ page }) => {
        // 무엇을: <link rel="canonical"> 태그 확인
        // 왜: 중복 콘텐츠 방지, SEO 정규화 필수
        await page.goto(path);
        const link = page.locator('link[rel="canonical"]');
        await expect(link).toHaveAttribute("href", canonical);
      });
    }
  });

  test.describe("meta description 확인", () => {
    test("각 페이지에 고유 description이 설정된다", async ({ page }) => {
      // 무엇을: <meta name="description"> 태그가 페이지별로 다른지
      // 왜: AdSense + SEO 필수 요건
      const descriptions = new Set<string>();

      const paths = ["/", "/timeline", "/baby-fair", "/weight", "/videos", "/about"];
      for (const path of paths) {
        await page.goto(path);
        const desc = await page.locator('meta[name="description"]').getAttribute("content");
        expect(desc).toBeTruthy();
        descriptions.add(desc!);
      }

      // 모든 페이지의 description이 고유해야 함
      expect(descriptions.size).toBe(paths.length);
    });
  });
});
