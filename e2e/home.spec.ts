import { test, expect } from "@playwright/test";

test.describe("홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Happy Path", () => {
    test("히어로 섹션이 렌더링된다", async ({ page }) => {
      // 무엇을: 히어로 섹션의 제목과 설명이 보이는지
      // 왜: 서비스 첫 화면의 핵심 요소
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByText("소중한 아기를 위한 완벽한 준비")).toBeVisible();
    });

    test("출산 예정일 입력 카드가 보인다", async ({ page }) => {
      // 무엇을: 예정일 입력 UI가 정상 렌더링되는지
      // 왜: 핵심 퍼널 진입점
      await expect(page.getByText("출산 예정일을 입력하세요")).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
    });

    test("출산 예정일을 입력하면 대시보드가 표시된다", async ({ page }) => {
      // 무엇을: 예정일 입력 후 현재 주차, D-day, 진행률이 표시되는지
      // 왜: 예정일 입력이 대시보드 활성화의 핵심 트리거
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];

      await page.locator('input[type="date"]').fill(dateStr);
      await expect(page.getByText(/현재 임신/)).toBeVisible();
      // 대시보드: 체크리스트 진행률 (링크가 /timeline으로 변경됨)
      await expect(page.getByText("체크리스트 진행률")).toBeVisible();
      // D-day 카드
      await expect(page.getByText("D-day")).toBeVisible();
    });

    test("4개 기능 카드가 보인다", async ({ page }) => {
      // 무엇을: 하단 기능 그리드에 4개 링크가 있는지
      // 왜: Phase 1.5에서 체크리스트 카드 제거 (타임라인에 통합)
      const grid = page.locator(".grid");
      await expect(grid.getByRole("link", { name: "타임라인" })).toBeVisible();
      await expect(grid.getByRole("link", { name: "베이비페어" })).toBeVisible();
      await expect(grid.getByRole("link", { name: "체중 기록" })).toBeVisible();
      await expect(grid.getByRole("link", { name: "영상" })).toBeVisible();
    });

    test("타임라인 카드 클릭 시 /timeline으로 이동한다", async ({ page }) => {
      // 무엇을: 기능 카드가 올바른 경로로 라우팅되는지
      // 왜: 네비게이션 정상 동작 확인
      await page.getByRole("link", { name: "타임라인" }).first().click();
      await expect(page).toHaveURL(/\/timeline/);
    });

    test("대시보드 이번 주 할 일에 커스텀 타임라인 항목이 반영된다", async ({ page }) => {
      // 무엇을: 타임라인에서 추가한 커스텀 항목이 홈 대시보드에 표시되는지
      // 왜: 대시보드와 타임라인 데이터 정합성 검증

      // 1. 예정일 입력 (현재 주차 계산)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];
      await page.locator('input[type="date"]').fill(dateStr);
      await expect(page.getByText(/현재 임신/)).toBeVisible();

      // 2. 타임라인으로 이동하여 현재 주차에 커스텀 항목 추가
      await page.goto("/timeline");
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[value="timeline"]').click();

      // 현재 주차 계산 (40주 - 남은 일수/7)
      const remainingDays = 100;
      const currentWeek = Math.max(1, 40 - Math.floor(remainingDays / 7));
      await page.locator('input[type="number"]').fill(String(currentWeek));
      await page.getByPlaceholder("일정을 입력하세요").fill("대시보드 테스트 항목");
      await page.getByRole("button", { name: "추가하기" }).click();
      await expect(page.getByText("대시보드 테스트 항목")).toBeVisible();

      // 3. 홈으로 돌아가서 확인
      await page.goto("/");
      await expect(page.getByText("이번 주 할 일")).toBeVisible();
      await expect(page.getByText("대시보드 테스트 항목")).toBeVisible();
    });
  });

  test.describe("피드백 배너", () => {
    test("피드백 배너 링크가 새 탭으로 열리도록 설정되어 있다", async ({ page }) => {
      // 무엇을: 피드백 링크의 target="_blank" 속성 확인
      // 왜: 사용자가 현재 페이지를 벗어나지 않도록
      const feedbackLink = page.getByRole("link", { name: "의견을 들려주세요" });
      await expect(feedbackLink).toBeVisible();
      await expect(feedbackLink).toHaveAttribute("target", "_blank");
      await expect(feedbackLink).toHaveAttribute("rel", /noopener/);
    });
  });

  test.describe("온보딩 / 미입력 상태", () => {
    test("예정일 미입력 시 입력 유도 카드가 표시된다", async ({ page }) => {
      // 무엇을: 예정일 없이 방문 시 유도 안내가 보이는지
      // 왜: 예정일이 핵심 데이터이므로 미입력 시 유도 필수
      await expect(page.getByText("예정일을 입력하면 나에게 맞는 체크리스트와 타임라인을 볼 수 있어요")).toBeVisible();
    });

    test("예정일 입력 후 유도 카드가 사라진다", async ({ page }) => {
      // 무엇을: 예정일 입력 후 유도 안내가 숨겨지는지
      // 왜: 입력 완료 시 불필요한 UI 제거
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];

      await page.locator('input[type="date"]').fill(dateStr);
      await expect(page.getByText("예정일을 입력하면 나에게 맞는 체크리스트와 타임라인을 볼 수 있어요")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 히어로와 기능 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px 모바일에서 핵심 UI가 보이는지
      // 왜: 타겟 유저(임산부)의 주요 접근 기기
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
      const grid = page.locator(".grid");
      await expect(grid.getByRole("link", { name: "타임라인" })).toBeVisible();
    });
  });
});
