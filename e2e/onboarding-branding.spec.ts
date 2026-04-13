import { test, expect } from "@playwright/test";

test.describe("온보딩 톤 변경 (Step 12)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("onboarding-completed"));
    await page.goto("/");
  });

  test.describe("Happy Path", () => {
    test("WelcomeStep h1이 1인칭 인사로 변경되었다", async ({ page }) => {
      // 무엇을: "출산 준비, 빠짐없이 챙기세요" → "안녕하세요!" 변경 확인
      // 왜: 3인칭 서비스 톤에서 1인칭 당사자 톤으로 전환
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).toBeVisible();
    });

    test("WelcomeStep 서브 텍스트에 당사자성 카피가 표시된다", async ({ page }) => {
      // 무엇을: onboardingGreeting 서브 텍스트 표시
      // 왜: "누가 왜 만들었는지"를 첫 화면에서 전달
      await expect(page.getByText("저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요.")).toBeVisible();
    });

    test("WelcomeStep highlights가 유저 관점 혜택으로 변경되었다", async ({ page }) => {
      // 무엇을: highlights 배열이 기능 나열 → 혜택 표현으로 변경
      // 왜: 유저가 "뭘 할 수 있는지" 직관적으로 이해
      await expect(page.getByText("주차별로 뭘 해야 하는지 정리")).toBeVisible();
      await expect(page.getByText("전국 베이비페어 일정 모음")).toBeVisible();
      await expect(page.getByText("체중 기록 & 출산 정보까지")).toBeVisible();
    });

    test("ReadyStep 타이틀에 브랜딩 카피가 반영되었다", async ({ page }) => {
      // 무엇을: "준비 완료!" → "준비 완료! 같이 챙겨봐요" 변경 확인
      // 왜: 마지막 단계에서도 당사자 톤 유지
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();
      await page.getByRole("button", { name: "예정일 나중에 입력하기" }).click();
      await expect(page.getByRole("heading", { name: "준비 완료! 같이 챙겨봐요" })).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 브랜딩 카피가 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 서브 텍스트가 잘리지 않는지
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).toBeVisible();
      await expect(page.getByText("저도 초산이라")).toBeVisible();
    });
  });
});
