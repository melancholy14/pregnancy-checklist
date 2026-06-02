import { test, expect } from "@playwright/test";

test.describe("하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("5개 네비게이션 항목이 순서대로 보인다", async ({ page }) => {
    // 무엇을: phase-4.6 §4 N1=B (5탭) — 홈 / 체크리스트 / 체중 / 베이비페어 / 정보
    // 왜: T1 rollback + H1=B 도미노 결정으로 홈 유지 + /weight 신규 탭 + /timeline 별도 탭 X
    const nav = page.locator("nav").last();
    await expect(nav).toBeVisible();

    const labels = await nav.locator("a span").allTextContents();
    expect(labels).toEqual(["홈", "체크리스트", "체중", "베이비페어", "정보"]);
  });

  test("네비게이션으로 페이지 이동이 된다", async ({ page }) => {
    // 무엇을: 5탭 각 경로 — /checklist · /weight · /baby-fair · /articles · /
    // 왜: 신규 진입 흐름 — "체중" 탭 신설(§4.2), "정보" 라벨 유지(path=/articles)
    const nav = page.locator("nav").last();

    await nav.getByText("체크리스트").click();
    await expect(page).toHaveURL(/\/checklist\/?$/);

    await nav.getByText("체중").click();
    await expect(page).toHaveURL(/\/weight\/?$/);

    await nav.getByText("베이비페어").click();
    await expect(page).toHaveURL(/\/baby-fair\/?$/);

    await nav.getByText("정보").click();
    await expect(page).toHaveURL(/\/articles\/?$/);

    await nav.getByText("홈").click();
    await expect(page).toHaveURL(/\/(pregnancy-checklist\/?)?$/);
  });

  test("'/weight' 진입 시 체중 탭이 활성화된다", async ({ page }) => {
    // 무엇을: match: "prefix" 검증 — /weight 진입 시 체중 탭 active
    // 왜: 활성 시각(pink CTA bg-pastel-pink/40) 컨벤션 유지 — DESIGN.md L67
    await page.goto("/weight");
    const nav = page.locator("nav").last();
    const weightLink = nav.locator("a", { has: page.getByText("체중") });
    await expect(weightLink).toHaveClass(/bg-pastel-pink\/40/);
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("375px에서 5개 탭이 한 줄에 표시되고 라벨이 줄바꿈되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 5탭 전환 시 모바일 폭에서 탭당 ~64-72px 수용 + 라벨 한 줄 유지
      // 왜: plan 리스크 — 4→5탭 변경으로 "베이비페어"(5자) 라벨 줄바꿈 가능성. 회귀 가드.
      await page.goto("/");
      const nav = page.locator("nav").last();
      const links = nav.locator("a");
      await expect(links).toHaveCount(5);

      const navBox = await nav.boundingBox();
      const firstBox = await links.first().boundingBox();
      const lastBox = await links.last().boundingBox();
      // 다섯 탭 모두 같은 y(한 줄)에 위치
      expect(navBox).not.toBeNull();
      expect(firstBox?.y).toBeCloseTo(lastBox?.y ?? 0, 0);

      // 각 라벨의 높이가 한 줄 폰트(11px) 기준 줄바꿈되지 않음 — 22px 미만이면 단일 행
      const labelCount = await nav.locator("a span").count();
      for (let i = 0; i < labelCount; i++) {
        const box = await nav.locator("a span").nth(i).boundingBox();
        expect(box?.height ?? 0).toBeLessThan(22);
      }
    });
  });
});
