import { test, expect } from "@playwright/test";

const ARTICLE_PATH = "/articles/early-pregnancy-tests";
const ARTICLE_CANONICAL =
  "https://pregnancy-checklist.com/articles/early-pregnancy-tests";
const CHECKLIST_PATH = "/checklist/hospital-bag";
const CHECKLIST_URL = "https://pregnancy-checklist.com/checklist/hospital-bag";
const TIMELINE_PATH = "/timeline";
const TIMELINE_URL = "https://pregnancy-checklist.com/timeline";

// 헤드리스 Chromium은 Web Share / Clipboard API가 비결정적이라
// 두 API를 정의하지 않거나 stub으로 대체해 분기를 명시적으로 검증한다.
// instance 레벨 defineProperty는 일부 환경에서 silently 실패하므로 Navigator.prototype에 직접 정의한다.

async function stubClipboard(context: import("@playwright/test").BrowserContext) {
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

async function stubWebShare(context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(`
    window.__sharedData = undefined;
    Object.defineProperty(Navigator.prototype, "share", {
      configurable: true,
      value: async function (data) { window.__sharedData = data; },
    });
  `);
}

async function disableClipboard(
  context: import("@playwright/test").BrowserContext,
) {
  await context.addInitScript(`
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get() { return undefined; },
    });
  `);
}

test.describe("공유 기능 (Phase 4 Step 4)", () => {
  // 쿠키 동의 배너(role="dialog")가 ShareModal 검증을 가리지 않도록 사전 동의 처리
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
    test("아티클 상세 페이지에 공유 버튼이 본문 상단과 하단 두 곳에 노출된다", async ({
      page,
    }) => {
      // 무엇을: 같은 페이지에 "공유하기"(상단) + "이 글 공유하기"(하단) 두 버튼이 모두 보임
      // 왜: AC #1 — 본문 상단·하단 양쪽 진입점 노출 의무
      await page.goto(ARTICLE_PATH);

      await expect(
        page.getByRole("button", { name: "공유하기", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "이 글 공유하기" }),
      ).toBeVisible();
    });

    test("체크리스트 페이지(hospital-bag)에 공유 버튼이 노출된다", async ({
      page,
    }) => {
      // 무엇을: /checklist/hospital-bag 헤더에 ShareButton 노출
      // 왜: AC #2 — 체크리스트 3종에 공유 버튼이 있어야 함
      await page.goto(CHECKLIST_PATH);
      await expect(
        page.getByRole("button", { name: "공유하기", exact: true }),
      ).toBeVisible();
    });

    test("타임라인 페이지에 공유 버튼이 노출된다", async ({ page }) => {
      // 무엇을: /timeline 헤더에 ShareButton 노출
      // 왜: 사용자 추가 요청 — 타임라인도 핵심 회유 콘텐츠
      await page.goto(TIMELINE_PATH);
      await expect(
        page.getByRole("button", { name: "공유하기", exact: true }),
      ).toBeVisible();
    });

    test("데스크톱: 공유 버튼 클릭 시 모달이 열리고 canonical URL이 표시된다", async ({
      page,
      context,
    }) => {
      // 무엇을: navigator.share 미지원(데스크톱 기본) → 모달 fallback
      // 왜: AC #4 — 데스크톱 fallback 흐름
      await stubClipboard(context);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();

      const urlInput = dialog.getByLabel("공유 링크");
      await expect(urlInput).toBeVisible();
      await expect(urlInput).toHaveValue(ARTICLE_CANONICAL);
    });

    test("데스크톱: 모달의 '복사' 클릭 시 clipboard에 URL이 들어가고 토스트가 노출된 뒤 모달이 닫힌다", async ({
      page,
      context,
    }) => {
      // 무엇을: clipboard.writeText 호출 + 성공 토스트 + 모달 닫힘
      // 왜: AC #4·#5 — 핵심 fallback 동작
      await stubClipboard(context);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();
      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: "링크 복사" }).click();

      await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();
      await expect(dialog).not.toBeVisible();

      const copied = await page.evaluate(
        () => (window as Window & { __copiedText?: string }).__copiedText,
      );
      expect(copied).toBe(ARTICLE_CANONICAL);
    });

    test("데스크톱: navigator.share가 정의돼 있어도 모달 fallback이 우선된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 데스크톱(터치 없음) 환경에선 Web Share API가 있어도 호출되지 않고 모달이 열림
      // 왜: 옵션 1 동작 — 데스크톱 사용자에게 일관된 모달 UX 제공
      await stubClipboard(context);
      await stubWebShare(context);
      await page.goto(CHECKLIST_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      // 모달이 열려야 함
      await expect(
        page.getByRole("dialog", { name: "공유하기" }),
      ).toBeVisible();

      // navigator.share는 호출되지 않아야 함
      const sharedUrl = await page.evaluate(
        () =>
          (window as Window & { __sharedData?: ShareData }).__sharedData?.url ??
          null,
      );
      expect(sharedUrl).toBeNull();
    });

    test("타임라인 데스크톱: 클릭 시 모달이 열리고 timeline URL이 표시된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 타임라인의 데스크톱 모달 흐름 + URL 정확성
      // 왜: 사용자 추가 요청 — 타임라인 공유가 데스크톱에서도 동작해야 함
      await stubClipboard(context);
      await page.goto(TIMELINE_PATH);
      // TimelineContainer는 useSyncExternalStore 3개를 사용해 hydration이 길다.
      // 하이드레이션 후 노출되는 "전체 진행률" 텍스트로 인터랙티브 상태 보장.
      await expect(page.getByText("전체 진행률")).toBeVisible();

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      const dialog = page.getByRole("dialog", { name: "공유하기" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("공유 링크")).toHaveValue(TIMELINE_URL);
    });
  });

  test.describe("Error / Validation", () => {
    test("clipboard 미지원 환경: 복사 클릭 시 에러 토스트가 노출된다", async ({
      page,
      context,
    }) => {
      // 무엇을: navigator.clipboard === undefined 일 때 try/catch에서 에러 토스트
      // 왜: 가정 사항 — 미지원/실패 시 사용자에게 명시적 안내 필요
      await disableClipboard(context);
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
    });
  });

  test.describe("권한 / 인증", () => {
    // 정적(output: "export") 공개 사이트 — 보호된 경로/권한 분기가 없음.
    test.skip("권한 분기 없음 — 정적 공개 사이트", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    // hasTouch: true → matchMedia("(pointer: coarse) and (hover: none)")가 매칭되어
    // triggerShare가 모바일 분기로 진입한다.
    test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

    test("모바일: 아티클 페이지의 공유 버튼이 화면 안에 노출된다", async ({
      page,
    }) => {
      // 무엇을: 375px에서 ShareButton이 잘리지 않고 보임
      // 왜: 주 타겟 기기에서 핵심 회유 진입점이 잘리면 안 됨
      await page.goto(ARTICLE_PATH);

      const button = page.getByRole("button", {
        name: "공유하기",
        exact: true,
      });
      await expect(button).toBeVisible();

      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });

    test("모바일 Web Share API: 클릭 시 native 시트로 위임된다", async ({
      page,
      context,
    }) => {
      // 무엇을: 모바일 뷰포트 + navigator.share 오버라이드 → 모달 미노출
      // 왜: 모바일이 1순위 경로이므로 단독 검증
      await stubWebShare(context);
      await page.goto(ARTICLE_PATH);

      await page
        .getByRole("button", { name: "공유하기", exact: true })
        .click();

      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                (window as Window & { __sharedData?: ShareData }).__sharedData
                  ?.url ?? null,
            ),
          { timeout: 2000 },
        )
        .toBe(ARTICLE_CANONICAL);

      await expect(
        page.getByRole("dialog", { name: "공유하기" }),
      ).not.toBeVisible();
    });
  });
});
