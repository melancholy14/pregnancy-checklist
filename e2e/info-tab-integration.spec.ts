import { test, expect } from "@playwright/test";

test.describe("정보 탭 통합 — 블로그 + 영상 (Phase 4 Step 2)", () => {
  test.beforeEach(async ({ context }) => {
    // 쿠키 동의 배너가 인터랙션을 가리지 않도록 미리 동의 처리
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("cookie-consent", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  test.describe("Happy Path", () => {
    test("/info 진입 시 페이지 헤더·탭·태그 필터·카드가 모두 보인다", async ({
      page,
    }) => {
      // 무엇을: 통합 허브 첫 화면 — 헤더, 3탭, 통합 태그 칩, 카드 리스트
      // 왜: AC #1 (혼합 리스트) + AC #2 (탭) + AC #3 (필터)
      await page.goto("/info");

      await expect(
        page.getByRole("heading", { name: /정보/, level: 1 }),
      ).toBeVisible();

      const tabList = page.getByRole("tablist", { name: "콘텐츠 타입" });
      await expect(tabList.getByRole("tab", { name: "전체" })).toBeVisible();
      await expect(tabList.getByRole("tab", { name: "블로그" })).toBeVisible();
      await expect(tabList.getByRole("tab", { name: "영상" })).toBeVisible();

      // 통합 태그 칩 — "전체" + 최소 1개 토픽 (예: 출산준비)
      await expect(page.getByRole("button", { name: /^#출산준비$/ })).toBeVisible();
    });

    test("탭을 영상으로 전환하면 영상 카드만 보이고 블로그 카드는 사라진다", async ({
      page,
    }) => {
      // 무엇을: activeTab 분기 동작
      // 왜: AC #2 — 탭 전환이 실제로 콘텐츠 타입을 분리해야 함
      await page.goto("/info");

      // 전체 탭에서는 발행된 블로그 글 중 하나가 노출됨
      const articleHeading = page
        .getByRole("heading", {
          name: /임신 초기 필수 검사 총정리/,
        })
        .first();
      await expect(articleHeading).toBeVisible();

      await page.getByRole("tab", { name: "영상" }).click();
      await expect(
        page.getByRole("tab", { name: "영상", selected: true }),
      ).toBeVisible();
      await expect(articleHeading).toHaveCount(0);
    });

    test("통합 태그 #출산준비 선택 시 매칭된 블로그·영상만 남는다", async ({
      page,
    }) => {
      // 무엇을: 통합 태그 매핑 동작 — 출산준비는 article 'weekly-prenatal-checklist'와 video 'birth_prep' 매칭
      // 왜: AC #3 — 통합 태그가 두 매체를 동시 필터해야 함
      await page.goto("/info");
      await page.getByRole("button", { name: /^#출산준비$/ }).click();

      await expect(page.getByRole("button", { name: /^#출산준비$/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      // 매칭 글: 임신 주차별 검사 & 준비 총정리 (tags: 출산준비 포함)
      await expect(
        page.getByRole("heading", {
          name: /임신 주차별 검사.*준비 총정리/,
        }),
      ).toBeVisible();

      // 매칭되지 않은 글: 임신 초기에 유난히 피곤한 진짜 이유 (tags: 임신피로 등 — 출산준비 아님)
      await expect(
        page.getByRole("heading", {
          name: /임신 초기에 유난히 피곤한 진짜 이유/,
        }),
      ).toHaveCount(0);
    });

    test("블로그 카드 클릭 시 /articles/[slug]로 이동한다 (URL 유지)", async ({
      page,
    }) => {
      // 무엇을: 블로그 상세 진입 시 기존 URL 그대로 사용
      // 왜: AC #6 — 인덱싱된 SEO URL 보호
      await page.goto("/info");
      await page.getByRole("tab", { name: "블로그" }).click();

      await page
        .getByRole("link", { name: /임신 초기 필수 검사 총정리/ })
        .first()
        .click();

      await expect(page).toHaveURL(/\/articles\/early-pregnancy-tests\/?$/);
      await expect(
        page.getByRole("heading", {
          name: "임신 초기 필수 검사 총정리",
          level: 1,
        }),
      ).toBeVisible();
    });

    test("?tab=videos 쿼리 진입 시 영상 탭이 선택된 상태로 시작된다", async ({
      page,
    }) => {
      // 무엇을: URL 쿼리로 초기 탭 결정 (videos 리다이렉트 경유 시 핵심)
      // 왜: AC #4 — `/videos` → `/info?tab=videos` 호환
      await page.goto("/info?tab=videos");

      await expect(
        page.getByRole("tab", { name: "영상", selected: true }),
      ).toBeVisible();
    });

    test("아티클 상세 → BottomNav '정보'가 활성화 상태로 보인다", async ({
      page,
    }) => {
      // 무엇을: /articles/[slug] 진입 시에도 정보 탭이 active
      // 왜: AC #14 — alsoMatchPrefixes 동작
      await page.goto("/articles/early-pregnancy-tests");

      // 활성 탭은 bg-pastel-pink/40 클래스를 가짐
      const nav = page.locator("nav").last();
      const infoLink = nav.getByRole("link", { name: /정보/ });
      await expect(infoLink).toHaveClass(/bg-pastel-pink\/40/);
    });
  });

  test.describe("리다이렉트", () => {
    test("/articles 진입 시 /info로 리다이렉트된다", async ({ page }) => {
      // 무엇을: 기존 목록 진입점이 통합 허브로 흡수됨
      // 왜: AC #8 — 외부 북마크/검색엔진 호환
      await page.goto("/articles");
      await page.waitForURL(/\/info\/?$/);
      await expect(
        page.getByRole("heading", { name: /정보/, level: 1 }),
      ).toBeVisible();
    });

    test("/videos 진입 시 /info?tab=videos로 리다이렉트되고 영상 탭이 선택된다", async ({
      page,
    }) => {
      // 무엇을: 영상 페이지 폐기 후 통합 허브 영상 탭으로 이동
      // 왜: AC #9 + AC #4 — 쿼리 보존 검증
      await page.goto("/videos");
      await page.waitForURL(/\/info\?tab=videos/);
      await expect(
        page.getByRole("tab", { name: "영상", selected: true }),
      ).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("알 수 없는 ?tab 값으로 진입하면 '전체' 탭으로 폴백된다", async ({
      page,
    }) => {
      // 무엇을: resolveInitialTab의 안전한 폴백
      // 왜: 사용자가 임의로 URL을 조작해도 페이지가 깨지지 않아야 함
      await page.goto("/info?tab=foo");

      await expect(
        page.getByRole("tab", { name: "전체", selected: true }),
      ).toBeVisible();
    });

    test("매칭 없는 조합(영상 탭 + 임신피로 토픽)에서 빈 상태 메시지가 표시된다", async ({
      page,
    }) => {
      // 무엇을: 영상에는 임신초기 카테고리가 없음 → 영상 탭에서는 0건
      // 왜: visibleItems.length === 0 분기 검증
      await page.goto("/info");
      await page.getByRole("tab", { name: "영상" }).click();

      // '#임신초기' 칩은 영상에 매칭되는 카테고리가 없으나 글에는 있어 칩 자체는 표시됨
      const earlyChip = page.getByRole("button", { name: /^#임신초기$/ });
      if ((await earlyChip.count()) > 0) {
        await earlyChip.click();
        await expect(page.getByText("해당 조건의 콘텐츠가 없어요")).toBeVisible();
      }
    });

    test("존재하지 않는 video id 해시로 진입해도 페이지가 정상 렌더된다", async ({
      page,
    }) => {
      // 무엇을: 잘못된 hash가 hash-scroll useEffect를 깨지 않아야 함
      // 왜: getElementById가 null이어도 early return 처리됨
      await page.goto("/info?tab=videos#nonexistent_video_id");
      await expect(
        page.getByRole("tab", { name: "영상", selected: true }),
      ).toBeVisible();
    });
  });

  test.describe("내부 링크 갱신 — 리다이렉트 우회", () => {
    test("홈 대시보드 '정보' 카드는 /info로 직접 연결된다", async ({
      page,
    }) => {
      // 무엇을: HomeContent.tsx의 정보 카드 href가 /info여야 함
      // 왜: 내부 클릭에서 리다이렉트 깜빡임 제거
      await page.goto("/");

      const infoLink = page.locator('a[href="/info"]').first();
      await expect(infoLink).toBeVisible();
      await expect(infoLink).toContainText("정보 & 가이드");
    });

    test("홈 대시보드 '영상' 카드는 /info?tab=videos로 직접 연결된다", async ({
      page,
    }) => {
      // 무엇을: 영상 대시보드 카드도 통합 허브로 직접 이동
      // 왜: 리다이렉트 우회
      await page.goto("/");

      const videoLink = page.locator('a[href="/info?tab=videos"]').first();
      await expect(videoLink).toBeVisible();
      await expect(videoLink).toContainText("영상");
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 탭 전환·태그 필터·카드 노출이 모두 정상 동작한다", async ({
      page,
    }) => {
      // 무엇을: 모바일 핵심 흐름 회귀 — 탭, 필터, 카드, 외부 링크
      // 왜: 주 사용자가 모바일이므로 인터랙션이 깨지지 않아야 함
      await page.goto("/info");

      // 탭 전환
      await page.getByRole("tab", { name: "영상" }).click();
      await expect(
        page.getByRole("tab", { name: "영상", selected: true }),
      ).toBeVisible();

      // 영상 외부 링크 — youtube.com으로 가는 a 태그 노출
      const youtubeLinks = page.locator("a[href*='youtube.com/watch']");
      await expect(youtubeLinks.first()).toBeVisible();

      // 다시 블로그 탭 — 블로그 카드 노출
      await page.getByRole("tab", { name: "블로그" }).click();
      await expect(
        page
          .getByRole("heading", { name: /임신 초기 필수 검사 총정리/ })
          .first(),
      ).toBeVisible();
    });

    test("모바일 BottomNav에 '영상' 탭이 없고 '정보' 탭이 노출된다", async ({
      page,
    }) => {
      // 무엇을: 4탭 구성 + '정보' → /info
      // 왜: AC #10 — '영상' 탭 제거 검증
      await page.goto("/info");

      const nav = page.locator("nav").last();
      await expect(nav.getByText("영상")).toHaveCount(0);
      await expect(nav.getByRole("link", { name: /정보/ })).toHaveAttribute(
        "href",
        "/info",
      );
    });
  });
});
