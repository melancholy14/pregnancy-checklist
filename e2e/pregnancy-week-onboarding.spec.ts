import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * gtag 목업을 영구 주입한다 (페이지 네비게이션을 가로질러 유지).
 *
 * Next.js의 ConsentGatedScripts가 afterInteractive로 `function gtag(){dataLayer.push(arguments)}`
 * 를 선언해 window.gtag를 globalThis에 정의(setter 우회)한다. 따라서 spy를 직접 window.gtag에
 * 두면 덮어써진다. 대신 `dataLayer`를 미리 커스텀 push로 설치 — gtag-init이 결국 dataLayer.push를
 * 호출하므로 모든 호출이 캡처된다. gtag-init이 실행되지 않는 환경 대비로 spy gtag도 함께 둔다.
 *
 * 첫 page.goto 전에 호출해야 한다.
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

/** 오늘 + days 오프셋의 ISO 날짜 문자열 (YYYY-MM-DD) */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** 온보딩을 강제로 통과한(완료된) 상태로 만든다. dueDate는 옵션. */
async function seedOnboardingState(
  page: Page,
  options: { dueDate?: string; bannerDismissed?: boolean } = {},
) {
  await page.addInitScript((opts) => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("onboarding-completed", "true");
    if (opts.bannerDismissed) {
      localStorage.setItem("onboarding-banner-dismissed", "true");
    }
    if (opts.dueDate) {
      // useDueDateStore v1 형태로 직접 시드 (impl-impl.md 결정 사항 정합)
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const start = new Date(opts.dueDate);
      start.setDate(start.getDate() - 280);
      const diffDays = Math.floor(
        (new Date().getTime() - start.getTime()) / 86400000,
      );
      const week = Math.max(1, Math.min(40, Math.floor(diffDays / 7)));
      localStorage.setItem(
        "due-date-storage",
        JSON.stringify({
          state: {
            dueDate: opts.dueDate,
            currentPregnancyWeek: week,
            lastCalcDate: today,
            cohortJoinWeek: week,
          },
          version: 1,
        }),
      );
    }
  }, options);
}

