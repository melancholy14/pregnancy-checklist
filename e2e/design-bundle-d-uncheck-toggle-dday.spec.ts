import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { seedStorage } from "./helpers/seedStorage";
import type { ChecklistItem } from "../src/types/checklist";

/**
 * design-bundle-d-uncheck-toggle-dday
 * spec: docs/features/design-bundle-d-uncheck-toggle-dday/spec.md
 * impl: docs/implementation/design-bundle-d-uncheck-toggle-dday-impl.md
 *
 * 검증 대상:
 * (1) "미체크만 보기" 토글 — on/off 시 체크된 항목 분기, 빈 상태 인라인 메시지
 * (2) D-day 라벨("N주차에 챙기기") — recommendedWeek > currentWeek 분기
 * (3) GA4 신규 3종: checklist_filter, upcoming_item_view, upcoming_item_check
 * (4) P2 와의 분기 (isHighlighted 우선), 체크/주차 미입력/recommendedWeek=0 가드
 * (5) 모바일 375px 레이아웃
 *
 * 테스트 슬러그: hospital-bag — 본 슬러그는 모든 base item 이 recommendedWeek=0 이라
 * D-day 라벨 검증은 customItems 시드(recommendedWeek > 0)로 진행한다.
 */

const HB_PATH = "/checklist/hospital-bag";

type HbChecklistRecord = { id: string; title: string; category: string };
const hbData = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../src/data/hospital_bag_checklist.json"),
    "utf8",
  ),
) as { items: HbChecklistRecord[] };

const ALL_HB_IDS: string[] = hbData.items.map((i) => i.id);

interface SeedCustomItem {
  id: string;
  title: string;
  category: "bag_mom" | "bag_baby" | "bag_docs";
  categoryName: string;
  recommendedWeek: number;
  priority: "high" | "medium" | "low";
}

async function setupGtagSpy(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__gtagCalls = [];
    const layer: unknown[] = [];
    const origPush = Array.prototype.push;
    (layer as unknown as { push: (...items: unknown[]) => number }).push =
      function (...items: unknown[]) {
        for (const item of items) {
          if (item != null && typeof item === "object" && "length" in (item as object)) {
            (w.__gtagCalls as unknown[][]).push(
              Array.from(item as ArrayLike<unknown>),
            );
          }
        }
        return origPush.apply(this, items);
      };
    w.dataLayer = layer;
    w.gtag = (...args: unknown[]) => {
      (w.__gtagCalls as unknown[][]).push(args);
    };
  });
}

async function getGtagCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const list = (window as unknown as Record<string, unknown>).__gtagCalls;
    return Array.isArray(list) ? (list as unknown[][]) : [];
  });
}

/** 주차 N 으로 due-date-storage 를 시드한다. */
async function seedPregnancyWeek(page: Page, week: number) {
  await page.addInitScript((w) => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("onboarding-banner-dismissed", "true");
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const due = new Date();
    due.setDate(due.getDate() + (40 - w) * 7);
    const dueDate = due.toISOString().split("T")[0];
    localStorage.setItem(
      "due-date-storage",
      JSON.stringify({
        state: {
          dueDate,
          currentPregnancyWeek: w,
          lastCalcDate: today,
          cohortJoinWeek: w,
        },
        version: 1,
      }),
    );
  }, week);
}

/** 주차 미입력 (cookie-consent 만 통과). */
async function seedNoWeek(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("onboarding-banner-dismissed", "true");
    localStorage.removeItem("due-date-storage");
  });
}

/** hospital-bag-storage 에 checkedIds·customItems 를 시드한다. version 은 seedStorage 기본값. */
async function seedHbStore(
  page: Page,
  state: { checkedIds?: string[]; customItems?: SeedCustomItem[] } = {},
) {
  const customItems: ChecklistItem[] | undefined = state.customItems?.map((i) => ({
    ...i,
    isCustom: true,
  }));
  await seedStorage(page, {
    checklist: {
      "hospital-bag": {
        checkedIds: state.checkedIds,
        customItems,
      },
    },
  });
}

