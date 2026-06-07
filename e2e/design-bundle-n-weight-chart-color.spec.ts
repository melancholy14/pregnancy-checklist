import { test, expect, type Page } from "@playwright/test";

// 검증 대상: docs/features/design-bundle-n-weight-chart-color/spec.md
// - M1. Line stroke + dot fill = pastel-peach (#FFE0CC)
// - M2. linearGradient 양쪽 stop = #FFE0CC (stop2 opacity 0, lavender 제거)
// - M4. chrome 토큰 변경 0 (출처·면책 카피 그대로)
// 회귀 0: 차트 SVG 안에 옛 색(#FFD4DE pink / #D0EDE2 mint / #E4D6F0 lavender) 노출 0건.
//
// 비고(P4.6): ReferenceLine 점선 2개는 차트에서 제거되고 캡션 텍스트(11.5~16kg)로 이전됨.
// 따라서 옛 M3(ReferenceLine 색·dashed 차등) 검증은 폐기하고, 캡션 회귀 가드만 남긴다.

const PEACH = "#FFE0CC";
const MUTED = "#9CA0A4";
const OLD_PINK = "#FFD4DE";
const OLD_MINT = "#D0EDE2";
const OLD_LAVENDER = "#E4D6F0";

async function gotoWeight(page: Page) {
  // 쿠키 동의 배너가 FAB 위에 떠 클릭을 가로채는 문제 회피
  // (e2e/checklist-week-bug.spec.ts 동일 패턴: 1회 진입 → consent 세팅 → 재진입)
  await page.goto("/weight");
  await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted"));
  await page.goto("/weight");
}

async function addRecord(page: Page, date: string, weight: string) {
  await page.locator("button.fixed").click();
  await page.locator('input[type="date"]').fill(date);
  await page.locator('input[type="number"]').fill(weight);
  await page.getByRole("button", { name: "추가" }).click();
}

async function seedTwoRecords(page: Page) {
  await gotoWeight(page);
  await addRecord(page, "2026-03-01", "60");
  await addRecord(page, "2026-04-15", "80");
  await page.locator(".recharts-surface").first().waitFor({ state: "visible" });
}

test.describe("design-bundle-n-weight-chart-color (체중 차트 색 정책 — peach=data + 캡션 가이드)", () => {
  test.describe("Happy Path", () => {
    test("Line stroke + dot fill 이 pastel-peach(#FFE0CC) 다", async ({ page }) => {
      // 무엇을: <Line> stroke 와 dot circle fill 이 peach hex 로 렌더
      // 왜: spec must M1 — pink(=CTA) 오용 회복, peach(=data role) 정합 (AP1)
      await seedTwoRecords(page);

      const linePath = page.locator(".recharts-line-curve").first();
      await expect(linePath).toHaveAttribute("stroke", PEACH);

      const dot = page.locator(".recharts-line-dot").first();
      await expect(dot).toHaveAttribute("fill", PEACH);
    });

    test("linearGradient 양쪽 stop 이 peach 단일이다(stop2 opacity 0, lavender 제거)", async ({ page }) => {
      // 무엇을: #weightGradient 의 stop1·stop2 stop-color = #FFE0CC, stop2 stop-opacity = "0"
      // 왜: spec must M2 — lavender stop 제거 + peach 단일 그라디언트
      await seedTwoRecords(page);

      const stops = page.locator("#weightGradient stop");
      await expect(stops).toHaveCount(2);
      await expect(stops.nth(0)).toHaveAttribute("stop-color", PEACH);
      await expect(stops.nth(1)).toHaveAttribute("stop-color", PEACH);
      await expect(stops.nth(1)).toHaveAttribute("stop-opacity", "0");
    });

    test("권장 범위는 캡션 텍스트(11.5~16kg)로 안내된다 — 차트 안 ReferenceLine 미렌더", async ({ page }) => {
      // 무엇을: P4.6 변경 — 차트 안 점선 2개 제거, 캡션 카피로 의미 이전
      // 왜: 시각 노이즈 축소 + 의학적 단정(점선=경계) 시그널 약화. 캡션 카피로 의미 위임.
      await seedTwoRecords(page);

      await expect(page.locator(".recharts-reference-line-line")).toHaveCount(0);
      await expect(page.getByText(/11\.5~16kg/)).toBeVisible();
    });

    test("M4: chrome 토큰 변경 0 — grid·axis 색 + 출처·면책 카피 유지", async ({ page }) => {
      // 무엇을: CartesianGrid #F8F6F4 / XAxis·YAxis #9CA0A4 + 출처·면책 카피 그대로
      // 왜: spec must M4 + won't N-4=A — 본문 카피 보강 0, designer N5 의료 안전 유지
      await seedTwoRecords(page);

      // grid + axis chrome stroke 유지
      await expect(page.locator(".recharts-cartesian-grid line").first()).toHaveAttribute("stroke", "#F8F6F4");
      await expect(page.locator(".recharts-xAxis .recharts-cartesian-axis-line")).toHaveAttribute("stroke", MUTED);

      // 본문 카피 — "출처: 대한산부인과학회 ..." 는 차트 영역 고유 카피
      await expect(page.getByText(/출처: 대한산부인과학회/)).toBeVisible();
      await expect(page.getByText(/의료적 조언이 아닙니다/)).toBeVisible();
    });
  });

  test.describe("Error / Validation (회귀 0건)", () => {
    test("차트 SVG 안에 옛 hex(#FFD4DE pink / #D0EDE2 mint / #E4D6F0 lavender) 노출 0건", async ({ page }) => {
      // 무엇을: 라인·dot·gradient 어디에도 옛 색이 노출되지 않는지
      // 왜: AP1 회복은 회귀 가드로 박아야 한다. 향후 신규 차트 추가 시에도 동일 룰 검증 기준.
      await seedTwoRecords(page);

      const svgHtml = await page.locator(".recharts-surface").first().innerHTML();
      expect(svgHtml, `chart should not contain ${OLD_PINK}`).not.toContain(OLD_PINK);
      expect(svgHtml, `chart should not contain ${OLD_MINT}`).not.toContain(OLD_MINT);
      expect(svgHtml, `chart should not contain ${OLD_LAVENDER}`).not.toContain(OLD_LAVENDER);
    });
  });

  test.describe("권한 / 인증 (state 분기 — 데이터 개수에 따른 차트 렌더 분기)", () => {
    test("데이터 0개: 차트 자체 미렌더 (`if (data.length === 0) return null;`)", async ({ page }) => {
      // 무엇을: data.length === 0 일 때 WeightChart 가 null 반환 → SVG DOM 부재
      // 왜: spec §4 빈 데이터 분기 회귀 가드 (빈 상태 카피는 P4.6 콘텐츠 보강 반영)
      await gotoWeight(page);
      await expect(
        page.getByText("체중 기록은 임신 건강의 가장 직관적인 신호예요"),
      ).toBeVisible();
      await expect(page.locator(".recharts-surface")).toHaveCount(0);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: peach 라인 색 정책 동일하게 유지", async ({ page }) => {
      // 무엇을: 375px viewport 에서도 peach=data 정책 유지 (ReferenceLine 은 코드에서 제거됨)
      // 왜: 주요 타겟 디바이스 폭(임산부 모바일). design.md §7 cross-check.
      await seedTwoRecords(page);

      const linePath = page.locator(".recharts-line-curve").first();
      await expect(linePath).toHaveAttribute("stroke", PEACH);

      // P4.6 변경: ReferenceLine 미렌더 회귀 가드
      await expect(page.locator(".recharts-reference-line-line")).toHaveCount(0);
    });
  });
});
