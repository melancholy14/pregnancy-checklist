import { test, expect } from "@playwright/test";
import { acceptCookieConsent } from "./helpers/consent";

test.describe("타임라인 페이지", () => {
  test.beforeEach(async ({ context, page }) => {
    await acceptCookieConsent(context);
    await page.goto("/timeline");
  });

  test.describe("Happy Path", () => {
    test("제목이 렌더링된다", async ({ page }) => {
      // 무엇을: 타임라인 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(
        page.getByText(/임신 주차에 맞춰 준비해야 할 항목을 한눈에 확인하세요/),
      ).toBeVisible();
    });

    test("JSON 기반 타임라인 항목들이 주차순으로 표시된다", async ({ page }) => {
      // 무엇을: timeline_items.json의 항목들이 카드로 렌더링되는지
      // 왜: 기본 데이터 정상 렌더링 확인
      await expect(page.getByText("임신 확인과 엽산 복용 시작")).toBeVisible();
      await expect(page.getByText("4주", { exact: true })).toBeVisible();
    });

    test("마지막에 40주 메시지가 보인다", async ({ page }) => {
      // 무엇을: 최하단 40주 안내
      // 왜: 타임라인 끝점 확인
      await expect(page.getByText(/40주차/)).toBeVisible();
    });

    test("커스텀 항목을 추가할 수 있다", async ({ page }) => {
      // 무엇을: FAB → 통합 폼 → 타임라인 항목 추가 전체 흐름
      // 왜: 커스텀 항목 추가 기능 검증
      await page.locator('button[aria-label="항목 추가"]').click();

      // 통합 폼에서 "일정" 유형 선택
      await page.locator('input[value="timeline"]').click();
      await expect(page.getByPlaceholder("일정을 입력하세요")).toBeVisible();

      // 주차 + 제목 입력 후 추가
      await page.locator('input[type="number"]').fill("20");
      await page.getByPlaceholder("일정을 입력하세요").fill("테스트 타임라인 항목");
      await page.getByRole("button", { name: "추가하기" }).click();

      // 추가된 항목 확인
      await expect(page.getByText("테스트 타임라인 항목")).toBeVisible();
      await expect(page.getByText("내 항목")).toBeVisible();
    });

    test("커스텀 항목은 삭제할 수 있다", async ({ page }) => {
      // 무엇을: 커스텀 항목에만 삭제 버튼이 있고 삭제 시 즉시 사라진 뒤 sonner undo 토스트 노출
      // 왜: 기본 항목은 보호, 커스텀만 삭제 가능. design-bundle-k 이후 AlertDialog confirm → undo-toast로 통일
      // 먼저 추가
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[value="timeline"]').click();
      await page.locator('input[type="number"]').fill("15");
      await page.getByPlaceholder("일정을 입력하세요").fill("삭제 테스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      await expect(page.getByText("삭제 테스트")).toBeVisible();

      // 삭제 — confirm 다이얼 없이 즉시 사라지고 토스트 노출
      const heading = page.getByRole("heading", { name: "삭제 테스트" });
      const card = heading.locator("xpath=ancestor::*[self::div or self::button][1]");
      await card.getByRole("button", { name: "삭제" }).click();
      await expect(page.getByRole("heading", { name: "삭제 테스트" })).not.toBeVisible();
      await expect(page.getByText("타임라인 노트를 삭제했어요")).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("빈 제목으로는 추가할 수 없다", async ({ page }) => {
      // 무엇을: 제목 없이 추가 버튼이 비활성화되는지
      // 왜: 빈 항목 방지
      await page.locator('button[aria-label="항목 추가"]').click();
      const addButton = page.getByRole("button", { name: "추가하기" });
      await expect(addButton).toBeDisabled();
    });

    test("기본 항목에는 삭제 버튼이 없다", async ({ page }) => {
      // 무엇을: JSON 기본 항목에 삭제 아이콘이 없는지
      // 왜: 기본 데이터 보호
      const firstCard = page.getByText("임신 확인과 엽산 복용 시작").locator("..").locator("..");
      await expect(firstCard.locator('button[aria-label="삭제"]')).not.toBeVisible();
    });
  });

  test.describe("온보딩 배너", () => {
    test("온보딩 미완 사용자에게 글로벌 슬림 배너가 표시된다", async ({ page }) => {
      // 무엇을: pregnancy-week-onboarding 적용 후 DueDateBanner는 삭제되고
      //         OnboardingBannerProvider의 글로벌 슬림 배너로 대체되었는지
      // 왜: spec.md 시나리오 2. SEO 직진자에게 도구 존재를 알림
      await expect(
        page.getByRole("link", {
          name: /예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요/,
        }),
      ).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 타임라인 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 카드가 보이고 FAB가 접근 가능한지
      // 왜: 주요 타겟 기기
      await expect(page.getByText("임신 확인과 엽산 복용 시작")).toBeVisible();
      await expect(page.locator('button[aria-label="항목 추가"]')).toBeVisible();
    });
  });
});