test.describe("design-bundle-d-uncheck-toggle-dday", () => {
  test.describe("Happy Path — '미체크만 보기' 토글", () => {
    test("토글 on 시 체크된 항목이 숨겨지고, off 시 다시 노출된다", async ({
      page,
    }) => {
      // 무엇을: 일부 항목 체크 → 토글 on → 체크된 항목 숨김. 토글 off → 복원
      // 왜: M3 — 핵심 필터 동작. spec §2 시나리오 1
      const seededChecked = [ALL_HB_IDS[0], ALL_HB_IDS[1]];
      // 안전한 substring (regex 특수문자 회피용 첫 5자만)
      const itemSubstring = hbData.items[0].title.slice(0, 5);
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { checkedIds: seededChecked });
      await page.goto(HB_PATH);

      // 시드된 체크 항목이 처음에 보임 (체크 상태)
      const firstItemRow = page.locator("label", { hasText: itemSubstring });
      await expect(firstItemRow.getByRole("checkbox")).toBeChecked();

      // 토글 on
      const toggle = page.getByRole("switch", { name: "미체크만 보기" });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");

      // 체크된 항목은 숨겨진다
      await expect(firstItemRow).toHaveCount(0);

      // 토글 off → 다시 노출
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await expect(firstItemRow).toBeVisible();
      await expect(firstItemRow.getByRole("checkbox")).toBeChecked();
    });

    test("토글 on + 미체크 0개 시 빈 상태 인라인 메시지가 노출된다", async ({
      page,
    }) => {
      // 무엇을: 모든 항목 체크 + 토글 on → '지금 보이는 항목은 모두 체크했어요'
      // 왜: M4 — 빈 상태 카피 정합성. spec §2 시나리오 6
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { checkedIds: ALL_HB_IDS });
      await page.goto(HB_PATH);

      const toggle = page.getByRole("switch", { name: "미체크만 보기" });
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");

      const emptyMsg = page.getByText("지금 보이는 항목은 모두 체크했어요");
      await expect(emptyMsg).toBeVisible();
      // role="status" + aria-live="polite" 시맨틱 검증
      await expect(emptyMsg).toHaveAttribute("role", "status");
      await expect(emptyMsg).toHaveAttribute("aria-live", "polite");
    });

    test("진행률 텍스트는 토글 on 이어도 전체 기준으로 유지된다", async ({
      page,
    }) => {
      // 무엇을: 토글 on 시에도 진행률 분모는 전체 기준 (예: "/32")
      // 왜: design.md §3 — '진행률 텍스트는 전체 기준 유지'
      const partialChecked = [ALL_HB_IDS[0], ALL_HB_IDS[1]];
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { checkedIds: partialChecked });
      await page.goto(HB_PATH);

      // 전체 진행률 분모 = 32
      const totalDenom = page.getByText("/32").first();
      await expect(totalDenom).toBeVisible();

      // 토글 on
      await page.getByRole("switch", { name: "미체크만 보기" }).click();

      // 분모는 그대로 — 토글로 표시 항목이 줄어도 전체 기준 유지
      await expect(totalDenom).toBeVisible();
    });
  });

  test.describe("Happy Path — D-day 라벨 (커스텀 아이템)", () => {
    test("currentWeek=22, recommendedWeek=32 커스텀 항목에 'N주차에 챙기기' 라벨", async ({
      page,
    }) => {
      // 무엇을: 미래 권장 항목 → "32주차에 챙기기" + Clock 아이콘 + muted-foreground 톤
      // 왜: M2 — D-day 라벨 매칭 핵심 분기. spec §2 시나리오 2
      const upcomingItem: SeedCustomItem = {
        id: "custom_upcoming_01",
        title: "출산 직전 짐 마지막 점검",
        category: "bag_docs",
        categoryName: "서류/기타",
        recommendedWeek: 32,
        priority: "medium",
      };
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", {
        hasText: /출산 직전 짐 마지막 점검/,
      });
      await expect(row).toBeVisible();
      const label = row.getByText("32주차에 챙기기");
      await expect(label).toBeVisible();
      // muted-foreground 톤 (P2 font-medium 와 분기) — 외부 span 의 클래스 검증
      const labelOuter = row
        .locator("span.text-muted-foreground")
        .filter({ hasText: "32주차에 챙기기" });
      await expect(labelOuter).toHaveClass(/font-normal/);
    });

    test("D-day 라벨 항목 체크 시 라벨이 사라진다 (!isChecked 가드)", async ({
      page,
    }) => {
      // 무엇을: 체크 후 라벨 제거 — spec §4 isChecked=true 가드
      // 왜: 라벨이 시간 컨텍스트라 체크된 항목엔 의미 없음
      const upcomingItem: SeedCustomItem = {
        id: "custom_upcoming_02",
        title: "예비 양수 체크 키트 준비",
        category: "bag_mom",
        categoryName: "엄마 가방",
        recommendedWeek: 30,
        priority: "low",
      };
      await seedPregnancyWeek(page, 18);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", {
        hasText: /예비 양수 체크 키트/,
      });
      await expect(row.getByText("30주차에 챙기기")).toBeVisible();
      await row.click();
      await expect(row.getByRole("checkbox")).toBeChecked();
      await expect(row.getByText("30주차에 챙기기")).toHaveCount(0);
    });

    test("recommendedWeek === currentWeek 항목은 P2 '이번 주 추천'만 노출 (D-day 분기)", async ({
      page,
    }) => {
      // 무엇을: P2 isHighlighted 가 우선 — D-day 라벨 미노출
      // 왜: spec §3 M2 — '두 라벨은 분기'. 같은 행 동시 노출 금지
      const matchingItem: SeedCustomItem = {
        id: "custom_match_01",
        title: "이번 주 산책로 메모",
        category: "bag_docs",
        categoryName: "서류/기타",
        recommendedWeek: 22,
        priority: "low",
      };
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { customItems: [matchingItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", { hasText: /이번 주 산책로 메모/ });
      await expect(row.getByText("이번 주 추천")).toBeVisible();
      await expect(row.getByText("22주차에 챙기기")).toHaveCount(0);
    });
  });

  test.describe("GA4 이벤트", () => {
    test("토글 변경 시 checklist_filter 가 on/off 값과 함께 발사된다", async ({
      page,
    }) => {
      // 무엇을: 토글 on → value=on, 토글 off → value=off, filter_type=uncheck_only
      // 왜: M5 / ga4.md §2 — 토글 변경 1회 발사, 페이지뷰 자동 발사 X
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page);
      await page.goto(HB_PATH);

      const toggle = page.getByRole("switch", { name: "미체크만 보기" });
      await expect(toggle).toBeVisible();

      // 페이지뷰만으로는 발사 0
      let calls = await getGtagCalls(page);
      expect(
        calls.filter((c) => c[0] === "event" && c[1] === "checklist_filter")
          .length,
      ).toBe(0);

      // on
      await toggle.click();
      await expect.poll(async () => {
        const list = await getGtagCalls(page);
        return list.filter(
          (c) => c[0] === "event" && c[1] === "checklist_filter",
        ).length;
      }).toBe(1);
      calls = await getGtagCalls(page);
      const onCall = calls.find(
        (c) => c[0] === "event" && c[1] === "checklist_filter",
      ) as unknown[];
      expect((onCall[2] as Record<string, unknown>).filter_type).toBe(
        "uncheck_only",
      );
      expect((onCall[2] as Record<string, unknown>).value).toBe("on");

      // off
      await toggle.click();
      await expect.poll(async () => {
        const list = await getGtagCalls(page);
        return list.filter(
          (c) => c[0] === "event" && c[1] === "checklist_filter",
        ).length;
      }).toBe(2);
      calls = await getGtagCalls(page);
      const filterCalls = calls.filter(
        (c) => c[0] === "event" && c[1] === "checklist_filter",
      );
      const offParams = filterCalls[1][2] as Record<string, unknown>;
      expect(offParams.value).toBe("off");
    });

    test("D-day 라벨 노출 항목 마운트 시 upcoming_item_view 가 1회 발사된다", async ({
      page,
    }) => {
      // 무엇을: 라벨 노출 항목 1건 마운트 → upcoming_item_view 1회. item_id, weeks_ahead 정확
      // 왜: M6 / ga4.md §2 — view 발사는 라벨 노출 케이스만, useEffect 1회
      const upcomingItem: SeedCustomItem = {
        id: "custom_upcoming_03",
        title: "출산용품 막바지 정리",
        category: "bag_docs",
        categoryName: "서류/기타",
        recommendedWeek: 30,
        priority: "medium",
      };
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      await expect(page.getByText("30주차에 챙기기")).toBeVisible();

      await expect.poll(async () => {
        const list = await getGtagCalls(page);
        return list.filter(
          (c) => c[0] === "event" && c[1] === "upcoming_item_view",
        ).length;
      }).toBe(1);

      const calls = await getGtagCalls(page);
      const viewCall = calls.find(
        (c) => c[0] === "event" && c[1] === "upcoming_item_view",
      ) as unknown[];
      const params = viewCall[2] as Record<string, unknown>;
      expect(params.item_id).toBe("custom_upcoming_03");
      expect(params.weeks_ahead).toBe(8);
    });

    test("D-day 라벨 항목 체크 시 upcoming_item_check 가 발사되고, 체크 해제 시 미발사", async ({
      page,
    }) => {
      // 무엇을: ON 토글 시 upcoming_item_check 1회 발사, OFF 토글 시 추가 발사 X
      // 왜: M6 / ga4.md §2 — willCheck 분기에서만 발사. OFF 가드
      const upcomingItem: SeedCustomItem = {
        id: "custom_upcoming_04",
        title: "출산 가방 최종 마감",
        category: "bag_mom",
        categoryName: "엄마 가방",
        recommendedWeek: 35,
        priority: "high",
      };
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 20);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", { hasText: /출산 가방 최종 마감/ });
      const checkbox = row.getByRole("checkbox");
      await expect(row.getByText("35주차에 챙기기")).toBeVisible();

      // ON
      await row.click();
      await expect(checkbox).toBeChecked();
      await expect.poll(async () => {
        const list = await getGtagCalls(page);
        return list.filter(
          (c) => c[0] === "event" && c[1] === "upcoming_item_check",
        ).length;
      }).toBe(1);

      const calls = await getGtagCalls(page);
      const checkCall = calls.find(
        (c) => c[0] === "event" && c[1] === "upcoming_item_check",
      ) as unknown[];
      const params = checkCall[2] as Record<string, unknown>;
      expect(params.item_id).toBe("custom_upcoming_04");
      expect(params.weeks_ahead).toBe(15);

      // OFF — 추가 발사 X
      await row.click();
      await expect(checkbox).not.toBeChecked();
      const callsAfter = await getGtagCalls(page);
      const checkAfter = callsAfter.filter(
        (c) => c[0] === "event" && c[1] === "upcoming_item_check",
      );
      expect(checkAfter.length).toBe(1);
    });
  });

  test.describe("Error / Negative", () => {
    test("currentWeek null (예정일 미입력) → D-day 라벨 미노출 + view 미발사", async ({
      page,
    }) => {
      // 무엇을: 주차 null 가드 — 라벨도 view 이벤트도 0
      // 왜: spec §4 — 'currentWeek null: D-day 라벨 비표시'
      const upcomingItem: SeedCustomItem = {
        id: "custom_upcoming_05",
        title: "주차 미입력 노출 검증 항목",
        category: "bag_docs",
        categoryName: "서류/기타",
        recommendedWeek: 30,
        priority: "low",
      };
      await setupGtagSpy(page);
      await seedNoWeek(page);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", {
        hasText: /주차 미입력 노출 검증 항목/,
      });
      await expect(row).toBeVisible();
      await expect(row.getByText(/주차에 챙기기$/)).toHaveCount(0);

      const calls = await getGtagCalls(page);
      const view = calls.filter(
        (c) => c[0] === "event" && c[1] === "upcoming_item_view",
      );
      expect(view.length).toBe(0);
    });

    test("기본 hospital-bag 항목(recommendedWeek=0)에는 D-day 라벨이 0건이다", async ({
      page,
    }) => {
      // 무엇을: P6 가드 — recommendedWeek=0 항목은 라벨 비표시
      // 왜: spec §4 — 'recommendedWeek=0: D-day 라벨 비표시'. 기존 데이터 회귀 방지
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page);
      await page.goto(HB_PATH);

      // 기본 항목은 모두 recommendedWeek=0 — '주차에 챙기기' 텍스트 0건
      await expect(page.getByText(/주차에 챙기기$/)).toHaveCount(0);
      // P2 라벨도 0건 (모든 base 가 recommendedWeek=0)
      await expect(page.getByText("이번 주 추천")).toHaveCount(0);
    });

    test("recommendedWeek < currentWeek (지난 주차) 항목 → 라벨 미노출", async ({
      page,
    }) => {
      // 무엇을: 과거 권장 주차 → 라벨 0 (won't 결정 — 미래만)
      // 왜: spec §3 won't / planner §7.7 공포 회피
      const pastItem: SeedCustomItem = {
        id: "custom_past_01",
        title: "지난 주차 권장 항목",
        category: "bag_mom",
        categoryName: "엄마 가방",
        recommendedWeek: 14,
        priority: "low",
      };
      await seedPregnancyWeek(page, 28);
      await seedHbStore(page, { customItems: [pastItem] });
      await page.goto(HB_PATH);

      const row = page.locator("label", { hasText: /지난 주차 권장 항목/ });
      await expect(row).toBeVisible();
      await expect(row.getByText(/주차에 챙기기$/)).toHaveCount(0);
      await expect(row.getByText("이번 주 추천")).toHaveCount(0);
    });

    test("토글 off 상태에서는 페이지뷰만으로 checklist_filter 미발사", async ({
      page,
    }) => {
      // 무엇을: 페이지 진입만으로 checklist_filter 발사 X
      // 왜: ga4.md §2 — '페이지뷰 시 자동 발사 X'
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page);
      await page.goto(HB_PATH);

      // 토글이 마운트된 후 충분히 대기 (다른 GA 이벤트로 hydration 완료 확인)
      await expect(
        page.getByRole("switch", { name: "미체크만 보기" }),
      ).toBeVisible();

      const calls = await getGtagCalls(page);
      const filter = calls.filter(
        (c) => c[0] === "event" && c[1] === "checklist_filter",
      );
      expect(filter.length).toBe(0);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일에서 토글 행과 D-day 라벨 항목이 한 줄로 정상 노출된다", async ({
      page,
    }) => {
      // 무엇을: 토글 + 라벨 + 항목 행이 모바일 viewport 에서 한 줄, 깨짐 없음
      // 왜: spec §5 / design.md §3 — 모바일 320~375px 한 줄 OK
      const upcomingItem: SeedCustomItem = {
        id: "custom_mobile_01",
        title: "모바일 출산준비 항목",
        category: "bag_docs",
        categoryName: "서류/기타",
        recommendedWeek: 30,
        priority: "medium",
      };
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { customItems: [upcomingItem] });
      await page.goto(HB_PATH);

      const toggle = page.getByRole("switch", { name: "미체크만 보기" });
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeInViewport();

      const row = page.locator("label", { hasText: /모바일 출산준비 항목/ });
      await expect(row).toBeVisible();
      await expect(row.getByText("30주차에 챙기기")).toBeVisible();
    });

    test("모바일에서 토글 on → 미체크 0개 시 빈 상태 메시지 정상 동작", async ({
      page,
    }) => {
      // 무엇을: 모바일에서 빈 상태 인라인 메시지 가시 + 토글 상태 유지
      // 왜: 모바일에서도 동일 UX. spec §3 M4
      await seedPregnancyWeek(page, 22);
      await seedHbStore(page, { checkedIds: ALL_HB_IDS });
      await page.goto(HB_PATH);

      const toggle = page.getByRole("switch", { name: "미체크만 보기" });
      await toggle.click();
      const emptyMsg = page.getByText("지금 보이는 항목은 모두 체크했어요");
      await expect(emptyMsg).toBeVisible();
      await expect(emptyMsg).toBeInViewport();
    });
  });
});
