import { test, expect } from "@playwright/test";

test.describe("아티클 authorNote 카드 (Step 14)", () => {
  test.describe("Happy Path", () => {
    test("authorNote가 있는 아티클에서 '만든이의 한마디' 카드가 표시된다", async ({
      page,
    }) => {
      // 무엇을: hospital-bag 아티클에서 authorNote 카드가 보이는지
      // 왜: authorNote가 있는 아티클에서는 반드시 카드가 렌더링되어야 함
      await page.goto("/articles/hospital-bag");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("블로그마다 리스트가 달라서 짜증났어요"),
      ).toBeVisible();
    });

    test("authorNote 카드가 제목/메타 아래, 본문 위에 위치한다", async ({
      page,
    }) => {
      // 무엇을: authorNote 카드의 DOM 위치가 올바른지
      // 왜: PRD에서 제목과 본문 사이에 삽입 요구
      await page.goto("/articles/hospital-bag");
      const card = page.locator("text=만든이의 한마디");
      const prose = page.locator(".article-prose");
      await expect(card).toBeVisible();
      await expect(prose).toBeVisible();

      const cardBox = await card.boundingBox();
      const proseBox = await prose.boundingBox();
      expect(cardBox!.y).toBeLessThan(proseBox!.y);
    });

    test("authorNote 카드에 따뜻한 톤 스타일이 적용된다", async ({ page }) => {
      // 무엇을: 카드에 PRD 지정 스타일 클래스가 있는지
      // 왜: bg-[#FFF4D4]/15, border, rounded-xl 디자인 요구
      await page.goto("/articles/hospital-bag");
      const card = page.locator(".rounded-xl", {
        hasText: "만든이의 한마디",
      });
      await expect(card).toBeVisible();
      await expect(card).toHaveClass(/border/);
    });

    test("baby-items-cost 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: 다른 아티클에서도 authorNote가 정상 표시되는지
      // 왜: 5개 아티클 모두 동작 확인
      await page.goto("/articles/baby-items-cost");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("스프레드시트로 정리했던 걸 그대로 옮겼어요"),
      ).toBeVisible();
    });

    test("early-pregnancy-tests 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: early-pregnancy-tests authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/early-pregnancy-tests");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("어떤 검사를 언제 받아야 하는지 너무 헷갈렸어요"),
      ).toBeVisible();
    });

    test("postpartum-care 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: postpartum-care authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/postpartum-care");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("뭘 기준으로 비교해야 하는지 몰라서 한참 헤맸어요"),
      ).toBeVisible();
    });

    test("pregnancy-weight-management 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: pregnancy-weight-management authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/pregnancy-weight-management");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("정상 범위가 어디까지인지 정리해봤습니다"),
      ).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("authorNote가 없는 아티클에서는 카드가 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: authorNote 미설정 아티클에서 카드 미렌더링 확인
      // 왜: authorNote가 없는 아티클에서 빈 카드가 보이면 안 됨
      await page.goto("/articles/infant-vaccination-schedule");
      await expect(page.getByText("만든이의 한마디")).not.toBeVisible();
    });

    test("authorNote가 없는 newborn-bath-tips에서도 카드가 없다", async ({
      page,
    }) => {
      // 무엇을: 또 다른 미설정 아티클 확인
      // 왜: 복수 아티클에서 미렌더링 일관성 검증
      await page.goto("/articles/newborn-bath-tips");
      await expect(page.getByText("만든이의 한마디")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: authorNote 카드가 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 카드 텍스트가 모두 보이는지
      // 왜: 주요 타겟 기기에서 레이아웃 깨짐 방지
      await page.goto("/articles/hospital-bag");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("블로그마다 리스트가 달라서 짜증났어요"),
      ).toBeVisible();
    });

    test("모바일: authorNote가 없는 아티클에서는 카드 미표시", async ({
      page,
    }) => {
      // 무엇을: 모바일에서도 미설정 아티클의 카드 미렌더링 확인
      // 왜: 반응형에서도 조건부 렌더링 동작 검증
      await page.goto("/articles/infant-vaccination-schedule");
      await expect(page.getByText("만든이의 한마디")).not.toBeVisible();
    });
  });
});
