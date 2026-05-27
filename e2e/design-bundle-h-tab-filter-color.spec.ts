import { test, expect, type Locator } from "@playwright/test";
import { execSync } from "node:child_process";

// 검증 대상: docs/features/design-bundle-h-tab-filter-color/spec.md
// 핵심: 3개 영역(timeline·articles·baby-fair)의 탭/필터/도시 활성색이
//       모두 `bg-pastel-lavender/40 ... border-pastel-lavender/30` 단일 컨벤션이어야 한다.
// 본 묶음 H의 won't 항목(BottomNav active=pink, AllDoneBadge=mint, ring/focus 등)은 보존되어야 한다.
//
// 메모: phase-4.6 §1에서 영상 자산 + InfoContainer 폐기 후 검증 대상에서 info·videos 제거됨.

const ACTIVE_LAVENDER_BG = /(?:^|\s)bg-pastel-lavender\/40(?:\s|$)/;
const ACTIVE_LAVENDER_BORDER = /(?:^|\s)border-pastel-lavender\/30(?:\s|$)/;
const FORBIDDEN_PINK_BG = /(?:^|\s)bg-pastel-pink\/40(?:\s|$)/;
const FORBIDDEN_MINT_BG = /(?:^|\s)bg-pastel-mint\/40(?:\s|$)/;
const RADIX_ACTIVE_LAVENDER_BG = /data-\[state=active\]:bg-pastel-lavender\/40/;
const RADIX_ACTIVE_LAVENDER_BORDER = /data-\[state=active\]:border-pastel-lavender\/30/;
const RADIX_FORBIDDEN_MINT = /data-\[state=active\]:bg-pastel-mint\/40/;
const RADIX_FORBIDDEN_PINK = /data-\[state=active\]:bg-pastel-pink\/40/;

async function expectActiveLavenderClass(button: Locator) {
  // 무엇을: 활성 상태 버튼의 className 이 lavender 컨벤션을 만족하는지
  // 왜: spec must의 "12곳 동일 패턴" — auto-retry 로 React rerender 타이밍 흡수
  await expect(button, "active button must use bg-pastel-lavender/40").toHaveClass(ACTIVE_LAVENDER_BG);
  await expect(button, "active button must use border-pastel-lavender/30").toHaveClass(ACTIVE_LAVENDER_BORDER);
  await expect(button, "active button must NOT keep bg-pastel-pink/40 (regression)").not.toHaveClass(FORBIDDEN_PINK_BG);
  await expect(button, "active button must NOT keep bg-pastel-mint/40 (regression)").not.toHaveClass(FORBIDDEN_MINT_BG);
}

async function expectRadixTriggerLavenderClass(trigger: Locator) {
  // 무엇을: Radix Tabs Trigger 의 data-[state=active] variant가 lavender 로 통일되었는지
  // 왜: BabyfairContainer 의 3개 탭은 Radix 패턴이라 className 에 variant 형태로 박혀있음
  //     (data-state attribute 가 토글되지만 class string 자체는 정적)
  await expect(trigger).toHaveClass(RADIX_ACTIVE_LAVENDER_BG);
  await expect(trigger).toHaveClass(RADIX_ACTIVE_LAVENDER_BORDER);
  await expect(trigger, "regression: mint variant must be removed").not.toHaveClass(RADIX_FORBIDDEN_MINT);
  await expect(trigger, "regression: pink variant must be removed").not.toHaveClass(RADIX_FORBIDDEN_PINK);
}

