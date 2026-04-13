import { test, expect } from "@playwright/test";

test.describe("타임라인 ↔ 블로그 크로스 링크", () => {
  test.describe("Happy Path — 타임라인 → 블로그", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/timeline");
    });

    test("linked_article_slugs가 있는 카드에 관련 글 링크가 표시된다", async ({ page }) => {
      // 무엇을: 32주차 카드에 "출산 가방 필수 준비물 총정리" 링크가 있는지
      // 왜: 타임라인 → 블로그 크로스 링크 기본 동작 확인
      const card = page.locator('[id="timeline-week-32"]');
      await expect(card.getByText("관련 글")).toBeVisible();
      await expect(card.getByRole("link", { name: /출산 가방 필수 준비물 총정리/ })).toBeVisible();
    });

    test("관련 글 링크를 클릭하면 해당 아티클 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 관련 글 링크 클릭 → 아티클 상세 페이지 이동
      // 왜: 크로스 링크가 실제로 동작하는지 검증
      const card = page.locator('[id="timeline-week-32"]');
      await card.getByRole("link", { name: /출산 가방 필수 준비물 총정리/ }).click();
      await expect(page).toHaveURL(/\/articles\/hospital-bag/);
      await expect(page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })).toBeVisible();
    });

    test("linked_article_slugs가 없는 카드에는 관련 글 영역이 없다", async ({ page }) => {
      // 무엇을: 6주차 카드에 관련 글이 없는지
      // 왜: 링크 매핑이 없는 주차에는 UI가 나타나지 않아야 함
      const card = page.locator('[id="timeline-week-6"]');
      await expect(card.getByText("관련 글")).not.toBeVisible();
    });

    test("4주차 카드에 임신 초기 필수 검사 관련 글이 표시된다", async ({ page }) => {
      // 무엇을: 4주차 → early-pregnancy-tests 매핑 확인
      // 왜: 복수 주차에 같은 아티클이 매핑될 수 있음 (4, 8, 10주)
      const card = page.locator('[id="timeline-week-4"]');
      await expect(card.getByRole("link", { name: /임신 초기 필수 검사 총정리/ })).toBeVisible();
    });
  });

  test.describe("Happy Path — 블로그 → 타임라인", () => {
    test("아티클 하단에 타임라인 CTA가 표시된다", async ({ page }) => {
      // 무엇을: hospital-bag 아티클에 32주차, 36주차 연결 CTA
      // 왜: 블로그 → 타임라인 역방향 크로스 링크 확인
      await page.goto("/articles/hospital-bag");
      await expect(page.getByText("타임라인에서 체크하기")).toBeVisible();
      await expect(page.getByText(/32주차/)).toBeVisible();
      await expect(page.getByText(/36주차/)).toBeVisible();
    });

    test("타임라인 CTA 링크를 클릭하면 타임라인 페이지로 이동한다", async ({ page }) => {
      // 무엇을: CTA의 "타임라인 보기" 링크 동작
      // 왜: 역방향 링크가 실제로 동작하는지 검증
      await page.goto("/articles/hospital-bag");
      await page.getByRole("link", { name: /타임라인 보기/ }).click();
      await expect(page).toHaveURL(/\/timeline/);
    });

    test("linked_timeline_weeks가 없는 아티클에는 CTA가 없다", async ({ page }) => {
      // 무엇을: weekly-prep에 타임라인 CTA가 없는지
      // 왜: 매핑이 없는 아티클에는 CTA가 나타나지 않아야 함
      await page.goto("/articles/weekly-prep");
      await expect(page.getByText("타임라인에서 체크하기")).not.toBeVisible();
    });

    test("임신 초기 필수 검사 아티클에 4, 8, 10주차 CTA가 표시된다", async ({ page }) => {
      // 무엇을: early-pregnancy-tests → 4, 8, 10주차 매핑
      // 왜: 복수 주차 매핑이 올바르게 표시되는지 확인
      await page.goto("/articles/early-pregnancy-tests");
      await expect(page.getByText("타임라인에서 체크하기")).toBeVisible();
      await expect(page.getByText(/4주차/)).toBeVisible();
      await expect(page.getByText(/8주차/)).toBeVisible();
      await expect(page.getByText(/10주차/)).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 타임라인 관련 글 링크가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 관련 글 링크가 보이는지
      // 왜: 주요 타겟 기기에서 UI 깨짐 없이 표시 확인
      await page.goto("/timeline");
      const card = page.locator('[id="timeline-week-12"]');
      await expect(card.getByRole("link", { name: /산후조리원 선택 가이드/ })).toBeVisible();
    });

    test("모바일: 아티클 타임라인 CTA가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 타임라인 CTA가 보이는지
      // 왜: 모바일에서 CTA 영역이 잘리지 않는지 확인
      await page.goto("/articles/postpartum-care");
      await expect(page.getByText("타임라인에서 체크하기")).toBeVisible();
      await expect(page.getByRole("link", { name: /타임라인 보기/ })).toBeVisible();
    });
  });
});
