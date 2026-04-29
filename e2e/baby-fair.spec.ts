import { test, expect } from "@playwright/test";

test.describe("베이비페어 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/baby-fair");
  });

  test.describe("Happy Path", () => {
    test("제목이 렌더링된다", async ({ page }) => {
      // 무엇을: 베이비페어 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "베이비페어 일정" })).toBeVisible();
    });

    test("도시 필터 버튼들이 표시된다", async ({ page }) => {
      // 무엇을: 전체 + 각 도시 필터 버튼 표시
      // 왜: 도시별 필터 기능 정상 렌더링
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: "서울", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "부산", exact: true })).toBeVisible();
    });

    test("3분류 탭이 표시된다", async ({ page }) => {
      // 무엇을: ongoing/upcoming/ended 3탭 표시
      // 왜: 행사 상태별 3분류 기능
      await expect(page.getByRole("tab", { name: /진행 중/ })).toBeVisible();
      await expect(page.getByRole("tab", { name: "예정" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "지난 행사" })).toBeVisible();
    });

    test("예정 탭에 행사 카드들이 표시된다", async ({ page }) => {
      // 무엇을: 예정 탭의 이벤트 카드 렌더링
      // 왜: 미래 행사 데이터가 정상적으로 표시되는지
      await page.getByRole("tab", { name: "예정" }).click();
      const cards = page.locator('[data-slot="card"]').filter({ hasText: /베이비페어|베이비&키즈페어|엑스포|베페/ });
      await expect(cards.first()).toBeVisible();
    });

    test("도시 필터 클릭 시 해당 도시 행사만 표시된다", async ({ page }) => {
      // 무엇을: 도시 필터로 이벤트가 정상 필터링되는지
      // 왜: 필터 기능 정상 동작 검증
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByRole("button", { name: "서울", exact: true }).click();
      await expect(page.getByText("제49회 베페(BeFe) 베이비페어")).toBeVisible();
    });

    test("전체 필터로 돌아오면 모든 행사가 표시된다", async ({ page }) => {
      // 무엇을: 전체 필터로 복귀 시 모든 이벤트 표시
      // 왜: 필터 해제 동작 확인
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByRole("button", { name: "서울", exact: true }).click();
      await page.getByRole("button", { name: "전체" }).click();
      await expect(page.getByText("대전 베이비페어")).toBeVisible();
    });

    test("참관 팁이 표시된다", async ({ page }) => {
      // 무엇을: 참관 팁 카드 표시
      // 왜: 유용한 부가 정보 제공
      await expect(page.getByText("참관 팁")).toBeVisible();
      await expect(page.getByText("사전 등록하면 입장료 할인 혜택이 있어요")).toBeVisible();
    });
  });

  test.describe("외부 링크 팝업", () => {
    test("행사 카드 클릭 시 외부 이동 확인 팝업이 표시된다", async ({ page }) => {
      // 무엇을: 카드 클릭 → AlertDialog 팝업 표시
      // 왜: 외부 사이트 이동 전 사용자 확인 필수
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByText("제49회 베페(BeFe) 베이비페어").click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expect(page.getByText("공식 홈페이지로 이동합니다")).toBeVisible();
    });

    test("팝업에서 취소 클릭 시 팝업이 닫힌다", async ({ page }) => {
      // 무엇을: 취소 버튼으로 팝업 닫기
      // 왜: 의도치 않은 외부 이동 방지
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByText("제49회 베페(BeFe) 베이비페어").click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: "취소" }).click();
      await expect(page.getByRole("alertdialog")).not.toBeVisible();
    });

    test("팝업에서 이동 클릭 시 새 탭이 열린다", async ({ page, context }) => {
      // 무엇을: 이동 버튼 클릭 시 window.open으로 새 탭 열기
      // 왜: 현재 페이지 유지 + 공식 사이트 새 탭 이동
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByText("제49회 베페(BeFe) 베이비페어").click();
      await expect(page.getByRole("alertdialog")).toBeVisible();

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "이동" }).click(),
      ]);
      expect(newPage.url()).toContain("befe.co.kr");
      await newPage.close();
    });

    test("팝업 타이틀에 행사명이 표시된다", async ({ page }) => {
      // 무엇을: AlertDialog 타이틀이 클릭한 행사명인지
      // 왜: 어떤 행사의 홈페이지로 이동하는지 사용자에게 명확히 전달
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await page.getByText("제49회 베페(BeFe) 베이비페어").click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText("제49회 베페(BeFe) 베이비페어")).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("지난 행사 탭 클릭 시 해당 탭 콘텐츠가 표시된다", async ({ page }) => {
      // 무엇을: 지난 행사 탭 전환 동작
      // 왜: 지난 행사 데이터가 있으면 표시, 없으면 빈 상태
      await page.getByRole("tab", { name: "지난 행사" }).click();
      await expect(page.getByText("대전 베이비페어")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 필터와 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 필터 버튼과 카드가 보이는지
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("tab", { name: /진행 중/ })).toBeVisible();
    });
  });
});
