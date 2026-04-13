import { test, expect } from "@playwright/test";

test.describe("체크리스트 주차 미존재 버그 수정 (Step 8)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
    // 이전 커스텀 데이터 초기화
    await page.evaluate(() => {
      localStorage.removeItem("checklist-storage");
      localStorage.removeItem("timeline-storage");
    });
    await page.reload();
  });

  test.describe("Happy Path", () => {
    test("존재하는 주차에 체크리스트 추가 시 AlertDialog 없이 바로 추가된다", async ({ page }) => {
      // 무엇을: 타임라인 항목이 있는 주차(예: 4주)에 체크리스트 추가
      // 왜: 기존 정상 플로우가 깨지지 않았는지 확인
      await page.locator('button[aria-label="항목 추가"]').click();

      // 체크리스트 유형 선택 (기본값이지만 명시적으로)
      await page.locator('input[value="checklist"]').click();
      await page.locator('input[type="number"]').fill("4");
      await page.getByPlaceholder("할 일을 입력하세요").fill("정상 추가 테스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      // AlertDialog가 표시되지 않고 바로 추가됨
      await expect(page.locator('[data-slot="alert-dialog-content"]')).not.toBeVisible();

      // 폼이 닫히고, store에 저장되었는지 확인
      await expect(page.getByPlaceholder("할 일을 입력하세요")).not.toBeVisible();
      // 4주차 카드의 체크리스트 요약이 표시되고, 클릭하면 항목이 보임
      const week4Card = page.locator("#timeline-week-4");
      await expect(week4Card.getByText("체크리스트 1개")).toBeVisible();
      await week4Card.getByText("체크리스트 1개").click();
      await expect(week4Card.getByText("정상 추가 테스트")).toBeVisible();
    });

    test("존재하지 않는 주차에 체크리스트 추가 시 AlertDialog가 표시된다", async ({ page }) => {
      // 무엇을: 타임라인 항목이 없는 주차(예: 1주)에 체크리스트 추가 시도
      // 왜: 핵심 버그 수정 — 유저에게 피드백 없이 데이터가 사라지는 문제 방지
      await page.locator('button[aria-label="항목 추가"]').click();

      await page.locator('input[value="checklist"]').click();
      await page.locator('input[type="number"]').fill("1");
      await page.getByPlaceholder("할 일을 입력하세요").fill("1주차 할일");
      await page.getByRole("button", { name: "추가하기" }).click();

      // AlertDialog 표시 확인
      const dialog = page.locator('[data-slot="alert-dialog-content"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("1주차에 타임라인 항목이 없습니다")).toBeVisible();
      await expect(dialog.getByText("주차를 먼저 추가해야 할일이 표시됩니다")).toBeVisible();
    });

    test("AlertDialog에서 '주차 추가하고 할일 넣기' 클릭 시 주차와 할일이 모두 추가된다", async ({ page }) => {
      // 무엇을: 자동 주차 생성 + 체크리스트 추가 흐름
      // 왜: 유저가 한 번의 동작으로 주차 + 할일을 함께 추가할 수 있어야 함
      await page.locator('button[aria-label="항목 추가"]').click();

      await page.locator('input[value="checklist"]').click();
      await page.locator('input[type="number"]').fill("3");
      await page.getByPlaceholder("할 일을 입력하세요").fill("3주차 자동 추가 테스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      // AlertDialog에서 확인 클릭
      const dialog = page.locator('[data-slot="alert-dialog-content"]');
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "주차 추가하고 할일 넣기" }).click();

      // 폼이 닫히고, 3주차 타임라인 카드가 생성됨
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText("3주차")).toBeVisible();
      // 3주차 카드를 열어 체크리스트 항목 확인
      await page.getByText("3주차").first().click();
      await expect(page.getByText("3주차 자동 추가 테스트")).toBeVisible();
    });

    test("AlertDialog에서 '취소' 클릭 시 폼으로 돌아간다", async ({ page }) => {
      // 무엇을: 취소 시 폼 상태 유지
      // 왜: 유저가 주차를 변경할 기회를 줘야 함
      await page.locator('button[aria-label="항목 추가"]').click();

      await page.locator('input[value="checklist"]').click();
      await page.locator('input[type="number"]').fill("2");
      await page.getByPlaceholder("할 일을 입력하세요").fill("취소 테스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      // AlertDialog에서 취소 클릭
      const dialog = page.locator('[data-slot="alert-dialog-content"]');
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "취소" }).click();

      // 다이얼로그 닫히고 폼은 그대로 유지
      await expect(dialog).not.toBeVisible();
      await expect(page.getByPlaceholder("할 일을 입력하세요")).toBeVisible();
      await expect(page.getByPlaceholder("할 일을 입력하세요")).toHaveValue("취소 테스트");
    });

    test("타임라인 항목 추가 시에는 주차 존재 여부 확인이 없다", async ({ page }) => {
      // 무엇을: 타임라인(일정) 유형 추가는 주차 확인 없이 바로 추가
      // 왜: 타임라인 항목은 자체가 주차를 만드므로 확인 불필요
      await page.locator('button[aria-label="항목 추가"]').click();

      await page.locator('input[value="timeline"]').click();
      await page.locator('input[type="number"]').fill("1");
      await page.getByPlaceholder("일정을 입력하세요").fill("타임라인 직접 추가");
      await page.getByRole("button", { name: "추가하기" }).click();

      // AlertDialog 없이 바로 추가
      await expect(page.locator('[data-slot="alert-dialog-content"]')).not.toBeVisible();
      await expect(page.getByText("타임라인 직접 추가")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: AlertDialog가 화면 내에 정상 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 AlertDialog가 잘리지 않는지
      // 왜: 주요 타겟 기기에서 다이얼로그 접근성 확인
      await page.locator('button[aria-label="항목 추가"]').click();

      await page.locator('input[value="checklist"]').click();
      await page.locator('input[type="number"]').fill("1");
      await page.getByPlaceholder("할 일을 입력하세요").fill("모바일 테스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      const dialog = page.locator('[data-slot="alert-dialog-content"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toBeInViewport();
      await expect(dialog.getByRole("button", { name: "주차 추가하고 할일 넣기" })).toBeVisible();
    });
  });
});
