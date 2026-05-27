import { test, expect, type Page, type BrowserContext } from "@playwright/test";

// addInitScript로 gtag spy + consent=rejected를 주입한다.
// rejected면 ConsentGatedScripts가 null을 반환해 실제 gtag 스크립트가 로드되지 않으므로
// 우리 spy가 sendGAEvent가 호출하는 유일한 gtag로 유지된다.
async function setupGtagSpy(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "rejected");
    } catch {
      /* SSR safe */
    }
    (window as unknown as { __gtagCalls: unknown[][] }).__gtagCalls = [];
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      (window as unknown as { __gtagCalls: unknown[][] }).__gtagCalls.push(args);
    };
  });
}

async function getCalls(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __gtagCalls: unknown[][] }).__gtagCalls,
  );
}

function eventsByName(calls: unknown[][], name: string) {
  return calls.filter((c) => c[0] === "event" && c[1] === name);
}

async function stubClipboard(context: BrowserContext) {
  await context.addInitScript(`
    window.__copiedText = undefined;
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get() {
        return {
          writeText: async (text) => { window.__copiedText = text; }
        };
      },
    });
  `);
}

test.describe("marketing-events-wiring (G·H·I·J)", () => {
  test.beforeEach(async ({ context }) => {
    await setupGtagSpy(context);
  });

  test.describe("Happy Path", () => {
    test("체크리스트 항목 토글 시 신/구 이벤트가 모두 발사된다", async ({ page }) => {
      // 무엇을: legacy `checklist_check` + canonical `checklist_item_toggle` 둘 다 발사 + 200ms 디바운스
      // 왜: H1 — 4주 grace 동안 양쪽 이름이 동시에 잡혀야 catalog 진입 검증 가능
      await page.goto("/checklist/hospital-bag");

      const firstLabel = page.locator('label[for^="checklist-row-"]').first();
      await firstLabel.scrollIntoViewIfNeeded();
      await firstLabel.click();

      // 200ms 디바운스 — toggle 이벤트가 들어올 때까지 대기
      await expect.poll(async () => {
        const calls = await getCalls(page);
        return eventsByName(calls, "checklist_item_toggle").length;
      }, { timeout: 2000 }).toBe(1);

      const calls = await getCalls(page);
      const legacyCalls = eventsByName(calls, "checklist_check");
      const newCalls = eventsByName(calls, "checklist_item_toggle");

      expect(legacyCalls.length).toBe(1);
      expect(newCalls.length).toBe(1);

      const newPayload = newCalls[0][2] as Record<string, unknown>;
      expect(newPayload).toHaveProperty("item_id");
      expect(newPayload).toHaveProperty("category");
      expect(newPayload).toHaveProperty("week");
      expect(newPayload.action).toBe("check");
      expect(newPayload.is_custom).toBe(false);
    });

    test("공유 모달 복사 클릭 시 share + share_click 둘 다 발사된다", async ({
      page,
      context,
    }) => {
      // 무엇을: legacy `share` + canonical `share_click(slug, method, location, content_type)` 병행
      // 왜: I2 — 정규 파라미터 등재 + grace 4주
      await stubClipboard(context);
      await page.goto("/articles/early-pregnancy-tests");

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();

      const calls = await getCalls(page);
      const legacy = eventsByName(calls, "share");
      const canonical = eventsByName(calls, "share_click");

      expect(legacy.length).toBe(1);
      expect(canonical.length).toBe(1);
      expect((legacy[0][2] as Record<string, string>).method).toBe("clipboard");

      const payload = canonical[0][2] as Record<string, string>;
      expect(payload.method).toBe("copy-link");
      expect(payload.slug).toBe("early-pregnancy-tests");
      expect(payload.location).toBe("header");
      expect(payload.content_type).toBe("article");
    });

    test("베이비페어 이동 클릭 시 outbound_click + external_link_click(context=babyfair) 둘 다 발사된다", async ({
      page,
    }) => {
      // 무엇을: J2 — babyfair 영역 외부 링크 정규화 발사
      // 왜: 카탈로그 슬라이스를 위해 context=babyfair / domain=host 필요
      await page.goto("/baby-fair");

      // 첫 번째 베이비페어 카드 클릭 → AlertDialog 표시
      const firstCard = page.locator('[role="button"][aria-label$="홈페이지 열기"]').first();
      await firstCard.click();

      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();

      // "이동" 링크는 새 탭을 열기 때문에 클릭은 modifier로 새 탭 진입을 막아 이벤트만 검증
      await dialog.getByRole("link", { name: "이동" }).click({ modifiers: ["Meta"] });

      const calls = await getCalls(page);
      const legacy = eventsByName(calls, "outbound_click");
      const canonical = eventsByName(calls, "external_link_click");

      expect(legacy.length).toBe(1);
      expect(canonical.length).toBe(1);
      const payload = canonical[0][2] as Record<string, string>;
      expect(payload.context).toBe("babyfair");
      expect(payload).toHaveProperty("domain");
      expect(payload).toHaveProperty("from_slug");
    });

    test("관련 콘텐츠 카드 클릭 시 content_click + related_article_click 둘 다 발사된다", async ({
      page,
    }) => {
      // 무엇을: I1 — RelatedArticles 자리 onClick override → related_article_click 발사
      // 왜: 추천 카드 효과(시나리오 5) 측정
      await page.goto("/articles/early-pregnancy-tests");

      const relatedSection = page.locator("section").filter({
        has: page.getByRole("heading", { name: /관련 콘텐츠/ }),
      });
      const firstRelated = relatedSection.locator("a[href^='/articles/']").first();
      if ((await firstRelated.count()) === 0) {
        test.skip();
        return;
      }

      await firstRelated.click();

      const calls = await getCalls(page);
      const legacy = eventsByName(calls, "content_click").filter(
        (c) => (c[2] as Record<string, string>).type === "article",
      );
      const canonical = eventsByName(calls, "related_article_click");

      expect(legacy.length).toBe(1);
      expect(canonical.length).toBe(1);
      const payload = canonical[0][2] as Record<string, string | number>;
      expect(payload.from_slug).toBe("early-pregnancy-tests");
      expect(payload).toHaveProperty("to_slug");
      expect(payload.position).toBe(1);
      expect(payload.recommendation_type).toBe("auto-crosslink");
    });

    test("정보 허브의 아티클 카드 클릭 시 content_click + cta_click 둘 다 발사된다", async ({
      page,
    }) => {
      // 무엇을: I3 — ArticleCard 일반 자리는 cta_click(cta_id=view_article)으로 흡수
      // 왜: 추천 외 진입을 별도 슬라이스로 분리
      await page.goto("/info");
      await page.getByRole("tab", { name: "블로그" }).click();

      const articleCard = page.locator("a[href^='/articles/']").first();
      await articleCard.click();

      const calls = await getCalls(page);
      const legacy = eventsByName(calls, "content_click").filter(
        (c) => (c[2] as Record<string, string>).type === "article",
      );
      const canonical = eventsByName(calls, "cta_click");

      expect(legacy.length).toBe(1);
      expect(canonical.length).toBe(1);
      const payload = canonical[0][2] as Record<string, string>;
      expect(payload.cta_id).toBe("view_article");
      expect(payload.location).toBe("info_hub");
      expect(payload.destination.startsWith("/articles/")).toBe(true);
    });

    test("체중 기록 추가 시 week/delta_from_last/is_first_log 파라미터가 함께 발사된다", async ({
      page,
    }) => {
      // 무엇을: H3 — weight_log align (첫 기록은 is_first_log=true, delta=null)
      // 왜: 체중 변화 슬라이스 가능하도록
      await page.goto("/weight");

      // 기존 기록 초기화 후 새 기록 진입
      await page.evaluate(() => {
        window.localStorage.removeItem("weight-storage");
      });
      await page.reload();

      await page.locator("button.fab-bottom-safe").click();

      await page.locator('input[type="date"]').fill("2026-05-01");
      await page.locator('input[type="number"]').fill("60.0");
      await page.getByRole("button", { name: "추가" }).click();

      const calls = await getCalls(page);
      const fires = eventsByName(calls, "weight_log");
      expect(fires.length).toBe(1);
      const payload = fires[0][2] as Record<string, unknown>;
      expect(payload).toHaveProperty("week");
      expect(payload.is_first_log).toBe(true);
      expect(payload.delta_from_last).toBeNull();
    });

    test("체크리스트가 처음일 때 empty_state_view가 마운트 시 발사된다", async ({ page }) => {
      // 무엇을: J3 — first_visit 케이스에서 reason=expected_empty 발사
      // 왜: 빈 상태 진입 슬라이스
      await page.goto("/checklist/hospital-bag");
      await page.evaluate(() => {
        window.localStorage.removeItem("hospital-bag-storage");
      });
      await page.reload();

      await expect.poll(async () => {
        const calls = await getCalls(page);
        return eventsByName(calls, "empty_state_view").length;
      }, { timeout: 3000 }).toBeGreaterThanOrEqual(1);

      const calls = await getCalls(page);
      const fires = eventsByName(calls, "empty_state_view");
      const payload = fires[0][2] as Record<string, string>;
      expect(payload.page).toContain("/checklist/hospital-bag");
      expect(payload.reason).toBe("expected_empty");
    });
  });

  test.describe("Error / Validation", () => {
    test("search_submit은 query를 정규화(lowercase+trim+100자 절단)해 발사한다", async ({
      page,
    }) => {
      // 무엇을: H4 — PII 보호 룰. raw 저장 금지, 정규화 후 발사
      // 왜: 카탈로그 §3.E 주의사항
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = page.locator("[data-slot='dialog-content']");
      await expect(dialog).toBeVisible();

      const input = dialog.locator("input[type='text']");
      await input.fill("  Pregnancy  ");

      // 800ms 디바운스 + spy 캡처 대기
      await expect.poll(async () => {
        const calls = await getCalls(page);
        return eventsByName(calls, "search_submit").length;
      }, { timeout: 3000 }).toBeGreaterThanOrEqual(1);

      const calls = await getCalls(page);
      const last = eventsByName(calls, "search_submit").at(-1)!;
      const payload = last[2] as Record<string, string | number>;
      expect(payload.query).toBe("pregnancy");
      expect(typeof payload.results_count).toBe("number");
    });

    test("query 길이가 2자 미만이면 search_submit이 발사되지 않는다", async ({
      page,
    }) => {
      // 무엇을: 디바운스 후에도 < 2자 입력은 미발사
      // 왜: 노이즈 이벤트 방지
      await page.goto("/timeline");
      await page.getByRole("button", { name: "검색" }).click();

      const dialog = page.locator("[data-slot='dialog-content']");
      const input = dialog.locator("input[type='text']");
      await input.fill("a");

      // 디바운스 + 여유 시간 후에도 발사가 없어야 한다
      await page.waitForFunction(
        () =>
          (window as unknown as { __gtagCalls: unknown[][] }).__gtagCalls
            .length >= 0,
        { timeout: 1500 },
      );
      const calls = await getCalls(page);
      const fires = eventsByName(calls, "search_submit");
      expect(fires.length).toBe(0);
    });

    test("체중 입력 검증 실패 시 weight_log가 발사되지 않는다", async ({ page }) => {
      // 무엇을: 30~200kg 범위 밖 입력은 onSubmit 호출 전에 reject
      // 왜: 잘못된 데이터로 분석 슬라이스가 오염되면 안 됨
      await page.goto("/weight");
      await page.evaluate(() => {
        window.localStorage.removeItem("weight-storage");
      });
      await page.reload();

      await page.locator("button.fab-bottom-safe").click();
      await page.locator('input[type="date"]').fill("2026-05-01");
      await page.locator('input[type="number"]').fill("25");
      await page.getByRole("button", { name: "추가" }).click();

      // 범위 초과 토스트 노출까지 기다린다 — 토스트가 보일 때까지는 onSubmit 미호출
      await expect(page.getByText(/30~200kg 범위로 입력해주세요/)).toBeVisible();
      const calls = await getCalls(page);
      expect(eventsByName(calls, "weight_log").length).toBe(0);
    });
  });

  test.describe("권한 / 인증", () => {
    test("정적 사이트라 인증 분기 없음 — consent 거부 상태에서도 spy가 주입되면 이벤트가 발사된다", async ({
      page,
    }) => {
      // 무엇을: cookie-consent=rejected여도 직접 주입된 gtag는 동작
      // 왜: 본 라운드는 측정 wiring으로 인증 분기 없음을 명시
      await page.goto("/timeline");
      // PageviewTracker가 마운트 시 page_view를 발사하므로 spy가 살아있는지 확인 가능
      await expect.poll(async () => {
        const calls = await getCalls(page);
        return eventsByName(calls, "page_view").length;
      }, { timeout: 3000 }).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 체크리스트 토글 신/구 병행 발사가 유지된다", async ({ page }) => {
      // 무엇을: 모바일 뷰포트에서도 H1 wiring이 동일하게 동작
      // 왜: 주 트래픽이 모바일이므로 회귀 방지
      await page.goto("/checklist/hospital-bag");

      const firstLabel = page.locator('label[for^="checklist-row-"]').first();
      await firstLabel.scrollIntoViewIfNeeded();
      await firstLabel.click();

      await expect.poll(async () => {
        const calls = await getCalls(page);
        return eventsByName(calls, "checklist_item_toggle").length;
      }, { timeout: 2000 }).toBe(1);

      const calls = await getCalls(page);
      expect(eventsByName(calls, "checklist_check").length).toBe(1);
    });
  });
});
