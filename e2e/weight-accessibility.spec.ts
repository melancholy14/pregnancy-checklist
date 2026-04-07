import { test, expect } from "@playwright/test";

test.describe("체중관리 접근성 개선 (Step 7)", () => {
  test.describe("Happy Path — 홈 체중 미니 대시보드", () => {
    test("기록이 없을 때 '아직 기록이 없어요' + '시작하기' CTA가 표시된다", async ({ page }) => {
      // 무엇을: 체중 기록 0건일 때 빈 상태 텍스트
      // 왜: PRD에 따른 빈 상태 문구 확인
      await page.goto("/");
      const weightCard = page.locator('a[href="/weight"]');
      await expect(weightCard.getByText("아직 기록이 없어요")).toBeVisible();
      await expect(weightCard.getByText("시작하기")).toBeVisible();
    });

    test("기록 1건일 때 체중과 '추가 기록' CTA가 표시된다", async ({ page }) => {
      // 무엇을: 1건 기록 시 체중 표시 + CTA 변경
      // 왜: 1건일 때 diff 없이 체중만 표시, CTA가 "추가 기록"
      await page.addInitScript(() => {
        localStorage.setItem("onboarding-completed", "true");
        localStorage.setItem("weight-storage", JSON.stringify({
          state: { logs: [{ id: "1", date: "2026-03-29", weight: 62.5 }] },
          version: 0,
        }));
      });
      await page.goto("/");
      const weightCard = page.locator('a[href="/weight"]');
      await expect(weightCard.getByText("62.5kg")).toBeVisible({ timeout: 10000 });
      await expect(weightCard.getByText("추가 기록")).toBeVisible();
    });

    test("기록 2건 이상일 때 체중 + 시작比 변화량 + '기록하기' CTA가 표시된다", async ({ page }) => {
      // 무엇을: 2건+ 기록 시 최근 체중 + diff(시작比) 표시
      // 왜: 체중 변화 추이를 홈에서 바로 확인
      await page.addInitScript(() => {
        localStorage.setItem("onboarding-completed", "true");
        localStorage.setItem("weight-storage", JSON.stringify({
          state: { logs: [
            { id: "1", date: "2026-03-01", weight: 60 },
            { id: "2", date: "2026-03-29", weight: 62.1 },
          ] },
          version: 0,
        }));
      });
      await page.goto("/");
      const weightCard = page.locator('a[href="/weight"]');
      await expect(weightCard.getByText("62.1kg")).toBeVisible({ timeout: 10000 });
      await expect(weightCard.getByText(/\+2\.1kg.*처음 대비/)).toBeVisible();
      await expect(weightCard.getByText("기록하기")).toBeVisible();
    });
  });

  test.describe("Happy Path — 체중 페이지 블로그 링크", () => {
    test("체중 페이지에 '임신 중 체중 관리 가이드' 링크가 표시된다", async ({ page }) => {
      // 무엇을: 체중 페이지 하단 블로그 연결 카드
      // 왜: 체중 관련 콘텐츠 크로스 링크
      await page.goto("/weight");
      await expect(page.getByText("임신 중 체중 관리 가이드")).toBeVisible();
      await expect(page.getByText("BMI별 권장 범위부터 안전한 운동법까지")).toBeVisible();
    });

    test("블로그 링크 클릭 시 아티클 페이지로 이동한다", async ({ page }) => {
      // 무엇을: 링크 클릭 → 아티클 상세 이동
      // 왜: 크로스 링크 동작 확인
      await page.goto("/weight");
      await page.getByText("임신 중 체중 관리 가이드").click();
      await expect(page).toHaveURL(/\/articles\/pregnancy-weight-management/);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 체중 페이지 블로그 링크가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 블로그 링크 카드 표시
      // 왜: 모바일 환경 UI 확인
      await page.goto("/weight");
      await expect(page.getByText("임신 중 체중 관리 가이드")).toBeVisible();
    });
  });
});
