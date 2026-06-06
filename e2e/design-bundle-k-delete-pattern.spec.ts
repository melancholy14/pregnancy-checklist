import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { seedStorage } from "./helpers/seedStorage";
import type { ChecklistItem } from "../src/types/checklist";
import type { TimelineItem } from "../src/types/timeline";
import type { WeightLog } from "../src/store/useWeightStore";

/**
 * design-bundle-k-delete-pattern
 * spec: docs/features/design-bundle-k-delete-pattern/spec.md
 * impl: docs/implementation/design-bundle-k-delete-pattern-impl.md
 *
 * 검증 대상:
 * (1) 시나리오 1: weight 로그 X → 즉시 사라짐 + sonner toast.action → "되돌리기" → 복원
 * (2) 시나리오 2: checklist 커스텀 항목 삭제 → AlertDialog 미노출 + 토스트 → "되돌리기" → 복원
 * (3) 시나리오 3: timeline 커스텀 항목 삭제 → AlertDialog 미노출 + 토스트 → "되돌리기" → 복원
 * (4) 시나리오 4 (부분): 연속 삭제 시 다중 토스트 동시 가시
 * (5) 시나리오 5: X 클릭 → 새로고침 → 토스트 사라짐 + 항목 영구 삭제 (undo 불가)
 * (6) 반응형 375px: weight 삭제 + 되돌리기 모바일 동작
 */

const WEIGHT_PATH = "/weight";
const TIMELINE_PATH = "/timeline";
const HB_PATH = "/checklist/hospital-bag";

type WeightLogSeed = WeightLog;

interface ChecklistCustomSeed {
  id: string;
  title: string;
  category: "bag_mom" | "bag_baby" | "bag_docs";
  categoryName: string;
  recommendedWeek: number;
  priority: "high" | "medium" | "low";
}

interface TimelineCustomSeed {
  id: string;
  week: number;
  title: string;
  description: string;
  type: "prep" | "shopping" | "admin" | "education" | "wellbeing";
  priority: "high" | "medium" | "low";
}

async function dismissOverlays(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("onboarding-banner-dismissed", "true");
  });
}

async function seedWeightLogs(page: Page, logs: WeightLogSeed[]) {
  await seedStorage(page, { weight: { logs } });
}

async function seedHbCustomItems(page: Page, items: ChecklistCustomSeed[]) {
  const customItems: ChecklistItem[] = items.map((i) => ({ ...i, isCustom: true }));
  await seedStorage(page, {
    checklist: {
      "hospital-bag": { customItems },
    },
  });
}

async function seedTimelineCustomItems(page: Page, items: TimelineCustomSeed[]) {
  const customItems: TimelineItem[] = items.map((i) => ({ ...i, isCustom: true }));
  await seedStorage(page, { timeline: { customItems } });
}

function weightLogCard(page: Page, weight: string) {
  // 차트 카드도 `data-slot="card"`이고 y축 라벨에 수치 노출 → strong 텍스트로 행 카드 식별
  return page
    .locator('[data-slot="card-content"]')
    .filter({ has: page.locator("strong", { hasText: weight }) });
}

