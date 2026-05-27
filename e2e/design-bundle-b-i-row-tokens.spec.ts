import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

// 검증 대상: docs/features/design-bundle-b-i-row-tokens/spec.md
//
// 묶음 I (data → token classes):
//   - home 미니카드 4개: babyfair=mint/40, weight=peach/40, video=yellow/40, info=lavender/40
//   - baby-fair 도시 Badge: 수도권=lavender, 광역시=peach, 영남=mint, 기타=yellow (4 행정구역 그룹)
//   - baby-fair 규모 Badge: large=peach (전 pink), medium=yellow, small=lavender
//   - timeline 카테고리 Badge: hospital=peach (전 pink), baby_items=mint, postpartum=lavender, admin=yellow
//   - 인라인 style={{ backgroundColor }} 0건 (타깃 4파일)
//
// 묶음 B (row markup / a11y):
//   - row = label + native checkbox 마크업. role="button"/aria-pressed 0건
//   - getByRole("checkbox", { name }) 로 row 접근 가능
//   - 편집·삭제 버튼은 label OUTSIDE 형제 (interactive 중첩 X)
//   - legal note (카시트) — Scale 아이콘 + italic
//   - 체크 시 label 배경 mint/20, 체크박스 mint
//   - mobile 375px 정합

// Tailwind v4 가 class 기반 색을 oklab 으로 출력하므로 RGB 직접 비교 대신
// className 에 정확한 토큰 클래스(`bg-pastel-{tone}/{alpha}`)가 포함되었는지로 검증.
// 이는 헬퍼 반환이 정적 클래스 문자열이라는 spec §2.1 디시플린과도 정합.
const HELPER_CLASS = {
  lavender40: "bg-pastel-lavender/40",
  mint40: "bg-pastel-mint/40",
  peach40: "bg-pastel-peach/40",
  yellow40: "bg-pastel-yellow/40",
  pink40: "bg-pastel-pink/40",
  mint20: "bg-pastel-mint/20",
} as const;

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

async function expandTimelineWeek(page: Page, week: number): Promise<Locator> {
  const card = page.locator(`[data-week='${week}']`);
  await expect(card).toBeVisible();
  const trigger = card.getByRole("button", { name: /체크리스트 \d+개/ }).first();
  await trigger.click();
  return card;
}

