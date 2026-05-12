import { test, expect, type BrowserContext } from "@playwright/test";

// 검증 대상: docs/features/design-bundle-j-share-button-position/spec.md
// 핵심: ShareButton이 GA4로 발사하는 `share_click` 이벤트에 `position` 파라미터가
//       올바르게 동봉되는지 검증한다 (`top_right` | `bottom_center`).
//       4개 호출부 — ArticleDetail 우상단/중앙하단, TimelineContainer 우상단, ChecklistPage 우상단.
//       위치 변경 0(M3) — 본 라운드는 measurement 파라미터 추가만.

const ARTICLE_PATH = "/articles/early-pregnancy-tests";
const TIMELINE_PATH = "/timeline";
const CHECKLIST_PATH = "/checklist/hospital-bag";

interface CapturedEvent {
  name: string;
  params: Record<string, unknown>;
}

declare global {
  interface Window {
    dataLayer?: IArguments[];
    __copiedText?: string;
    __sharedData?: ShareData;
  }
}

// ConsentGatedScripts(소비자 동의 후 로드되는 GA 스크립트)는
// 1) 외부 googletagmanager.com 스크립트
// 2) 인라인 init 스크립트 (`function gtag(){dataLayer.push(arguments)}`)
// 두 가지로 구성된다. 인라인 init이 window.gtag을 자기 구현으로 덮으므로
// 테스트는 인라인 init이 만든 window.dataLayer에서 이벤트를 읽는다.
// 외부 스크립트는 네트워크 노이즈만 만들므로 차단한다.
async function blockGaExternal(context: BrowserContext) {
  await context.route("**/gtag/js**", (route) => route.abort());
  await context.route("**/google-analytics.com/**", (route) => route.abort());
}

async function stubClipboard(context: BrowserContext) {
  await context.addInitScript(`
    window.__copiedText = undefined;
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get() {
        return { writeText: async (text) => { window.__copiedText = text; } };
      },
    });
  `);
}

async function stubWebShare(context: BrowserContext) {
  await context.addInitScript(`
    window.__sharedData = undefined;
    Object.defineProperty(Navigator.prototype, "share", {
      configurable: true,
      value: async function (data) { window.__sharedData = data; },
    });
  `);
}

async function getShareClickEvents(
  page: import("@playwright/test").Page,
): Promise<CapturedEvent[]> {
  return page.evaluate(() => {
    const dl = window.dataLayer ?? [];
    const out: { name: string; params: Record<string, unknown> }[] = [];
    for (const entry of dl) {
      // entry는 Arguments(["event", name, params])
      if (entry[0] === "event" && entry[1] === "share_click") {
        out.push({
          name: String(entry[1]),
          params: (entry[2] as Record<string, unknown>) ?? {},
        });
      }
    }
    return out;
  });
}

