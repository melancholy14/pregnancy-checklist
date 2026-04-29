import { test, expect } from "@playwright/test";

test.describe("Step 3: 타임라인 → 영상 크로스 링크", () => {
  test.describe("Happy Path", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/timeline");
    });

    test("linked_video_ids가 있는 카드에 관련 영상 링크가 표시된다", async ({ page }) => {
      // 무엇을: 21주차 카드에 "관련 영상" 섹션과 임산부 운동 영상 링크
      // 왜: 타임라인 → 영상 크로스 링크 기본 동작 확인
      const card = page.locator('[id="timeline-week-21"]');
      await expect(card.getByText("관련 영상")).toBeVisible();
      await expect(card.getByRole("link", { name: /임산부 스트레칭/ })).toBeVisible();
    });

    test("복수 영상이 매핑된 카드에서 모든 영상 링크가 표시된다", async ({ page }) => {
      // 무엇을: 21주차에 3개 영상 링크가 모두 표시되는지
      // 왜: 1:N 매핑이 올바르게 렌더링되는지 확인
      const card = page.locator('[id="timeline-week-21"]');
      const videoLinks = card.locator('a[href^="/videos#video_"]');
      await expect(videoLinks).toHaveCount(3);
    });

    test("관련 영상 링크를 클릭하면 영상 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 영상 링크 클릭 → /videos#video_id 이동
      // 왜: 크로스 링크가 실제로 동작하는지 검증
      const card = page.locator('[id="timeline-week-34"]');
      await card.getByRole("link", { name: /출산 임박신호/ }).click();
      await expect(page).toHaveURL(/\/videos#video_014/);
    });

    test("linked_video_ids가 없는 카드에는 관련 영상 영역이 없다", async ({ page }) => {
      // 무엇을: 5주차 카드에 관련 영상이 없는지
      // 왜: 매핑이 없는 주차에는 UI가 나타나지 않아야 함
      const card = page.locator('[id="timeline-week-5"]');
      await expect(card.getByText("관련 영상")).not.toBeVisible();
    });

    test("관련 글과 관련 영상이 동시에 표시될 수 있다", async ({ page }) => {
      // 무엇을: 32주차 카드에 관련 글 + 관련 영상 둘 다 표시
      // 왜: 두 크로스 링크가 충돌 없이 공존하는지 확인
      const card = page.locator('[id="timeline-week-32"]');
      await expect(card.getByText("관련 글")).toBeVisible();
      await expect(card.getByText("관련 영상")).toBeVisible();
    });

    test("8개 카드에 관련 영상 섹션이 렌더링된다", async ({ page }) => {
      // 무엇을: 매핑된 8개 주차 모두 확인 (12, 21, 22, 25, 30, 31, 32, 34)
      // 왜: 전수 매핑 검증
      const weeks = [12, 21, 22, 25, 30, 31, 32, 34];
      for (const week of weeks) {
        const card = page.locator(`[id="timeline-week-${week}"]`);
        await expect(card.getByText("관련 영상")).toBeVisible();
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 관련 영상 링크가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 관련 영상 링크가 보이는지
      // 왜: 주요 타겟 기기에서 UI 깨짐 없이 표시 확인
      await page.goto("/timeline");
      const card = page.locator('[id="timeline-week-34"]');
      await expect(card.getByText("관련 영상")).toBeVisible();
      await expect(card.getByRole("link", { name: /출산 임박신호/ })).toBeVisible();
    });
  });
});

test.describe("Step 6: 체중 ↔ 블로그 크로스 링크", () => {
  test.describe("체중 → 블로그 (기존 확인)", () => {
    test("체중 페이지 하단에 블로그 링크 카드가 표시된다", async ({ page }) => {
      // 무엇을: 체중 페이지에 "임신 중 체중 관리 가이드" 카드
      // 왜: 체중 → 블로그 크로스 링크 정상 확인
      await page.goto("/weight");
      await expect(page.getByText("임신 중 체중 관리 가이드")).toBeVisible();
      await expect(page.getByRole("link", { name: /임신 중 체중 관리 가이드/ })).toBeVisible();
    });

    test("블로그 링크 클릭 시 아티클 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 카드 클릭 → /articles/pregnancy-weight-management 이동
      // 왜: 링크 동작 확인
      await page.goto("/weight");
      await page.getByRole("link", { name: /임신 중 체중 관리 가이드/ }).click();
      await expect(page).toHaveURL(/\/articles\/pregnancy-weight-management/);
    });
  });

  test.describe("블로그 → 체중 (신규)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles/pregnancy-weight-management");
    });

    test("체중 관리 아티클 본문에 체중 기록 도구 CTA가 표시된다", async ({ page }) => {
      // 무엇을: 💡 블록쿼트 CTA가 렌더링되는지
      // 왜: 블로그 → 체중 역방향 크로스 링크 핵심 동작
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).toBeVisible();
      await expect(page.getByRole("link", { name: /체중 기록 도구/ })).toBeVisible();
    });

    test("체중 기록 도구 링크 클릭 시 체중 페이지로 이동한다", async ({ page }) => {
      // 무엇을: CTA 링크 클릭 → /weight 이동
      // 왜: 역방향 링크가 실제로 동작하는지 검증
      await page.getByRole("link", { name: /체중 기록 도구/ }).click();
      await expect(page).toHaveURL(/\/weight/);
    });

    test("다른 아티클에는 체중 CTA가 없다", async ({ page }) => {
      // 무엇을: hospital-bag 아티클에 체중 CTA가 없는지
      // 왜: 체중 CTA는 체중 관리 아티클에만 존재해야 함
      await page.goto("/articles/hospital-bag");
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 체중 CTA가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 CTA 표시
      // 왜: 모바일에서 UI 깨짐 없이 표시 확인
      await page.goto("/articles/pregnancy-weight-management");
      await expect(page.getByText("내 체중을 직접 기록해보세요!")).toBeVisible();
      await expect(page.getByRole("link", { name: /체중 기록 도구/ })).toBeVisible();
    });
  });
});
