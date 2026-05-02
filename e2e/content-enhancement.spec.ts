import { test, expect } from "@playwright/test";

test.describe("정보글 시스템", () => {
  test.describe("Happy Path — 목록 페이지 (/info 통합 허브)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/info");
      // 블로그 탭으로 이동해 글 목록만 노출시킨다
      await page.getByRole("tab", { name: "블로그" }).click();
    });

    test("제목이 렌더링된다", async ({ page }) => {
      // 무엇을: /info 통합 허브 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: /정보/, level: 1 })).toBeVisible();
    });

    test("발행된 정보글이 목록에 표시된다", async ({ page }) => {
      // 무엇을: 현재 발행된 MD 글들이 노출되는지
      // 왜: AdSense 승인을 위한 콘텐츠 볼륨 확인
      await expect(
        page.getByRole("heading", { name: "임신 초기 필수 검사 총정리" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /임신 중 체중관리 완전 정리/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /태아보험.*가입 전에/ }),
      ).toBeVisible();
    });

    test("통합 태그 필터 칩이 표시된다", async ({ page }) => {
      // 무엇을: 전체 + 통합 태그 필터 버튼
      // 왜: 태그 기반 필터링 UI 존재 확인
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^#출산준비$/ })).toBeVisible();
    });

    test("글 카드 클릭 시 상세 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 목록 → 상세 네비게이션 (URL 유지)
      // 왜: 정보글 탐색 핵심 흐름
      await page
        .getByRole("link", { name: /임신 초기 필수 검사 총정리/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/articles\/early-pregnancy-tests/);
    });
  });

  test.describe("Happy Path — 통합 태그 필터", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/info");
    });

    test("통합 태그 클릭 시 매칭된 글만 노출된다", async ({ page }) => {
      // 무엇을: 통합 태그 필터 동작
      // 왜: 사용자가 관심 주제별로 글을 찾을 수 있어야 함
      await page.getByRole("button", { name: /^#보험$/ }).click();
      await expect(
        page.getByRole("heading", { name: /태아보험.*가입 전에/ }),
      ).toBeVisible();
      // 보험 태그가 없는 글은 숨겨져야 함
      await expect(
        page.getByRole("heading", { name: "임신 초기 필수 검사 총정리" }),
      ).toHaveCount(0);
    });

    test("전체 버튼 클릭 시 모든 콘텐츠가 다시 노출된다", async ({ page }) => {
      // 무엇을: 필터 초기화
      // 왜: 태그 필터 후 전체 보기로 돌아갈 수 있어야 함
      await page.getByRole("button", { name: /^#보험$/ }).click();
      await page
        .getByRole("button", { name: "전체", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: /태아보험.*가입 전에/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "임신 초기 필수 검사 총정리" }),
      ).toBeVisible();
    });
  });

  test.describe("Happy Path — 상세 페이지", () => {
    test("상세 페이지가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 정보글 상세 페이지 콘텐츠 표시
      // 왜: MD → HTML 변환 결과 검증
      await page.goto("/articles/early-pregnancy-tests");
      await expect(
        page.getByRole("heading", { name: "임신 초기 필수 검사 총정리" }),
      ).toBeVisible();
      await expect(page.getByText("#임신초기").first()).toBeVisible();
      // 본문 콘텐츠 일부 확인
      await expect(page.getByText(/NIPT/).first()).toBeVisible();
    });

    test("목록으로 돌아가기 링크가 동작한다", async ({ page }) => {
      // 무엇을: 상세 → 통합 정보 허브 네비게이션
      // 왜: 뒤로가기 UX (목록은 /info로 통합됨)
      await page.goto("/articles/early-pregnancy-tests");
      await page.getByText("목록으로").click();
      await expect(page).toHaveURL(/\/info\/?$/);
    });

    test("각 정보글이 1,000자 이상 콘텐츠를 가진다", async ({ page }) => {
      // 무엇을: 정보글 콘텐츠 볼륨 확인
      // 왜: AdSense 승인 기준 (1,000자+)
      const slugs = [
        "early-pregnancy-fatigue-reasons",
        "early-pregnancy-tests",
        "mid-pregnancy-lifestyle-guide",
        "pregnancy-weight-management",
        "weekly-prenatal-checklist",
        "prenatal-insurance-preparation-guide",
        "pregnancy-government-benefits-2026",
      ];
      for (const slug of slugs) {
        await page.goto(`/articles/${slug}`);
        const article = page.locator("article");
        const text = await article.textContent();
        expect(text?.length).toBeGreaterThan(1000);
      }
    });

    test("의료 면책 고지가 표시된다", async ({ page }) => {
      // 무엇을: 정보글 하단 의료 면책 문구
      // 왜: 의료 정보 면책 요구사항 (AdSense 신뢰도)
      await page.goto("/articles/early-pregnancy-tests");
      await expect(page.getByText(/담당.*의료진/).first()).toBeVisible();
    });
  });

  test.describe("리다이렉트", () => {
    test("/guides/hospital-bag → /articles/hospital-bag 리다이렉트", async ({ page }) => {
      // 무엇을: 기존 가이드 URL에서 정보글 URL로 리다이렉트
      // 왜: 북마크/외부 링크 호환성
      await page.goto("/guides/hospital-bag");
      await expect(page).toHaveURL(/\/articles\/hospital-bag/);
    });

    test("/guides/weekly-prep → /articles/weekly-prenatal-checklist 리다이렉트", async ({ page }) => {
      // 무엇을: 기존 가이드 URL에서 정보글 URL로 리다이렉트
      // 왜: 북마크/외부 링크 호환성
      await page.goto("/guides/weekly-prep");
      await expect(page).toHaveURL(/\/articles\/weekly-prenatal-checklist/);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 통합 정보 허브가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 /info 통합 허브 노출
      // 왜: 주요 타겟 기기
      await page.goto("/info");
      await expect(page.getByRole("heading", { name: /정보/, level: 1 })).toBeVisible();
      await expect(page.getByText("임신 초기 필수 검사 총정리")).toBeVisible();
    });

    test("모바일: 통합 태그 필터가 줄바꿈되며 정상 동작한다", async ({ page }) => {
      // 무엇을: 좁은 화면에서 통합 태그 칩이 wrap되어 보이는지
      // 왜: 태그가 잘리거나 숨겨지면 안 됨
      await page.goto("/info");
      await expect(page.getByRole("button", { name: "전체" }).first()).toBeVisible();
      await page.getByRole("button", { name: /^#출산준비$/ }).click();
      await expect(
        page.getByRole("heading", { name: /임신 주차별 검사/ }),
      ).toBeVisible();
    });

    test("모바일: 상세 페이지 콘텐츠가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 상세 페이지가 읽기 가능한지
      // 왜: 본문 prose 스타일이 모바일에서 깨지지 않아야 함
      await page.goto("/articles/early-pregnancy-tests");
      await expect(
        page.getByRole("heading", { name: "임신 초기 필수 검사 총정리" }),
      ).toBeVisible();
      const article = page.locator("article");
      await expect(article).toContainText("NIPT");
    });
  });
});

