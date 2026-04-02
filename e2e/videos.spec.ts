import { test, expect } from "@playwright/test";

test.describe("영상 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/videos");
  });

  test.describe("Happy Path", () => {
    test("제목이 렌더링된다", async ({ page }) => {
      // 무엇을: 영상 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "영상 콘텐츠" })).toBeVisible();
      await expect(page.getByText("임신과 육아에 도움되는 영상 모음")).toBeVisible();
    });

    test("videos.json이 비어있으면 empty state가 표시된다", async ({ page }) => {
      // 무엇을: 데이터 없을 때 안내 메시지 표시
      // 왜: Phase 1에서 videos.json은 빈 배열, empty state 필수
      await expect(page.getByText("아직 등록된 영상이 없어요")).toBeVisible();
      await expect(page.getByText("곧 유용한 영상이 추가될 예정입니다")).toBeVisible();
    });

    test("YouTube 안내 카드가 보인다", async ({ page }) => {
      // 무엇을: 하단 안내 카드 표시
      // 왜: 영상 재생 관련 안내
      await expect(page.getByText(/YouTube로 연결됩니다/)).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: empty state가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 empty state 표시
      // 왜: 주요 타겟 기기
      await expect(page.getByText("아직 등록된 영상이 없어요")).toBeVisible();
    });
  });
});
