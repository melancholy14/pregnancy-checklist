import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * design-bundle-cleanup-round
 * spec / round: docs/design-bundle-cleanup-round/README.md
 * impl: docs/implementation/design-bundle-cleanup-round-impl.md
 *
 * 라운드 가드 5개 (묶음별 회귀는 기존 E2E 회귀로 위임):
 *  1) 페이지 셸 단색 회귀         — A
 *  2) 헤딩 위계 회귀              — C
 *  3) cleanup grep 가드 (fs)       — A·C·E
 *  4) 허브 카드 4장 시각 정합     — F
 *  5) BabyfairCard outbound + rel — O
 */

const REPO = path.resolve(__dirname, "..");

async function setupGtagSpy(page: Page) {
  // layout.tsx 의 head 인라인 부트스트랩이 window.gtag 를 덮어쓰므로 dataLayer.push 를 가로챈다.
  await page.addInitScript(() => {
    type Win = Record<string, unknown>;
    const calls: unknown[][] = [];
    (window as unknown as Win).__gtagCalls = calls;

    const dl: unknown[] = [];
    const origPush = Array.prototype.push;
    Object.defineProperty(dl, "push", {
      value(this: unknown[], ...args: unknown[]) {
        for (const a of args) {
          if (a && typeof a === "object" && "length" in (a as Record<string, unknown>)) {
            calls.push(Array.from(a as ArrayLike<unknown>));
          }
        }
        return origPush.apply(this, args);
      },
      configurable: true,
      writable: true,
    });
    (window as unknown as Win).dataLayer = dl;

    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      calls.push(args);
    };
  });
}

async function getGtagEventNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const list = (window as unknown as Record<string, unknown>).__gtagCalls;
    if (!Array.isArray(list)) return [];
    return (list as unknown[][])
      .filter((args) => args[0] === "event" && typeof args[1] === "string")
      .map((args) => args[1] as string);
  });
}

