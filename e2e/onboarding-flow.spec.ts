import { test, expect } from "@playwright/test";

test.describe("온보딩 플로우", () => {
  test.describe("Happy Path", () => {
    test("전체 플로우: 웰컴 → 예정일 입력 → 데이터 안내 → 타임라인 이동", async ({ page }) => {
      // 무엇을: 3단계 온보딩을 처음부터 끝까지 완료하면 /timeline으로 이동하는지
      // 왜: 핵심 온보딩 흐름 전체가 정상 동작해야 첫 방문 유저의 이탈을 막을 수 있음
      await page.goto("/");

      // Step 1: 웰컴
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).toBeVisible();
      await expect(page.getByText("주차별로 뭘 해야 하는지 정리")).toBeVisible();
      await expect(page.getByText("전국 베이비페어 일정 모음")).toBeVisible();
      await expect(page.getByText("체중 기록 & 출산 정보까지")).toBeVisible();
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();

      // Step 2: 예정일 입력
      await expect(page.getByRole("heading", { name: "예정일을 알려주세요" })).toBeVisible();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];
      await page.getByLabel("출산 예정일 선택").fill(dateStr);
      await page.getByRole("button", { name: "다음 단계로 이동" }).click();

      // Step 3: 데이터 안내
      await expect(page.getByRole("heading", { name: "준비 완료! 같이 챙겨봐요" })).toBeVisible();
      await expect(page.getByText("입력한 정보는 이 브라우저에만 저장돼요")).toBeVisible();
      await expect(page.getByText("회원가입 없이 바로 시작!")).toBeVisible();
      await expect(page.getByText("다시 와도 기록이 남아있어요")).toBeVisible();
      await page.getByRole("button", { name: "체크리스트 보러가기" }).click();

      // 타임라인으로 이동
      await page.waitForURL(/\/timeline/);
    });

    test("예정일 건너뛰기 후 온보딩 완료", async ({ page }) => {
      // 무엇을: Step 2에서 "나중에 입력할게요"를 눌러도 Step 3으로 이동 후 정상 완료되는지
      // 왜: 예정일 모르는 초기 유저도 온보딩을 완료할 수 있어야 함
      await page.goto("/");

      // Step 1 → Step 2
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();
      await expect(page.getByRole("heading", { name: "예정일을 알려주세요" })).toBeVisible();

      // 건너뛰기
      await page.getByRole("button", { name: "예정일 나중에 입력하기" }).click();

      // Step 3으로 이동 확인
      await expect(page.getByRole("heading", { name: "준비 완료! 같이 챙겨봐요" })).toBeVisible();
      await page.getByRole("button", { name: "체크리스트 보러가기" }).click();
      await page.waitForURL(/\/timeline/);
    });

    test("온보딩 완료 후 재방문 시 홈이 바로 표시된다", async ({ page }) => {
      // 무엇을: 온보딩 완료 후 다시 / 접속하면 온보딩 없이 홈 화면이 보이는지
      // 왜: 온보딩은 1회만 표시되어야 하고 재방문 시 홈으로 바로 가야 함
      await page.goto("/");

      // 온보딩 완료
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();
      await page.getByRole("button", { name: "예정일 나중에 입력하기" }).click();
      await page.getByRole("button", { name: "체크리스트 보러가기" }).click();
      await page.waitForURL(/\/timeline/);

      // 홈으로 재방문
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).not.toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("예정일 미선택 시 다음 버튼이 비활성화된다", async ({ page }) => {
      // 무엇을: Step 2에서 날짜를 선택하지 않으면 "다음" 버튼이 disabled인지
      // 왜: 빈 값으로 진행하면 잘못된 상태가 저장될 수 있음
      await page.goto("/");
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();

      await expect(page.getByRole("heading", { name: "예정일을 알려주세요" })).toBeVisible();
      await expect(page.getByRole("button", { name: "다음 단계로 이동" })).toBeDisabled();
    });

    test("예정일 선택 후 다음 버튼이 활성화된다", async ({ page }) => {
      // 무엇을: Step 2에서 날짜를 선택하면 "다음" 버튼이 enabled로 바뀌는지
      // 왜: 유효한 입력 시 진행 가능해야 함
      await page.goto("/");
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const dateStr = futureDate.toISOString().split("T")[0];
      await page.getByLabel("출산 예정일 선택").fill(dateStr);

      await expect(page.getByRole("button", { name: "다음 단계로 이동" })).toBeEnabled();
    });
  });

  test.describe("권한 / 인증 (localStorage 기반)", () => {
    test("onboarding-completed 플래그가 있으면 온보딩을 건너뛴다", async ({ page }) => {
      // 무엇을: localStorage에 onboarding-completed가 있으면 홈이 바로 보이는지
      // 왜: 이미 온보딩을 완료한 유저가 다시 온보딩을 보면 안 됨
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "출산 준비 체크리스트" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).not.toBeVisible();
    });

    test("onboarding-completed 플래그가 없으면 온보딩이 표시된다", async ({ page }) => {
      // 무엇을: localStorage에 플래그가 없으면 온보딩 화면이 보이는지
      // 왜: 첫 방문 유저에게 반드시 온보딩을 보여줘야 함
      await page.goto("/");
      await page.evaluate(() => localStorage.removeItem("onboarding-completed"));
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "안녕하세요!" })).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 전체 온보딩 흐름이 정상 동작한다", async ({ page }) => {
      // 무엇을: 375px 모바일에서 3단계 온보딩 전체가 동작하는지
      // 왜: 주요 타겟 유저(임산부)가 모바일로 접근할 가능성이 높음
      await page.goto("/");

      // Step 1
      await expect(page.getByRole("heading", { name: "안녕하세요!" })).toBeVisible();
      await page.getByRole("button", { name: "온보딩 시작하기" }).click();

      // Step 2 — 건너뛰기
      await expect(page.getByRole("heading", { name: "예정일을 알려주세요" })).toBeVisible();
      await page.getByRole("button", { name: "예정일 나중에 입력하기" }).click();

      // Step 3
      await expect(page.getByRole("heading", { name: "준비 완료! 같이 챙겨봐요" })).toBeVisible();
      await page.getByRole("button", { name: "체크리스트 보러가기" }).click();

      await page.waitForURL(/\/timeline/);
    });
  });
});
