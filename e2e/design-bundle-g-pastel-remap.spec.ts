import { test, expect } from "@playwright/test";

// 검증 대상: docs/features/design-bundle-g-pastel-remap/spec.md
// - 홈 정보 & 가이드 미니카드 아이콘: #E4D6F0 (pastel-lavender) ← 기존 #E0F0FF
// - 타임라인 행정 배지: #FFE0CC + alpha40 (pastel-peach @ 25%) ← 기존 #E0F0FF40
// - 베이비페어 소형 배지: #E4D6F0 (pastel-lavender) ← 기존 #E0F0FF
// 회귀 0건: 3개 페이지 어디에도 #E0F0FF / rgb(224, 240, 255) 가 노출되면 안 된다.

const PEACH_25PCT_RGBA = "rgba(255, 224, 204, 0.25)"; // #FFE0CC40 (alpha 0x40 → 64/255 ≈ 0.25 in chromium)
const OLD_HEX = "#E0F0FF";
const OLD_RGB_PATTERN = "rgb(224, 240, 255)";

async function gotoHomeOnboarded(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
  await page.goto("/");
}

test.describe("design-bundle-g-pastel-remap (5-pastel role 정합 회복)", () => {
  test.describe("Happy Path", () => {
    test("홈 정보 & 가이드 미니카드 아이콘이 pastel-lavender 클래스를 갖는다", async ({ page }) => {
      // 무엇을: HomeContent.tsx 의 slot="info" prop 이 DashboardCard 아이콘 div 에 lavender/40 클래스로 반영
      // 왜: spec must 1번 — design-bundle-b-i-row-tokens 라운드 이후 인라인 style → className 전환된 신 컨트랙트
      await gotoHomeOnboarded(page);

      const infoCard = page.locator('a[href="/articles"]', { hasText: "📝" }).first();
      await expect(infoCard).toBeVisible();

      const iconBox = infoCard.locator("div.w-8.h-8.rounded-lg").first();
      await expect(iconBox).toHaveClass(/bg-pastel-lavender\/40/);
    });

    test("타임라인 '행정' 배지 배경이 pastel-peach(#FFE0CC, alpha 0.25)이다", async ({ page }) => {
      // 무엇을: TIMELINE_TYPE_CONFIG.admin.color 변경이 TimelineAccordionCard Badge 배경(${color}40)에 반영되는지
      // 왜: spec must 2번 — admin role을 peach로 옮긴 결정의 시각 적용 검증
      await page.goto("/timeline");

      const adminBadge = page.locator('[data-slot="badge"]:has-text("행정")').first();
      await expect(adminBadge).toBeVisible();
      await expect(adminBadge).toHaveCSS("background-color", PEACH_25PCT_RGBA);
    });

    test("베이비페어 '소형' 배지가 pastel-lavender 클래스를 갖는다", async ({ page }) => {
      // 무엇을: BabyfairCard 소형 Badge 가 getScaleTokenClass("small") 결과로 lavender/40 클래스 적용
      // 왜: spec must 3번 — design-bundle-b-i-row-tokens 라운드 이후 신 컨트랙트
      // 데이터상 small-scale 행사(2026-04-02~04-05)는 5월 9일 기준 '지난 행사' 탭
      await page.goto("/baby-fair");
      await page.getByRole("tab", { name: "지난 행사" }).click();

      const smallBadge = page.locator('[data-slot="badge"]:has-text("소형")').first();
      await expect(smallBadge).toBeVisible();
      await expect(smallBadge).toHaveClass(/bg-pastel-lavender\/40/);
    });
  });

  test.describe("Error / Validation (회귀 0건)", () => {
    test("3개 영향 페이지(/, /timeline, /baby-fair) 어디에도 옛 hex가 노출되지 않는다", async ({ page }) => {
      // 무엇을: spec 성공 기준 1·2 — 변경 3곳 외에도 렌더 결과 HTML에 #E0F0FF / rgb(224,240,255)가 0건인지
      // 왜: 회귀 방지(어떤 새 코드 경로가 옛 hex를 다시 도입하는 일을 차단)
      const assertNoOldHex = async (label: string) => {
        const html = await page.content();
        expect(html, `${label}: should not contain ${OLD_HEX}`).not.toContain(OLD_HEX);
        expect(html, `${label}: should not contain ${OLD_RGB_PATTERN}`).not.toContain(OLD_RGB_PATTERN);
        expect(html, `${label}: should not contain rgb(224,240,255) (no spaces)`).not.toContain("rgb(224,240,255)");
      };

      await gotoHomeOnboarded(page);
      await assertNoOldHex("/");

      await page.goto("/timeline");
      await assertNoOldHex("/timeline");

      await page.goto("/baby-fair");
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await assertNoOldHex("/baby-fair");
    });
  });

  test.describe("권한 / 인증 (state 분기) — 색 격리", () => {
    test("타임라인 '쇼핑' 배지는 admin 색(peach)을 받지 않는다", async ({ page }) => {
      // 무엇을: 다른 type의 배지에 우연히 admin/peach 색이 섞이지 않는지
      // 왜: 권한·세션 분기는 본 기능에 없으므로, '같은 hex 라이브러리 안 다른 role' 격리로 대체.
      //     spec won't에 박혀있는 'pink=CTA 전용' 등 role 경계가 깨지지 않는다는 1차 회귀 가드.
      await page.goto("/timeline");

      const shoppingBadge = page.locator('[data-slot="badge"]:has-text("쇼핑")').first();
      await expect(shoppingBadge).toBeVisible();

      const bg = await shoppingBadge.evaluate((el) => getComputedStyle(el).backgroundColor);
      // shopping = #FFF4D4 (sunshine) + 40 → rgba(255, 244, 212, 0.25). 절대 peach가 아니어야 함.
      expect(bg).not.toBe(PEACH_25PCT_RGBA);
      expect(bg).not.toBe("rgba(224, 240, 255, 0.25)"); // 옛 hex의 alpha 형태도 아니어야 함
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서도 홈 정보 카드와 베이비페어 소형 배지가 lavender 클래스를 유지한다", async ({ page }) => {
      // 무엇을: 375px viewport에서도 lavender/40 클래스가 동일하게 적용되는지
      // 왜: 타겟 유저(임산부) 주요 디바이스 폭 기준 회귀 가드
      await gotoHomeOnboarded(page);
      const infoCard = page.locator('a[href="/articles"]', { hasText: "📝" }).first();
      await expect(infoCard).toBeVisible();
      const iconBox = infoCard.locator("div.w-8.h-8.rounded-lg").first();
      await expect(iconBox).toHaveClass(/bg-pastel-lavender\/40/);

      await page.goto("/baby-fair");
      await page.getByRole("tab", { name: "지난 행사" }).click();
      const smallBadge = page.locator('[data-slot="badge"]:has-text("소형")').first();
      await expect(smallBadge).toBeVisible();
      await expect(smallBadge).toHaveClass(/bg-pastel-lavender\/40/);
    });
  });
});