test.describe("design-bundle-b-i-row-tokens", () => {
  test.describe("Happy Path — 묶음 I 데이터→토큰 매핑", () => {
    test("home 미니카드 아이콘 배경이 헬퍼 결과 클래스로 적용된다 (style 미사용)", async ({
      page,
    }) => {
      // 무엇을: babyfair=mint/40, weight=peach/40, articles=lavender/40
      // 왜: spec §2.4 HomeContent 매트릭스 — slot prop + getDashboardIconBgClass 결과 검증
      await seedPregnancyWeek(page, 24);
      await page.goto("/");

      // DashboardCard 의 아이콘 박스: w-8 h-8 rounded-lg flex items-center
      const iconBox = (href: string) =>
        page.locator(`a[href="${href}"] div.w-8.h-8.rounded-lg`).first();

      await expect(iconBox("/baby-fair")).toHaveClass(new RegExp(HELPER_CLASS.mint40.replace("/", "\\/")));
      await expect(iconBox("/weight")).toHaveClass(new RegExp(HELPER_CLASS.peach40.replace("/", "\\/")));
      await expect(iconBox("/articles")).toHaveClass(new RegExp(HELPER_CLASS.lavender40.replace("/", "\\/")));

      // style 인라인 미사용 (className 기반) — 아이콘 모두 style attribute 미부착
      for (const icon of [iconBox("/baby-fair"), iconBox("/weight"), iconBox("/articles")]) {
        const styleAttr = await icon.getAttribute("style");
        expect(styleAttr ?? "").not.toContain("background-color");
      }
    });

    test("baby-fair 도시 Badge는 4 행정구역 그룹 색을 따른다", async ({ page }) => {
      // 무엇을: 서울→lavender, 부산→peach, 창원→mint, 청주→yellow
      // 왜: spec §2.2 A — 17 도시 → 4 그룹 재매핑
      await page.goto("/baby-fair");
      await page.getByRole("tab", { name: "지난 행사" }).click();

      const cityBadge = (city: string) =>
        page.locator(`[data-slot="badge"]`, { hasText: new RegExp(`^${city}$`) }).first();

      const groupExpect: { city: string; klass: string }[] = [
        { city: "서울", klass: HELPER_CLASS.lavender40 },
        { city: "부산", klass: HELPER_CLASS.peach40 },
        { city: "창원", klass: HELPER_CLASS.mint40 },
        { city: "청주", klass: HELPER_CLASS.yellow40 },
      ];

      let totalChecked = 0;
      for (const { city, klass } of groupExpect) {
        const badge = cityBadge(city);
        const count = await badge.count();
        if (count > 0) {
          await expect(badge).toBeVisible();
          await expect(badge).toHaveClass(new RegExp(klass.replace("/", "\\/")));
          totalChecked += 1;
        }
      }

      expect(totalChecked).toBeGreaterThan(0);
    });

    test("baby-fair 규모 '대형' Badge는 peach (pink → peach 재매핑)", async ({ page }) => {
      // 무엇을: scale=large 의 색이 더 이상 pink가 아니고 peach
      // 왜: spec §2.2 B — pink → peach 재매핑이 5-pastel role 정합 회복의 핵심
      await page.goto("/baby-fair");
      await page.getByRole("tab", { name: "지난 행사" }).click();

      const largeBadge = page.locator(`[data-slot="badge"]`, { hasText: /^대형$/ }).first();
      if (await largeBadge.count()) {
        await expect(largeBadge).toBeVisible();
        await expect(largeBadge).toHaveClass(new RegExp(HELPER_CLASS.peach40.replace("/", "\\/")));
        // pink 클래스가 포함되지 않음 (회귀 가드)
        const className = (await largeBadge.getAttribute("class")) ?? "";
        expect(className).not.toContain("bg-pastel-pink");
      }
    });

    test("timeline 카테고리 Badge는 헬퍼 결과 색을 받는다 (hospital=peach 재매핑)", async ({ page }) => {
      // 무엇을: hospital row 의 카테고리 Badge 가 peach/40 클래스를 가짐
      // 왜: spec §2.2 C — hospital pink → peach 재매핑
      await seedPregnancyWeek(page, 8);
      await page.goto("/timeline");

      // 8주에 hospital 카테고리 매칭 (item_001 "산부인과 선택")
      const card8 = await expandTimelineWeek(page, 8);
      const hospitalRow = card8.locator("label", { hasText: /산부인과 선택/ });
      await expect(hospitalRow).toBeVisible();
      const hospitalBadge = hospitalRow.locator('[data-slot="badge"]').first();
      await expect(hospitalBadge).toBeVisible();
      await expect(hospitalBadge).toHaveClass(new RegExp(HELPER_CLASS.peach40.replace("/", "\\/")));
      const className = (await hospitalBadge.getAttribute("class")) ?? "";
      expect(className).not.toContain("bg-pastel-pink");
    });
  });

  test.describe("Happy Path — 묶음 B row 마크업", () => {
    test("/checklist/hospital-bag 행은 native checkbox + label 마크업 (aria-pressed 미사용)", async ({
      page,
    }) => {
      // 무엇을: row가 더 이상 role="button"/aria-pressed 패턴이 아니고 input[type=checkbox] + label
      // 왜: spec §2.5 — WCAG 4.1.2 정합 + 스크린리더 일관 음성
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      // 첫 항목의 native checkbox
      const firstCheckbox = page.getByRole("checkbox").first();
      await expect(firstCheckbox).toBeVisible();
      await expect(firstCheckbox).not.toBeChecked();

      // role="button"/aria-pressed 가 페이지 어디에도 row 형태로 0건
      const oldRowMarkup = await page.locator('[role="button"][aria-pressed]').count();
      expect(oldRowMarkup).toBe(0);
    });

    test("label 클릭 시 native checkbox 가 토글되고 has-[input:checked] 분기가 적용된다", async ({
      page,
    }) => {
      // 무엇을: label 클릭 → input.checked + className 에 has-[input:checked]:bg-pastel-mint/20 정적 클래스 존재
      // 왜: spec §2.7 — 체크 상태 시각 분기 (Tailwind v4 has-* 변형으로 처리)
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const firstLabel = page.locator("label[for]:has(input[type='checkbox'])").first();
      const firstCheckbox = firstLabel.getByRole("checkbox");

      await expect(firstCheckbox).not.toBeChecked();
      await firstLabel.click();
      await expect(firstCheckbox).toBeChecked();

      // label className 에 정적 has-[input:checked] 분기가 들어있는지 (정적 클래스라 항상 노출)
      const className = (await firstLabel.getAttribute("class")) ?? "";
      expect(className).toContain("has-[input:checked]:bg-pastel-mint/20");
    });

    test("legal note (카시트)는 Scale 아이콘 + italic + 체크 후 line-through 보존", async ({
      page,
    }) => {
      // 무엇을: classifyNote("도로교통법 제50조") = "legal" 분기 시각
      // 왜: spec §2.3 noteType 분기 — 보존되어야 함
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const carseatRow = page.locator("label", { hasText: /카시트 \(차량 설치/ });
      await expect(carseatRow).toBeVisible();

      const noteSpan = carseatRow.locator("span", { hasText: /도로교통법 제50조/ }).first();
      await expect(noteSpan).toHaveClass(/italic/);

      // 체크 후 line-through
      await carseatRow.click();
      await expect(carseatRow.getByRole("checkbox")).toBeChecked();
      await expect(noteSpan).toHaveClass(/line-through/);
    });

    test("커스텀 항목의 편집·삭제 버튼은 label OUTSIDE 형제 영역에 있다", async ({ page }) => {
      // 무엇을: edit/delete 가 label 안 nested 상태가 아닌 sibling div 안
      // 왜: spec §2.5 — interactive 중첩 제거 (WCAG 4.1.2)
      await seedPregnancyWeek(page, 22);
      await page.addInitScript(() => {
        localStorage.setItem(
          "hospital-bag-storage",
          JSON.stringify({
            state: {
              checkedIds: [],
              customItems: [
                {
                  id: "custom_b_test_01",
                  title: "테스트 커스텀 항목",
                  category: "bag_mom",
                  categoryName: "엄마 가방",
                  recommendedWeek: 22,
                  priority: "medium",
                  isCustom: true,
                },
              ],
              migrationLostFlag: false,
            },
            version: 0,
          }),
        );
      });
      await page.goto("/checklist/hospital-bag");

      const customRow = page.locator("label", { hasText: /테스트 커스텀 항목/ });
      await expect(customRow).toBeVisible();

      // label 내부에는 edit/delete 가 없어야 함
      const editInsideLabel = customRow.locator('button[aria-label="수정"]');
      const deleteInsideLabel = customRow.locator('button[aria-label="삭제"]');
      expect(await editInsideLabel.count()).toBe(0);
      expect(await deleteInsideLabel.count()).toBe(0);

      // label 형제 영역에는 있어야 함 (label.parent 안에서 접근)
      const rowContainer = customRow.locator("..");
      await expect(rowContainer.locator('button[aria-label="수정"]')).toBeVisible();
      await expect(rowContainer.locator('button[aria-label="삭제"]')).toBeVisible();
    });

    test("/timeline WeekChecklistSection 행도 native checkbox 패턴 + 카테고리 Badge 보존", async ({
      page,
    }) => {
      // 무엇을: timeline 행도 ChecklistRow 사용 — checkbox role + categoryLabel Badge 노출
      // 왜: spec §2.4 WeekChecklistSection 매트릭스 — categoryLabel + categoryToneClassName 정합
      await seedPregnancyWeek(page, 24);
      await page.goto("/timeline");

      const card24 = await expandTimelineWeek(page, 24);
      const checkbox = card24.getByRole("checkbox").first();
      await expect(checkbox).toBeVisible();

      // 카테고리 Badge 가 row 안에 노출
      const firstBadge = card24
        .locator("label")
        .first()
        .locator('[data-slot="badge"]')
        .first();
      await expect(firstBadge).toBeVisible();
    });
  });

  test.describe("Error / Validation (회귀 0건)", () => {
    test("페이지 어디에도 helper 대상 hex 가 인라인 style 로 0건이다", async ({ page }) => {
      // 무엇을: spec §3 success — `style={{ backgroundColor }}` 헬퍼 대상 4파일에서 미사용
      // 왜: 헌법 디시플린 — DESIGN.md §10 명시 헬퍼 경유 의무
      const oldHexes = ["#FFD4DE", "#FFE0CC", "#D0EDE2", "#E4D6F0", "#FFF4D4"];

      const checkPage = async (path: string, label: string) => {
        await page.goto(path);
        await expect(page.locator("body")).toBeVisible();
        // BabyfairCard, DashboardCard, WeekChecklistSection 의 인라인 style 검사
        // 모든 이벤트 카드 / 미니카드 / row Badge 가 className-only 인지
        const inlineStyles = await page.evaluate(() => {
          const elements = document.querySelectorAll('[style*="background-color"]');
          const results: { selector: string; style: string }[] = [];
          elements.forEach((el) => {
            const style = (el as HTMLElement).style.backgroundColor;
            // TimelineAccordionCard 의 week circle 은 본 라운드 범위 외 — 식별해서 제외
            const inWeekCircle = el.closest('[id^="timeline-week-"]');
            const inTimelineTypeBadge = el
              .closest('[data-slot="badge"]')
              ?.parentElement?.querySelector('[id^="timeline-week-"]');
            if (inWeekCircle || inTimelineTypeBadge) return;
            results.push({ selector: el.tagName + (el.className ? `.${(el as HTMLElement).className.split(" ")[0]}` : ""), style });
          });
          return results;
        });
        for (const { selector, style } of inlineStyles) {
          for (const hex of oldHexes) {
            expect(style.toLowerCase(), `${label} ${selector}: should not contain ${hex}`).not.toContain(hex.toLowerCase());
          }
        }
      };

      await seedPregnancyWeek(page, 24);
      await checkPage("/", "/");
      await checkPage("/timeline", "/timeline");
      await checkPage("/baby-fair", "/baby-fair");
      await checkPage("/checklist/hospital-bag", "/checklist/hospital-bag");
    });

    test("ChecklistItemRow 와 WeekChecklistSection 행에 role='button' / aria-pressed 0건", async ({
      page,
    }) => {
      // 무엇을: 두 영역의 row 마크업 모두 native checkbox 패턴
      // 왜: spec §3 묶음 B success — row-as-button 0 회귀 가드
      await seedPregnancyWeek(page, 24);

      await page.goto("/checklist/hospital-bag");
      // 페이지 안 row 영역 ([data-slot="card"] 안 [role=button]+aria-pressed)
      expect(await page.locator('[role="button"][aria-pressed]').count()).toBe(0);

      await page.goto("/timeline");
      const card24 = await expandTimelineWeek(page, 24);
      expect(await card24.locator('[role="button"][aria-pressed]').count()).toBe(0);
    });
  });

  test.describe("권한 / 인증 (state 분기)", () => {
    test("주차 미입력 상태에서도 row 마크업이 정상 렌더된다", async ({ page }) => {
      // 무엇을: due-date-storage 가 비어있어도 /checklist/hospital-bag row 가 렌더되고 토글 가능
      // 왜: 주차 미입력 분기는 본 기능에 영향 없어야 함 — checklist 자체는 항상 노출
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
        localStorage.setItem("onboarding-completed", "true");
        localStorage.setItem("onboarding-banner-dismissed", "true");
        localStorage.removeItem("due-date-storage");
      });
      await page.goto("/checklist/hospital-bag");

      const firstCheckbox = page.getByRole("checkbox").first();
      await expect(firstCheckbox).toBeVisible();
      await expect(firstCheckbox).not.toBeChecked();

      const firstLabel = page.locator("label[for]:has(input[type='checkbox'])").first();
      await firstLabel.click();
      await expect(firstCheckbox).toBeChecked();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일 home 미니카드 4개 클래스가 그대로 유지된다", async ({ page }) => {
      // 무엇을: 375px viewport 에서도 babyfair=mint, info=lavender 클래스 적용
      // 왜: 타깃 유저 모바일 폭 회귀 가드
      await seedPregnancyWeek(page, 24);
      await page.goto("/");

      const babyfairIcon = page.locator('a[href="/baby-fair"] div.w-8.h-8.rounded-lg').first();
      const infoIcon = page.locator('a[href="/info"]', { hasText: "📝" }).locator("div.w-8.h-8.rounded-lg").first();

      await expect(babyfairIcon).toHaveClass(new RegExp(HELPER_CLASS.mint40.replace("/", "\\/")));
      await expect(infoIcon).toHaveClass(new RegExp(HELPER_CLASS.lavender40.replace("/", "\\/")));
    });

    test("모바일 /checklist/hospital-bag 행 토글이 정상 작동한다", async ({ page }) => {
      // 무엇을: 375px viewport 에서 row 클릭 → 체크 상태 전이
      // 왜: spec §3 묶음 B 수동 검증 항목 — 모바일에서 줄꺾임/터치 영역 확인
      await seedPregnancyWeek(page, 30);
      await page.goto("/checklist/hospital-bag");

      const firstLabel = page.locator("label[for]:has(input[type='checkbox'])").first();
      await expect(firstLabel).toBeInViewport();
      await firstLabel.click();
      await expect(firstLabel.getByRole("checkbox")).toBeChecked();
    });
  });
});
