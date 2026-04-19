import { test, expect } from "@playwright/test";

// 검색 다이얼로그는 data-slot="dialog-content"로 특정
const searchDialog = (page: import("@playwright/test").Page) =>
  page.locator("[data-slot='dialog-content']");

test.describe("클라이언트 검색", () => {
  // 쿠키 동의 배너가 dialog role을 가지므로, 테스트 전에 미리 동의 처리
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("cookie-consent", "accepted");
    });
  });

  test.describe("Happy Path", () => {
    test("StickyHeader에 검색 아이콘이 노출된다 (홈 제외)", async ({ page }) => {
      // 무엇을: 홈이 아닌 페이지에서 검색 버튼이 보이는지
      // 왜: StickyHeader는 홈에서 숨겨지므로, 다른 페이지에서 검색 진입점이 있어야 함
      await page.goto("/timeline");
      await expect(page.getByRole("button", { name: "검색" })).toBeVisible();
    });

    test("검색 아이콘 클릭 시 모달이 열리고 안내 메시지가 표시된다", async ({ page }) => {
      // 무엇을: 검색 모달이 열리고 "검색어를 입력하세요" 안내가 보이는지
      // 왜: 사용자에게 2자 이상 입력해야 한다는 가이드를 제공해야 함
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)")).toBeVisible();
      await expect(dialog.getByText("검색어를 입력하세요", { exact: true })).toBeVisible();
    });

    test("2자 이상 입력 시 검색 결과가 그룹별로 노출된다", async ({ page }) => {
      // 무엇을: "임신"처럼 공통 키워드 검색 시 타임라인 결과가 섹션별로 나오는지
      // 왜: 검색 결과가 타입별로 분리되어야 사용자가 원하는 콘텐츠를 빠르게 찾을 수 있음
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("임신");

      // "검색어를 입력하세요" 안내가 사라지고 결과가 나와야 함
      await expect(dialog.getByText("검색어를 입력하세요", { exact: true })).not.toBeVisible();

      // 타임라인 그룹 헤딩이 존재해야 함
      await expect(dialog.locator("[role='listbox']").getByText("타임라인")).toBeVisible();
    });

    test("타임라인 결과 클릭 시 /timeline#timeline-week-N으로 이동한다", async ({ page }) => {
      // 무엇을: 타임라인 검색 결과 클릭 시 해당 주차로 이동하는지
      // 왜: 검색 → 타임라인 연결이 핵심 UX 흐름
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("임신 확인");

      const result = dialog.locator("[role='option']").filter({ hasText: "4주" }).first();
      await expect(result).toBeVisible();
      await result.click();

      await expect(page).toHaveURL(/\/timeline#timeline-week-4/);
    });

    test("정보글 결과 클릭 시 /articles/slug 으로 이동한다", async ({ page }) => {
      // 무엇을: 정보글 검색 결과 클릭 시 해당 아티클로 이동하는지
      // 왜: 검색 → 아티클 연결이 콘텐츠 발견성의 핵심
      await page.goto("/articles");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("체중 관리");

      await expect(dialog.locator("[role='listbox']").getByText("정보글")).toBeVisible();
      const result = dialog.locator("[role='option']").filter({ hasText: "체중" }).first();
      await expect(result).toBeVisible();
      await result.click();

      await expect(page).toHaveURL(/\/articles\//);
    });

    test("영상 결과 클릭 시 /videos#video_id 로 이동한다", async ({ page }) => {
      // 무엇을: 영상 검색 결과 클릭 시 영상 페이지의 해당 카드로 이동하는지
      // 왜: 영상 검색 → hash 스크롤 + 하이라이트가 정상 동작해야 함
      await page.goto("/videos");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("스트레칭");

      await expect(dialog.locator("[role='listbox']").getByText("영상", { exact: true })).toBeVisible();
      const result = dialog.locator("[role='option']").filter({ hasText: "스트레칭" }).first();
      await expect(result).toBeVisible();
      await result.click();

      await expect(page).toHaveURL(/\/videos#video_/);
    });

    test("모달 닫기 버튼 클릭 시 모달이 닫힌다", async ({ page }) => {
      // 무엇을: X 버튼으로 모달 닫기
      // 왜: 사용자가 검색을 취소할 수 있어야 함
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("1자 입력 시 검색이 실행되지 않고 안내 메시지가 유지된다", async ({ page }) => {
      // 무엇을: 1자 입력 시 "검색어를 입력하세요" 안내가 그대로 유지되는지
      // 왜: fuse.js minMatchCharLength: 2 설정과 query.length < 2 가드
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("임");

      await expect(dialog.getByText("검색어를 입력하세요", { exact: true })).toBeVisible();
    });

    test("매칭 결과 없는 검색어 입력 시 빈 결과 안내가 표시된다", async ({ page }) => {
      // 무엇을: 전혀 매칭 안 되는 검색어에 "검색 결과가 없습니다" 표시
      // 왜: 사용자에게 결과가 없음을 명확히 알려야 함
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("zzzzxxxx");

      await expect(dialog.getByText("검색 결과가 없습니다")).toBeVisible();
    });

    test("모달 재열림 시 이전 검색어가 초기화된다", async ({ page }) => {
      // 무엇을: 모달을 닫았다 다시 열면 검색어가 빈 상태인지
      // 왜: 이전 검색 컨텍스트가 남아있으면 혼란
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      const input = dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)");
      await input.fill("임신");

      // 모달 닫기
      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).not.toBeVisible();

      // 다시 열기
      await page.getByRole("button", { name: "검색" }).click();
      await expect(dialog).toBeVisible();
      await expect(input).toHaveValue("");
      await expect(dialog.getByText("검색어를 입력하세요", { exact: true })).toBeVisible();
    });
  });

  test.describe("권한 / 인증", () => {
    test("비로그인 상태에서도 검색 기능이 정상 동작한다", async ({ page }) => {
      // 무엇을: 인증 없이 검색 모달이 열리고 결과가 표시되는지
      // 왜: 이 앱은 공개 사이트로 인증 없이 모든 기능이 동작해야 함
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("운동");

      const items = dialog.locator("[role='option']");
      await expect(items.first()).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 검색 아이콘이 노출되고 모달이 정상 동작한다", async ({ page }) => {
      // 무엇을: 375px에서 검색 아이콘 → 모달 → 검색 → 결과 노출 전체 흐름
      // 왜: 주 타겟이 모바일 사용자이므로 검색 UX가 완전해야 함
      await page.goto("/timeline");
      await expect(page.getByRole("button", { name: "검색" })).toBeVisible();

      await page.getByRole("button", { name: "검색" }).click();
      const dialog = searchDialog(page);
      await expect(dialog).toBeVisible();

      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("요가");
      await expect(dialog.locator("[role='option']").first()).toBeVisible();
    });

    test("모바일: 결과 클릭 시 페이지 이동이 정상 동작한다", async ({ page }) => {
      // 무엇을: 375px에서 검색 결과 터치 시 정상 네비게이션
      // 왜: 터치 인터랙션에서도 onClick이 정상 발화해야 함
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = searchDialog(page);
      await dialog.getByPlaceholder("검색어를 입력하세요 (2자 이상)").fill("엽산");

      const result = dialog.locator("[role='option']").first();
      await expect(result).toBeVisible();
      await result.click();

      // 모달이 닫히고 페이지가 변경됨
      await expect(dialog).not.toBeVisible();
    });
  });
});