test.describe("design-bundle-h-tab-filter-color (탭/필터 활성색 lavender 통일)", () => {
  test.describe("Happy Path — 활성색 lavender (런타임 렌더 영역)", () => {
    test("/timeline 카테고리 필터: 기본 '전체' active + 다른 카테고리 클릭 후에도 lavender 적용", async ({ page }) => {
      // 무엇을: T-4 — CategoryFilter 의 active 버튼이 항상 lavender 컨벤션
      // 왜: phase-4.5 §2.8.2 T-4 핵심 — 기존 pink active 가 lavender 로 치환됐는지
      await page.goto("/timeline");
      await page.waitForLoadState("networkidle"); // React hydration 대기 — 클릭 핸들러 attach 보장

      const allFilter = page.getByRole("button", { name: "전체" }).first();
      await expect(allFilter).toBeVisible();
      await expectActiveLavenderClass(allFilter);

      // 두 번째 카테고리(병원 준비 등) 클릭 → activeCategory 가 옮겨가고 그 버튼이 active
      const filterButtons = page.locator("button.rounded-xl.whitespace-nowrap");
      const secondFilter = filterButtons.nth(1);
      await secondFilter.click();
      await expectActiveLavenderClass(secondFilter);
    });

    test("/baby-fair 도시 필터: 기본 '전체' active 가 lavender", async ({ page }) => {
      // 무엇을: B-4 (도시) — selectedCity 기본 '전체' 인 상태에서 lavender
      // 왜: spec table B-4 (도시) — mint→lavender 변경 검증
      await page.goto("/baby-fair");

      const cityAll = page.getByRole("button", { name: "전체" }).first();
      await expect(cityAll).toBeVisible();
      await expectActiveLavenderClass(cityAll);
    });

    test("/baby-fair 진행 중·예정·지난 행사 탭 트리거 className: 3곳 모두 lavender variant", async ({ page }) => {
      // 무엇을: B-4 (탭1·2·3) — Radix Tabs trigger 의 data-[state=active] variant 가 lavender
      // 왜: spec table B-4 (탭1~3) 3곳을 한 케이스에서 일괄 검증
      await page.goto("/baby-fair");

      const ongoingTrigger = page.getByRole("tab", { name: /진행 중/ });
      const upcomingTrigger = page.getByRole("tab", { name: "예정" });
      const endedTrigger = page.getByRole("tab", { name: "지난 행사" });

      await expect(ongoingTrigger).toBeVisible();
      await expectRadixTriggerLavenderClass(ongoingTrigger);
      await expectRadixTriggerLavenderClass(upcomingTrigger);
      await expectRadixTriggerLavenderClass(endedTrigger);

      // 활성 전환 — data-state=active 가 옮겨감 (className 자체는 변하지 않음)
      await upcomingTrigger.click();
      await expect(upcomingTrigger).toHaveAttribute("data-state", "active");
    });
  });

  test.describe("Error / Validation — 회귀 0건 (소스 grep + 렌더 grep)", () => {
    test("source-level: spec 성공 기준 1번 grep — 3개 영역 어디에도 bg-pastel-(pink|mint)/40 잔존 없음", () => {
      // 무엇을: spec L56 success criterion — 회귀 가드
      // 왜: timeline·articles·babyfair 라인을 모두 검사. 새 코드가 옛 토큰 다시 도입하면 즉시 실패.
      // 메모: phase-4.6 §1에서 src/components/info·videos 폐기됨.
      let output = "";
      try {
        output = execSync(
          "grep -rnE 'bg-pastel-(pink|mint)/40[^/]' src/components/timeline src/components/babyfair src/components/articles",
          { encoding: "utf8" }
        );
      } catch (err) {
        // grep exits 1 when no matches → 통과
        const status = (err as { status?: number }).status;
        if (status === 1) output = "";
        else throw err;
      }
      expect(output, "3개 영역에 옛 pink/40·mint/40 활성색이 잔존하면 안 된다").toBe("");
    });

    test("source-level: 신규 영역에 lavender/40 페어가 박혀 있음", () => {
      // 무엇을: spec must 표 충족하는 lavender 클래스가 코드에 실제 존재하는지 lower-bound 검증
      // 왜: grep 회귀 가드는 '나쁜 게 없다'는 음성 검증. '좋은 게 있다'는 양성 검증을 별도로 둠.
      const cmd = "grep -rnE 'bg-pastel-lavender/40' src/components/timeline src/components/babyfair src/components/articles";
      const output = execSync(cmd, { encoding: "utf8" });
      const lines = output.trim().split("\n").filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);
    });

    test("/timeline 카테고리 필터 영역에 pink/40·mint/40 활성색이 잔존하지 않는다", async ({ page }) => {
      // 무엇을: 런타임 회귀 — 빌드 결과 timeline 페이지에서 모든 필터 버튼 className 검사
      // 왜: source-level grep 만으로는 빌드 시점에 다시 들어오는 회귀(예: PostCSS 변환)를 못 잡음
      await page.goto("/timeline");
      const filterButtons = page.locator("button.rounded-xl.whitespace-nowrap");
      const count = await filterButtons.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(filterButtons.nth(i)).not.toHaveClass(FORBIDDEN_PINK_BG);
        await expect(filterButtons.nth(i)).not.toHaveClass(FORBIDDEN_MINT_BG);
      }
    });

    test("/baby-fair 도시 필터 + 탭 트리거 영역에 mint/40·pink/40 활성색이 잔존하지 않는다", async ({ page }) => {
      // 무엇을: B-4 4곳 회귀 방지 — 도시 버튼 + Radix tabs trigger 모두 점검
      // 왜: 가장 변경이 많은 곳(4곳)이라 회귀 위험 최대
      await page.goto("/baby-fair");

      const cityButtons = page.locator("button.rounded-xl.whitespace-nowrap");
      const cityCount = await cityButtons.count();
      for (let i = 0; i < cityCount; i++) {
        await expect(cityButtons.nth(i)).not.toHaveClass(FORBIDDEN_PINK_BG);
        await expect(cityButtons.nth(i)).not.toHaveClass(FORBIDDEN_MINT_BG);
      }

      const tabs = page.getByRole("tab");
      const tabCount = await tabs.count();
      expect(tabCount).toBe(3);
      for (let i = 0; i < tabCount; i++) {
        await expect(tabs.nth(i)).not.toHaveClass(RADIX_FORBIDDEN_MINT);
        await expect(tabs.nth(i)).not.toHaveClass(RADIX_FORBIDDEN_PINK);
      }
    });
  });

  test.describe("권한 / 인증 (color isolation) — won't 항목 보존", () => {
    test("BottomNav 활성 항목은 pink CTA 컨벤션을 그대로 유지한다 (DESIGN.md L67)", async ({ page }) => {
      // 무엇을: spec won't 명시 — BottomNav active 는 pink (DESIGN.md L67 'Pink — Primary CTA — active state in BottomNav')
      // 왜: 본 묶음 H 가 BottomNav 를 건드리면 안 됨. role 경계 1차 가드.
      // /baby-fair 는 BottomNav navItems 에 명시된 경로 → 해당 Link 가 active=pink
      await page.goto("/baby-fair");

      const bottomNav = page.locator("nav").last();
      await expect(bottomNav).toBeVisible();

      const pinkActiveLinks = bottomNav.locator('a[class*="bg-pastel-pink"]');
      const pinkCount = await pinkActiveLinks.count();
      expect(pinkCount, "BottomNav active item must keep bg-pastel-pink/40 (CTA convention)").toBeGreaterThan(0);
    });

    test("/baby-fair 검색 input 의 focus:ring-pastel-mint/50 은 본 변경에 영향받지 않는다", async ({ page }) => {
      // 무엇을: spec won't 명시 — focus ring (활성색이 아니라 키보드 포커스 표시)
      // 왜: '활성 탭/필터 색' 과 'focus ring' 은 다른 의미축. 본 라운드에서 건드리면 안 됨.
      await page.goto("/baby-fair");

      const yearSelect = page.locator("select");
      // 연도 옵션이 1개뿐이면 selectbox 가 안 그려질 수 있어 conditional 처리
      if ((await yearSelect.count()) > 0) {
        await expect(yearSelect.first()).toHaveClass(/focus:ring-pastel-mint\/50/);
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서도 /timeline 카테고리 활성 버튼은 lavender 컨벤션을 유지한다", async ({ page }) => {
      // 무엇을: 375px 임산부 주요 디바이스 폭에서도 동일 컨벤션 적용
      // 왜: 컨테이너 폭 변화에 따라 탭/필터가 wrap·scroll 되어도 활성색은 동일해야 함
      await page.goto("/timeline");
      const allFilter = page.getByRole("button", { name: "전체" }).first();
      await expect(allFilter).toBeVisible();
      await expectActiveLavenderClass(allFilter);
    });

    test("모바일에서도 /baby-fair 탭 트리거는 lavender variant 를 유지한다", async ({ page }) => {
      // 무엇을: B-4 모바일 회귀 — Radix tabs 가 좁은 폭에서 wrap 되어도 lavender variant 유지
      // 왜: 변경이 가장 많은 영역(4곳)의 모바일 회귀 가드
      await page.goto("/baby-fair");
      const ongoingTrigger = page.getByRole("tab", { name: /진행 중/ });
      await expect(ongoingTrigger).toBeVisible();
      await expectRadixTriggerLavenderClass(ongoingTrigger);
    });
  });
});
