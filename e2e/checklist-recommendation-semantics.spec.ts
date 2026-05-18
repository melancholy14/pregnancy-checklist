import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

// checklist-recommendation-semantics
// (1) 추천 매칭(P2 isHighlighted): /timeline WeekChecklistSection 내부 행에 "이번 주 추천" 마이크로 라벨
// (2) P6 시맨틱: recommendedWeek=0 항목은 매칭 제외 (신규 3종 슬러그)
// (3) P7 legal 노트 시각: /checklist/hospital-bag (카시트 행) Scale 아이콘 + italic, 체크 후 보존
// (4) GA4: recommended_item_view (페이지뷰 1회), recommended_item_check, checklist_check.note_type
// (5) 타임라인 자동 스크롤 보강: 26주차일 때 26 카드로
//
// 권한/인증 시나리오는 사이트가 public 정적 export 라 N/A. 대체로 negative 케이스를 사용한다.

/**
 * gtag 목업을 영구 주입한다 (페이지 네비게이션을 가로질러 유지).
 * pregnancy-week-onboarding.spec.ts 와 동일 패턴.
 */
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

/** 주차 미입력 상태 (cookie-consent 만 통과). */
async function seedNoWeek(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("onboarding-banner-dismissed", "true");
    localStorage.removeItem("due-date-storage");
  });
}

/**
 * 타임라인 N주 카드를 펼친다. TimelineAccordionCard 의 useState(defaultOpen) 가
 * 초기 SSR 시점의 false 를 캡처해서 hydration 후에도 닫혀 있는 동작에 대응.
 * 카드 트리거 버튼은 카드 내부의 첫 번째 button (heading 포함).
 */
async function expandTimelineWeek(page: Page, week: number): Promise<Locator> {
  const card = page.locator(`[data-week='${week}']`);
  await expect(card).toBeVisible();
  // 카드 트리거 버튼 (heading 또는 "체크리스트 N개" 텍스트 포함)
  const trigger = card.getByRole("button", { name: /체크리스트 \d+개/ }).first();
  await trigger.click();
  return card;
}

