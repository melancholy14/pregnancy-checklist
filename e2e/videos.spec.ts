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

    test("카테고리 필터 버튼이 표시된다", async ({ page }) => {
      // 무엇을: 카테고리 필터 버튼 렌더링
      // 왜: videos.json에 데이터가 있으므로 필터 UI가 활성화되어야 함
      await expect(page.getByRole("button", { name: "임산부 운동" })).toBeVisible();
      await expect(page.getByRole("button", { name: "출산 준비", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "신생아 케어" })).toBeVisible();
    });

    test("기본 뷰에서 영상 카드가 표시된다", async ({ page }) => {
      // 무엇을: 영상 뷰 기본 상태에서 영상 카드가 보이는지
      // 왜: 전체 카테고리 영상이 기본 표시되어야 함
      await expect(page.getByText("임산부 스트레칭 + 유무산소 운동 20분")).toBeVisible();
    });

    test("카테고리 필터 전환이 동작한다", async ({ page }) => {
      // 무엇을: 카테고리 버튼 클릭 시 해당 카테고리 영상이 표시되는지
      // 왜: 카테고리별 필터링 기능 검증
      await page.getByRole("button", { name: "출산 준비", exact: true }).click();
      await expect(page.getByText("산부인과의사가 자연분만을 권하는 진짜 이유")).toBeVisible();

      await page.getByRole("button", { name: "신생아 케어" }).click();
      await expect(page.getByText("신생아 목욕 방법 (with 쁘리마쥬)")).toBeVisible();
    });

    test("영상 카드가 YouTube 링크를 가진다", async ({ page }) => {
      // 무엇을: 영상 카드 클릭 시 YouTube로 연결되는지
      // 왜: 외부 링크 정상 동작 확인
      const firstCard = page.locator('a[href*="youtube.com/watch"]').first();
      await expect(firstCard).toBeVisible();
      await expect(firstCard).toHaveAttribute("target", "_blank");
    });

    test("영상 썸네일이 YouTube에서 로드된다", async ({ page }) => {
      // 무엇을: 썸네일 이미지가 img.youtube.com에서 로드되는지
      // 왜: 자체 호스팅 없이 YouTube 핫링크 방식 사용
      const thumbnail = page.locator('img[src*="img.youtube.com"]').first();
      await expect(thumbnail).toBeVisible();
    });

    test("YouTube 안내 카드가 보인다", async ({ page }) => {
      // 무엇을: 하단 안내 카드 표시
      // 왜: 영상 재생 관련 안내
      await expect(page.getByText(/YouTube로 연결됩니다/)).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 영상 카드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 영상 카드 표시
      // 왜: 주요 타겟 기기
      await expect(page.getByRole("button", { name: "임산부 운동" })).toBeVisible();
      await expect(page.locator('a[href*="youtube.com/watch"]').first()).toBeVisible();
    });
  });
});