test.describe("ShareButton position 파라미터 (묶음 J)", () => {
  // 쿠키 동의 배너가 ShareModal/ShareButton 위를 가리지 않도록 사전 동의 처리
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("cookie-consent", "accepted");
      } catch {
        /* ignore */
      }
    });
  });

  test.describe("Happy Path", () => {
    test("아티클 우상단 ShareButton → share_click.position='top_right' 발사", async ({
      page,
      context,
    }) => {
      // 무엇을: ArticleDetail 우상단(메타 영역) 공유 버튼 클릭 시
      //         share_click 이벤트가 position=top_right로 발사되는지
      // 왜: spec M2 — 우상단 호출부 position prop 부착이 GA4까지 도달
      await blockGaExternal(context);
      await stubClipboard(context);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("top_right");
      expect(events[0].params.content_type).toBe("article");
      expect(events[0].params.method).toBe("clipboard");
    });

    test("아티클 중앙하단 ShareButton → share_click.position='bottom_center' 발사", async ({
      page,
      context,
    }) => {
      // 무엇을: ArticleDetail 중앙하단("이 글 공유하기") 클릭 시 position=bottom_center
      // 왜: spec M2 — 양 위치 측정 가설 검증의 핵심
      await blockGaExternal(context);
      await stubClipboard(context);
      await page.goto(ARTICLE_PATH);

      await page.getByRole("button", { name: "이 글 공유하기" }).click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("bottom_center");
      expect(events[0].params.content_type).toBe("article");
    });

    test("타임라인 ShareButton → share_click.position='top_right' 발사", async ({
      page,
      context,
    }) => {
      // 무엇을: TimelineContainer 우상단 ShareButton position=top_right
      // 왜: spec 시나리오 3 — checklist·timeline은 우상단 단독
      await blockGaExternal(context);
      await stubClipboard(context);
      await page.goto(TIMELINE_PATH);
      // TimelineContainer 하이드레이션 대기
      await expect(page.getByText("전체 진행률")).toBeVisible();

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("top_right");
      expect(events[0].params.content_type).toBe("timeline");
    });

    test("체크리스트 ShareButton → share_click.position='top_right' 발사", async ({
      page,
      context,
    }) => {
      // 무엇을: ChecklistPage 우상단 ShareButton position=top_right
      // 왜: spec 시나리오 3 — checklist 단일 위치
      await blockGaExternal(context);
      await stubClipboard(context);
      await page.goto(CHECKLIST_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("top_right");
      expect(events[0].params.content_type).toBe("checklist");
    });

    test("아티클 양 위치 연속 클릭 시 각 클릭이 별개 이벤트로 발사된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 우상단 → 중앙하단 순서로 둘 다 클릭 시 share_click 이벤트가 2건 발사되고
      //         position 값이 서로 다르게 기록되는지
      // 왜: spec §4 엣지 케이스 — 양쪽 발사 시 각 클릭 별개 발사 정책 준수.
      //     position별 카운트 합산은 분석 단계 책임이므로 발사 자체는 분리되어야 함.
      await blockGaExternal(context);
      await stubClipboard(context);
      await page.goto(ARTICLE_PATH);

      // 우상단 클릭 → 복사 → 모달 닫힘
      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      let dialog = page.getByRole("dialog", { name: "공유하기" });
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(dialog).not.toBeVisible();

      // 중앙하단 클릭 → 복사
      await page.getByRole("button", { name: "이 글 공유하기" }).click();
      dialog = page.getByRole("dialog", { name: "공유하기" });
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(dialog).not.toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(2);
      expect(events[0].params.position).toBe("top_right");
      expect(events[1].params.position).toBe("bottom_center");
    });
  });

  test.describe("Error / Validation", () => {
    test("clipboard 미지원 환경에서 복사 실패해도 share_click이 발사되지 않는다", async ({
      page,
      context,
    }) => {
      // 무엇을: navigator.clipboard 미지원 → writeText 호출 단계에서 throw →
      //         catch 분기로 진입하므로 sendGAEvent("share_click", ...)는 실행되지 않음.
      // 왜: 측정 무결성 — 실제 복사가 안 됐는데 share_click 카운트가 발생하면 측정이 거짓.
      //     spec §5 측정 지표(영역당 ≥10건)의 정확성 보장.
      await blockGaExternal(context);
      await context.addInitScript(`
        Object.defineProperty(Navigator.prototype, "clipboard", {
          configurable: true,
          get() { return undefined; },
        });
      `);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "링크 복사" }).click();
      await expect(
        page.getByText("링크 복사에 실패했어요. 직접 선택해 복사해 주세요."),
      ).toBeVisible();

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(0);
    });

    test("4개 호출부 어디서든 position 값은 enum 2종(top_right|bottom_center) 안에만 들어간다", async ({
      page,
      context,
    }) => {
      // 무엇을: 4개 호출부 각각을 트리거해 position 이 허용 enum 안에만 들어감을 확인
      // 왜: spec M1 — enum 외 값이 새면 SoT enum 정의가 깨지고 분석 단계에서 그룹화 실패.
      //     dataLayer는 navigation마다 리셋되므로 페이지마다 측정 후 합산한다.
      const allowed = new Set(["top_right", "bottom_center"]);
      await blockGaExternal(context);
      await stubClipboard(context);

      const collected: CapturedEvent[] = [];

      // 1) /articles: 두 호출부 모두 클릭 → 같은 dataLayer 안에 누적
      await page.goto(ARTICLE_PATH);
      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "공유하기" })
        .getByRole("button", { name: "링크 복사" })
        .click();
      await expect(
        page.getByRole("dialog", { name: "공유하기" }),
      ).not.toBeVisible();

      await page.getByRole("button", { name: "이 글 공유하기" }).click();
      await page
        .getByRole("dialog", { name: "공유하기" })
        .getByRole("button", { name: "링크 복사" })
        .click();
      await expect(
        page.getByRole("dialog", { name: "공유하기" }),
      ).not.toBeVisible();
      collected.push(...(await getShareClickEvents(page)));

      // 2) /timeline
      await page.goto(TIMELINE_PATH);
      await expect(page.getByText("전체 진행률")).toBeVisible();
      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "공유하기" })
        .getByRole("button", { name: "링크 복사" })
        .click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();
      collected.push(...(await getShareClickEvents(page)));

      // 3) /checklist/<slug>
      await page.goto(CHECKLIST_PATH);
      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "공유하기" })
        .getByRole("button", { name: "링크 복사" })
        .click();
      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();
      collected.push(...(await getShareClickEvents(page)));

      expect(collected).toHaveLength(4);
      for (const e of collected) {
        expect(allowed.has(String(e.params.position))).toBe(true);
      }
    });
  });

  test.describe("권한 / 인증", () => {
    // 정적(output: "export") 공개 사이트 — 보호된 경로/권한 분기가 없음.
    test.skip("권한 분기 없음 — 정적 공개 사이트", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    // hasTouch: true → matchMedia("(pointer: coarse) and (hover: none)")가 매칭되어
    // triggerShare가 모바일 분기(navigator.share)로 진입한다.
    test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

    test("모바일 Web Share API 경로에도 position이 동봉된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 모바일 분기에서 navigator.share 호출 후 sendGAEvent("share_click", ...,
      //         { position }) 가 발사되는지
      // 왜: spec §4 엣지 — navigator.share 미지원/지원 양쪽 분기 모두 position 동봉 의무.
      //     모바일이 1순위 경로이므로 분기 누락 시 측정 표본의 큰 비율을 잃는다.
      await blockGaExternal(context);
      await stubWebShare(context);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      // navigator.share resolve 이후 sendGAEvent가 호출되도록 polling 으로 대기
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                (window.dataLayer ?? []).filter(
                  (e) => e[0] === "event" && e[1] === "share_click",
                ).length,
            ),
          { timeout: 2000 },
        )
        .toBeGreaterThanOrEqual(1);

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("top_right");
      expect(events[0].params.method).toBe("web_share_api");
    });

    test("모바일: 아티클 중앙하단 버튼도 position=bottom_center로 발사된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 모바일 + Web Share API 환경에서 중앙하단 버튼이 bottom_center를 동봉
      // 왜: 모바일 분기가 우상단만 검증되면 spec 측정 가설(상-하단 도달률 비교)이 절반만 커버됨
      await blockGaExternal(context);
      await stubWebShare(context);
      await page.goto(ARTICLE_PATH);

      // 본문 하단까지 스크롤 (모바일에서 중앙하단 버튼이 자동 렌더되지만 가시 영역으로 이동)
      await page.getByRole("button", { name: "이 글 공유하기" }).scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: "이 글 공유하기" }).click();

      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                (window.dataLayer ?? []).filter(
                  (e) => e[0] === "event" && e[1] === "share_click",
                ).length,
            ),
          { timeout: 2000 },
        )
        .toBeGreaterThanOrEqual(1);

      const events = await getShareClickEvents(page);
      expect(events).toHaveLength(1);
      expect(events[0].params.position).toBe("bottom_center");
      expect(events[0].params.method).toBe("web_share_api");
    });
  });
});
