import { test, expect } from "@playwright/test";

test.describe("체크리스트 허브 + 신규 3종 (Phase 4 Step 1)", () => {
  test.beforeEach(async ({ context }) => {
    // 쿠키 동의 배너가 FAB 클릭을 가리지 않도록 미리 동의 처리
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("cookie-consent", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  test.describe("Happy Path", () => {
    test("/checklist 허브에 4종 카드가 표시된다", async ({ page }) => {
      // 무엇을: 타임라인 + 출산가방/남편준비/임신준비 4개 카드 모두 노출
      // 왜: 사이트 정체성 — "여러 체크리스트의 허브"로 보여야 함
      await page.goto("/checklist");

      await expect(page.getByRole("heading", { name: /체크리스트/, level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "주차별 타임라인" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "출산가방 체크리스트" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "남편/파트너 준비 체크리스트" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "임신 준비 체크리스트" })).toBeVisible();
    });

    test("출산가방 카드 클릭 시 /checklist/hospital-bag 으로 이동한다", async ({ page }) => {
      // 무엇을: 허브 카드 → 개별 페이지 라우팅
      // 왜: 허브 진입 흐름 검증
      await page.goto("/checklist");
      await page.getByRole("heading", { name: "출산가방 체크리스트" }).click();
      await expect(page).toHaveURL(/\/checklist\/hospital-bag/);
      await expect(page.getByRole("heading", { name: /출산가방 체크리스트/, level: 1 })).toBeVisible();
    });

    test("출산가방 페이지에서 항목을 체크하면 진행률이 증가하고 새로고침 후에도 유지된다", async ({ page }) => {
      // 무엇을: localStorage 독립 저장 + 진행률 실시간 반영
      // 왜: AC #5 (독립 저장) + #7 (진행률 실시간)
      await page.goto("/checklist/hospital-bag");

      // 초기 상태: 0/N 완료
      await expect(page.getByText(/0\/\d+ 완료/)).toBeVisible();

      // 첫 항목 체크 — "산모용 잠옷"으로 텍스트 매칭
      const item = page
        .locator('[role="button"]')
        .filter({ hasText: "산모용 잠옷" })
        .first();
      await item.click();

      // 진행률이 1로 증가 (1/N 표기 부분)
      await expect(page.getByText(/^1$/).first()).toBeVisible();

      // 새로고침
      await page.reload();

      // 체크 상태가 유지되는지 — line-through 클래스를 가진 텍스트가 보이는지
      await expect(
        page.locator(".line-through").filter({ hasText: "산모용 잠옷" })
      ).toBeVisible();
    });

    test("남편준비 페이지에서 커스텀 항목을 추가하고 삭제할 수 있다", async ({ page }) => {
      // 무엇을: FAB → 추가 폼 → 항목 추가 → 삭제 흐름
      // 왜: AC #6 커스텀 아이템 기능
      await page.goto("/checklist/partner-prep");

      // FAB 클릭
      await page.locator('button[aria-label="항목 추가"]').click();

      // 분류 선택은 기본값 사용, 제목 입력
      await page.getByLabel("할 일 제목").fill("E2E 테스트 항목");
      await page.getByRole("button", { name: "추가하기" }).click();

      // 추가된 항목 확인
      await expect(page.getByText("E2E 테스트 항목")).toBeVisible();

      // 삭제 — 추가된 카드의 삭제 버튼 클릭 후 확인
      const card = page.locator('[role="button"]').filter({ hasText: "E2E 테스트 항목" });
      await card.locator('button[aria-label="삭제"]').click();
      await page
        .locator('[data-slot="alert-dialog-content"]')
        .getByRole("button", { name: "삭제" })
        .click();

      await expect(page.getByText("E2E 테스트 항목")).not.toBeVisible();
    });

    test("3종 체크리스트의 localStorage 키가 서로 독립적이다", async ({ page }) => {
      // 무엇을: 출산가방 체크가 임신준비 진행률에 영향 주지 않음
      // 왜: AC #5 — 데이터 격리
      await page.goto("/checklist/hospital-bag");
      await page
        .locator('[role="button"]')
        .filter({ hasText: "산모용 잠옷" })
        .first()
        .click();

      // 임신 준비 페이지 이동 → 진행률 0 유지
      await page.goto("/checklist/pregnancy-prep");
      await expect(page.getByText(/0\/\d+ 완료/)).toBeVisible();

      // localStorage 키 확인
      const keys = await page.evaluate(() => Object.keys(localStorage));
      expect(keys).toContain("hospital-bag-storage");
      expect(keys).not.toContain("pregnancy-prep-storage-checked"); // 키 오염 없음
    });

    test("관련 콘텐츠 CTA가 출산가방 페이지에 표시된다", async ({ page }) => {
      // 무엇을: meta.linked_article_slugs / linked_timeline_weeks 표시
      // 왜: AC #8 — 하단 관련 콘텐츠 CTA
      await page.goto("/checklist/hospital-bag");
      await expect(page.getByRole("heading", { name: /관련 콘텐츠/ })).toBeVisible();
      await expect(page.getByText(/관련 타임라인/)).toBeVisible();
      await expect(page.getByText(/32주차 보기/)).toBeVisible();
    });

    test("BottomNav '체크리스트' 탭이 /checklist 하위 경로에서 활성화된다", async ({ page }) => {
      // 무엇을: prefix 매칭으로 하위 페이지에서도 탭 활성
      // 왜: AC #10 — 네비게이션 일관성
      await page.goto("/checklist/hospital-bag");
      const nav = page.locator("nav").last();
      const checklistTab = nav.getByText("체크리스트").locator("..");
      await expect(checklistTab).toHaveClass(/bg-pastel-pink/);
    });
  });

  test.describe("Error / Validation", () => {
    test("빈 제목으로는 커스텀 항목을 추가할 수 없다", async ({ page }) => {
      // 무엇을: 제목 입력 없을 때 추가 버튼 비활성화
      // 왜: 빈 항목 방지
      await page.goto("/checklist/pregnancy-prep");
      await page.locator('button[aria-label="항목 추가"]').click();
      await expect(page.getByRole("button", { name: "추가하기" })).toBeDisabled();
    });

    test("기본 아이템에는 삭제 버튼이 없다", async ({ page }) => {
      // 무엇을: 시드 JSON 항목 보호
      // 왜: 의도치 않은 데이터 손실 방지
      await page.goto("/checklist/hospital-bag");
      const card = page
        .locator('[role="button"]')
        .filter({ hasText: "산모용 잠옷" })
        .first();
      await expect(card.locator('button[aria-label="삭제"]')).toHaveCount(0);
    });

    test("기존 /checklist 리다이렉트가 제거되어 허브가 직접 표시된다", async ({ page }) => {
      // 무엇을: /checklist → /timeline 리다이렉트 제거
      // 왜: AC #9 — 허브 페이지로 전환
      await page.goto("/checklist");
      await expect(page).toHaveURL(/\/checklist\/?$/);
      await expect(
        page.getByRole("heading", { name: /체크리스트/, level: 1 })
      ).toBeVisible();
    });
  });

  test.describe("SEO 메타", () => {
    test("4개 페이지 모두 canonical URL이 정확하다", async ({ page }) => {
      // 무엇을: 각 페이지 canonical
      // 왜: AC #11/12 — SEO 메타 + sitemap 일관성
      const expectations: Array<[string, RegExp]> = [
        ["/checklist", /pregnancy-checklist\.com\/checklist$/],
        ["/checklist/hospital-bag", /pregnancy-checklist\.com\/checklist\/hospital-bag$/],
        ["/checklist/partner-prep", /pregnancy-checklist\.com\/checklist\/partner-prep$/],
        ["/checklist/pregnancy-prep", /pregnancy-checklist\.com\/checklist\/pregnancy-prep$/],
      ];
      for (const [path, pattern] of expectations) {
        await page.goto(path);
        const canonical = await page
          .locator('link[rel="canonical"]')
          .getAttribute("href");
        expect(canonical).toMatch(pattern);
      }
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 허브 카드가 모두 보이고 클릭으로 이동된다", async ({ page }) => {
      // 무엇을: 375px에서 카드 레이아웃 + 라우팅
      // 왜: 주요 타겟 기기
      await page.goto("/checklist");
      await expect(page.getByRole("heading", { name: "출산가방 체크리스트" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "임신 준비 체크리스트" })).toBeVisible();

      await page.getByRole("heading", { name: "임신 준비 체크리스트" }).click();
      await expect(page).toHaveURL(/\/checklist\/pregnancy-prep/);
    });

    test("모바일: 출산가방 페이지에서 체크 + 진행률 + FAB가 정상 동작한다", async ({ page }) => {
      // 무엇을: 모바일에서 핵심 인터랙션
      // 왜: 핵심 사용 시나리오 (대부분 모바일에서 사용)
      await page.goto("/checklist/hospital-bag");
      await expect(page.locator('button[aria-label="항목 추가"]')).toBeVisible();

      const item = page
        .locator('[role="button"]')
        .filter({ hasText: "산모용 잠옷" })
        .first();
      await item.click();

      // 체크 상태 확인 — 1로 진행
      await expect(page.locator(".line-through").filter({ hasText: "산모용 잠옷" })).toBeVisible();
    });
  });
});
