import { test, expect } from "@playwright/test";

test.describe("체크리스트 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/checklist");
  });

  test.describe("Happy Path", () => {
    test("제목과 진행률 바가 렌더링된다", async ({ page }) => {
      // 무엇을: 체크리스트 페이지 기본 UI 확인
      // 왜: 핵심 기능 페이지의 정상 렌더링 검증
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByText("전체 진행률")).toBeVisible();
      await expect(page.getByText(/\/\d+ 완료/)).toBeVisible();
    });

    test("5개 카테고리 탭이 보인다", async ({ page }) => {
      // 무엇을: 5개 카테고리 탭 표시
      // 왜: 카테고리 탭은 체크리스트의 핵심 네비게이션
      await expect(page.getByRole("tab", { name: /병원 준비/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /출산 가방/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /신생아 준비/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /산후 준비/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: /행정 준비/ })).toBeVisible();
    });

    test("체크리스트 항목에 priority 배지가 표시된다", async ({ page }) => {
      // 무엇을: 각 항목에 높음/보통/낮음 배지가 있는지
      // 왜: Phase 1에서 추가된 priority 배지 기능 검증
      await expect(page.getByText("높음").first()).toBeVisible();
    });

    test("항목 클릭 시 체크 상태가 토글된다", async ({ page }) => {
      // 무엇을: 체크박스 토글로 항목이 체크/해제되는지
      // 왜: 체크리스트의 핵심 인터랙션
      const item = page.getByText("산부인과 선택").locator("..");
      await item.click();
      await expect(page.getByText("산부인과 선택")).toHaveCSS("text-decoration-line", "line-through");
    });

    test("카테고리 탭 클릭 시 해당 카테고리 항목이 표시된다", async ({ page }) => {
      // 무엇을: 탭 전환으로 카테고리별 항목 필터링
      // 왜: 카테고리별 분류가 정상 동작하는지 확인
      await page.getByRole("tab", { name: /출산 가방/ }).click();
      await expect(page.getByText("산모 속옷 준비", { exact: true })).toBeVisible();
    });

    test("진행률이 체크 상태에 따라 변한다", async ({ page }) => {
      // 무엇을: 체크 시 진행률 숫자가 변경되는지
      // 왜: 진행률 실시간 반영은 핵심 피드백
      const progressText = page.getByText(/\/\d+ 완료/);
      const before = await progressText.textContent();

      await page.getByText("산부인과 선택").locator("..").click();
      const after = await progressText.textContent();

      expect(before).not.toEqual(after);
    });

    test("커스텀 항목을 추가할 수 있다", async ({ page }) => {
      // 무엇을: FAB → 폼 → 항목 추가 전체 흐름
      // 왜: Phase 1 핵심 신규 기능
      // FAB 버튼 클릭
      await page.locator('button[aria-label="항목 추가"]').click();

      // 폼 표시 확인
      await expect(page.getByPlaceholder("추가할 항목을 입력하세요")).toBeVisible();

      // 항목명 입력 후 추가
      await page.getByPlaceholder("추가할 항목을 입력하세요").fill("테스트 커스텀 항목");
      await page.getByRole("button", { name: "추가", exact: true }).click();

      // 추가된 항목 확인
      await expect(page.getByText("테스트 커스텀 항목")).toBeVisible();
    });

    test("커스텀 항목은 삭제할 수 있다", async ({ page }) => {
      // 무엇을: 커스텀 항목에만 삭제 버튼이 표시되고 삭제 가능한지
      // 왜: 기본 항목은 보호, 커스텀만 삭제 가능해야 함
      // 먼저 커스텀 항목 추가
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.getByPlaceholder("추가할 항목을 입력하세요").fill("삭제할 항목");
      await page.getByRole("button", { name: "추가", exact: true }).click();

      // 삭제 버튼 클릭
      const deleteButton = page.getByText("삭제할 항목").locator("..").locator("..").locator('button[aria-label="삭제"]');
      await deleteButton.click();

      // 항목이 사라졌는지 확인
      await expect(page.getByText("삭제할 항목")).not.toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("빈 항목명으로는 추가할 수 없다", async ({ page }) => {
      // 무엇을: 항목명 없이 추가 버튼이 비활성화되는지
      // 왜: 빈 항목 방지
      await page.locator('button[aria-label="항목 추가"]').click();
      const addButton = page.getByRole("button", { name: "추가", exact: true });
      await expect(addButton).toBeDisabled();
    });

    test("기본 항목에는 삭제 버튼이 없다", async ({ page }) => {
      // 무엇을: 기본 항목(isCustom이 아닌)에 삭제 아이콘이 없는지
      // 왜: 기본 데이터 보호
      const firstItem = page.getByText("산부인과 선택").locator("..").locator("..");
      await expect(firstItem.locator('button[aria-label="삭제"]')).not.toBeVisible();
    });
  });

  test.describe("온보딩 배너", () => {
    test("예정일 미입력 시 DueDateBanner가 표시된다", async ({ page }) => {
      // 무엇을: 예정일 없이 체크리스트 진입 시 배너가 보이는지
      // 왜: 예정일 입력 유도 (주차 하이라이트 등 기능에 필요)
      await expect(page.getByText("예정일을 입력하면 나에게 맞는 정보를 볼 수 있어요")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 탭과 항목이 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 모바일 뷰포트에서 탭 스크롤, 항목 표시 확인
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("tab", { name: /병원 준비/ })).toBeVisible();
      await expect(page.getByText("산부인과 선택")).toBeVisible();
    });
  });
});
