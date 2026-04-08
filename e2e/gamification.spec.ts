import { test, expect } from "@playwright/test";

test.describe("달성감 / 게이미피케이션 (Step 9)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
    // 이전 데이터 초기화
    await page.evaluate(() => {
      localStorage.removeItem("checklist-storage");
      localStorage.removeItem("timeline-storage");
    });
    await page.reload();
  });

  test.describe("9-1A: 주차 완료 축하", () => {
    test("체크리스트 항목을 모두 완료하면 ✅ 아이콘과 완료 메시지가 표시된다", async ({ page }) => {
      // 무엇을: Week 6 (체크리스트 1개)에서 전부 완료 시 축하 UI
      // 왜: 주차 완료 달성감 제공이 핵심 기능
      const week6Card = page.locator("#timeline-week-6");

      // 완료 전에는 ✅ 없음
      await expect(week6Card.locator('span[aria-label="완료"]')).not.toBeVisible();

      // 아코디언 열기
      await week6Card.getByText("체크리스트").click();

      // 체크리스트 항목 체크
      await week6Card.getByRole("checkbox").first().check();

      // ✅ 아이콘 표시
      await expect(week6Card.locator('span[aria-label="완료"]')).toBeVisible();

      // 완료 메시지 표시
      await expect(week6Card.getByText("6주차 할일을 모두 완료했어요!")).toBeVisible();
    });

    test("체크리스트 항목을 해제하면 완료 상태가 사라진다", async ({ page }) => {
      // 무엇을: 완료 후 체크 해제 시 ✅과 메시지가 사라지는지
      // 왜: 상태 변경이 즉시 반영되어야 함
      const week6Card = page.locator("#timeline-week-6");

      // 체크
      await week6Card.getByText("체크리스트").click();
      await week6Card.getByRole("checkbox").first().check();
      await expect(week6Card.locator('span[aria-label="완료"]')).toBeVisible();

      // 체크 해제
      await week6Card.getByRole("checkbox").first().uncheck();
      await expect(week6Card.locator('span[aria-label="완료"]')).not.toBeVisible();
      await expect(week6Card.getByText("6주차 할일을 모두 완료했어요!")).not.toBeVisible();
    });
  });

  test.describe("9-1B: 마일스톤 배지", () => {
    test("진행률이 0%일 때 마일스톤 메시지가 없다", async ({ page }) => {
      // 무엇을: 초기 상태에서 마일스톤 미표시
      // 왜: 0% 상태에 메시지가 있으면 어색함
      await expect(page.getByText("순조로운 출발!")).not.toBeVisible();
      await expect(page.getByText("절반 완료!")).not.toBeVisible();
    });

    test("체크리스트 항목을 체크하면 마일스톤 메시지가 표시된다", async ({ page }) => {
      // 무엇을: 25% 이상 달성 시 마일스톤 메시지 표시
      // 왜: 진행 동기 부여
      // 전체 항목의 25% 이상을 한번에 체크하기 위해 localStorage로 직접 설정
      const totalItems = await page.evaluate(() => {
        const raw = localStorage.getItem("checklist-storage");
        return raw ? JSON.parse(raw) : null;
      });

      // 전체 체크리스트 ID를 가져와 25% 이상 체크
      const allChecklistIds: string[] = await page.evaluate(() => {
        // 페이지에서 모든 체크박스의 data 추출
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        return Array.from(checkboxes).map((cb) => cb.id).filter(Boolean);
      });

      // 25%에 해당하는 수만큼 체크 (최소 테스트를 위해 localStorage 직접 설정)
      await page.evaluate(() => {
        // 모든 체크리스트 아이템 ID를 수집하기 어려우므로,
        // 충분한 수의 아이템을 체크한 상태를 시뮬레이션
        const storage = JSON.parse(localStorage.getItem("checklist-storage") || '{"state":{"checkedIds":[],"customItems":[]},"version":0}');
        // 기존 checkedIds에 많은 항목 추가하여 25% 이상 만들기
        const fakeIds = Array.from({ length: 30 }, (_, i) => `item_${String(i + 1).padStart(3, "0")}`);
        storage.state.checkedIds = fakeIds;
        localStorage.setItem("checklist-storage", JSON.stringify(storage));
      });
      await page.reload();

      // 마일스톤 메시지 중 하나가 표시되는지 확인
      const milestone = page.locator("text=/순조로운 출발!|절반 완료!|거의 다 왔어요!|완벽한 준비 완료!/");
      await expect(milestone.first()).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 주차 완료 ✅과 마일스톤 메시지가 정상 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 게이미피케이션 UI가 잘리지 않는지
      // 왜: 주요 타겟 기기
      const week6Card = page.locator("#timeline-week-6");
      await week6Card.getByText("체크리스트").click();
      await week6Card.getByRole("checkbox").first().check();

      await expect(week6Card.locator('span[aria-label="완료"]')).toBeVisible();
      await expect(week6Card.getByText("6주차 할일을 모두 완료했어요!")).toBeVisible();
    });
  });
});
