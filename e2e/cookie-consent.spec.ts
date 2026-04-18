import { test, expect } from "@playwright/test";

test.describe("쿠키 동의 배너", () => {
  test.describe("Happy Path", () => {
    test("첫 방문 시 쿠키 동의 배너가 노출된다", async ({ page }) => {
      // 무엇을: cookie-consent 키가 없을 때 배너 표시
      // 왜: 개인정보처리방침에 "서비스 첫 방문 시 쿠키 사용에 대한 안내를 제공합니다" 명시
      await page.goto("/");
      await expect(page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.")).toBeVisible();
      await expect(page.getByRole("button", { name: "동의" })).toBeVisible();
      await expect(page.getByRole("button", { name: "거부" })).toBeVisible();
    });

    test("개인정보처리방침 링크가 동작한다", async ({ page }) => {
      // 무엇을: 배너 내 개인정보처리방침 링크 클릭 시 /privacy 이동
      // 왜: 사용자가 동의 전 상세 정보 확인 가능해야 함
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");
      const banner = page.locator("[class*='fixed bottom']").filter({ hasText: "쿠키" });
      await banner.getByRole("link", { name: "개인정보처리방침" }).click();
      await expect(page).toHaveURL(/\/privacy/);
    });

    test("동의 클릭 시 배너가 닫히고 선택이 저장된다", async ({ page }) => {
      // 무엇을: "동의" 클릭 → 배너 사라짐 + localStorage 저장
      // 왜: 동의 후 GA4/AdSense 활성화
      await page.goto("/");
      await page.getByRole("button", { name: "동의" }).click();
      await expect(page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.")).not.toBeVisible();

      const consent = await page.evaluate(() => localStorage.getItem("cookie-consent"));
      expect(consent).toBe("accepted");
    });

    test("거부 클릭 시 배너가 닫히고 선택이 저장된다", async ({ page }) => {
      // 무엇을: "거부" 클릭 → 배너 사라짐 + localStorage 저장
      // 왜: 거부 시 GA4/AdSense 비활성화
      await page.goto("/");
      await page.getByRole("button", { name: "거부" }).click();
      await expect(page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.")).not.toBeVisible();

      const consent = await page.evaluate(() => localStorage.getItem("cookie-consent"));
      expect(consent).toBe("rejected");
    });

    test("재방문 시 이전 선택이 유지되어 배너가 미노출된다", async ({ page }) => {
      // 무엇을: localStorage에 consent 값이 있으면 배너 숨김
      // 왜: 매 방문마다 배너가 뜨면 UX 저해
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted"));
      await page.goto("/");
      await expect(page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.")).not.toBeVisible();
    });

    test("거부 후 재방문 시에도 배너가 미노출된다", async ({ page }) => {
      // 무엇을: rejected 상태 유지 확인
      // 왜: 거부 선택도 기억되어야 함
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("cookie-consent", "rejected"));
      await page.goto("/");
      await expect(page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 배너가 하단 네비게이션 위에 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 배너가 BottomNav와 겹치지 않고 위에 위치
      // 왜: 모바일 주 타겟 기기에서 배너가 네비게이션을 가리면 안 됨
      await page.goto("/");
      const banner = page.getByText("더 나은 서비스 경험을 위해 쿠키를 사용합니다.");
      await expect(banner).toBeVisible();

      const acceptBtn = page.getByRole("button", { name: "동의" });
      await expect(acceptBtn).toBeVisible();
    });
  });
});
