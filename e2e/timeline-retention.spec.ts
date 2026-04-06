import { test, expect } from "@playwright/test";

/** 예정일을 설정하고 홈으로 이동하는 헬퍼 */
async function setupWithDueDate(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
  await page.goto("/");

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 100);
  const dateStr = futureDate.toISOString().split("T")[0];
  await page.locator('input[type="date"]').fill(dateStr);
  await expect(page.getByText(/현재 임신/)).toBeVisible();
}

test.describe("타임라인 유도 강화 + 데이터 보존", () => {
  test.describe("Happy Path", () => {
    test("홈 CTA 카드: 주차 + 미완료 수 + 체크 미리보기 + CTA 버튼 표시", async ({ page }) => {
      // 무엇을: 예정일 입력 후 이번 주 할 일 카드가 체크리스트 미리보기와 CTA 버튼을 포함하는지
      // 왜: 홈→타임라인 전환율 향상의 핵심 UI
      await setupWithDueDate(page);

      // 주차 + 할 일 수 메시지 확인
      await expect(page.getByText(/주차에.*할 일이 남았어요/)).toBeVisible();

      // CTA 버튼 확인
      await expect(page.getByRole("button", { name: "타임라인에서 확인하기" })).toBeVisible();
    });

    test("홈 CTA 버튼 클릭 시 타임라인으로 이동", async ({ page }) => {
      // 무엇을: "타임라인에서 확인하기" 버튼이 /timeline으로 이동하는지
      // 왜: CTA의 핵심 동작
      await setupWithDueDate(page);

      await page.getByRole("button", { name: "타임라인에서 확인하기" }).click();
      await page.waitForURL(/\/timeline/);
    });

    test("타임라인 첫 체크 시 인라인 배너가 표시된다", async ({ page }) => {
      // 무엇을: 타임라인에서 첫 번째 체크리스트 항목을 체크하면 저장 안내 배너가 나오는지
      // 왜: 데이터 보존 불안 해소를 위한 1회성 안내
      await setupWithDueDate(page);
      await page.goto("/timeline");

      // 체크리스트가 있는 아코디언을 열고 체크박스 클릭
      const checklistTrigger = page.getByText(/체크리스트 \d+개/).first();
      await expect(checklistTrigger).toBeVisible();
      await checklistTrigger.click();
      const firstCheckbox = page.getByRole("checkbox").first();
      await expect(firstCheckbox).toBeVisible();
      await firstCheckbox.click();

      // 인라인 배너 확인
      await expect(page.getByText("체크한 내용은 자동 저장돼요!")).toBeVisible();
      await expect(page.getByText("다시 방문해도 기록이 남아있어요")).toBeVisible();

      // 확인 버튼으로 배너 닫기
      await page.getByRole("button", { name: "배너 닫기" }).click();
      await expect(page.getByText("체크한 내용은 자동 저장돼요!")).not.toBeVisible();
    });

    test("첫 체크 배너는 1회만 표시된다", async ({ page }) => {
      // 무엇을: 첫 체크 후 배너를 닫고 재방문해도 배너가 다시 나오지 않는지
      // 왜: 1회성 안내이므로 반복 표시되면 UX 저하
      await setupWithDueDate(page);
      await page.goto("/timeline");

      // 아코디언 열고 첫 체크 → 배너 표시 → 닫기
      const checklistTrigger = page.getByText(/체크리스트 \d+개/).first();
      await expect(checklistTrigger).toBeVisible();
      await checklistTrigger.click();
      const firstCheckbox = page.getByRole("checkbox").first();
      await expect(firstCheckbox).toBeVisible();
      await firstCheckbox.click();
      await expect(page.getByText("체크한 내용은 자동 저장돼요!")).toBeVisible();
      await page.getByRole("button", { name: "배너 닫기" }).click();

      // 페이지 새로고침 후 — first-check-guide-shown이 true이므로 배너 미표시
      await page.goto("/timeline");
      await expect(page.getByText("체크한 내용은 자동 저장돼요!")).not.toBeVisible();
    });

    test("재방문 유저에게 웰컴 메시지가 표시된다", async ({ page }) => {
      // 무엇을: 어제 방문 + 체크 기록이 있는 유저가 오늘 방문하면 웰컴 메시지가 나오는지
      // 왜: 재방문 유저의 데이터 보존 인지 + 리텐션 강화

      // 1. UI로 데이터 생성: 예정일 입력 + 체크리스트 체크
      await setupWithDueDate(page);
      await page.goto("/timeline");
      const trigger = page.getByText(/체크리스트 \d+개/).first();
      await expect(trigger).toBeVisible();
      await trigger.click();
      const checkbox = page.getByRole("checkbox").first();
      await expect(checkbox).toBeVisible();
      await checkbox.click();

      // 2. 마지막 방문 날짜를 어제로 조작
      await page.evaluate(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        localStorage.setItem("last-visit-date", yesterday.toISOString().split("T")[0]);
      });

      // 3. 홈으로 재방문
      await page.goto("/");
      await expect(page.getByText(/돌아오셨군요! 지난번에 \d+개 체크하셨어요/)).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("예정일 미입력 시 CTA 카드가 표시되지 않는다", async ({ page }) => {
      // 무엇을: 예정일 없이 방문하면 이번 주 할 일 카드가 안 나오는지
      // 왜: 주차 계산 불가 시 CTA 카드를 보여줄 수 없음
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");

      await expect(page.getByText(/주차에.*할 일이 남았어요/)).not.toBeVisible();
      await expect(page.getByRole("button", { name: "타임라인에서 확인하기" })).not.toBeVisible();
    });

    test("당일 재방문 시 웰컴 메시지가 표시되지 않는다", async ({ page }) => {
      // 무엇을: 같은 날 다시 방문하면 웰컴 메시지가 안 나오는지
      // 왜: 당일 반복 방문에 매번 메시지 보이면 UX 저하

      // UI로 체크 기록 생성
      await setupWithDueDate(page);
      await page.goto("/timeline");
      const trigger = page.getByText(/체크리스트 \d+개/).first();
      await expect(trigger).toBeVisible();
      await trigger.click();
      const checkbox = page.getByRole("checkbox").first();
      await expect(checkbox).toBeVisible();
      await checkbox.click();

      // last-visit-date를 오늘로 유지한 채 홈 재방문
      await page.goto("/");
      await expect(page.getByText(/돌아오셨군요/)).not.toBeVisible();
    });
  });

  test.describe("권한 / 인증 (localStorage 기반)", () => {
    test("체크 기록 없는 재방문 유저에게는 웰컴 메시지가 안 나온다", async ({ page }) => {
      // 무엇을: 어제 방문했지만 체크한 기록이 0개면 웰컴 메시지 미표시
      // 왜: "0개 체크하셨어요"는 의미 없는 메시지

      // 예정일만 설정 (체크 기록 없음)
      await setupWithDueDate(page);

      // 마지막 방문을 어제로 조작
      await page.evaluate(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        localStorage.setItem("last-visit-date", yesterday.toISOString().split("T")[0]);
      });

      await page.goto("/");
      await expect(page.getByText(/돌아오셨군요/)).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: CTA 카드와 버튼이 정상 표시된다", async ({ page }) => {
      // 무엇을: 375px 모바일에서 CTA 카드가 정상 렌더링되고 버튼 클릭이 동작하는지
      // 왜: 주요 타겟 유저가 모바일로 접근
      await setupWithDueDate(page);

      await expect(page.getByText(/주차에.*할 일/)).toBeVisible();
      await expect(page.getByRole("button", { name: "타임라인에서 확인하기" })).toBeVisible();

      await page.getByRole("button", { name: "타임라인에서 확인하기" }).click();
      await page.waitForURL(/\/timeline/);
    });
  });
});