test.describe("checklist-recommendation-semantics", () => {
  test.describe("Happy Path — /timeline 매칭 노출", () => {
    test("24주차 진입 + 24주 카드 펼침 시 매칭 항목에 '이번 주 추천' 라벨이 노출된다", async ({
      page,
    }) => {
      // 무엇을: item_109("임신성 당뇨 검사 (GDM)") recommendedWeek=24 → 라벨 노출
      // 왜: P2 isHighlighted 부활의 핵심 AC. spec.md §5 첫 번째 성공 기준
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const row = card24.locator("label", { hasText: /임신성 당뇨 검사/ });
      await expect(row).toBeVisible();
      await expect(row.getByText("이번 주 추천")).toBeVisible();
    });

    test("추천 항목 ON 체크 시 라벨이 사라지고 행이 mint 시각으로 전이된다", async ({ page }) => {
      // 무엇을: 매칭 항목 1개 체크 → 라벨 제거 + bg-pastel-mint 적용
      // 왜: spec.md §2 시나리오 5 — 체크 직후 라벨 제거가 의도된 동작
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const row = card24.locator("label", { hasText: /임신성 당뇨 검사/ });
      await expect(row.getByText("이번 주 추천")).toBeVisible();

      await row.click();
      await expect(row.getByRole("checkbox")).toBeChecked();
      await expect(row.getByText("이번 주 추천")).toHaveCount(0);
    });

    test("24주차 진입 시 recommended_item_view 가 1회 발사된다 (count, week, slug)", async ({
      page,
    }) => {
      // 무엇을: 페이지뷰 당 1회, count=4, week=24, slug="main"
      // 왜: ga4.md §2 명세 — 매칭 항목 노출 분모. 발사는 카드 펼침과 무관 (마운트 시점)
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      // hydration + effect 발사까지 대기. 24주 카드 자체가 보이면 hydration 완료
      await expect(page.locator("[data-week='24']")).toBeVisible();
      // effect 가 비동기라 GA 호출이 모두 들어왔다는 보장 필요 — 폴링
      await expect
        .poll(async () => {
          const calls = await getGtagCalls(page);
          return calls.filter(
            (c) => c[0] === "event" && c[1] === "recommended_item_view",
          ).length;
        })
        .toBe(1);

      const calls = await getGtagCalls(page);
      const viewCalls = calls.filter(
        (c) => c[0] === "event" && c[1] === "recommended_item_view",
      );
      const params = viewCalls[0][2] as Record<string, unknown>;
      expect(params.count).toBe(4); // 24주 매칭 4개 (item_012/_057/_090/_109)
      expect(params.week).toBe(24);
      expect(params.slug).toBe("main");
    });

    test("추천 항목 ON 체크 시 recommended_item_check 와 checklist_check 가 동시 발사된다", async ({
      page,
    }) => {
      // 무엇을: ON 토글에서 두 이벤트 동시 발사. checklist_check 에 note_type 파라미터 포함(null)
      // 왜: ga4.md §2 — 추천 → 행동 전환 핵심 지표
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const row = card24.locator("label", { hasText: /임신성 당뇨 검사/ });
      await expect(row).toBeVisible();
      await row.click();

      const calls = await getGtagCalls(page);
      const recCheck = calls.filter(
        (c) => c[0] === "event" && c[1] === "recommended_item_check",
      );
      const stdCheck = calls.filter(
        (c) => c[0] === "event" && c[1] === "checklist_check",
      );

      expect(recCheck.length).toBe(1);
      const recParams = recCheck[0][2] as Record<string, unknown>;
      expect(recParams.item_id).toBe("item_109");
      expect(recParams.week).toBe(24);
      expect(recParams.slug).toBe("main");

      expect(stdCheck.length).toBe(1);
      const stdParams = stdCheck[0][2] as Record<string, unknown>;
      expect(stdParams.checked).toBe(true);
      expect(stdParams.note_type).toBeNull();
      expect(stdParams.slug).toBe("main");
    });
  });

  test.describe("Happy Path — legal 노트 시각 (/checklist/hospital-bag)", () => {
    test("legal 노트 항목은 노트 영역에 italic 분기 시각이 적용된다 (카시트)", async ({ page }) => {
      // 무엇을: classifyNote("도로교통법 제50조") = "legal" → italic 클래스
      // 왜: P7 legal 시각 분기 — spec.md §3 must
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const carseatRow = page.locator("label", { hasText: /카시트 \(차량 설치/ });
      await expect(carseatRow).toBeVisible();
      const note = carseatRow.locator("span", { hasText: /도로교통법 제50조/ });
      await expect(note.first()).toHaveClass(/italic/);
    });

    test("legal 노트는 체크 후에도 보존되고 line-through 가 적용된다 (M4 결정)", async ({
      page,
    }) => {
      // 무엇을: 체크 후 노트 텍스트 보존 + line-through 시각
      // 왜: M4 합의 — 노트 보존, 일관된 시각
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const carseatRow = page.locator("label", { hasText: /카시트 \(차량 설치/ });
      await carseatRow.click();
      await expect(carseatRow.getByRole("checkbox")).toBeChecked();
      await expect(page.getByText(/도로교통법 제50조/)).toBeVisible();

      const note = carseatRow.locator("span", { hasText: /도로교통법 제50조/ });
      await expect(note.first()).toHaveClass(/line-through/);
    });

    test("legal 노트 항목 체크 시 checklist_check.note_type='legal' 발사", async ({ page }) => {
      // 무엇을: note_type 파라미터가 "legal" 값으로 발사
      // 왜: ga4.md §2 note_type 분포 추적
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const carseatRow = page.locator("label", { hasText: /카시트 \(차량 설치/ });
      await carseatRow.click();

      const calls = await getGtagCalls(page);
      const stdCheck = calls.filter(
        (c) => c[0] === "event" && c[1] === "checklist_check",
      );
      expect(stdCheck.length).toBe(1);
      expect((stdCheck[0][2] as Record<string, unknown>).note_type).toBe("legal");
    });
  });

  test.describe("Error / Negative", () => {
    test("주차 미입력 상태에서는 마이크로 라벨이 0개이고 recommended_item_view 미발사", async ({
      page,
    }) => {
      // 무엇을: currentPregnancyWeek === null 가드 — view 미발사 + 라벨 0
      // 왜: spec.md §4 엣지 — "주차 미입력자: 매칭 자체 미수행"
      await setupGtagSpy(page);
      await seedNoWeek(page);
      await page.goto("/timeline");

      // 첫 timeline 카드 가시
      await expect(page.locator("[data-week]").first()).toBeVisible();
      // 미주차 입력자도 카드를 펼칠 수 있게 — 4주 카드 펼쳐도 라벨 없음
      const trigger = page
        .locator("[data-week='4']")
        .getByRole("button", { name: /체크리스트 \d+개/ })
        .first();
      if (await trigger.count()) await trigger.click();

      await expect(page.getByText("이번 주 추천")).toHaveCount(0);

      const calls = await getGtagCalls(page);
      const recView = calls.filter(
        (c) => c[0] === "event" && c[1] === "recommended_item_view",
      );
      expect(recView.length).toBe(0);
    });

    test("매칭 0건 주차 (26주차) 진입 시 라벨 0개 + recommended_item_view 미발사", async ({
      page,
    }) => {
      // 무엇을: 26주차는 데이터 분포상 매칭 0개 — count=0 이면 view 이벤트 미발사
      // 왜: 추천 가치 검증 시 noise 회피 — impl 결정 사항 정합
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 26);
      await page.goto("/timeline");

      const w26 = page.locator("[data-week='26']");
      await expect(w26).toBeVisible();
      // 26주 카드 펼쳐도 라벨 0개
      const trigger = w26.getByRole("button", { name: /체크리스트 \d+개/ }).first();
      if (await trigger.count()) await trigger.click();
      await expect(page.getByText("이번 주 추천")).toHaveCount(0);

      const calls = await getGtagCalls(page);
      const recView = calls.filter(
        (c) => c[0] === "event" && c[1] === "recommended_item_view",
      );
      expect(recView.length).toBe(0);
    });

    test("신규 3종 슬러그 (hospital-bag) 진입 시 마이크로 라벨이 0개다", async ({ page }) => {
      // 무엇을: hospital_bag 항목 전부 recommendedWeek=0 — 슬러그 자체가 컨텍스트
      // 왜: spec.md §2 시나리오 2 — P6 시맨틱(0=미정)의 시각 표면
      await seedPregnancyWeek(page, 24);
      await page.goto("/checklist/hospital-bag");

      await expect(page.getByRole("checkbox").first()).toBeVisible();
      await expect(page.getByText("이번 주 추천")).toHaveCount(0);
    });

    test("추천 항목 OFF 토글에서는 recommended_item_check 가 미발사된다", async ({ page }) => {
      // 무엇을: 체크 → 체크 해제 시 두 번째 토글에서 추천 이벤트 미발사 (OFF 가드)
      // 왜: ga4.md §2 — "체크 OFF(체크 해제)에서는 미발사"
      await setupGtagSpy(page);
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const row = card24.locator("label", { hasText: /임신성 당뇨 검사/ });
      await expect(row).toBeVisible();
      const checkbox = row.getByRole("checkbox");
      await row.click(); // ON
      await expect(checkbox).toBeChecked();
      await row.click(); // OFF
      await expect(checkbox).not.toBeChecked();

      const calls = await getGtagCalls(page);
      const recCheck = calls.filter(
        (c) => c[0] === "event" && c[1] === "recommended_item_check",
      );
      expect(recCheck.length).toBe(1);

      const stdCheck = calls.filter(
        (c) => c[0] === "event" && c[1] === "checklist_check",
      );
      expect(stdCheck.length).toBe(2);
      expect((stdCheck[1][2] as Record<string, unknown>).checked).toBe(false);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일 375px /timeline 에서도 마이크로 라벨이 노출된다", async ({ page }) => {
      // 무엇을: 모바일 viewport 에서 라벨 노출 + 행 깨짐 없음
      // 왜: spec.md §5 — 모바일 320~375px 차분한 행
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const row = card24.locator("label", { hasText: /임신성 당뇨 검사/ });
      await expect(row).toBeVisible();
      await expect(row.getByText("이번 주 추천")).toBeVisible();
    });

    test("모바일에서 26주차 → 타임라인 진입 시 26주차 카드로 자동 스크롤된다", async ({
      page,
    }) => {
      // 무엇을: TimelineContainer 자동 스크롤 정확 매칭 보강 — 26주차일 때 25 가 아닌 26
      // 왜: 본 PR 묶음에 포함된 별도 버그 수정의 회귀 방지
      await seedPregnancyWeek(page, 26);
      await page.goto("/timeline");

      const w26 = page.locator("[data-week='26']");
      await expect(w26).toBeVisible();
      await expect(w26).toBeInViewport({ ratio: 0.3 });
    });
  });
});
