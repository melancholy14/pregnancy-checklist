import { test, expect } from "@playwright/test";

test.describe("체중 기록 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/weight");
  });

  test.describe("Happy Path", () => {
    test("제목과 설명이 렌더링된다", async ({ page }) => {
      // 무엇을: 체중 기록 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "체중 기록" })).toBeVisible();
      await expect(page.getByText("임신 중 체중 변화를 기록하고 확인하세요")).toBeVisible();
    });

    test("기록이 없으면 빈 상태가 표시된다", async ({ page }) => {
      // 무엇을: 초기 상태에서 안내 메시지 표시
      // 왜: 사용자에게 다음 행동 유도
      await expect(page.getByText("아직 기록이 없어요")).toBeVisible();
    });

    test("FAB 버튼이 보인다", async ({ page }) => {
      // 무엇을: 체중 추가 FAB 버튼 표시
      // 왜: 핵심 인터랙션 진입점
      const fab = page.locator("button.fixed");
      await expect(fab).toBeVisible();
    });

    test("FAB 클릭 시 추가 폼이 표시된다", async ({ page }) => {
      // 무엇을: 폼이 열리고 날짜/체중 입력 필드가 보이는지
      // 왜: 데이터 입력 UI 정상 동작
      await page.locator("button.fixed").click();
      await expect(page.getByText("새 기록 추가")).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
      await expect(page.locator('input[type="number"]')).toBeVisible();
      await expect(page.getByRole("button", { name: "추가" })).toBeVisible();
    });

    test("체중을 추가하면 목록에 표시된다", async ({ page }) => {
      // 무엇을: 체중 입력 → 목록 반영 전체 흐름
      // 왜: 핵심 기능 end-to-end 검증
      await page.locator("button.fixed").click();
      await page.locator('input[type="date"]').fill("2026-03-29");
      await page.locator('input[type="number"]').fill("62.5");
      await page.getByRole("button", { name: "추가" }).click();

      await expect(page.getByRole("strong").filter({ hasText: "62.5" })).toBeVisible();
      await expect(page.getByText(/2026년 3월 29일/)).toBeVisible();
    });

    test("차트에 출처 및 면책 고지가 표시된다", async ({ page }) => {
      // 무엇을: 체중 기록 추가 후 차트 영역에 출처가 표시되는지
      // 왜: Phase 1 의료 면책 요구사항
      // 먼저 데이터 2개 추가 (차트 + 참조선 표시 조건)
      await page.locator("button.fixed").click();
      await page.locator('input[type="date"]').fill("2026-03-01");
      await page.locator('input[type="number"]').fill("60");
      await page.getByRole("button", { name: "추가" }).click();

      await page.locator("button.fixed").click();
      await page.locator('input[type="date"]').fill("2026-03-15");
      await page.locator('input[type="number"]').fill("61.5");
      await page.getByRole("button", { name: "추가" }).click();

      await expect(page.getByText(/대한산부인과학회/)).toBeVisible();
      await expect(page.getByText(/의료적 조언이 아닙니다/)).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("날짜나 체중 없이 추가하면 동작하지 않는다", async ({ page }) => {
      // 무엇을: 입력값 없이 추가 버튼 클릭 시 폼이 닫히지 않는지
      // 왜: 불완전 데이터 방지
      await page.locator("button.fixed").click();
      await page.getByRole("button", { name: "추가" }).click();
      // 폼이 여전히 보여야 함 (닫히지 않음)
      await expect(page.getByText("새 기록 추가")).toBeVisible();
      // 기록 목록에 아무것도 추가되지 않아야 함 (날짜/체중 필드가 비어있으므로)
      await expect(page.locator('input[type="date"]')).toHaveValue("");
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 빈 상태와 FAB가 정상 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 핵심 UI 표시
      // 왜: 주요 타겟 기기
      await expect(page.getByText("아직 기록이 없어요")).toBeVisible();
      await expect(page.locator("button.fixed")).toBeVisible();
    });
  });
});
