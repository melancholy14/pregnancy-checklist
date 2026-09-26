import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { acceptCookieConsent } from "./helpers/consent";

const ARTICLES_DIR = path.resolve(__dirname, "../src/content/articles");

// authorNote 미설정 글은 하드코딩하지 않고 frontmatter 에서 동적 발견한다.
// (글이 발행되며 authorNote 가 붙는 순간 fixture 가 stale 되는 것을 방지)
// 렌더 조건은 ArticleDetail 의 `article.authorNote &&` 와 동일하게 truthy 기준.
const NOTELESS_SLUGS = fs
  .readdirSync(ARTICLES_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .filter((slug) => {
    const { data } = matter(
      fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.md`), "utf-8"),
    );
    return !data.authorNote;
  });

test.describe("아티클 authorNote 카드 (Step 14)", () => {
  test.beforeEach(async ({ context }) => {
    await acceptCookieConsent(context);
  });

  test.describe("Happy Path", () => {
    test("authorNote가 있는 아티클에서 '만든이의 한마디' 카드가 표시된다", async ({
      page,
    }) => {
      // 무엇을: babyfair-survival-guide 아티클에서 authorNote 카드가 보이는지
      // 왜: authorNote가 있는 아티클에서는 반드시 카드가 렌더링되어야 함
      await page.goto("/articles/babyfair-survival-guide");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText(/베이비페어 가기 전에/),
      ).toBeVisible();
    });

    test("authorNote 카드가 제목/메타 아래, 본문 위에 위치한다", async ({
      page,
    }) => {
      // 무엇을: authorNote 카드의 DOM 위치가 올바른지
      // 왜: PRD에서 제목과 본문 사이에 삽입 요구
      await page.goto("/articles/babyfair-survival-guide");
      const card = page.locator("text=만든이의 한마디");
      const prose = page.locator(".article-prose").first();
      await expect(card).toBeVisible();
      await expect(prose).toBeVisible();

      const cardBox = await card.boundingBox();
      const proseBox = await prose.boundingBox();
      expect(cardBox!.y).toBeLessThan(proseBox!.y);
    });

    test("authorNote 카드에 따뜻한 톤 스타일이 적용된다", async ({ page }) => {
      // 무엇을: 카드에 PRD 지정 스타일 클래스가 있는지
      // 왜: bg-[#FFF4D4]/15, border, rounded-xl 디자인 요구
      await page.goto("/articles/babyfair-survival-guide");
      const card = page.locator(".rounded-xl", {
        hasText: "만든이의 한마디",
      });
      await expect(card).toBeVisible();
      await expect(card).toHaveClass(/border/);
    });

    test("prenatal-insurance 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: 다른 아티클에서도 authorNote가 정상 표시되는지
      // 왜: authorNote가 있는 아티클 모두 동작 확인
      await page.goto("/articles/prenatal-insurance-preparation-guide");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("태아보험 검색이었어요"),
      ).toBeVisible();
    });

    test("early-pregnancy-tests 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: early-pregnancy-tests authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/early-pregnancy-tests");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("어떤 검사를 언제 받아야 하는지 너무 헷갈렸어요"),
      ).toBeVisible();
    });

    test("postpartum-care-center-guide 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: postpartum-care-center-guide authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/postpartum-care-center-guide");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText(/어떤 글은 시설을 강조하고/),
      ).toBeVisible();
    });

    test("pregnancy-weight-management 아티클에서 authorNote가 표시된다", async ({
      page,
    }) => {
      // 무엇을: pregnancy-weight-management authorNote 확인
      // 왜: 5개 대상 아티클 중 하나
      await page.goto("/articles/pregnancy-weight-management");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText("정상 범위가 어디까지인지 정리해봤습니다"),
      ).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    // 전 글에 authorNote 가 붙어 fixture 가 0건이면 실패 대신 스킵으로 표시
    if (NOTELESS_SLUGS.length === 0) {
      test.skip("authorNote 미설정 아티클이 없어 미렌더링 케이스 스킵", () => {});
    }

    for (const slug of NOTELESS_SLUGS) {
      test(`authorNote가 없는 ${slug}에서는 카드가 표시되지 않는다`, async ({
        page,
      }) => {
        // 무엇을: authorNote 미설정 아티클에서 카드 미렌더링 확인
        // 왜: authorNote가 없는 아티클에서 빈 카드가 보이면 안 됨
        await page.goto(`/articles/${slug}`);
        // 404 페이지에서 "카드 없음"이 공허하게 통과하는 것을 방지
        await expect(page.locator(".article-prose").first()).toBeVisible();
        await expect(page.getByText("만든이의 한마디")).not.toBeVisible();
      });
    }
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: authorNote 카드가 잘리지 않고 표시된다", async ({ page }) => {
      // 무엇을: 375px에서 카드 텍스트가 모두 보이는지
      // 왜: 주요 타겟 기기에서 레이아웃 깨짐 방지
      await page.goto("/articles/babyfair-survival-guide");
      await expect(page.getByText("만든이의 한마디")).toBeVisible();
      await expect(
        page.getByText(/베이비페어 가기 전에/),
      ).toBeVisible();
    });

    for (const slug of NOTELESS_SLUGS) {
      test(`모바일: authorNote가 없는 ${slug}에서는 카드 미표시`, async ({
        page,
      }) => {
        // 무엇을: 모바일에서도 미설정 아티클의 카드 미렌더링 확인
        // 왜: 반응형에서도 조건부 렌더링 동작 검증
        await page.goto(`/articles/${slug}`);
        await expect(page.locator(".article-prose").first()).toBeVisible();
        await expect(page.getByText("만든이의 한마디")).not.toBeVisible();
      });
    }
  });
});
