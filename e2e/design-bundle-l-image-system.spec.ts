import { test, expect } from "@playwright/test";

// design-bundle-l-image-system: phase-4.5 §2.11 article-prose 이미지 시스템 잔여 마감
// (IM-1 토큰 + IM-3 plain <img width/height/lazy> + IM-5 원본 새 탭 열기).
// rehype-article-figure 빌드 타임 변환이 figure → media → anchor → img + ExternalLink/AI 칩 +
// figcaption(suffix) 마크업을 자동 생성한다.
//
// 권한/인증 시나리오는 article 페이지가 모두 public 정적 페이지라 해당 사항 없어 생략.
// API 모킹도 SSG/build-time 변환이라 런타임 API 0이므로 생략. negative 케이스는
// 이미지 없는 글로 figure 부재를, title 슬롯 비움 케이스는 코드 경로 검증으로 대체한다.

test.describe("design-bundle-l-image-system: article 이미지 새 탭 열기 + 토큰", () => {
  test.describe("Happy Path", () => {
    test("figure가 anchor + img를 감싼 마크업 구조를 가진다", async ({
      page,
    }) => {
      // 무엇을: figure → span.media → a.link → img 의 중첩 구조가 살아있는지
      // 왜: design.md §2 결정 — anchor=img만, figcaption은 anchor 외 (스크린리더 분리)
      await page.goto("/articles/weekly-prenatal-checklist");

      const figure = page.locator(".article-prose .article-figure");
      await expect(figure).toHaveCount(1);

      const media = figure.locator(".article-figure__media");
      await expect(media).toBeVisible();

      const link = media.locator("> a.article-figure__link");
      await expect(link).toBeVisible();

      const img = link.locator("> img");
      await expect(img).toBeVisible();
    });

    test("anchor에 target=_blank + rel=noopener noreferrer + aria-label이 부착된다", async ({
      page,
    }) => {
      // 무엇을: 새 탭 열기 + opener 차단 + 스크린리더 라벨이 모두 일치하는지
      // 왜: spec.md M2 + review.md 항목 3 결정 — 키보드/SR 사용자 동작 예측 가능성
      await page.goto("/articles/weekly-prenatal-checklist");

      const link = page.locator(".article-prose .article-figure__link");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect(link).toHaveAttribute("rel", /noreferrer/);
      await expect(link).toHaveAttribute(
        "aria-label",
        "원본 이미지 새 창에서 보기",
      );
    });

    test("anchor의 href가 원본 이미지 경로를 가리킨다", async ({ page }) => {
      // 무엇을: link.href가 img.src와 같은 원본 png 경로인지
      // 왜: 새 탭에서 원본을 열어야 하므로 link.href ≠ 페이지 URL이어야 함
      await page.goto("/articles/weekly-prenatal-checklist");

      const link = page.locator(".article-prose .article-figure__link");
      const href = await link.getAttribute("href");
      expect(href).toMatch(/weekly-prenatal-checklist\.webp$/);

      const img = link.locator("> img");
      const src = await img.getAttribute("src");
      expect(src).toMatch(/weekly-prenatal-checklist\.webp$/);
    });

    test("첫 이미지에 loading=eager + fetchpriority=high + width/height attribute가 자동 부착된다", async ({
      page,
    }) => {
      // 무엇을: 본문 첫 이미지(LCP candidate)에 eager + fetchpriority + dimensions 부착
      // 왜: phase-4.7 R1-B — fold 위 인포그래픽 LCP 최적화. 나머지 이미지는 lazy 유지.
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure img").first();
      await expect(img).toHaveAttribute("loading", "eager");
      await expect(img).toHaveAttribute("fetchpriority", "high");

      const width = await img.getAttribute("width");
      const height = await img.getAttribute("height");
      expect(Number(width)).toBeGreaterThan(0);
      expect(Number(height)).toBeGreaterThan(0);
    });

    test("figcaption에 ' · 원본 보기' suffix가 부착되고 AI 마커와 공존한다", async ({
      page,
    }) => {
      // 무엇을: figcaption 텍스트가 "원본 캡션 · AI 생성 · 원본 보기" 순서로 합쳐지는지
      // 왜: spec.md §4 엣지 케이스 — P14 AI suffix + 본 라운드 원본 보기 suffix 둘 다 적용
      await page.goto("/articles/weekly-prenatal-checklist");

      const caption = page.locator(
        ".article-prose .article-figure__caption",
      );
      await expect(caption).toBeVisible();
      const text = (await caption.textContent()) ?? "";
      expect(text).toContain("· AI 생성");
      expect(text).toContain("· 원본 보기");
      // 순서 검증 — AI 생성이 원본 보기보다 앞서야 한다
      expect(text.indexOf("· AI 생성")).toBeLessThan(text.indexOf("· 원본 보기"));
    });

    test("두 번째 발행 글도 동일한 anchor + suffix 구조가 적용된다", async ({
      page,
    }) => {
      // 무엇을: prenatal-insurance-preparation-guide도 동일 변환 결과를 가지는지
      // 왜: spec.md M4 발행 글 2건 빌드 검증 — 마이그레이션 누락 0
      await page.goto("/articles/prenatal-insurance-preparation-guide");

      const link = page.locator(".article-prose .article-figure__link");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute(
        "aria-label",
        "원본 이미지 새 창에서 보기",
      );

      const caption = page.locator(
        ".article-prose .article-figure__caption",
      );
      const text = (await caption.textContent()) ?? "";
      expect(text).toContain("· 원본 보기");
    });

    test("figure media 슬롯이 img에 둥근 모서리(border-radius) 토큰을 적용한다", async ({
      page,
    }) => {
      // 무엇을: 실제 렌더된 img의 computed border-radius가 1rem(16px) 이상인지
      // 왜: spec.md M1 + design.md §3 default — rounded-2xl 정합 토큰 적용 검증
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure__media img");
      await expect(img).toBeVisible();

      const radius = await img.evaluate((el) =>
        Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
      );
      expect(radius).toBeGreaterThanOrEqual(15);
    });

    test("focus-visible 시 anchor에 lavender ring shadow가 표시된다", async ({
      page,
    }) => {
      // 무엇을: 키보드 Tab으로 link 포커스 시 box-shadow가 비어있지 않은 값으로 변경되는지
      // 왜: design.md §3 focus-visible — pastel-lavender ring으로 키보드 사용자 시각 표시
      await page.goto("/articles/weekly-prenatal-checklist");

      const link = page.locator(".article-prose .article-figure__link");
      await expect(link).toBeVisible();

      // 포커스 전 box-shadow (보통 'none')
      const shadowBefore = await link.evaluate(
        (el) => getComputedStyle(el).boxShadow,
      );

      // 포커스 후
      await link.focus();
      const shadowAfter = await link.evaluate(
        (el) => getComputedStyle(el).boxShadow,
      );

      expect(shadowAfter).not.toBe(shadowBefore);
      expect(shadowAfter).not.toBe("none");
    });

    test("JS 비활성화 시에도 anchor + img + figcaption 구조가 SSG로 노출된다", async ({
      browser,
    }) => {
      // 무엇을: JavaScript 없이도 figure/anchor 구조가 초기 HTML에 포함되는지
      // 왜: 빌드 타임 변환이라 SSG 출력이 봇·SR·JS-off 사용자 모두 동일해야 함
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await page.goto("/articles/weekly-prenatal-checklist");
      const link = page.locator(".article-prose .article-figure__link");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute(
        "aria-label",
        "원본 이미지 새 창에서 보기",
      );
      const img = link.locator("> img");
      // 본문 첫 이미지 = LCP candidate → eager (phase-4.7 R1-B)
      await expect(img).toHaveAttribute("loading", "eager");

      await context.close();
    });
  });

  test.describe("Error / Validation", () => {
    test("이미지 없는 글에는 anchor·figure 자체가 0개다", async ({ page }) => {
      // 무엇을: 이미지 0개인 글에서 article-figure / __link 모두 없어야 함
      // 왜: 플러그인이 image-only paragraph만 변환하도록 좁게 동작하는지 검증
      await page.goto("/articles/early-pregnancy-tests");

      await expect(
        page.locator(".article-prose .article-figure"),
      ).toHaveCount(0);
      await expect(
        page.locator(".article-prose .article-figure__link"),
      ).toHaveCount(0);
    });

    test("img에 title 속성이 남아있지 않다 (브라우저 tooltip 중복 방지)", async ({
      page,
    }) => {
      // 무엇을: rehype 플러그인이 title을 figcaption으로 옮긴 뒤 img에서 제거했는지
      // 왜: 브라우저 기본 tooltip + figcaption 중복 노출 차단 (P14 정합 유지)
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure img");
      await expect(img).not.toHaveAttribute("title", /.+/);
    });

    test("발행 글 2건은 caption 보유라 분기 A — 우상단 ExternalLink 마커는 없다", async ({
      page,
    }) => {
      // 무엇을: figcaption이 있는 케이스에서 우상단 __external 아이콘이 0개인지
      // 왜: spec.md §3 분기 처리 — caption 있으면 figcaption suffix가 시각 표시 담당
      await page.goto("/articles/weekly-prenatal-checklist");

      await expect(
        page.locator(".article-prose .article-figure__external"),
      ).toHaveCount(0);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 figure + anchor + figcaption이 정상 노출된다", async ({
      page,
    }) => {
      // 무엇을: 375px 화면에서도 figure/anchor/figcaption이 전부 보이는지
      // 왜: 주요 타겟 기기에서 새 탭 열기 + suffix 시각 표시 의무 충족
      await page.goto("/articles/weekly-prenatal-checklist");

      const figure = page.locator(".article-prose .article-figure");
      await expect(figure).toBeVisible();

      const link = figure.locator(".article-figure__link");
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("target", "_blank");

      const caption = figure.locator(".article-figure__caption");
      await expect(caption).toBeVisible();
      const text = (await caption.textContent()) ?? "";
      expect(text).toContain("· 원본 보기");
    });

    test("모바일에서 img가 viewport 폭을 넘어가지 않는다", async ({ page }) => {
      // 무엇을: 375px 폭에서 img의 boundingBox.width가 화면 폭 이하인지
      // 왜: design.md §5 모바일 320px — figure max-width: 100% + intrinsic ratio 유지
      await page.goto("/articles/weekly-prenatal-checklist");

      const img = page.locator(".article-prose .article-figure img");
      await expect(img).toBeVisible();

      const box = await img.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(375);
    });
  });
});
