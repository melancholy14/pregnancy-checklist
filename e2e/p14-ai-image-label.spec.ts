import { test, expect } from "@playwright/test";

// P14: AI 생성 이미지 표시 의무
// 빌드 타임 rehype 플러그인이 article 본문 이미지를 figure 구조로 변환하고,
// alt에 `(AI 생성 이미지)` 마커가 있으면 워터마크 칩 + (캡션 시) figcaption을 자동 부착하는 기능.
//
// 권한/인증 시나리오는 article 페이지가 모두 public 정적 페이지라 해당 사항 없어 생략.
// API 모킹도 SSG/build-time 변환이라 런타임 API가 없으므로 생략. negative 케이스는
// 이미지 없는 글 / 캡션 없는 글로 figure·figcaption 부재를 검증한다.

test.describe("P14: AI 생성 이미지 표시", () => {
  test.describe("Happy Path", () => {
    test("AI 인포그래픽 글에 figure + 워터마크 칩이 노출된다 (weekly-prenatal-checklist)", async ({
      page,
    }) => {
      // 무엇을: figure.article-figure가 1개 존재하고 우하단 칩에 'Imagined with AI' 텍스트가 있는지
      // 왜: 발행된 AI 인포그래픽 글의 표시 의무 충족이 본 기능의 핵심 AC
      await page.goto("/articles/weekly-prenatal-checklist");

      const figure = page.locator(".article-prose .article-figure");
      await expect(figure).toHaveCount(1);

      const chip = figure.locator(".article-figure__chip");
      await expect(chip).toBeVisible();
      await expect(chip).toHaveText("Imagined with AI");
    });

    test("AI 인포그래픽 글의 figure에 alt 마커가 보존된다 (weekly-prenatal-checklist)", async ({
      page,
    }) => {
      // 무엇을: img alt 속성에 '(AI 생성 이미지)' 후행 표기가 그대로 살아있는지
      // 왜: 스크린리더 낭독 일관성 — review.md §5.1 alt 컨벤션 single source of truth
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure img");
      await expect(img).toHaveAttribute("alt", /\(AI 생성 이미지\)$/);
    });

    test("AI 이미지 글에 figure + 칩이 노출된다 (prenatal-insurance-preparation-guide)", async ({
      page,
    }) => {
      // 무엇을: 두 번째 발행 글에서도 동일 figure 구조가 적용되는지
      // 왜: 발행 글 2건 모두 마이그레이션 완료를 검증
      await page.goto("/articles/prenatal-insurance-preparation-guide");

      const chip = page.locator(".article-prose .article-figure__chip");
      await expect(chip).toBeVisible();
      await expect(chip).toHaveText("Imagined with AI");
    });

    test("워터마크 칩에 aria-hidden이 적용된다", async ({ page }) => {
      // 무엇을: 칩이 스크린리더에 노출되지 않도록 aria-hidden=true가 설정되었는지
      // 왜: alt가 이미 AI 표시를 낭독하므로 칩 텍스트는 중복 — design.md §5.2
      await page.goto("/articles/weekly-prenatal-checklist");

      const chip = page.locator(".article-prose .article-figure__chip");
      await expect(chip).toHaveAttribute("aria-hidden", "true");
    });

    test("워터마크 칩이 이미지 우하단 영역에 위치한다", async ({ page }) => {
      // 무엇을: 칩의 bounding box가 figure media 영역의 우하단에 들어 있는지
      // 왜: design.md §3 default 시안의 우하단 8px 안쪽 위치 — 시각 표시 의무 핵심
      await page.goto("/articles/weekly-prenatal-checklist");

      const media = page.locator(".article-prose .article-figure__media");
      const chip = page.locator(".article-prose .article-figure__chip");
      await expect(media).toBeVisible();
      await expect(chip).toBeVisible();

      const mediaBox = await media.boundingBox();
      const chipBox = await chip.boundingBox();
      expect(mediaBox).not.toBeNull();
      expect(chipBox).not.toBeNull();

      // 칩의 오른쪽 끝이 media 오른쪽 끝과 가깝고(20px 이내), 아래쪽 끝도 가까움
      const mediaRight = mediaBox!.x + mediaBox!.width;
      const chipRight = chipBox!.x + chipBox!.width;
      const mediaBottom = mediaBox!.y + mediaBox!.height;
      const chipBottom = chipBox!.y + chipBox!.height;
      expect(mediaRight - chipRight).toBeLessThan(20);
      expect(mediaBottom - chipBottom).toBeLessThan(20);
    });

    test("JS 비활성화 시에도 figure 구조가 SSG로 노출된다", async ({
      browser,
    }) => {
      // 무엇을: JavaScript 없이도 figure + 칩 구조가 초기 HTML에 포함되는지
      // 왜: 빌드 타임 변환이라 SSG 출력에 포함되어야 AdSense 봇·스크린리더 모두 인식 가능
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await page.goto("/articles/weekly-prenatal-checklist");
      await expect(
        page.locator(".article-prose .article-figure"),
      ).toHaveCount(1);
      await expect(
        page.locator(".article-prose .article-figure__chip"),
      ).toHaveText("Imagined with AI");

      await context.close();
    });
  });

  test.describe("Error / Validation", () => {
    test("이미지에 markdown title이 있는 글은 figcaption이 렌더된다", async ({
      page,
    }) => {
      // 무엇을: weekly-prenatal-checklist 본문 이미지에 title="..." 속성 → figcaption 노출
      // 왜: rehype-article-figure 가 title 슬롯을 figcaption 으로 변환 (image-sop.md 참고)
      await page.goto("/articles/weekly-prenatal-checklist");

      const captions = page.locator(".article-prose .article-figure__caption");
      await expect(captions.first()).toBeVisible();
    });

    test("이미지 없는 글에는 article-figure 자체가 노출되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 이미지 0개인 글에서는 figure·칩이 일절 없어야 함
      // 왜: 플러그인이 image-only paragraph만 변환하도록 좁게 동작하는지 검증
      await page.goto("/articles/early-pregnancy-tests");

      await expect(
        page.locator(".article-prose .article-figure"),
      ).toHaveCount(0);
      await expect(
        page.locator(".article-prose .article-figure__chip"),
      ).toHaveCount(0);
    });

    test("img 태그에 title 속성이 남아있지 않다 (브라우저 tooltip 중복 방지)", async ({
      page,
    }) => {
      // 무엇을: rehype 플러그인이 title을 figcaption으로 옮긴 뒤 img에서 제거했는지
      // 왜: 브라우저 기본 tooltip과 figcaption 중복 노출을 막는 결정 (impl.md 가정)
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure img");
      await expect(img).not.toHaveAttribute("title", /.+/);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 figure + 칩이 정상 노출된다", async ({ page }) => {
      // 무엇을: 375px 화면에서도 figure 구조와 칩이 깨지지 않고 보이는지
      // 왜: 주요 타겟 기기(모바일 스크롤 독자)에서 표시 의무 충족 확인
      await page.goto("/articles/weekly-prenatal-checklist");

      const figure = page.locator(".article-prose .article-figure");
      await expect(figure).toBeVisible();

      const chip = figure.locator(".article-figure__chip");
      await expect(chip).toBeVisible();
      await expect(chip).toHaveText("Imagined with AI");
    });

    test("모바일에서도 칩이 이미지 영역 안에 위치한다", async ({ page }) => {
      // 무엇을: 320~375px 좁은 화면에서 칩이 figure 밖으로 튀어나오지 않는지
      // 왜: design.md §5.2 모바일 320px 분석 — 칩이 정보 영역 침범 최소
      await page.goto("/articles/weekly-prenatal-checklist");

      const media = page.locator(".article-prose .article-figure__media");
      const chip = page.locator(".article-prose .article-figure__chip");
      await expect(media).toBeVisible();
      await expect(chip).toBeVisible();

      const mediaBox = await media.boundingBox();
      const chipBox = await chip.boundingBox();
      expect(mediaBox).not.toBeNull();
      expect(chipBox).not.toBeNull();

      expect(chipBox!.x).toBeGreaterThanOrEqual(mediaBox!.x);
      expect(chipBox!.x + chipBox!.width).toBeLessThanOrEqual(
        mediaBox!.x + mediaBox!.width + 1,
      );
    });
  });
});