test.describe("네비게이션 & 대시보드 업데이트", () => {
  test.describe("Happy Path", () => {
    test("하단 네비에 정보 탭이 있다", async ({ page }) => {
      // 무엇을: 체중 탭이 정보 탭으로 교체되었는지
      // 왜: 콘텐츠 강화 Phase에서 네비 재구성
      await page.goto("/");
      const nav = page.locator("nav");
      await expect(nav.getByText("정보")).toBeVisible();
      // 체중 탭은 네비에서 제거됨
      await expect(nav.getByText("체중")).not.toBeVisible();
    });

    test("정보 탭 클릭 시 /info로 이동한다", async ({ page }) => {
      // 무엇을: 네비게이션 → 통합 정보 허브 이동
      // 왜: 네비게이션 핵심 동작
      await page.goto("/");
      await page.locator("nav").getByText("정보").click();
      await expect(page).toHaveURL(/\/info\/?$/);
    });

    test("홈 대시보드에 정보 카드가 있다", async ({ page }) => {
      // 무엇을: 홈 대시보드에 정보글 진입점
      // 왜: 대시보드에서도 정보글로 접근 가능해야 함
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");
      await expect(
        page.locator('a[href="/info"]').first(),
      ).toBeVisible();
    });

    test("홈 대시보드 정보 카드는 /info로 직접 연결된다", async ({ page }) => {
      // 무엇을: 대시보드 카드 href가 /info (리다이렉트 우회)
      // 왜: 내부 클릭에서 리다이렉트 깜빡임 제거
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");
      const infoLink = page.locator('a[href="/info"]').first();
      await expect(infoLink).toBeVisible();
      await expect(infoLink).toContainText("정보 & 가이드");
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 정보 탭이 하단 네비에 보인다", async ({ page }) => {
      // 무엇을: 모바일에서 네비 정보 탭 노출
      // 왜: 4탭이 좁은 화면에서 잘 배치되는지
      await page.goto("/");
      const nav = page.locator("nav");
      await expect(nav.getByText("정보")).toBeVisible();
      await expect(nav.getByText("홈")).toBeVisible();
    });
  });
});

test.describe("SEO — 정보글 메타데이터", () => {
  test("/info 통합 허브에 고유 title이 있다", async ({ page }) => {
    // 무엇을: /info 페이지 title 태그
    // 왜: SEO 색인 품질
    await page.goto("/info");
    await expect(page).toHaveTitle(/정보/);
  });

  test("상세 페이지에 글별 title이 있다", async ({ page }) => {
    // 무엇을: /articles/[slug] 페이지 title 태그
    // 왜: 각 정보글이 고유 title로 색인되어야 함
    await page.goto("/articles/early-pregnancy-tests");
    await expect(page).toHaveTitle(/임신 초기 필수 검사 총정리/);
  });

  test("상세 페이지에 canonical URL이 있다", async ({ page }) => {
    // 무엇을: 정보글 canonical 메타태그
    // 왜: 중복 콘텐츠 방지 (AdSense 승인 요건)
    await page.goto("/articles/early-pregnancy-tests");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      /\/articles\/early-pregnancy-tests/
    );
  });

  test("상세 페이지에 OG 태그가 있다", async ({ page }) => {
    // 무엇을: 정보글 Open Graph 메타태그
    // 왜: SNS 공유 시 미리보기 품질 (트래픽 확보)
    await page.goto("/articles/early-pregnancy-tests");
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /임신 초기 필수 검사 총정리/);
  });
});
