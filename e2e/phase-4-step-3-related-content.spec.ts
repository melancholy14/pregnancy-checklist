import { test, expect } from "@playwright/test";

test.describe("아티클 하단 관련 콘텐츠 추천 (Phase 4 Step 3)", () => {
  test.describe("Happy Path", () => {
    test('/articles/early-pregnancy-tests 하단에 "📰 관련 콘텐츠" 섹션이 노출된다', async ({
      page,
    }) => {
      // 무엇을: 관련 글 섹션 헤더 + 카드 1개 이상 노출
      // 왜: AC #1 — 글을 다 읽은 사용자에게 다음 콘텐츠를 보여주는 핵심 회유 장치
      await page.goto("/articles/early-pregnancy-tests");

      const section = page.getByRole("heading", { name: /관련 콘텐츠/ });
      await expect(section).toBeVisible();

      // 같은 임신초기 태그를 공유하는 다른 글이 카드로 노출되어야 함
      await expect(
        page.getByRole("heading", { name: /임신 초기에 유난히 피곤한/ }),
      ).toBeVisible();
    });

    test("현재 글은 추천 목록에서 제외된다", async ({ page }) => {
      // 무엇을: 추천 카드 영역에 현재 글 제목이 등장하지 않음
      // 왜: AC #3 — 자기 자신을 추천하면 사용자 신뢰도 저하
      await page.goto("/articles/early-pregnancy-tests");

      const relatedHeading = page.getByRole("heading", { name: /관련 콘텐츠/ });
      await expect(relatedHeading).toBeVisible();

      // 추천 섹션 이후 영역에서 현재 글 제목과 동일한 카드 제목이 없어야 함
      const cardWithCurrentTitle = page
        .locator("section", { has: relatedHeading })
        .getByRole("heading", { name: "임신 초기 필수 검사 총정리" });
      await expect(cardWithCurrentTitle).toHaveCount(0);
    });

    test("관련 체크리스트 섹션에 매칭된 체크리스트가 노출된다", async ({
      page,
    }) => {
      // 무엇을: pregnancy_prep_checklist의 linked_article_slugs에 early-pregnancy-tests가 있음
      // 왜: AC #4 — 체크리스트 역매칭 동작 검증
      await page.goto("/articles/early-pregnancy-tests");

      await expect(page.getByText("관련 체크리스트")).toBeVisible();
      const link = page.getByRole("link", {
        name: /임신 준비 체크리스트/,
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/checklist/pregnancy-prep");
    });

    test("관련 영상 섹션에 unified-tag로 매칭된 영상이 노출된다", async ({
      page,
    }) => {
      // 무엇을: 검사 태그 → unified-tag "checkup" → videoCategories=["prenatal_checkup"] 매칭
      // 왜: AC #6 — unified-tag를 통한 영상 매칭이 동작해야 함
      await page.goto("/articles/early-pregnancy-tests");

      await expect(page.getByText("관련 영상")).toBeVisible();

      // 영상 링크는 /info?tab=videos#<id> 형태
      const videoLinks = page.locator(
        'a[href^="/info?tab=videos#"]',
      );
      await expect(videoLinks.first()).toBeVisible();
      const count = await videoLinks.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(3);
    });

    test("관련 글 카드 클릭 시 해당 아티클 페이지로 이동한다", async ({
      page,
    }) => {
      // 무엇을: 카드 → 아티클 상세 라우팅
      // 왜: AC #8 — 회유 장치의 가장 중요한 검증 (실제 페이지뷰로 이어짐)
      await page.goto("/articles/early-pregnancy-tests");

      const fatigueCard = page.getByRole("heading", {
        name: /임신 초기에 유난히 피곤한/,
      });
      await expect(fatigueCard).toBeVisible();
      await fatigueCard.click();

      await page.waitForURL(/\/articles\/early-pregnancy-fatigue-reasons/);
      await expect(
        page.getByRole("heading", {
          name: /임신 초기에 유난히 피곤한/,
          level: 1,
        }),
      ).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("매칭되는 체크리스트가 없는 글에서는 '관련 체크리스트' 섹션이 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: prenatal-insurance-preparation-guide는 어떤 체크리스트의 linked_article_slugs에도 없음
      // 왜: 빈 섹션이 노출되면 UX 잡음. AC #7과 직결
      await page.goto("/articles/prenatal-insurance-preparation-guide");

      // 글이 정상 로드됐는지 먼저 확인
      await expect(
        page.getByRole("heading", { name: /태아보험/, level: 1 }),
      ).toBeVisible();

      await expect(page.getByText("관련 체크리스트")).not.toBeVisible();
    });

    test("매칭되는 영상 카테고리가 없는 글에서는 '관련 영상' 섹션이 표시되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 보험·임신준비 unified-tag는 videoCategories=[] (빈 배열)
      // 왜: 빈 섹션이 노출되면 UX 잡음
      await page.goto("/articles/prenatal-insurance-preparation-guide");

      await expect(
        page.getByRole("heading", { name: /태아보험/, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText("관련 영상")).not.toBeVisible();
    });

    test("관련 글이 부족하면 최신 글로 보충되어 항상 카드가 노출된다", async ({
      page,
    }) => {
      // 무엇을: 모든 아티클 페이지에서 "📰 관련 콘텐츠" 섹션이 노출됨
      // 왜: AC #2 — 태그 매칭이 0개여도 fallback으로 최신 글 보충
      await page.goto("/articles/pregnancy-government-benefits-2026");

      await expect(
        page.getByRole("heading", { name: /관련 콘텐츠/ }),
      ).toBeVisible();
    });
  });

  test.describe("권한 / 인증", () => {
    // 본 사이트는 정적(output: "export") 공개 사이트로 보호된 경로 / 권한 분기가 없음.
    // 인증 시나리오는 적용 불가하므로 스킵.
    test.skip("권한 분기 없음 — 정적 공개 사이트", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 관련 콘텐츠 섹션이 정상 노출되고 카드가 잘리지 않는다", async ({
      page,
    }) => {
      // 무엇을: 375px에서도 섹션 헤더 + 관련 글 카드가 보임
      // 왜: 주 타겟 기기에서 회유 장치가 정상 동작해야 함
      await page.goto("/articles/early-pregnancy-tests");

      await expect(
        page.getByRole("heading", { name: /관련 콘텐츠/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /임신 초기에 유난히 피곤한/ }),
      ).toBeVisible();
    });

    test("모바일: 관련 체크리스트 링크가 화면 안에 노출된다", async ({
      page,
    }) => {
      // 무엇을: 375px에서 체크리스트 링크가 잘리지 않고 보임
      // 왜: 모바일에서 가로 스크롤이나 잘림 없이 탭 가능해야 함
      await page.goto("/articles/early-pregnancy-tests");

      const link = page.getByRole("link", {
        name: /임신 준비 체크리스트/,
      });
      await expect(link).toBeVisible();

      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });
  });
});