test.describe("design-bundle-k-delete-pattern", () => {
  test.describe("Happy Path — undo 토스트로 복원", () => {
    test("시나리오 1: weight 로그 X → 토스트 → 되돌리기 → 복원", async ({ page }) => {
      // 무엇을: X 클릭 시 즉시 항목 제거 + 토스트 등장, "되돌리기" 클릭 시 복원
      // 왜: spec §2 시나리오 1 — 시간 비용 0초 + 7초 회복 창
      await dismissOverlays(page);
      await seedWeightLogs(page, [
        { id: "w-001", date: "2026-03-15", weight: 62.5 },
      ]);
      await page.goto(WEIGHT_PATH);

      const weightCard = weightLogCard(page, "62.5");
      await expect(weightCard).toBeVisible();

      await weightCard.getByRole("button", { name: "체중 기록 삭제" }).click();

      // 즉시 사라짐
      await expect(weightCard).toHaveCount(0);

      // 토스트 노출
      const toastBody = page.getByText("체중 기록을 삭제했어요");
      await expect(toastBody).toBeVisible();

      // 되돌리기 → 복원
      await page.getByRole("button", { name: "되돌리기" }).click();
      await expect(weightLogCard(page, "62.5")).toBeVisible();
    });

    test("시나리오 2: checklist 커스텀 항목 삭제 → AlertDialog 미노출 + 되돌리기 복원", async ({
      page,
    }) => {
      // 무엇을: 삭제 버튼 클릭 → confirm 다이얼 미노출 + 토스트, 되돌리기 클릭 시 복원
      // 왜: spec §2 시나리오 2 — AlertDialog 호출부 제거 정합. design.md §3 default 상태
      await dismissOverlays(page);
      const customItem: ChecklistCustomSeed = {
        id: "custom-k-checklist-01",
        title: "K-test 체크 커스텀",
        category: "bag_mom",
        categoryName: "엄마 가방",
        recommendedWeek: 0,
        priority: "medium",
      };
      await seedHbCustomItems(page, [customItem]);
      await page.goto(HB_PATH);

      const row = page.locator("label", { hasText: "K-test 체크 커스텀" });
      await expect(row).toBeVisible();

      const deleteBtn = row
        .locator("..")
        .getByRole("button", { name: "삭제" });
      await deleteBtn.click();

      // AlertDialog 컨텐츠 미노출 (DeleteConfirmDialog 제거 확인)
      await expect(page.locator('[data-slot="alert-dialog-content"]')).toHaveCount(0);

      // 즉시 사라짐 + 토스트
      await expect(row).toHaveCount(0);
      await expect(page.getByText("체크리스트 항목을 삭제했어요")).toBeVisible();

      // 되돌리기 → 복원
      await page.getByRole("button", { name: "되돌리기" }).click();
      await expect(
        page.locator("label", { hasText: "K-test 체크 커스텀" })
      ).toBeVisible();
    });

    test("시나리오 3: timeline 커스텀 노트 삭제 → AlertDialog 미노출 + 되돌리기 복원", async ({
      page,
    }) => {
      // 무엇을: 삭제 → confirm 다이얼 미노출 + 토스트, 되돌리기 시 복원
      // 왜: spec §2 시나리오 3 — DeleteConfirmDialog 컴포넌트 자체 삭제 정합
      await dismissOverlays(page);
      const customItem: TimelineCustomSeed = {
        id: "custom-k-timeline-01",
        week: 18,
        title: "K-test 타임 커스텀",
        description: "K bundle 검증용",
        type: "prep",
        priority: "medium",
      };
      await seedTimelineCustomItems(page, [customItem]);
      await page.goto(TIMELINE_PATH);

      const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: "K-test 타임 커스텀" });
      await expect(card).toBeVisible();

      await card.getByRole("button", { name: "삭제" }).click();

      // AlertDialog 미노출
      await expect(page.locator('[data-slot="alert-dialog-content"]')).toHaveCount(0);

      // 즉시 사라짐 + 토스트
      await expect(card).toHaveCount(0);
      await expect(page.getByText("타임라인 노트를 삭제했어요")).toBeVisible();

      // 되돌리기 → 복원
      await page.getByRole("button", { name: "되돌리기" }).click();
      await expect(
        page.locator('[data-slot="card"]').filter({ hasText: "K-test 타임 커스텀" })
      ).toBeVisible();
    });
  });

  test.describe("Error / Edge — 다중 토스트 + 영구 삭제", () => {
    test("시나리오 4: 연속 삭제 시 토스트 다중 동시 가시", async ({ page }) => {
      // 무엇을: 2개 연속 X 클릭 → 토스트 2개 동시 가시 (visibleToasts=3 + 별개 발사)
      // 왜: spec §2 시나리오 4 + 페어 1 합의 — 토스트 별개 인스턴스, 병합 X
      await dismissOverlays(page);
      await seedWeightLogs(page, [
        { id: "w-multi-1", date: "2026-03-10", weight: 60.1 },
        { id: "w-multi-2", date: "2026-03-11", weight: 60.2 },
      ]);
      await page.goto(WEIGHT_PATH);

      const card1 = weightLogCard(page, "60.1");
      const card2 = weightLogCard(page, "60.2");
      await expect(card1).toBeVisible();
      await expect(card2).toBeVisible();

      await card1.getByRole("button", { name: "체중 기록 삭제" }).click();
      await card2.getByRole("button", { name: "체중 기록 삭제" }).click();

      // 토스트 2개 동시 가시 (병합 X)
      await expect(page.getByText("체중 기록을 삭제했어요")).toHaveCount(2);
      // 되돌리기 버튼도 2개
      await expect(page.getByRole("button", { name: "되돌리기" })).toHaveCount(2);
    });

    test("시나리오 5: X → 새로고침 → 토스트 사라짐 + 항목 영구 삭제 (undo 불가)", async ({
      page,
    }) => {
      // 무엇을: 삭제 직후 새로고침 → 토스트 휘발 + zustand persist에 삭제 반영
      // 왜: spec §2 시나리오 5 / K-2 옵션 A — React state 임시 보관, 새로고침 시 undo 불가
      // 비고: addInitScript은 reload 시 재실행되므로 UI 추가로 시드 — 새로고침 영속성 검증 정확도 우선
      await dismissOverlays(page);
      await page.goto(WEIGHT_PATH);

      await page.locator("button.fixed").click();
      await page.locator('input[type="date"]').fill("2026-03-20");
      await page.locator('input[type="number"]').fill("63");
      await page.getByRole("button", { name: "추가" }).click();

      const card = weightLogCard(page, "63");
      await expect(card).toBeVisible();

      await card.getByRole("button", { name: "체중 기록 삭제" }).click();
      await expect(page.getByText("체중 기록을 삭제했어요")).toBeVisible();

      await page.reload();

      // 토스트 사라짐
      await expect(page.getByText("체중 기록을 삭제했어요")).toHaveCount(0);
      // 항목 영구 삭제
      await expect(weightLogCard(page, "63")).toHaveCount(0);
      // 빈 상태 메시지 노출
      await expect(
        page.getByText("체중 기록은 임신 건강의 가장 직관적인 신호예요"),
      ).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: weight X → 토스트 → 되돌리기 흐름 정상", async ({ page }) => {
      // 무엇을: 375px 뷰포트에서 토스트 + 되돌리기 버튼 가시/터치 가능
      // 왜: design.md §7 — 모바일 토스트 위치(top-center) + 액션 버튼 정합
      await dismissOverlays(page);
      await seedWeightLogs(page, [
        { id: "w-mobile-001", date: "2026-03-25", weight: 64.2 },
      ]);
      await page.goto(WEIGHT_PATH);

      const card = weightLogCard(page, "64.2");
      await expect(card).toBeVisible();
      await expect(card).toBeInViewport();

      await card.getByRole("button", { name: "체중 기록 삭제" }).click();

      const toastBody = page.getByText("체중 기록을 삭제했어요");
      await expect(toastBody).toBeVisible();
      await expect(toastBody).toBeInViewport();

      const undo = page.getByRole("button", { name: "되돌리기" });
      await expect(undo).toBeVisible();
      await undo.click();

      await expect(weightLogCard(page, "64.2")).toBeVisible();
    });
  });
});
