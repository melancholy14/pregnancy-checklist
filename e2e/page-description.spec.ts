import { test, expect } from "@playwright/test";

test.describe("도구 페이지 설명 텍스트 (PageDescription)", () => {
  test.describe("Happy Path", () => {
    test("타임라인 페이지에 설명 텍스트가 노출된다", async ({ page }) => {
      // 무엇을: 타임라인 페이지에 200~300자 설명 텍스트가 렌더링되는지 확인
      // 왜: AdSense 심사 봇이 텍스트를 파싱하여 사이트 가치를 판단하므로 충분한 텍스트가 필요
      await page.goto("/timeline");

      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(page.getByText("출산 예정일을 입력하면 현재 주차가 자동으로 하이라이트됩니다")).toBeVisible();
      await expect(page.getByText("체크리스트를 바로 관리할 수 있어요")).toBeVisible();
    });

    test("체중 기록 페이지에 설명 텍스트가 노출된다", async ({ page }) => {
      // 무엇을: 체중 기록 페이지에 BMI별 적정 체중 관련 설명이 렌더링되는지 확인
      // 왜: 도구 페이지에 텍스트가 없으면 "가치 낮은 콘텐츠"로 판정 위험
      await page.goto("/weight");

      await expect(page.getByRole("heading", { name: "체중 기록" })).toBeVisible();
      await expect(page.getByText("대한산부인과학회 기준 BMI별 적정 체중 증가 범위를 참고할 수")).toBeVisible();
      await expect(page.getByText("담당 의료진과 함께 체중 추이를")).toBeVisible();
    });

    test("베이비페어 페이지에 설명 텍스트가 노출된다", async ({ page }) => {
      // 무엇을: 베이비페어 페이지에 필터 안내 관련 설명이 렌더링되는지 확인
      // 왜: 위젯만 있는 페이지는 AdSense 심사에서 "Low-value content"로 거절됨
      await page.goto("/baby-fair");

      await expect(page.getByRole("heading", { name: "베이비페어 일정" })).toBeVisible();
      await expect(page.getByText("지역별·연도별 필터로 원하는 행사만 골라볼 수 있습니다")).toBeVisible();
      await expect(page.getByText("사전 등록 할인과 선착순 혜택 정보도 함께 안내합니다")).toBeVisible();
    });

    test("영상 콘텐츠 페이지에 설명 텍스트가 노출된다", async ({ page }) => {
      // 무엇을: 영상 페이지에 카테고리 큐레이션 관련 설명이 렌더링되는지 확인
      // 왜: 영상 임베드만으로는 텍스트 밀도가 부족
      await page.goto("/videos");

      await expect(page.getByRole("heading", { name: "영상 콘텐츠" })).toBeVisible();
      await expect(page.getByText("검증된 채널의 영상을")).toBeVisible();
      await expect(page.getByText("세부 카테고리 필터로 필요한 영상만 골라 시청할 수 있어요")).toBeVisible();
    });

    test("정보글 페이지에 설명 텍스트가 노출된다", async ({ page }) => {
      // 무엇을: 정보글 목록 페이지에 경험 기반 작성 원칙 관련 설명이 렌더링되는지 확인
      // 왜: 아티클 목록 페이지에도 설명 텍스트가 있어야 사이트 전체 콘텐츠 밀도가 충분
      await page.goto("/articles");

      await expect(page.getByRole("heading", { name: "정보 & 가이드" })).toBeVisible();
      await expect(page.getByText("경험 기반으로")).toBeVisible();
      await expect(page.getByText("참고 자료 출처가 명시되어 있어 신뢰할 수 있는 정보를 제공합니다")).toBeVisible();
    });
  });

  test.describe("SSG 렌더링 검증", () => {
    test("설명 텍스트가 초기 HTML에 포함되어 있다 (JS 비활성화)", async ({
      browser,
    }) => {
      // 무엇을: JavaScript 없이도 설명 텍스트가 HTML에 포함되는지 확인
      // 왜: AdSense 심사 봇은 텍스트를 파싱하는데, CSR 전용이면 봇이 읽지 못할 수 있음
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await page.goto("/timeline");
      await expect(page.getByText("출산 예정일을 입력하면 현재 주차가 자동으로 하이라이트됩니다")).toBeVisible();

      await page.goto("/weight");
      await expect(page.getByText("대한산부인과학회 기준 BMI별 적정 체중 증가 범위를 참고할 수")).toBeVisible();

      await page.goto("/baby-fair");
      await expect(page.getByText("지역별·연도별 필터로 원하는 행사만 골라볼 수 있습니다")).toBeVisible();

      await page.goto("/videos");
      await expect(page.getByText("검증된 채널의 영상을")).toBeVisible();

      await page.goto("/articles");
      await expect(page.getByText("경험 기반으로")).toBeVisible();

      await context.close();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 설명 텍스트가 도구 UI를 과도하게 밀어내지 않는다", async ({
      page,
    }) => {
      // 무엇을: 375px 모바일 화면에서 설명 텍스트 아래에 본문 UI가 보이는지 확인
      // 왜: 설명이 길어서 실제 도구 UI가 fold 아래로 밀리면 UX 저하
      await page.goto("/timeline");
      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(page.getByText("출산 예정일을 입력하면 현재 주차가 자동으로 하이라이트됩니다")).toBeVisible();

      await page.goto("/weight");
      await expect(page.getByRole("heading", { name: "체중 기록" })).toBeVisible();
      await expect(page.getByText("대한산부인과학회 기준 BMI별 적정 체중 증가 범위를 참고할 수")).toBeVisible();

      await page.goto("/baby-fair");
      await expect(page.getByRole("heading", { name: "베이비페어 일정" })).toBeVisible();
      await expect(page.getByText("지역별·연도별 필터로 원하는 행사만 골라볼 수 있습니다")).toBeVisible();
    });
  });
});
