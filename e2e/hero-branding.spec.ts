import { test, expect } from "@playwright/test";

test.describe("히어로 카피 & 톤 리뉴얼 (Step 10)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
    await page.goto("/");
  });

  test.describe("Happy Path", () => {
    test("히어로 타이틀이 SEO 앵커로 유지된다", async ({ page }) => {
      // 무엇을: h1 "출산 준비 체크리스트"가 변경되지 않았는지
      // 왜: SEO 메인 키워드로 절대 변경 불가
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
    });

    test("브랜딩 서브 카피가 표시된다", async ({ page }) => {
      // 무엇을: "답답해서 직접 만들었습니다" 서브 카피
      // 왜: 병원 브로셔 톤에서 당사자성 강조로 전환
      await expect(page.getByText("답답해서 직접 만들었습니다")).toBeVisible();
    });

    test("히어로 캡션이 표시된다", async ({ page }) => {
      // 무엇을: "초산 임신 중인 개발자의 출산 준비 기록" 캡션
      // 왜: 당사자성을 구체적으로 전달하는 보조 텍스트
      await expect(page.getByText("초산 임신 중인 개발자의 출산 준비 기록")).toBeVisible();
    });

    test("하단 모티베이션 카피가 변경되었다", async ({ page }) => {
      // 무엇을: "같이 준비하면 덜 막막하니까요" 모티베이션 텍스트
      // 왜: 클리셰("출산은 인생에서 가장 특별한 순간") 탈피
      await expect(page.getByText("같이 준비하면 덜 막막하니까요")).toBeVisible();
      await expect(page.getByText("출산은 인생에서 가장 특별한 순간입니다")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 히어로 영역이 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 히어로 전체 요소가 보이는지
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByText("답답해서 직접 만들었습니다")).toBeVisible();
      await expect(page.getByText("초산 임신 중인 개발자의 출산 준비 기록")).toBeVisible();
    });
  });
});
