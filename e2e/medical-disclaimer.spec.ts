import { test, expect } from "@playwright/test";

test.describe("의료 디스클레이머 + reviewed_by 정리 (Step 0e)", () => {
  test.describe("Happy Path", () => {
    test("임신 검사 아티클에 산부인과 전문의 면책 문구가 노출된다", async ({ page }) => {
      // 무엇을: 의료 주제 아티클에 산부인과 전문의 안내 면책 문구 확인
      // 왜: YMYL 콘텐츠에 적절한 전문가 안내가 있어야 AdSense 심사 통과
      await page.goto("/articles/early-pregnancy-tests");

      const disclaimer = page.locator("text=산부인과 전문의와 상담하세요");
      await expect(disclaimer).toBeVisible();
    });

    test("보험 아티클에 보험설계사/재무설계 전문가 면책 문구가 노출된다", async ({ page }) => {
      // 무엇을: 재무 주제 아티클에 보험·재무 전문가 안내 면책 문구 확인
      // 왜: 보험 글에 의료 면책 문구를 쓰면 맥락이 안 맞음
      await page.goto("/articles/prenatal-insurance-preparation-guide");

      const disclaimer = page.locator("text=보험설계사 또는 재무설계 전문가와 상담하세요");
      await expect(disclaimer).toBeVisible();
    });

    test("출산 가방 아티클에 소아청소년과 전문의 면책 문구가 노출된다", async ({ page }) => {
      // 무엇을: 육아 주제 아티클에 소아청소년과 전문의 안내 확인
      // 왜: 글 주제와 면책 대상이 일치해야 신뢰도 향상
      await page.goto("/articles/hospital-bag");

      const disclaimer = page.locator("text=소아청소년과 전문의와 상담하세요");
      await expect(disclaimer).toBeVisible();
    });

    test("면책 문구가 본문 위에 카드 형태로 노출된다", async ({ page }) => {
      // 무엇을: MedicalDisclaimer가 article-prose 앞에 렌더링되는지 확인
      // 왜: 본문 상단에 면책 문구가 있어야 독자가 먼저 인지
      await page.goto("/articles/early-pregnancy-tests");

      await expect(page.getByText("ℹ️")).toBeVisible();
      await expect(page.getByText("안내").first()).toBeVisible();
    });

    test("본문 안에 blockquote 면책 문구가 중복 노출되지 않는다", async ({ page }) => {
      // 무엇을: 기존 MD 본문의 ⚠️ blockquote가 제거되었는지 확인
      // 왜: MedicalDisclaimer 컴포넌트와 blockquote가 중복되면 안 됨
      await page.goto("/articles/early-pregnancy-tests");

      const articleProse = page.locator(".article-prose");
      await expect(articleProse.locator("blockquote")).toHaveCount(0);
    });
  });

  test.describe("reviewed_by 제거 검증", () => {
    test("아티클 상세 페이지에 reviewed_by 관련 UI가 노출되지 않는다", async ({ page }) => {
      // 무엇을: reviewed_by 빈 문자열이 UI에 노출되지 않는지 확인
      // 왜: reviewed_by: "" 는 전문가 리뷰 미완료를 명시하는 것과 동일
      await page.goto("/articles/hospital-bag");

      await expect(page.getByText("reviewed_by")).not.toBeVisible();
      await expect(page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })).toBeVisible();
    });
  });

  test.describe("SSG 렌더링 검증", () => {
    test("면책 문구가 초기 HTML에 포함되어 있다 (JS 비활성화)", async ({ browser }) => {
      // 무엇을: JavaScript 없이도 면책 문구가 HTML에 포함되는지 확인
      // 왜: AdSense 심사 봇이 텍스트를 파싱할 수 있어야 함
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await page.goto("/articles/prenatal-insurance-preparation-guide");
      await expect(page.getByText("보험설계사 또는 재무설계 전문가와 상담하세요")).toBeVisible();

      await page.goto("/articles/early-pregnancy-tests");
      await expect(page.getByText("산부인과 전문의와 상담하세요")).toBeVisible();

      await context.close();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 면책 문구 카드가 정상 표시된다", async ({ page }) => {
      // 무엇을: 375px 모바일 화면에서 면책 문구가 깨지지 않는지 확인
      // 왜: 모바일 퍼스트 서비스이므로 좁은 화면에서도 가독성 확보 필요
      await page.goto("/articles/hospital-bag");

      await expect(page.getByText("소아청소년과 전문의와 상담하세요")).toBeVisible();
      await expect(page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })).toBeVisible();
    });
  });
});
