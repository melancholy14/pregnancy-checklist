import { test, expect } from "@playwright/test";

test.describe("Contact 페이지 톤 변경 (Step 15)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test.describe("Happy Path", () => {
    test("페이지 타이틀이 '의견 보내기'로 표시된다", async ({ page }) => {
      // 무엇을: h1이 "의견 보내기"인지 확인
      // 왜: 기존 "연락처" → "의견 보내기" 변경이 핵심
      await expect(
        page.getByRole("heading", { level: 1, name: "의견 보내기" }),
      ).toBeVisible();
    });

    test("1인 당사자 톤 카피가 표시된다", async ({ page }) => {
      // 무엇을: 기업 화법 대신 당사자 톤 텍스트가 보이는지
      // 왜: 톤 변경의 핵심 가치
      await expect(
        page.getByText("혼자 만들다 보니 놓치는 것도 많아요."),
      ).toBeVisible();
      await expect(
        page.getByText(/다 환영합니다/),
      ).toBeVisible();
    });

    test("피드백 폼 링크가 존재한다", async ({ page }) => {
      // 무엇을: 의견 보내기 버튼이 외부 폼으로 연결되는지
      // 왜: 피드백 채널 유지 필수
      const link = page.getByRole("link", { name: "의견 보내기 폼으로 이동" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("target", "_blank");
    });

    test("이메일 섹션에 당사자 톤과 mailto 링크가 있다", async ({ page }) => {
      // 무엇을: 이메일 섹션 톤 변경 + mailto 링크 확인
      // 왜: "문의사항이 있으시면" → "직접 연락 주셔도 돼요" 변경
      await expect(
        page.getByRole("heading", { name: "이메일" }),
      ).toBeVisible();
      await expect(
        page.getByText("직접 연락 주셔도 돼요."),
      ).toBeVisible();
      const emailLink = page.getByRole("link", { name: "이메일 보내기" });
      await expect(emailLink).toBeVisible();
      await expect(emailLink).toHaveAttribute(
        "href",
        "mailto:melancholy8914@gmail.com",
      );
    });
  });

  test.describe("Error / Validation", () => {
    test("기존 '연락처' 타이틀이 더 이상 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 기존 타이틀 제거 확인
      // 왜: 리뉴얼 후 이전 톤이 남아있으면 안 됨
      await expect(
        page.getByRole("heading", { name: "연락처" }),
      ).not.toBeVisible();
    });

    test("기업 화법 '소중한 의견' 문구가 제거되었다", async ({ page }) => {
      // 무엇을: 기존 기업 화법 텍스트 제거 확인
      // 왜: 톤 변경 목적 달성 검증
      await expect(
        page.getByText("여러분의 소중한 의견을 기다립니다"),
      ).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 전체 섹션이 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 핵심 요소가 모두 보이는지
      // 왜: 주요 타겟 기기에서 레이아웃 깨짐 방지
      await expect(
        page.getByRole("heading", { level: 1, name: "의견 보내기" }),
      ).toBeVisible();
      await expect(
        page.getByText("혼자 만들다 보니"),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "이메일 보내기" }),
      ).toBeVisible();
    });
  });
});
