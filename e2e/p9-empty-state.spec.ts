import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * P9 빈 상태 카피·CTA — 4종 케이스 검증.
 * spec: docs/features/p9-empty-state/spec.md
 * impl: docs/implementation/p9-empty-state-impl.md
 *
 * 테스트 슬러그: hospital-bag (storeKey: "hospital-bag-storage")
 */

const HB_PATH = "/checklist/hospital-bag";
const HB_STORAGE_KEY = "hospital-bag-storage";

type ChecklistItem = { id: string };
const hbData = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../src/data/hospital_bag_checklist.json"),
    "utf8",
  ),
) as { items: ChecklistItem[] };

const ALL_HB_IDS: string[] = hbData.items.map((i) => i.id);

/** 동의·체크리스트·예정일 storage 모두 초기화 */
async function clearStorage(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.removeItem(key);
  }, HB_STORAGE_KEY);
}

/** persist 형식으로 store에 시드 */
async function seedStore(
  page: Page,
  state: { checkedIds?: string[]; customItems?: unknown[] } = {},
) {
  await page.addInitScript(
    ({ key, payload }) => {
      localStorage.setItem("cookie-consent", "accepted");
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            checkedIds: payload.checkedIds ?? [],
            customItems: payload.customItems ?? [],
          },
          version: 0,
        }),
      );
    },
    {
      key: HB_STORAGE_KEY,
      payload: {
        checkedIds: state.checkedIds,
        customItems: state.customItems,
      },
    },
  );
}

/** 손상된 JSON을 storage에 박아 hydration 실패를 유도 */
async function seedCorruptStorage(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem(key, "{this is not valid json");
  }, HB_STORAGE_KEY);
}

