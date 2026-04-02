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
      // 왜: Phase 1 핵심 신규 기능
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: "서울" })).toBeVisible();
      await expect(page.getByRole("button", { name: "부산" })).toBeVisible();
    });

    test("예정/지난 행사 탭이 표시된다", async ({ page }) => {
      // 무엇을: upcoming/ended 탭 표시
      // 왜: Phase 1 핵심 신규 기능
      await expect(page.getByRole("tab", { name: "예정 행사" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "지난 행사" })).toBeVisible();
    });

    test("행사 카드들이 표시된다", async ({ page }) => {
      // 무엇을: 이벤트 카드 렌더링
      // 왜: 데이터가 정상적으로 표시되는지
      await expect(page.getByText("서울 베이비페어")).toBeVisible();
      await expect(page.getByText("코엑스 Hall A")).toBeVisible();
    });

    test("도시 필터 클릭 시 해당 도시 행사만 표시된다", async ({ page }) => {
      // 무엇을: 도시 필터로 이벤트가 정상 필터링되는지
      // 왜: 필터 기능 정상 동작 검증
      await page.getByRole("button", { name: "부산" }).click();
      await expect(page.getByText("부산 임산부 & 육아용품 박람회")).toBeVisible();
      // 서울 이벤트는 안 보여야 함
      await expect(page.getByText("서울 베이비페어")).not.toBeVisible();
    });

    test("전체 필터로 돌아오면 모든 행사가 표시된다", async ({ page }) => {
      // 무엇을: 전체 필터로 복귀 시 모든 이벤트 표시
      // 왜: 필터 해제 동작 확인
      await page.getByRole("button", { name: "부산" }).click();
      await page.getByRole("button", { name: "전체" }).click();
      await expect(page.getByText("서울 베이비페어")).toBeVisible();
      await expect(page.getByText("부산 임산부 & 육아용품 박람회")).toBeVisible();
    });

    test("참관 팁이 표시된다", async ({ page }) => {
      // 무엇을: 참관 팁 카드 표시
      // 왜: 유용한 부가 정보 제공
      await expect(page.getByText("참관 팁")).toBeVisible();
      await expect(page.getByText(/사전 등록/)).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("지난 행사 탭 클릭 시 해당 탭 콘텐츠가 표시된다", async ({ page }) => {
      // 무엇을: 지난 행사 탭 전환 동작
      // 왜: 모든 이벤트가 미래 날짜면 빈 상태가 보여야 함
      await page.getByRole("tab", { name: "지난 행사" }).click();
      // 모든 이벤트가 미래 날짜이므로 빈 상태가 보여야 함
      await expect(page.getByText("지난 행사가 없어요")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 필터와 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 필터 버튼과 카드가 보이는지
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByText("서울 베이비페어")).toBeVisible();
    });
  });
});
