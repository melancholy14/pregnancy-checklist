import { test, expect } from "@playwright/test";

test.describe("About 페이지 → 만든 사람 스토리텔링 (Step 13)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
  });

  test.describe("Happy Path", () => {
    test("페이지 타이틀이 '만든 사람'으로 표시된다", async ({ page }) => {
      // 무엇을: h1이 "만든 사람"인지 확인
      // 왜: 기존 "서비스 소개" → "만든 사람" 변경이 핵심 리뉴얼 포인트
      await expect(
        page.getByRole("heading", { level: 1, name: "만든 사람" }),
      ).toBeVisible();
    });

    test("'왜 만들었나' 스토리 섹션이 존재한다", async ({ page }) => {
      // 무엇을: "왜 만들었나" 제목과 스토리 텍스트가 보이는지
      // 왜: 개인 스토리텔링이 이번 리뉴얼의 핵심 가치
      await expect(
        page.getByRole("heading", { name: "왜 만들었나" }),
      ).toBeVisible();
      await expect(
        page.getByText("첫 아이를 준비하면서 검색해보니"),
      ).toBeVisible();
      await expect(
        page.getByText("개발자라 직접 만들기로 했어요"),
      ).toBeVisible();
    });

    test("'왜 만들었나' 섹션이 강조 카드 스타일이다", async ({ page }) => {
      // 무엇을: 스토리 섹션이 배경색 카드로 감싸져 있는지
      // 왜: PRD에서 bg-[#FFF4D4]/10 카드로 강조 요구
      const section = page.locator('section[aria-label="왜 만들었나"]');
      await expect(section).toBeVisible();
      await expect(section).toHaveClass(/rounded-xl/);
    });

    test("만든이 현재 주차가 자동 표시된다", async ({ page }) => {
      // 무엇을: "임신 N주차" 텍스트가 동적으로 표시되는지
      // 왜: CREATOR_DUE_DATE 기반 자동 계산이 핵심 기능
      await expect(page.getByText(/임신 \d+주차/)).toBeVisible();
    });

    test("'앞으로의 계획' 섹션이 존재한다", async ({ page }) => {
      // 무엇을: 향후 계획 섹션이 보이는지
      // 왜: 서비스 로드맵을 사용자에게 전달
      await expect(
        page.getByRole("heading", { name: "앞으로의 계획" }),
      ).toBeVisible();
      await expect(
        page.getByText("산후조리, 신생아 케어, 예방접종 트래커까지"),
      ).toBeVisible();
    });

    test("데이터 저장 안내 섹션이 유지된다", async ({ page }) => {
      // 무엇을: 기존 데이터 안내가 그대로 있는지
      // 왜: 리뉴얼 시 기존 필수 정보 유실 방지
      await expect(
        page.getByRole("heading", { name: "데이터 저장 안내" }),
      ).toBeVisible();
      await expect(
        page.getByText("로컬 저장소(LocalStorage)에만 저장"),
      ).toBeVisible();
    });

    test("의료 면책 안내 섹션이 유지된다", async ({ page }) => {
      // 무엇을: 기존 의료 면책이 그대로 있는지
      // 왜: 법적 면책 고지 유실 방지
      await expect(
        page.getByRole("heading", { name: "의료 면책 안내" }),
      ).toBeVisible();
      const section = page.locator('section[aria-label="의료 면책 안내"]');
      await expect(
        section.getByText("의료적 조언을 제공하지 않습니다"),
      ).toBeVisible();
    });

    test("'의견 보내기' 링크가 /contact로 연결된다", async ({ page }) => {
      // 무엇을: 의견 보내기 버튼이 /contact 페이지로 이동하는지
      // 왜: 사용자 피드백 채널 연결이 리뉴얼 요구사항
      const link = page.getByRole("link", { name: "의견 보내기" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/contact");
    });
  });

  test.describe("Error / Validation", () => {
    test("페이지에 '서비스 소개' 구 타이틀이 더 이상 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 기존 "서비스 소개" 타이틀이 제거되었는지
      // 왜: 리뉴얼 후 이전 구조가 남아있으면 안 됨
      await expect(
        page.getByRole("heading", { name: "서비스 소개" }),
      ).not.toBeVisible();
    });

    test("기존 '주요 기능' 리스트가 제거되었다", async ({ page }) => {
      // 무엇을: 기능 나열 섹션이 없어졌는지
      // 왜: 스토리텔링 구조로 전환 → 기능 목록 제거
      await expect(
        page.getByRole("heading", { name: "주요 기능" }),
      ).not.toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 전체 섹션이 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 모든 핵심 섹션이 보이는지
      // 왜: 주요 타겟 기기에서 레이아웃 깨짐 방지
      await expect(
        page.getByRole("heading", { level: 1, name: "만든 사람" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "왜 만들었나" }),
      ).toBeVisible();
      await expect(page.getByText(/임신 \d+주차/)).toBeVisible();
      await expect(
        page.getByRole("link", { name: "의견 보내기" }),
      ).toBeVisible();
    });

    test("모바일: 의견 보내기 버튼이 탭 가능하다", async ({ page }) => {
      // 무엇을: 모바일에서 의견 보내기 링크를 탭하면 /contact로 이동하는지
      // 왜: 모바일에서 CTA 동작 검증
      await page.getByRole("link", { name: "의견 보내기" }).click();
      await page.waitForURL("**/contact");
      await expect(page).toHaveURL(/\/contact/);
    });
  });
});