test.describe("design-bundle-cleanup-round 라운드 가드", () => {
  test("(1) 페이지 셸이 그라디언트 없이 bg-background 단색이다", async ({
    page,
  }) => {
    // 무엇을: /checklist · /checklist/<slug> · /timeline 의 셸 div 클래스
    // 왜: A 묶음 §2.1 — `bg-linear-to-b from-background to-white` 헌법 위반 정정
    const targets = [
      "/checklist",
      "/checklist/hospital-bag",
      "/timeline",
    ];

    for (const url of targets) {
      await page.goto(url);
      // 페이지 셸: `min-h-screen pb-24 px-4 bg-background` 컨테이너 (layout 래퍼와 구분)
      const shell = page.locator("div.min-h-screen.pb-24.px-4").first();
      await expect(shell, `${url} shell exists`).toBeVisible();
      const cls = (await shell.getAttribute("class")) ?? "";
      expect(cls, `${url} shell class`).toContain("bg-background");
      expect(cls, `${url} shell must not have gradient`).not.toContain(
        "bg-linear-to-b",
      );
      expect(cls, `${url} shell must not end on white`).not.toContain(
        "to-white",
      );
    }
  });

  test("(2) 헤딩이 인라인 size override 없이 시맨틱 hN으로 렌더된다", async ({
    page,
  }) => {
    // 무엇을: ChecklistHub h2 · ChecklistPage h2 · ArticleDetail h1 의 className
    // 왜: C 묶음 §2.1·§2.2 — `text-[15px]` / `text-xl` 인라인 제거 회귀

    // ChecklistHub 카드 타이틀 (h2)
    await page.goto("/checklist");
    const hubTitles = page.getByRole("heading", { level: 2 }).filter({
      hasText: /타임라인|체크리스트/,
    });
    expect(await hubTitles.count()).toBeGreaterThanOrEqual(2);
    for (const cls of await hubTitles.evaluateAll((els) =>
      els.map((el) => el.className),
    )) {
      expect(cls).not.toMatch(/text-\[15px\]/);
    }

    // ChecklistPage 서브카테고리 헤더 (h2)
    await page.goto("/checklist/hospital-bag");
    const subHeaders = page.getByRole("heading", { level: 2 });
    expect(await subHeaders.count()).toBeGreaterThan(0);
    for (const cls of await subHeaders.evaluateAll((els) =>
      els.map((el) => el.className),
    )) {
      expect(cls).not.toMatch(/text-\[15px\]/);
    }

    // ArticleDetail h1
    await page.goto("/articles/postpartum-care-center-guide");
    const h1 = page.locator("article h1").first();
    await expect(h1).toBeVisible();
    const h1Cls = (await h1.getAttribute("class")) ?? "";
    expect(h1Cls).not.toMatch(/text-xl\b/);
    expect(h1Cls).not.toMatch(/text-\[15px\]/);
  });

  test("(3) cleanup grep 가드: 화살표/red/hex(전 영역) + shadow-md(스펙 4 영역 정보카드) 0건", async () => {
    // 무엇을: cleanup SoT 영역에서 패턴 회귀 0건
    // 왜: A·C·E 묶음의 grep 가드를 소스 레벨에서 차단
    // 범위:
    //   화살표 →           : src/components 전체 (E §2.2 SoT — chrome 컴포넌트 한정)
    //   red-N / hex         : src/components 전체 (E §2.3·§2.4 SoT)
    //   rest shadow-md     : spec §3 grep 범위 (checklist/timeline/weight/babyfair),
    //                         form 카드·`hover:shadow-md`·current ring·final pill 보존
    const wideRoot = path.join(REPO, "src/components");
    const shadowRoots = [
      "src/components/checklist",
      "src/components/timeline",
      "src/components/weight",
      "src/components/babyfair",
    ].map((p) => path.join(REPO, p));

    function walk(dir: string): string[] {
      const out: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
      }
      return out;
    }

    const violations: string[] = [];

    // (a)·(b)·(c) — 전 영역
    for (const file of walk(wideRoot)) {
      const content = fs.readFileSync(file, "utf8");
      const rel = path.relative(REPO, file);
      content.split("\n").forEach((line, idx) => {
        if (line.includes("→")) {
          violations.push(`${rel}:${idx + 1}  arrow → in source`);
        }
        if (/(?:text|bg|border|hover:bg|hover:text)-red-\d/.test(line)) {
          violations.push(`${rel}:${idx + 1}  red-N utility`);
        }
        if (line.includes("#F0EBE6") || line.includes("#3D4447")) {
          violations.push(`${rel}:${idx + 1}  raw hex #F0EBE6/#3D4447`);
        }
      });
    }

    // (d) — spec §3 영역 한정
    const ALLOWED_SHADOW_MD_FILES = new Set([
      "src/components/checklist/ChecklistAddForm.tsx",
      "src/components/timeline/UnifiedAddForm.tsx",
      "src/components/weight/WeightForm.tsx",
    ]);
    const ALLOWED_SHADOW_MD_LINE_HINTS = [
      // current week 강조 ring lift (`scale-110 ring-4 ring-white shadow-md`)
      { file: "src/components/timeline/TimelineAccordionCard.tsx", needle: "scale-110" },
      // final celebration pill (40주차) — E §2.1 SoT 외, 별도 라운드
      { file: "src/components/timeline/TimelineContainer.tsx", needle: "Final Message" },
      { file: "src/components/timeline/TimelineContainer.tsx", needle: "from-pastel-pink/60 to-pastel-lavender/60" },
    ];

    for (const root of shadowRoots) {
      for (const file of walk(root)) {
        const content = fs.readFileSync(file, "utf8");
        const rel = path.relative(REPO, file);
        if (ALLOWED_SHADOW_MD_FILES.has(rel)) continue;
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (!line.includes("shadow-md")) return;
          if (line.includes("hover:shadow-md")) return;
          // 라인 자체에 hint가 있는지 (예: `scale-110 ring-4 ring-white shadow-md`)
          const localHint = ALLOWED_SHADOW_MD_LINE_HINTS.some(
            (h) => h.file === rel && line.includes(h.needle),
          );
          if (localHint) return;
          // 직전 라인에 hint(주석)가 있는지 — Final Message 케이스
          const prev = idx > 0 ? lines[idx - 1] : "";
          const prevHint = ALLOWED_SHADOW_MD_LINE_HINTS.some(
            (h) => h.file === rel && prev.includes(h.needle),
          );
          if (prevHint) return;
          violations.push(`${rel}:${idx + 1}  rest shadow-md on info card`);
        });
      }
    }

    expect(violations).toEqual([]);
  });

  test("(4) /checklist 4장 카드의 좌측 슬롯이 모두 text-3xl 이모지 단독 패턴이다", async ({
    page,
  }) => {
    // 무엇을: ChecklistHub의 4 카드(타임라인·출산가방·남편준비·임신준비)가 동일 패턴인지
    // 왜: F 묶음 §2.1 — 타임라인 카드만 컨테이너+lucide였던 것을 이모지 단독으로 정렬
    await page.goto("/checklist");

    const cards = page.locator("a.block.no-underline");
    expect(await cards.count()).toBe(4);

    // 모든 카드의 첫 자식 슬롯이 `text-3xl shrink-0` span (이모지 단독) 이어야 한다
    for (let i = 0; i < 4; i++) {
      const slot = cards
        .nth(i)
        .locator("span.text-3xl.shrink-0[aria-hidden]")
        .first();
      await expect(slot, `card #${i} icon slot`).toBeVisible();
      const text = ((await slot.textContent()) ?? "").trim();
      expect(text.length, `card #${i} emoji text`).toBeGreaterThan(0);
    }

    // 핑크 사각 컨테이너(`bg-pastel-pink/40 flex items-center justify-center`) 가 0건
    const oldContainer = page.locator(
      "a.block.no-underline span.bg-pastel-pink\\/40.flex.items-center.justify-center",
    );
    await expect(oldContainer).toHaveCount(0);
  });

  test("(5) BabyfairCard 이동 버튼은 anchor + rel 표준 + GA outbound_click 발사", async ({
    page,
    context,
  }) => {
    // 무엇을: 다이얼로그의 "이동" 트리거가 anchor href/target/rel 표준 + GA event 동시 발사
    // 왜: O 묶음 §2.1·§2.2 — window.open 우회 제거, 표준 anchor 패턴 정렬
    await setupGtagSpy(page);
    await page.goto("/baby-fair");

    // 어느 탭이든 첫 카드를 클릭
    await page.getByRole("tab", { name: "지난 행사" }).click();
    const firstCard = page.locator('[role="button"][aria-label*="공식 홈페이지"]').first();
    await firstCard.click();
    await expect(page.getByRole("alertdialog")).toBeVisible();

    const moveLink = page.getByRole("alertdialog").getByRole("link", {
      name: "이동",
    });
    await expect(moveLink).toBeVisible();
    await expect(moveLink).toHaveAttribute("target", "_blank");
    await expect(moveLink).toHaveAttribute("rel", /noopener/);
    await expect(moveLink).toHaveAttribute("rel", /noreferrer/);
    const href = await moveLink.getAttribute("href");
    expect(href, "anchor href").toMatch(/^https?:\/\//);

    // 클릭 → 새 탭 + GA event
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      moveLink.click(),
    ]);
    expect(newPage.url()).not.toBe("about:blank");
    await newPage.close();

    const events = await getGtagEventNames(page);
    expect(events).toContain("outbound_click");
  });
});