test.describe("pregnancy-week-onboarding", () => {
  test.describe("Happy Path", () => {
    test("첫 방문자 홈 진입 → 풀스크린 온보딩 → 예정일 입력 → 홈 정보 모드", async ({
      page,
    }) => {
      // 무엇을: 첫 방문자가 풀스크린 OnboardingFlow를 거쳐 예정일을 입력하면
      //         홈 상단 카드가 peach 정보 모드("현재 N주차 · D-N")로 변환되는지
      // 왜: spec.md 시나리오 1 핵심 흐름. P3·P4의 unblock 효과를 검증하는 정합 경로
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
      });
      await setupGtagSpy(page);
      await page.goto("/");

      await page.getByRole("button", { name: "온보딩 시작하기" }).click();

      const dueDate = dateOffset(100);
      await page.getByLabel("출산 예정일 선택").fill(dueDate);
      await page.getByRole("button", { name: "다음 단계로 이동" }).click();

      await page.getByRole("button", { name: "체크리스트 보러가기" }).click();
      await page.waitForURL(/\/timeline/);

      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: /현재 \d+주차/ }),
      ).toBeVisible();
      await expect(page.getByText(`출산 예정일: ${dueDate}`)).toBeVisible();
    });

    test("미입력 상태 둘러보기: 홈 lavender 입력 카드 노출", async ({ page }) => {
      // 무엇을: onboarding-completed=true + dueDate=null 상태에서 홈 진입 시
      //         lavender 입력 모드 카드가 노출되는지
      // 왜: spec.md 시나리오 3. 미입력자 둘러보기 결정 위에 입력 카드가 정상 노출되어야 함
      await seedOnboardingState(page);
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "예정일을 알려주세요" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "예정일 저장" })).toBeVisible();
    });

    test("입력 후 재방문: 정보 모드 카드 + 수정 → 입력 모드 전환", async ({
      page,
    }) => {
      // 무엇을: dueDate가 저장된 사용자가 홈에 진입하면 peach 정보 모드 카드가 보이고,
      //         "수정" 버튼 클릭 시 입력 모드로 전환되는지
      // 왜: spec.md 시나리오 4·5. 정보 ↔ 입력 모드 전환은 핵심 인터랙션
      const dueDate = dateOffset(100);
      await seedOnboardingState(page, { dueDate });
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: /현재 \d+주차/ }),
      ).toBeVisible();
      await page.getByRole("button", { name: "예정일 수정" }).click();

      await expect(
        page.getByRole("heading", { name: "예정일을 알려주세요" }),
      ).toBeVisible();
    });

    test("SEO 직진자(/articles/*)에 슬림 배너 노출 + 클릭 시 /로 이동", async ({
      page,
    }) => {
      // 무엇을: 온보딩 미완 사용자가 /articles/<slug>에 직진하면 슬림 배너가 노출되고,
      //         배너 본체 클릭 시 / 로 이동하는지
      // 왜: spec.md 시나리오 2. 슬림 배너가 SEO 유입자에게 도구 존재를 알리는 핵심 진입점
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
      });
      await setupGtagSpy(page);

      await page.goto("/articles/pregnancy-foods-to-avoid");

      const banner = page.getByRole("link", {
        name: /예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요/,
      });
      await expect(banner).toBeVisible();

      await banner.click();
      await page.waitForURL(/\/$/);
    });
  });

  test.describe("Error / Validation", () => {
    test("과거 날짜 입력 시 토스트 노출 + store 미저장", async ({ page }) => {
      // 무엇을: 입력 모드에서 과거 날짜를 입력 후 저장 시 sonner 에러 토스트가 노출되고
      //         localStorage의 dueDate는 null로 유지되는지
      // 왜: spec.md §4 "잘못된 dueDate 입력" 케이스. 잘못된 값이 저장되면 GA4 보고서가 오염됨
      await seedOnboardingState(page);
      await page.goto("/");

      await page.getByLabel("출산 예정일 선택").fill(dateOffset(-30));
      await page.getByRole("button", { name: "예정일 저장" }).click();

      await expect(
        page.getByText("출산 예정일을 다시 확인해주세요"),
      ).toBeVisible();

      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem("due-date-storage");
        return raw ? (JSON.parse(raw).state?.dueDate ?? null) : null;
      });
      expect(stored).toBeNull();
    });

    test("40주 이상 미래 날짜 입력 시 토스트 노출", async ({ page }) => {
      // 무엇을: 40주(280일) 이상 미래 날짜 입력 시도가 거부되는지
      // 왜: 임신 주차 0~42 범위 외는 의학적으로 의미 없음. spec.md §4 정합
      await seedOnboardingState(page);
      await page.goto("/");

      await page.getByLabel("출산 예정일 선택").fill(dateOffset(400));
      await page.getByRole("button", { name: "예정일 저장" }).click();

      await expect(
        page.getByText("출산 예정일을 다시 확인해주세요"),
      ).toBeVisible();
    });

    test("슬림 배너 닫기 시 localStorage 저장 + 새로고침 후 미노출", async ({
      page,
    }) => {
      // 무엇을: 슬림 배너 X 버튼 클릭 시 onboarding-banner-dismissed=true 저장되고
      //         새로고침 후에도 배너가 노출되지 않는지
      // 왜: spec.md 시나리오 2 닫기 동작. 영구 dismiss 보장
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
      });
      await setupGtagSpy(page);
      await page.goto("/articles/pregnancy-foods-to-avoid");

      const banner = page.getByRole("link", {
        name: /예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요/,
      });
      await expect(banner).toBeVisible();

      await page.getByRole("button", { name: "배너 닫기" }).click();

      // dismiss GA 이벤트는 클릭 시점에 동기 발사. 즉시 확인.
      const dismissCalls = (await getGtagCalls(page)).filter(
        (c) => c[0] === "event" && c[1] === "onboarding_banner_dismiss",
      );
      expect(dismissCalls.length).toBeGreaterThanOrEqual(1);

      // setItem은 250ms 페이드아웃 후 호출되므로 폴링으로 대기
      await expect
        .poll(
          async () =>
            page.evaluate(() => localStorage.getItem("onboarding-banner-dismissed")),
        )
        .toBe("true");

      await page.reload();
      await expect(banner).toHaveCount(0);
    });
  });

  test.describe("권한 / 인증 (localStorage 기반)", () => {
    test("온보딩 완료자에게는 슬림 배너 미노출", async ({ page }) => {
      // 무엇을: localStorage('onboarding-completed')=true 사용자가 /articles/* 진입 시
      //         슬림 배너가 노출되지 않는지
      // 왜: spec.md 시나리오 4. 온보딩 완료자는 도구 존재를 이미 알고 있으므로 재노출 X
      await seedOnboardingState(page);
      await page.goto("/articles/pregnancy-foods-to-avoid");

      await expect(
        page.getByRole("link", {
          name: /예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요/,
        }),
      ).toHaveCount(0);
    });

    test("온보딩 미완 + 배너 dismissed 사용자에게는 배너 미노출", async ({
      page,
    }) => {
      // 무엇을: 슬림 배너를 한번 닫은 사용자가 다른 페이지 진입 시 배너가 다시 보이지 않는지
      // 왜: design.md §3.6 상태 매트릭스 "onboarding 미완 + 배너 dismissed" 행
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
        localStorage.setItem("onboarding-banner-dismissed", "true");
      });

      await page.goto("/timeline");
      await expect(
        page.getByRole("link", {
          name: /예정일을 입력하면 주차별로 정렬된 체크리스트를 볼 수 있어요/,
        }),
      ).toHaveCount(0);
    });

    test("PageviewTracker가 매 페이지뷰에 user_properties 3종을 set한다", async ({
      page,
    }) => {
      // 무엇을: dueDate 입력 사용자가 라우팅 시 매 page_view 직전 due_date_set,
      //         current_pregnancy_week, cohort_join_week 3종이 user_properties로 set되는지
      // 왜: ga4.md §3 핵심 측정 정합. 코호트 리텐션 분석의 baseline
      const dueDate = dateOffset(100);
      await seedOnboardingState(page, { dueDate });
      await setupGtagSpy(page);

      await page.goto("/info");

      // PageviewTracker의 useEffect가 실행되어 set 호출이 들어갈 때까지 폴링
      await expect
        .poll(async () => {
          const calls = await getGtagCalls(page);
          return calls.some(
            (c) =>
              c[0] === "set" &&
              c[1] === "user_properties" &&
              (c[2] as Record<string, unknown>).due_date_set === true,
          );
        })
        .toBe(true);

      const calls = await getGtagCalls(page);
      const setCall = calls.find(
        (c) =>
          c[0] === "set" &&
          c[1] === "user_properties" &&
          (c[2] as Record<string, unknown>).due_date_set === true,
      );
      const props = setCall![2] as Record<string, unknown>;
      expect(typeof props.current_pregnancy_week).toBe("number");
      expect(typeof props.cohort_join_week).toBe("number");
    });

    test("미입력자에게는 current_pregnancy_week가 set되지 않는다", async ({
      page,
    }) => {
      // 무엇을: dueDate=null 사용자의 user_properties에 current_pregnancy_week 키가
      //         포함되지 않는지(undefined로 set 생략)
      // 왜: ga4.md §3.2. PII 안전 + GA4 보고서에 "값 없음" 세그먼트로 자연 분류
      await seedOnboardingState(page);
      await setupGtagSpy(page);

      await page.goto("/info");

      await expect
        .poll(async () => {
          const calls = await getGtagCalls(page);
          return calls.some(
            (c) => c[0] === "set" && c[1] === "user_properties",
          );
        })
        .toBe(true);

      const calls = await getGtagCalls(page);
      const setCalls = calls.filter(
        (c) => c[0] === "set" && c[1] === "user_properties",
      );
      const lastProps = setCalls[setCalls.length - 1][2] as Record<
        string,
        unknown
      >;
      expect(lastProps.due_date_set).toBe(false);
      expect(lastProps.current_pregnancy_week).toBeUndefined();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 홈 lavender 입력 카드 노출 + 저장 버튼 풀너비", async ({
      page,
    }) => {
      // 무엇을: 375px 모바일에서 홈 입력 모드 카드가 정상 노출되고
      //         저장 버튼이 풀너비로 보이는지
      // 왜: design.md §5.3 모바일 320px 검증의 375px 버전. 주요 타겟 유저 모바일 사용 가정
      await seedOnboardingState(page);
      await page.goto("/");

      await expect(
        page.getByRole("heading", { name: "예정일을 알려주세요" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "예정일 저장" })).toBeVisible();
    });

    test("모바일: 슬림 배너 X 버튼 hit area 44px 이상", async ({ page }) => {
      // 무엇을: 모바일에서 배너 X 버튼이 44×44 이상의 hit area를 가지는지
      // 왜: design.md §3.1 + WCAG 2.5.5 Target Size. 손가락 탭 정확도
      await page.addInitScript(() => {
        localStorage.setItem("cookie-consent", "accepted");
      });
      await page.goto("/articles/pregnancy-foods-to-avoid");

      const closeButton = page.getByRole("button", { name: "배너 닫기" });
      await expect(closeButton).toBeVisible();
      const box = await closeButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  });
});
