import { test, expect } from "@playwright/test";

/**
 * Lighthouse SEO 검증 대상 7개 페이지의 SEO 필수 요소 확인.
 * scripts/lighthouse-check.sh의 빠른 대체 — Playwright로 수 초 내 퇴행 감지.
 */

const TARGET_PAGES = [
  { path: "/", name: "홈" },
  { path: "/timeline", name: "타임라인" },
  { path: "/baby-fair", name: "베이비페어" },
  { path: "/weight", name: "체중 관리" },
  { path: "/info", name: "정보 통합 허브" },
  { path: "/checklist", name: "체크리스트 허브" },
  { path: "/articles/early-pregnancy-tests", name: "블로그 상세" },
];

test.describe("Lighthouse SEO 필수 요소 (7개 타겟 페이지)", () => {
  for (const { path, name } of TARGET_PAGES) {
    test.describe(`${name} (${path})`, () => {
      test(`title이 존재하고 비어있지 않다`, async ({ page }) => {
        await page.goto(path);
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
      });

      test(`meta description이 존재한다`, async ({ page }) => {
        await page.goto(path);
        const desc = await page
          .locator('meta[name="description"]')
          .getAttribute("content");
        expect(desc).toBeTruthy();
        expect(desc!.length).toBeGreaterThan(0);
      });

      test(`canonical URL이 설정되어 있다`, async ({ page }) => {
        await page.goto(path);
        const canonical = await page
          .locator('link[rel="canonical"]')
          .getAttribute("href");
        expect(canonical).toBeTruthy();
        expect(canonical).toContain("pregnancy-checklist.com");
      });

      test(`viewport meta가 설정되어 있다`, async ({ page }) => {
        await page.goto(path);
        const viewport = await page
          .locator('meta[name="viewport"]')
          .getAttribute("content");
        expect(viewport).toBeTruthy();
        expect(viewport).toContain("width=");
      });

      test(`html lang 속성이 ko이다`, async ({ page }) => {
        await page.goto(path);
        const lang = await page.locator("html").getAttribute("lang");
        expect(lang).toBe("ko");
      });

      test(`h1 요소가 정확히 1개 존재한다`, async ({ page }) => {
        await page.goto(path);
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBe(1);
      });
    });
  }
});

test.describe("Lighthouse 스크립트 인프라", () => {
  test("lighthouse-check.sh 파일이 존재한다", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const scriptPath = path.resolve("scripts/lighthouse-check.sh");
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  test("lighthouse-check.sh에 7개 타겟 페이지가 포함되어 있다", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const scriptPath = path.resolve("scripts/lighthouse-check.sh");
    const content = fs.readFileSync(scriptPath, "utf8");

    for (const { path: pagePath } of TARGET_PAGES) {
      expect(content).toContain(`"${pagePath}"`);
    }
  });

  test("package.json에 lighthouse-check 스크립트가 정의되어 있다", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pkgPath = path.resolve("package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    expect(pkg.scripts["lighthouse-check"]).toBeTruthy();
  });
});
