import { test, expect } from "@playwright/test";

test.describe("정보글 시스템", () => {
  test.describe("Happy Path — 목록 페이지", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles");
    });

    test("제목과 설명이 렌더링된다", async ({ page }) => {
      // 무엇을: 정보글 목록 페이지 기본 UI
      // 왜: 페이지 정상 진입 확인
      await expect(page.getByRole("heading", { name: "정보 & 가이드" })).toBeVisible();
      await expect(page.getByText("경험 기반으로 정리했습니다")).toBeVisible();
    });

    test("정보글 7개가 목록에 표시된다", async ({ page }) => {
      // 무엇을: 7개 MD 파일 기반 글이 모두 노출되는지
      // 왜: AdSense 승인을 위한 최소 콘텐츠 볼륨 확인
      await expect(page.getByText("출산 가방 필수 준비물 총정리")).toBeVisible();
      await expect(page.getByText("임신 주차별 검사")).toBeVisible();
      await expect(page.getByText("임신 초기 필수 검사 총정리")).toBeVisible();
      await expect(page.getByText("산후조리원 선택 가이드")).toBeVisible();
      await expect(page.getByText("출산 준비물 예상 비용 총정리")).toBeVisible();
      await expect(page.getByText("임신 중 체중관리 완전 정리")).toBeVisible();
      await expect(page.getByText("태아보험, 가입 전에 꼭 따져봐야 할")).toBeVisible();
    });

    test("태그 필터 칩이 표시된다", async ({ page }) => {
      // 무엇을: 전체 + 각 태그별 필터 버튼
      // 왜: 태그 기반 필터링 UI 존재 확인
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: "출산준비" })).toBeVisible();
    });

    test("글 카드에 태그가 표시된다", async ({ page }) => {
      // 무엇을: 글 카드에 태그 배지가 보이는지
      // 왜: 태그 UI가 정보글 탐색을 돕는지 확인
      await expect(page.getByText("#출산가방").first()).toBeVisible();
    });

    test("글 카드 클릭 시 상세 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 목록 → 상세 네비게이션
      // 왜: 정보글 탐색 핵심 흐름
      await page.getByText("출산 가방 필수 준비물 총정리").click();
      await expect(page).toHaveURL(/\/articles\/hospital-bag/);
    });
  });

  test.describe("Happy Path — 태그 필터", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles");
    });

    test("태그 클릭 시 해당 태그 글만 노출된다", async ({ page }) => {
      // 무엇을: 태그 필터 동작
      // 왜: 사용자가 관심 주제별로 글을 찾을 수 있어야 함
      await page.getByRole("button", { name: "산후관리" }).click();
      await expect(page.getByText("산후조리원 선택 가이드")).toBeVisible();
      // 산후관리 태그가 없는 글은 숨겨져야 함
      await expect(page.getByText("임신 초기 필수 검사 총정리")).not.toBeVisible();
    });

    test("전체 버튼 클릭 시 모든 글이 다시 노출된다", async ({ page }) => {
      // 무엇을: 필터 초기화
      // 왜: 태그 필터 후 전체 보기로 돌아갈 수 있어야 함
      await page.getByRole("button", { name: "산후관리" }).click();
      await page.getByRole("button", { name: "전체" }).click();
      await expect(page.getByText("출산 가방 필수 준비물 총정리")).toBeVisible();
      await expect(page.getByText("임신 초기 필수 검사 총정리")).toBeVisible();
    });
  });

  test.describe("Happy Path — 상세 페이지", () => {
    test("상세 페이지가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 정보글 상세 페이지 콘텐츠 표시
      // 왜: MD → HTML 변환 결과 검증
      await page.goto("/articles/hospital-bag");
      await expect(page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })).toBeVisible();
      await expect(page.getByText("#출산가방")).toBeVisible();
      // 본문 콘텐츠 일부 확인
      await expect(page.getByText(/산모 잠옷/).first()).toBeVisible();
    });

    test("목록으로 돌아가기 링크가 동작한다", async ({ page }) => {
      // 무엇을: 상세 → 목록 네비게이션
      // 왜: 뒤로가기 UX
      await page.goto("/articles/hospital-bag");
      await page.getByText("목록으로").click();
      await expect(page).toHaveURL(/\/articles$/);
    });

    test("각 정보글이 1,000자 이상 콘텐츠를 가진다", async ({ page }) => {
      // 무엇을: 정보글 콘텐츠 볼륨 확인
      // 왜: AdSense 승인 기준 (1,000자+)
      const slugs = [
        "hospital-bag",
        "weekly-prenatal-checklist",
        "early-pregnancy-tests",
        "postpartum-care",
        "baby-items-cost",
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

    test("모바일: 목록 페이지가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 정보글 목록 표시
      // 왜: 주요 타겟 기기
      await page.goto("/articles");
      await expect(page.getByRole("heading", { name: "정보 & 가이드" })).toBeVisible();
      await expect(page.getByText("출산 가방 필수 준비물 총정리")).toBeVisible();
    });

    test("모바일: 태그 필터가 줄바꿈되며 정상 동작한다", async ({ page }) => {
      // 무엇을: 좁은 화면에서 태그 칩이 wrap되어 보이는지
      // 왜: 태그가 잘리거나 숨겨지면 안 됨
      await page.goto("/articles");
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await page.getByRole("button", { name: "출산준비" }).click();
      await expect(page.getByText("출산 가방 필수 준비물 총정리")).toBeVisible();
    });

    test("모바일: 상세 페이지 콘텐츠가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 상세 페이지가 읽기 가능한지
      // 왜: 본문 prose 스타일이 모바일에서 깨지지 않아야 함
      await page.goto("/articles/baby-items-cost");
      await expect(page.getByRole("heading", { name: "출산 준비물 예상 비용 총정리" })).toBeVisible();
      // 본문 콘텐츠가 존재하는지 (스크롤 없이 article 요소 내부)
      const article = page.locator("article");
      await expect(article).toContainText("카테고리별");
    });
  });
});