test.describe("P9 빈 상태 카피·CTA", () => {
  test.describe("Happy Path", () => {
    test("first_visit: 체크 0개·custom 0개 — 빈 상태 카드 + [둘러보기] CTA 노출", async ({
      page,
    }) => {
      // 무엇을: 깨끗한 storage로 진입 시 review.md §5 결정 카피와 lavender CTA가 그대로 노출되는지
      // 왜: spec.md §3 must "카피 정합성" — 임의 변형 금지. designer 페르소나 6.6 정합
      await clearStorage(page);
      await page.goto(HB_PATH);

      const empty = page
        .locator('section[role="status"]')
        .filter({ hasText: "체크리스트가 비어 있어요" });
      await expect(empty).toBeVisible();
      await expect(empty).toContainText(
        "체크리스트가 비어 있어요. 항목을 살펴보시겠어요?",
      );
      const browseBtn = page.getByRole("button", {
        name: "체크리스트 항목 둘러보기",
      });
      await expect(browseBtn).toBeVisible();
      await expect(browseBtn).toHaveText("둘러보기");

      // P3 슬림 배너 입력 CTA 위임 — 빈 상태 카드 안에는 예정일 입력 CTA 없어야 함
      await expect(empty).not.toContainText("예정일");
      await expect(empty).not.toContainText("주차");
    });

    test("first_visit [둘러보기] 탭 시 항목 리스트로 스크롤 (라우팅 변경 X)", async ({
      page,
    }) => {
      // 무엇을: design.md §1 플로우 — anchor scroll, 라우트 동일 유지
      // 왜: 빈 상태에서 사용자 다음 행동이 "items 둘러보기"로 명확히 연결되어야 함
      await clearStorage(page);
      await page.goto(HB_PATH);

      const itemsAnchor = page.locator("#checklist-items");
      await expect(itemsAnchor).toBeAttached();

      await page
        .getByRole("button", { name: "체크리스트 항목 둘러보기" })
        .click();

      // 라우트는 그대로
      await expect(page).toHaveURL(new RegExp(`${HB_PATH}/?$`));

      // 항목 리스트 가시 영역 진입(스크롤 후 viewport 내)
      await expect(itemsAnchor).toBeInViewport({ ratio: 0 });
    });

    test("all_done: 모든 항목 체크 상태 진입 시 헤더 격려 텍스트 + 토스트 1회", async ({
      page,
    }) => {
      // 무엇을: 모두 체크된 상태로 페이지 진입 시 AllDoneBadge + sonner 토스트가 노출되는지
      // 왜: spec.md §3 must "모두 완료 헤더 격려" + "모두 완료 토스트 같은 슬러그 마운트당 1회"
      await seedStore(page, { checkedIds: ALL_HB_IDS });
      await page.goto(HB_PATH);

      const badge = page.getByLabel("모든 항목 완료");
      await expect(badge).toBeVisible();
      await expect(badge).toContainText("모든 항목을 챙기셨어요");

      // sonner 토스트 — 텍스트 + 액션 버튼
      await expect(
        page.getByText("다른 체크리스트도 살펴보시겠어요?"),
      ).toBeVisible();
      const toastAction = page
        .getByRole("button", { name: "둘러보기" })
        .filter({ hasNotText: "체크리스트 항목 둘러보기" });
      await expect(toastAction).toBeVisible();
    });

    test("all_done 토스트 액션 [둘러보기] 탭 시 /checklist 허브로 이동", async ({
      page,
    }) => {
      // 무엇을: 토스트 액션이 hub 라우트로 navigate되는지
      // 왜: design.md §1 플로우 + N4 다크 패턴 회피(자체 도구 안내 한정)
      await seedStore(page, { checkedIds: ALL_HB_IDS });
      await page.goto(HB_PATH);

      await expect(
        page.getByText("다른 체크리스트도 살펴보시겠어요?"),
      ).toBeVisible();
      const toastAction = page
        .getByRole("button", { name: "둘러보기" })
        .filter({ hasNotText: "체크리스트 항목 둘러보기" });
      await toastAction.click();

      await page.waitForURL(/\/checklist\/?$/);
      await expect(
        page.getByRole("heading", { name: /체크리스트/, level: 1 }),
      ).toBeVisible();
    });

    test("migration_lost: 손상된 storage 진입 시 inline alert + [확인] CTA", async ({
      page,
    }) => {
      // 무엇을: hydration 실패 → onRehydrateStorage 콜백이 default state + migrationLostFlag 켬 → alert 노출
      // 왜: spec.md §3 must "자동 복구 콜백" + 사용자 인지 의무
      await seedCorruptStorage(page);
      await page.goto(HB_PATH);

      const alert = page
        .locator('div[role="alert"]')
        .filter({ hasText: "체크 기록을 새로 시작해요" });
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(
        "체크 기록을 새로 시작해요. 항목은 그대로 보여드릴게요.",
      );
      await expect(
        alert.getByRole("button", { name: "안내 닫기" }),
      ).toBeVisible();
    });

    test("migration_lost: [확인] 탭 시 alert 사라지고 플래그 클리어", async ({
      page,
    }) => {
      // 무엇을: clearMigrationLost 액션이 호출되어 in-memory 플래그가 false로 되는지
      // 왜: spec.md §4 edge case "[확인] 또는 첫 체크 시 alert 사라짐"
      await seedCorruptStorage(page);
      await page.goto(HB_PATH);

      const alert = page
        .locator('div[role="alert"]')
        .filter({ hasText: "체크 기록을 새로 시작해요" });
      await expect(alert).toBeVisible();

      await alert.getByRole("button", { name: "안내 닫기" }).click();
      await expect(alert).not.toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("first_visit: 빈 상태에서 첫 체크 시 카드 사라짐 (item count 1+가 되면)", async ({
      page,
    }) => {
      // 무엇을: 첫 체크박스 토글 → checkedIds.length=1 → first_visit 조건 깨짐 → 빈 상태 카드 dismiss
      // 왜: spec.md §4 edge case 정합. 사용자가 첫 행동을 하면 안내가 자연스럽게 사라져야 함
      await clearStorage(page);
      await page.goto(HB_PATH);

      const empty = page
        .locator('section[role="status"]')
        .filter({ hasText: "체크리스트가 비어 있어요" });
      await expect(empty).toBeVisible();

      // 첫 항목 체크
      const firstRow = page.locator('[role="button"][aria-pressed="false"]').first();
      await firstRow.click();

      await expect(empty).not.toBeVisible();
    });

    test("migration_lost: 첫 체크 시 alert 사라지고 storage에 정상 저장", async ({
      page,
    }) => {
      // 무엇을: spec.md §4 "CTA 탭 또는 첫 체크 시 alert 사라짐" — toggle path에서 clearMigrationLost 호출
      // 왜: 사용자가 첫 행동(체크) 시 alert가 자동 dismiss되어야 함. 새로 시작이라는 톤 정합
      await seedCorruptStorage(page);
      await page.goto(HB_PATH);

      const alert = page
        .locator('div[role="alert"]')
        .filter({ hasText: "체크 기록을 새로 시작해요" });
      await expect(alert).toBeVisible();

      const firstRow = page.locator('[role="button"][aria-pressed="false"]').first();
      await firstRow.click();

      await expect(alert).not.toBeVisible();

      // 손상된 키가 정상 JSON으로 덮어써졌는지 (zustand persist가 덮어씀)
      const stored = await page.evaluate((key) => localStorage.getItem(key), HB_STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored as string);
      expect(parsed?.state?.checkedIds?.length).toBeGreaterThanOrEqual(1);
    });

    test("all_done 토스트는 세션 중 transition 시 미발사 (마운트 1회 룰)", async ({
      page,
    }) => {
      // 무엇을: spec.md §4 edge case "체크 toggle 직후 모두 완료 → 토스트는 다음 마운트까지 미발사"
      // 왜: 사용자가 마지막 항목을 체크하는 순간 토스트가 깜빡이지 않아야 함. 헤더 텍스트만 즉시 노출
      const allButOne = ALL_HB_IDS.slice(0, ALL_HB_IDS.length - 1);
      await seedStore(page, { checkedIds: allButOne });
      await page.goto(HB_PATH);

      // hydration 완료 증거: seed된 31개 아이템이 aria-pressed="true"가 될 때까지 대기.
      // not.toBeVisible은 SSR 시점에도 즉시 통과되므로 hydration 동기화 신호로 부적합.
      await expect(
        page.locator('[role="button"][aria-pressed="true"]'),
      ).toHaveCount(allButOne.length);

      // 진입 시 all_done=false → 토스트 미노출, 배지 미노출
      await expect(page.getByLabel("모든 항목 완료")).not.toBeVisible();
      await expect(
        page.getByText("다른 체크리스트도 살펴보시겠어요?"),
      ).not.toBeVisible();

      // 마지막 미체크 항목 토글
      await page
        .locator('[role="button"][aria-pressed="false"]')
        .first()
        .click();

      // 헤더 격려 텍스트는 즉시 노출
      await expect(page.getByLabel("모든 항목 완료")).toBeVisible();

      // 토스트는 마운트 동안 발사 X — 1초 동안 미노출 유지 검증
      await expect(
        page.getByText("다른 체크리스트도 살펴보시겠어요?"),
      ).not.toBeVisible({ timeout: 1000 });
    });

    test("custom만 케이스 + custom 0개 = first_visit으로 분기", async ({ page }) => {
      // 무엇을: spec.md §4 edge case — base는 항상 존재하므로 직접 simulate 불가하지만,
      //         custom 0 + checked 0 진입은 항상 first_visit이어야 함
      // 왜: case 우선순위 정합 검증
      await seedStore(page, { checkedIds: [], customItems: [] });
      await page.goto(HB_PATH);

      await expect(
        page
          .locator('section[role="status"]')
          .filter({ hasText: "체크리스트가 비어 있어요" }),
      ).toBeVisible();
      // 안내 카피(custom_only) 미노출
      await expect(
        page.getByText("기본 항목이 비어 있어요"),
      ).not.toBeVisible();
    });
  });

  test.describe("권한 / 인증", () => {
    test("인증 게이트 없음 — 비로그인 상태로 모든 케이스 접근 가능", async ({ page }) => {
      // 무엇을: 본 앱은 인증을 요구하지 않으며, 빈 상태 컴포넌트도 비로그인 환경에서 정상 노출
      // 왜: spec.md 범위에 인증 분기 없음. 회귀 시 빈 상태가 인증 게이트 뒤로 숨지 않는지 명시 검증
      await clearStorage(page);
      await page.goto(HB_PATH);

      await expect(page).toHaveURL(new RegExp(`${HB_PATH}/?$`));
      await expect(
        page
          .locator('section[role="status"]')
          .filter({ hasText: "체크리스트가 비어 있어요" }),
      ).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: first_visit 카드 가시·미클립", async ({ page }) => {
      // 무엇을: design.md §5.2 "first_visit 카드 폭 화면의 90%" — 320~375px에서 잘리지 않는지
      // 왜: 주요 타겟 기기 검증, keep-all 줄바꿈 정합
      await clearStorage(page);
      await page.goto(HB_PATH);

      const empty = page
        .locator('section[role="status"]')
        .filter({ hasText: "체크리스트가 비어 있어요" });
      await expect(empty).toBeVisible();
      await expect(empty).toBeInViewport();
      await expect(
        page.getByRole("button", { name: "체크리스트 항목 둘러보기" }),
      ).toBeInViewport();
    });

    test("모바일: all_done 헤더 배지 + 토스트 가시", async ({ page }) => {
      // 무엇을: 375px에서 AllDoneBadge와 sonner 토스트(top-center) 가시 영역 내 노출
      // 왜: 모바일에서 토스트가 화면 밖으로 잘리지 않는지
      await seedStore(page, { checkedIds: ALL_HB_IDS });
      await page.goto(HB_PATH);

      await expect(page.getByLabel("모든 항목 완료")).toBeInViewport();
      await expect(
        page.getByText("다른 체크리스트도 살펴보시겠어요?"),
      ).toBeInViewport();
    });

    test("모바일: migration_lost alert + [확인] 버튼 가시", async ({ page }) => {
      // 무엇을: design.md §5.2 "alert 폭 본문 폭 100%" 정합. 모바일에서 버튼 탭 영역 충분
      // 왜: 손실 안내가 핵심 도메인 — 사용자 인지 의무
      await seedCorruptStorage(page);
      await page.goto(HB_PATH);

      const alert = page
        .locator('div[role="alert"]')
        .filter({ hasText: "체크 기록을 새로 시작해요" });
      await expect(alert).toBeInViewport();
      await expect(
        alert.getByRole("button", { name: "안내 닫기" }),
      ).toBeInViewport();
    });
  });
});
