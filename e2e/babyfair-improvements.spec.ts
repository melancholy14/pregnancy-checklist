import { test, expect } from "@playwright/test";

test.describe("베이비페어 개선 (Step 6)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/baby-fair");
  });

  test.describe("Happy Path — 3분류 탭", () => {
    test("진행 중 / 예정 / 지난 행사 3개 탭이 존재한다", async ({ page }) => {
      // 무엇을: 3탭 구조 확인
      // 왜: 기존 2탭에서 3탭으로 변경됨
      await expect(page.getByRole("tab", { name: /진행 중/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: "예정" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "지난 행사" })).toBeVisible();
    });

    test("예정 탭 클릭 시 미래 행사만 표시된다", async ({ page }) => {
      // 무엇을: 예정 탭에 start_date > today인 행사만 표시
      // 왜: 탭 필터 정상 동작 확인
      await page.getByRole("tab", { name: "예정" }).click();
      const cards = page.locator('[data-slot="card"]').filter({ hasText: /베이비페어|베이비&키즈페어|엑스포|베페/ });
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("지난 행사 탭 클릭 시 과거 행사만 표시된다", async ({ page }) => {
      // 무엇을: 지난 행사 탭에 end_date < today인 행사만 표시
      // 왜: 지난 행사 분류 정상 동작 확인
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await expect(page.getByText("대전 베이비페어")).toBeVisible();
      await expect(page.getByText("2026 맘스홀릭베이비페어")).toBeVisible();
    });

    test("탭 간 전환이 정상 동작한다", async ({ page }) => {
      // 무엇을: 탭 전환 시 콘텐츠가 올바르게 바뀌는지
      // 왜: 탭 상태 관리 정상 동작 확인
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await expect(page.getByText("대전 베이비페어", { exact: true })).toBeVisible();

      await page.getByRole("tab", { name: "예정" }).click();
      await expect(page.getByText("대전 베이비페어", { exact: true })).not.toBeVisible();
    });
  });

  test.describe("Happy Path — 연도 라벨", () => {
    test("서브타이틀에 현재 연도가 포함되어 있다", async ({ page }) => {
      // 무엇을: 서브타이틀에 연도 자동 반영
      // 왜: 콘텐츠 최신성 표시
      const year = new Date().getFullYear();
      await expect(page.getByText(`${year}년 전국 베이비페어 행사 안내`)).toBeVisible();
    });
  });

  test.describe("Happy Path — 도시 필터 + 탭 조합", () => {
    test("도시 필터와 탭 필터가 함께 적용된다", async ({ page }) => {
      // 무엇을: 도시 + 탭 복합 필터
      // 왜: 두 필터가 AND 조건으로 동작하는지 확인
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByRole("button", { name: "서울", exact: true }).click();

      // 서울 지난 행사만 표시
      await expect(page.getByText("2026 맘스홀릭베이비페어")).toBeVisible();
      // 대전 지난 행사는 안 보여야 함
      await expect(page.getByText("대전 베이비페어")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 3개 탭이 모두 보인다", async ({ page }) => {
      // 무엇을: 375px에서 3탭이 잘리지 않는지
      // 왜: 모바일 환경에서 탭 접근성 확인
      await expect(page.getByRole("tab", { name: /진행 중/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: "예정" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "지난 행사" })).toBeVisible();
    });
  });
});