test.describe("영상 페이지 개편", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/videos");
  });

  test.describe("Happy Path — 영상 뷰", () => {
    test("영상/채널 뷰 전환 버튼이 표시된다", async ({ page }) => {
      // 무엇을: 영상/채널 토글 UI
      // 왜: 두 가지 뷰를 전환할 수 있어야 함
      await expect(page.getByRole("button", { name: "영상" })).toBeVisible();
      await expect(page.getByRole("button", { name: "채널" })).toBeVisible();
    });

    test("카테고리 필터에 전체 버튼이 있다", async ({ page }) => {
      // 무엇을: 카테고리 필터에 전체 선택 옵션
      // 왜: 모든 카테고리 영상을 한 번에 볼 수 있어야 함
      await expect(page.getByRole("button", { name: "전체" }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "임산부 운동" })).toBeVisible();
      await expect(page.getByRole("button", { name: "출산 준비", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "신생아 케어" })).toBeVisible();
    });

    test("카테고리 선택 시 세부 카테고리 필터가 나타난다", async ({ page }) => {
      // 무엇을: 2단 필터 — 카테고리 선택 후 세부 카테고리
      // 왜: subcategory 기반 세분화 검증
      await page.getByRole("button", { name: "임산부 운동" }).click();
      await expect(page.getByRole("button", { name: /산전 요가/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /산전 필라테스/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /순산 준비 운동/ })).toBeVisible();
    });

    test("세부 카테고리 필터가 동작한다", async ({ page }) => {
      // 무엇을: 세부 카테고리 클릭 시 해당 영상만 노출
      // 왜: subcategory 필터링 핵심 기능
      await page.getByRole("button", { name: "임산부 운동" }).click();
      await page.getByRole("button", { name: "요가" }).click();
      await expect(page.getByText(/임산부 요가/).first()).toBeVisible();
      // 걷기 영상은 숨겨져야 함
      await expect(page.getByText("임산부 걷기 운동 - 집에서 하는 30분 유산소")).not.toBeVisible();
    });

    test("영상 카드에 채널명이 표시된다", async ({ page }) => {
      // 무엇을: 영상 카드에 채널 이름 노출
      // 왜: 영상 출처 정보 제공
      const card = page.locator('a[href*="youtube.com/watch"]').first();
      await expect(card).toBeVisible();
    });

    test("15개 이상 영상이 존재한다", async ({ page }) => {
      // 무엇을: 영상 총 개수 확인
      // 왜: AdSense 승인을 위한 콘텐츠 볼륨
      const videoLinks = page.locator('a[href*="youtube.com/watch"]');
      await expect(videoLinks.first()).toBeVisible();
      const count = await videoLinks.count();
      expect(count).toBeGreaterThanOrEqual(15);
    });
  });

  test.describe("Happy Path — 채널 뷰", () => {
    test("채널 뷰로 전환하면 채널 목록이 표시된다", async ({ page }) => {
      // 무엇을: 채널 뷰 전환 시 채널 카드 노출
      // 왜: 채널 탐색 기능 핵심 흐름
      await page.getByRole("button", { name: "채널" }).click();
      // 채널 카드에 채널명이 보여야 함
      const channelLinks = page.locator('a[href*="youtube.com/channel"]');
      await expect(channelLinks.first()).toBeVisible();
    });

    test("채널 카드에 썸네일이 표시된다", async ({ page }) => {
      // 무엇을: 채널 썸네일 이미지 노출
      // 왜: 채널 썸네일 정상 로드 확인
      await page.getByRole("button", { name: "채널" }).click();
      const thumbnail = page.locator('img[alt]').first();
      await expect(thumbnail).toBeVisible();
    });

    test("채널 뷰에서 카테고리 필터가 동작한다", async ({ page }) => {
      // 무엇을: 채널 뷰에서도 카테고리 필터 사용 가능
      // 왜: 채널도 카테고리별로 탐색할 수 있어야 함
      await page.getByRole("button", { name: "채널" }).click();
      await page.getByRole("button", { name: "신생아 케어" }).click();
      const channelLinks = page.locator('a[href*="youtube.com/channel"]');
      await expect(channelLinks.first()).toBeVisible();
    });

    test("채널 클릭 시 YouTube 채널 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 채널 카드의 외부 링크
      // 왜: 실제 YouTube 채널로 연결되어야 함
      await page.getByRole("button", { name: "채널" }).click();
      const firstChannel = page.locator('a[href*="youtube.com/channel"]').first();
      await expect(firstChannel).toHaveAttribute("target", "_blank");
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 영상/채널 뷰 전환이 동작한다", async ({ page }) => {
      // 무엇을: 모바일에서 뷰 토글 UI 사용 가능
      // 왜: 주요 타겟 기기
      await page.goto("/videos");
      await expect(page.getByRole("button", { name: "영상" })).toBeVisible();
      await page.getByRole("button", { name: "채널" }).click();
      const channelLinks = page.locator('a[href*="youtube.com/channel"]');
      await expect(channelLinks.first()).toBeVisible();
    });

    test("모바일: 카테고리 필터가 줄바꿈되며 동작한다", async ({ page }) => {
      // 무엇을: 좁은 화면에서 필터 칩 정상 동작
      // 왜: 필터가 잘리거나 숨겨지면 안 됨
      await page.goto("/videos");
      await page.getByRole("button", { name: "출산 준비", exact: true }).click();
      const videoLinks = page.locator('a[href*="youtube.com/watch"]');
      await expect(videoLinks.first()).toBeVisible();
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

    test("정보 탭 클릭 시 /articles로 이동한다", async ({ page }) => {
      // 무엇을: 네비게이션 → 정보글 목록 이동
      // 왜: 네비게이션 핵심 동작
      await page.goto("/");
      await page.locator("nav").getByText("정보").click();
      await expect(page).toHaveURL(/\/articles/);
    });

    test("홈 대시보드에 정보 카드가 있다", async ({ page }) => {
      // 무엇을: 홈 대시보드에 정보글 진입점
      // 왜: 대시보드에서도 정보글로 접근 가능해야 함
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");
      await expect(page.getByRole("link", { name: "정보", exact: true })).toBeVisible();
    });

    test("홈 대시보드 정보 카드 클릭 시 /articles로 이동", async ({ page }) => {
      // 무엇을: 대시보드 → 정보글 목록 이동
      // 왜: 대시보드 진입점 동작 확인
      await page.goto("/");
      await page.evaluate(() => localStorage.setItem("onboarding-completed", "true"));
      await page.goto("/");
      const dashboard = page.locator(".grid.grid-cols-2");
      await dashboard.getByRole("link", { name: /정보/ }).click();
      await expect(page).toHaveURL(/\/articles/);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 정보 탭이 하단 네비에 보인다", async ({ page }) => {
      // 무엇을: 모바일에서 네비 정보 탭 노출
      // 왜: 5탭이 좁은 화면에서 잘 배치되는지
      await page.goto("/");
      const nav = page.locator("nav");
      await expect(nav.getByText("정보")).toBeVisible();
      await expect(nav.getByText("홈")).toBeVisible();
    });
  });
});

test.describe("SEO — 정보글 메타데이터", () => {
  test("목록 페이지에 고유 title이 있다", async ({ page }) => {
    // 무엇을: /articles 페이지 title 태그
    // 왜: SEO 색인 품질
    await page.goto("/articles");
    await expect(page).toHaveTitle(/정보 & 가이드/);
  });

  test("상세 페이지에 글별 title이 있다", async ({ page }) => {
    // 무엇을: /articles/[slug] 페이지 title 태그
    // 왜: 각 정보글이 고유 title로 색인되어야 함
    await page.goto("/articles/hospital-bag");
    await expect(page).toHaveTitle(/출산 가방 필수 준비물 총정리/);
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
    await page.goto("/articles/postpartum-care");
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /산후조리원 선택 가이드/);
  });
});
