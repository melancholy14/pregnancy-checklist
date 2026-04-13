import { test, expect } from "@playwright/test";

test.describe("홈 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
    await page.goto("/");
  });

  test.describe("Happy Path", () => {
    test("히어로 섹션이 렌더링된다", async ({ page }) => {
      // 무엇을: 히어로 섹션의 제목과 설명이 보이는지
      // 왜: 서비스 첫 화면의 핵심 요소
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByText("답답해서 직접 만들었습니다")).toBeVisible();
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
      await expect(page.getByText("체크리스트 진행률")).toBeVisible();
      await expect(page.getByText("D-day")).toBeVisible();
    });

    test("예정일 입력 후 이번 주 CTA 카드가 표시된다", async ({ page }) => {
      // 무엇을: 예정일 입력 후 이번 주 할 일 CTA 카드가 체크리스트 미리보기와 함께 나오는지
      // 왜: 홈→타임라인 전환율 향상 CTA의 핵심 동작
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];
      await page.locator('input[type="date"]').fill(dateStr);
      await expect(page.getByText(/현재 임신/)).toBeVisible();

      await expect(page.getByText(/주차에.*할 일/)).toBeVisible();
      await expect(page.getByRole("button", { name: "타임라인에서 확인하기" })).toBeVisible();
    });
  });

  test.describe("미니 대시보드 카드", () => {
    test("4개 미니 대시보드 카드가 렌더링된다", async ({ page }) => {
      // 무엇을: 기능 메뉴판 대신 미니 대시보드 카드 4개가 보이는지
      // 왜: Phase 2.5 Step 3 — 메뉴판→미니 대시보드 개편
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /베이비페어/ })).toBeVisible();
      await expect(dashboard.getByRole("link", { name: /체중 기록/ })).toBeVisible();
      await expect(dashboard.getByRole("link", { name: /영상/ })).toBeVisible();
      await expect(dashboard.getByRole("link", { name: /정보/ })).toBeVisible();
    });

    test("베이비페어 카드에 다가오는 행사 정보가 표시된다", async ({ page }) => {
      // 무엇을: 베이비페어 카드에 행사 수 또는 '없습니다' 메시지가 보이는지
      // 왜: 스냅샷 데이터로 클릭 동기 부여
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /베이비페어/ })).toBeVisible();
      const hasEvents = await page.getByText(/다가오는 행사/).isVisible().catch(() => false);
      const hasNoEvents = await page.getByText(/예정된 베이비페어가 없습니다/).isVisible().catch(() => false);
      expect(hasEvents || hasNoEvents).toBe(true);
    });

    test("영상 카드에 총 영상 수와 카테고리가 표시된다", async ({ page }) => {
      // 무엇을: 영상 카드에 영상 건수와 카테고리 수가 보이는지
      // 왜: 콘텐츠 볼륨 표시로 탐색 유도
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /영상/ })).toBeVisible();
      await expect(page.getByText(/추천 영상/)).toBeVisible();
      await expect(page.getByText(/카테고리/)).toBeVisible();
    });

    test("정보 카드에 아티클 정보가 표시된다", async ({ page }) => {
      // 무엇을: 정보 카드에 최신 글 제목과 총 아티클 수가 보이는지
      // 왜: 콘텐츠 최신성 표시로 클릭 유도
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /정보/ })).toBeVisible();
      await expect(page.getByText(/아티클/)).toBeVisible();
    });

    test("체중 카드에 시작 안내 또는 최근 기록이 표시된다", async ({ page }) => {
      // 무엇을: 체중 미기록 시 시작 안내가 보이는지
      // 왜: 미기록 유저에게도 카드가 의미 있도록
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /체중 기록/ })).toBeVisible();
      await expect(page.getByText(/아직 기록이 없어요/)).toBeVisible();
    });

    test("베이비페어 카드 클릭 시 /baby-fair로 이동한다", async ({ page }) => {
      // 무엇을: 미니 대시보드 카드가 올바른 경로로 라우팅되는지
      // 왜: 네비게이션 정상 동작 확인
      const dashboard = page.locator(".grid.grid-cols-2");
      await dashboard.getByRole("link", { name: /베이비페어/ }).click();
      await expect(page).toHaveURL(/\/baby-fair/);
    });

    test("영상 카드 클릭 시 /videos로 이동한다", async ({ page }) => {
      // 무엇을: 영상 카드 라우팅 확인
      // 왜: 네비게이션 정상 동작 확인
      const dashboard = page.locator(".grid.grid-cols-2");
      await dashboard.getByRole("link", { name: /영상/ }).click();
      await expect(page).toHaveURL(/\/videos/);
    });
  });

  test.describe("Footer 링크", () => {
    test("Footer에 연락처 링크가 있다", async ({ page }) => {
      // 무엇을: Footer에 연락처(의견 보내기) 링크 존재
      // 왜: 피드백 접근 경로 확인
      const contactLink = page.getByRole("link", { name: "연락처" });
      await expect(contactLink).toBeVisible();
      await expect(contactLink).toHaveAttribute("href", "/contact");
    });

    test("예정일 입력 후 이번 주 CTA 카드가 주차별 할 일을 표시한다", async ({ page }) => {
      // 무엇을: 예정일 입력 후 홈 대시보드에 주차별 할 일 카드가 표시되는지
      // 왜: 대시보드의 핵심 CTA가 정상 렌더링되어야 함
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];
      await page.locator('input[type="date"]').fill(dateStr);
      await expect(page.getByText(/현재 임신/)).toBeVisible();
      await expect(page.getByText(/주차에.*할 일|주차에 모든 할 일을 완료했어요/)).toBeVisible();
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

    test("모바일: 히어로와 미니 대시보드 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px 모바일에서 핵심 UI가 보이는지
      // 왜: 타겟 유저(임산부)의 주요 접근 기기
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
      const dashboard = page.locator(".grid.grid-cols-2");
      await expect(dashboard.getByRole("link", { name: /베이비페어/ })).toBeVisible();
      await expect(dashboard.getByRole("link", { name: /체중 기록/ })).toBeVisible();
    });
  });
});
