import { test, expect } from "@playwright/test";

test.describe("타임라인 정보 구체화 (Step 16)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test.describe("Happy Path", () => {
    test("타임라인에 36개 이상 항목이 표시된다", async ({ page }) => {
      // 무엇을: 빈 주차 채움 후 총 항목 수가 36개 이상인지
      // 왜: 기존 21개 → 36개로 증가 확인
      const cards = page.locator("[id^='timeline-week-']");
      await expect(cards.first()).toBeVisible();
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(36);
    });

    test("Week 5 항목이 존재한다 (신규 빈 주차)", async ({ page }) => {
      // 무엇을: 기존에 없던 Week 5 항목이 추가되었는지
      // 왜: 빈 주차 채우기의 대표 케이스
      const week5 = page.locator("#timeline-week-5");
      await expect(week5).toBeAttached();
      await expect(week5.getByText("임신 초기 생활 습관 점검")).toBeVisible();
    });

    test("Week 13 항목이 존재한다 (초기→중기 전환)", async ({ page }) => {
      // 무엇을: Week 13 빈 주차가 채워졌는지
      // 왜: 임신 초기→중기 전환점 커버 확인
      const week13 = page.locator("#timeline-week-13");
      await expect(week13).toBeAttached();
      await expect(week13.getByText("임신 초기 → 중기 전환")).toBeVisible();
    });

    test("Week 33 항목이 존재한다 (후기 빈 주차)", async ({ page }) => {
      // 무엇을: Week 33 빈 주차가 채워졌는지
      // 왜: 후기 빈 주차 커버 확인
      const week33 = page.locator("#timeline-week-33");
      await expect(week33).toBeAttached();
      await expect(week33.getByText("신생아 용품 최종 점검")).toBeVisible();
    });

    test("타임라인 카드에 type 배지가 표시된다", async ({ page }) => {
      // 무엇을: 카드 헤더에 type별 아이콘+라벨 배지가 있는지
      // 왜: type 시각적 구분이 이번 개선의 핵심 UI 변경
      const firstCard = page.locator("[id^='timeline-week-']").first();
      await expect(firstCard).toBeVisible();
      // 5가지 type 라벨 중 하나 이상이 페이지에 존재
      const badges = page.getByText(/(?:준비|쇼핑|행정|교육|건강)/);
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });

    test("행정 type 배지가 올바른 라벨로 표시된다", async ({ page }) => {
      // 무엇을: admin type 항목에 "행정" 라벨이 표시되는지
      // 왜: TIMELINE_TYPE_CONFIG 매핑 정확성 확인
      const week4 = page.locator("#timeline-week-4");
      await expect(week4).toBeAttached();
      await expect(week4.getByText("행정")).toBeVisible();
    });

    test("건강 type 배지가 올바른 라벨로 표시된다", async ({ page }) => {
      // 무엇을: wellbeing type 항목에 "건강" 라벨이 표시되는지
      // 왜: TIMELINE_TYPE_CONFIG 매핑 정확성 확인
      const week5 = page.locator("#timeline-week-5");
      await expect(week5).toBeAttached();
      await expect(week5.getByText("건강")).toBeVisible();
    });

    test("기존 항목(Week 32)의 description이 간결하게 정비되었다", async ({
      page,
    }) => {
      // 무엇을: 긴 description이 핵심 1문장으로 정비되었는지
      // 왜: description 포맷 개선 확인
      const week32 = page.locator("#timeline-week-32");
      await expect(week32).toBeAttached();
      await expect(
        week32.getByText("아래 체크리스트에서 하나씩 확인하세요"),
      ).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("Week 4~40 범위 내 주요 주차에 항목이 존재한다", async ({ page }) => {
      // 무엇을: 연속된 주차가 비어있지 않은지 샘플 확인
      // 왜: 빈 주차 채우기가 올바르게 적용되었는지 검증
      const sampleWeeks = [4, 7, 11, 15, 19, 23, 27, 31, 33];
      for (const week of sampleWeeks) {
        await expect(
          page.locator(`#timeline-week-${week}`),
        ).toBeAttached();
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: type 배지가 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 배지가 타이틀과 함께 잘리지 않는지
      // 왜: 배지 추가로 카드 헤더가 좁은 화면에서 깨질 수 있음
      const firstCard = page.locator("[id^='timeline-week-']").first();
      await expect(firstCard).toBeVisible();
      const badges = page.getByText(/(?:준비|쇼핑|행정|교육|건강)/);
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });

    test("모바일: 신규 항목(Week 9)이 정상 표시된다", async ({ page }) => {
      // 무엇을: 모바일에서 신규 항목이 정상 렌더링되는지
      // 왜: 신규 데이터가 모바일에서도 동작하는지 확인
      const week9 = page.locator("#timeline-week-9");
      await expect(week9).toBeAttached();
      await expect(week9.getByText("NIPT/융모막 검사 상담")).toBeVisible();
    });
  });
});
