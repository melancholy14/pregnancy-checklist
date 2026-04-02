import { test, expect } from "@playwright/test";

test.describe("타임라인 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test.describe("Happy Path", () => {
    test("제목이 렌더링된다", async ({ page }) => {
      // 무엇을: 타임라인 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(page.getByText("주차별 중요한 순간들을 확인하세요")).toBeVisible();
    });

    test("JSON 기반 타임라인 항목들이 주차순으로 표시된다", async ({ page }) => {
      // 무엇을: timeline_items.json의 항목들이 카드로 렌더링되는지
      // 왜: Phase 1에서 마일스톤 5개 → 30+ 개별 카드로 전환됨
      await expect(page.getByText("임신 확인 후 기본 일정 잡기")).toBeVisible();
      await expect(page.getByText("4주", { exact: true })).toBeVisible();
    });

    test("마지막에 40주 메시지가 보인다", async ({ page }) => {
      // 무엇을: 최하단 40주 안내
      // 왜: 타임라인 끝점 확인
      await expect(page.getByText(/40주차/)).toBeVisible();
    });

    test("커스텀 항목을 추가할 수 있다", async ({ page }) => {
      // 무엇을: FAB → 폼 → 항목 추가 전체 흐름
      // 왜: Phase 1 핵심 신규 기능
      await page.locator('button[aria-label="항목 추가"]').click();

      // 폼 표시 확인
      await expect(page.getByPlaceholder("할 일을 입력하세요")).toBeVisible();

      // 주차 + 제목 입력 후 추가
      await page.locator('input[type="number"]').fill("20");
      await page.getByPlaceholder("할 일을 입력하세요").fill("테스트 타임라인 항목");
      await page.getByRole("button", { name: "추가", exact: true }).click();

      // 추가된 항목 확인
      await expect(page.getByText("테스트 타임라인 항목")).toBeVisible();
      // 내 항목 배지
      await expect(page.getByText("내 항목")).toBeVisible();
    });

    test("커스텀 항목은 삭제할 수 있다", async ({ page }) => {
      // 무엇을: 커스텀 항목에만 삭제 버튼이 있고 삭제 가능한지
      // 왜: 기본 항목은 보호, 커스텀만 삭제 가능
      // 먼저 추가
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[type="number"]').fill("15");
      await page.getByPlaceholder("할 일을 입력하세요").fill("삭제 테스트");
      await page.getByRole("button", { name: "추가", exact: true }).click();

      await expect(page.getByText("삭제 테스트")).toBeVisible();

      // 삭제 - 커스텀 항목이 포함된 카드에서 삭제 버튼 찾기
      const card = page.locator('[data-slot="card"]').filter({ hasText: "삭제 테스트" });
      await card.locator('button[aria-label="삭제"]').click();

      await expect(page.getByText("삭제 테스트")).not.toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("빈 제목으로는 추가할 수 없다", async ({ page }) => {
      // 무엇을: 제목 없이 추가 버튼이 비활성화되는지
      // 왜: 빈 항목 방지
      await page.locator('button[aria-label="항목 추가"]').click();
      const addButton = page.getByRole("button", { name: "추가", exact: true });
      await expect(addButton).toBeDisabled();
    });

    test("기본 항목에는 삭제 버튼이 없다", async ({ page }) => {
      // 무엇을: JSON 기본 항목에 삭제 아이콘이 없는지
      // 왜: 기본 데이터 보호
      const firstCard = page.getByText("임신 확인 후 기본 일정 잡기").locator("..").locator("..");
      await expect(firstCard.locator('button[aria-label="삭제"]')).not.toBeVisible();
    });
  });

  test.describe("온보딩 배너", () => {
    test("예정일 미입력 시 DueDateBanner가 표시된다", async ({ page }) => {
      // 무엇을: 배너로 예정일 입력을 유도하는지
      // 왜: 주차 기반 시각 구분에 예정일 필요
      await expect(page.getByText("예정일을 입력하면 나에게 맞는 정보를 볼 수 있어요")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 타임라인 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 카드가 보이고 FAB가 접근 가능한지
      // 왜: 주요 타겟 기기
      await expect(page.getByText("임신 확인 후 기본 일정 잡기")).toBeVisible();
      await expect(page.locator('button[aria-label="항목 추가"]')).toBeVisible();
    });
  });
});
