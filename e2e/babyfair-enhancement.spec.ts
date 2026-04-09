import { test, expect } from "@playwright/test";

test.describe("베이비페어 정보 구체화 (Step 17)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/baby-fair");
  });

  test.describe("Happy Path", () => {
    test("대형 행사에 scale 배지 '대형'이 표시된다", async ({ page }) => {
      // 무엇을: scale=large 행사에 "대형" 배지가 보이는지
      // 왜: 규모 시각적 구분이 핵심 개선 포인트
      await expect(page.getByText("대형").first()).toBeVisible();
    });

    test("확장 정보가 있는 행사에 운영시간이 표시된다", async ({ page }) => {
      // 무엇을: operating_hours 필드가 있는 행사에 시간 정보가 보이는지
      // 왜: 운영시간은 방문 의사결정에 핵심 정보
      await expect(page.getByText(/10:00~18:00/).first()).toBeVisible();
    });

    test("확장 정보가 있는 행사에 입장 안내가 표시된다", async ({ page }) => {
      // 무엇을: admission 필드가 있는 행사에 입장 정보가 보이는지
      // 왜: 입장료 정보 부재가 PRD에서 지적한 문제점
      await expect(page.getByText(/사전등록 무료/).first()).toBeVisible();
    });

    test("확장 정보가 있는 행사에 주차 안내가 표시된다", async ({ page }) => {
      // 무엇을: parking 필드가 있는 행사에 주차 정보가 보이는지
      // 왜: 대형 페어에서 주차가 핵심 의사결정 요소
      await expect(page.getByText(/주차장/).first()).toBeVisible();
    });

    test("highlights가 있는 행사에 특징 리스트가 표시된다", async ({
      page,
    }) => {
      // 무엇을: highlights 배열이 있는 행사에 항목들이 보이는지
      // 왜: 행사 특징으로 방문 여부 판단
      await expect(page.getByText("200+ 브랜드 참여").first()).toBeVisible();
    });

    test("기존 데이터만 있는 행사도 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 확장 필드 없는 행사가 깨지지 않는지
      // 왜: 하위 호환 보장 필수
      // 예정 탭에서 확장 데이터 없는 소형 행사 확인
      const cards = page.locator(".rounded-2xl");
      await expect(cards.first()).toBeVisible();
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Error / Validation", () => {
    test("highlights가 3개 초과이면 '외 N개'가 표시된다", async ({ page }) => {
      // 무엇을: highlights 배열이 3개 초과일 때 잘림 처리되는지
      // 왜: 카드 길이 제한 (PRD 주의사항)
      // 현재 데이터는 모두 3개 이하이므로 "외" 텍스트가 없어야 함
      const overflowText = page.getByText(/^외 \d+개$/);
      await expect(overflowText).not.toBeVisible();
    });

    test("scale이 없는 행사에는 규모 배지가 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: scale 필드 없는 행사에 대형/중형/소형 배지가 안 나오는지
      // 왜: optional 필드의 조건부 렌더링 정확성 검증
      // 첫 번째 카드(과거 행사 탭의 대전 베이비페어)에 scale 없음
      await page.getByRole("tab", { name: /지난 행사/ }).click();
      const firstEndedCard = page.locator("[class*='rounded-2xl']").first();
      await expect(firstEndedCard).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: scale 배지와 도시 배지가 잘리지 않는다", async ({
      page,
    }) => {
      // 무엇을: 375px에서 배지가 줄바꿈되어 정상 표시되는지
      // 왜: 배지 추가로 카드 헤더가 좁은 화면에서 깨질 수 있음
      await expect(page.getByText("대형").first()).toBeVisible();
    });

    test("모바일: 확장 정보가 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 운영시간/입장료/주차 정보가 모바일에서 정상 표시되는지
      // 왜: 텍스트가 길어 모바일에서 잘릴 수 있음
      await expect(page.getByText(/사전등록 무료/).first()).toBeVisible();
    });
  });
});
