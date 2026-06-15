import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * seo-breadcrumb-jsonld
 * spec: docs/features/jsonld-breadcrumb-identity/spec.md
 * qa:   docs/features/jsonld-breadcrumb-identity/qa.md
 * impl: docs/implementation/jsonld-breadcrumb-identity-impl.md
 *
 * SEO 신호:
 *   - 13 indexable 페이지 각각에 BreadcrumbList JSON-LD 주입 (sitemap IA 명시)
 *   - layout 에 WebSite (name+url+alternateName) + Person 최소판 (name+url) 주입
 * 회귀 가드:
 *   - WebSite 에 SearchAction 부재 (결정 2 — Sitelinks Search Box deprecated)
 *   - Person 에 sameAs/image/description 부재 (결정 1 — 최소판, sameAs 보강은 후속 PR)
 *   - redirect 4 페이지에는 BreadcrumbList 미주입
 *   - fs-level: out/<route>.html 13 indexable 에 "@type":"BreadcrumbList" 1회 이상 등장
 */

const BASE = "https://pregnancy-checklist.com";
const REPO = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO, "out");

const SAMPLE_ARTICLE_SLUG = "early-pregnancy-tests";

const INDEXABLE_ROUTES = [
  "/",
  "/timeline",
  "/checklist",
  "/checklist/hospital-bag",
  "/checklist/partner-prep",
  "/checklist/pregnancy-prep",
  "/baby-fair",
  "/articles",
  "/weight",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

const REDIRECT_ROUTES = [
  "/info",
  "/videos",
  "/guides/hospital-bag",
  "/guides/weekly-prep",
] as const;

type JsonLd = Record<string, unknown>;

async function getLdJsonScripts(page: Page, route: string): Promise<JsonLd[]> {
  await page.goto(route);
  const handles = await page.locator('script[type="application/ld+json"]').all();
  const parsed: JsonLd[] = [];
  for (const h of handles) {
    const text = await h.textContent();
    if (!text) continue;
    parsed.push(JSON.parse(text) as JsonLd);
  }
  return parsed;
}

function pickByType(scripts: JsonLd[], type: string): JsonLd[] {
  return scripts.filter((s) => s["@type"] === type);
}

function routeToHtmlPath(route: string): string {
  if (route === "/") return path.join(OUT_DIR, "index.html");
  return path.join(OUT_DIR, `${route.replace(/^\//, "")}.html`);
}

test.describe("seo-breadcrumb-jsonld", () => {
  test.describe("Happy Path — 샘플 4 페이지", () => {
    test("/ (루트): BreadcrumbList position 1 단일 + item 절대 URL", async ({ page }) => {
      // 무엇을: 루트 페이지에 BreadcrumbList JSON-LD 가 1개 존재하고 itemListElement 가 position 1 단일
      // 왜: 13 indexable 페이지 IA 일관성의 시작점. 루트가 어긋나면 모든 하위 라우트의 신호가 흔들림.
      const scripts = await getLdJsonScripts(page, "/");
      const breadcrumbs = pickByType(scripts, "BreadcrumbList");
      expect(breadcrumbs).toHaveLength(1);
      const items = breadcrumbs[0].itemListElement as JsonLd[];
      expect(items).toHaveLength(1);
      expect(items[0].position).toBe(1);
      expect(items[0].name).toBe("홈");
      expect(items[0].item).toBe(`${BASE}/`);
    });

    test(`/articles/${SAMPLE_ARTICLE_SLUG} (article): BreadcrumbList 3-level + article.title 사용`, async ({
      page,
    }) => {
      // 무엇을: article slug 페이지의 BreadcrumbList 가 홈 > 정보 & 가이드 > {title} 3-level
      // 왜: 동적 라우트 분기가 articleMeta 를 받아 정확히 합성되는지 검증. 핵심 SERP 노출 시나리오.
      const scripts = await getLdJsonScripts(page, `/articles/${SAMPLE_ARTICLE_SLUG}`);
      const breadcrumbs = pickByType(scripts, "BreadcrumbList");
      expect(breadcrumbs).toHaveLength(1);
      const items = breadcrumbs[0].itemListElement as JsonLd[];
      expect(items).toHaveLength(3);
      expect((items[0] as JsonLd).name).toBe("홈");
      expect((items[1] as JsonLd).name).toBe("정보 & 가이드");
      expect((items[1] as JsonLd).item).toBe(`${BASE}/articles`);
      expect((items[2] as JsonLd).item).toBe(`${BASE}/articles/${SAMPLE_ARTICLE_SLUG}`);
      expect(typeof (items[2] as JsonLd).name).toBe("string");
      expect(((items[2] as JsonLd).name as string).length).toBeGreaterThan(0);
    });

    test("/checklist/hospital-bag: BreadcrumbList 3-level + 홈 > 체크리스트 > 출산가방 체크리스트", async ({
      page,
    }) => {
      // 무엇을: 정적 3-level 체크리스트 sub 페이지 매핑 정확성
      // 왜: prefix 가 같은 /checklist 와 /checklist/hospital-bag 의 분리 검증.
      const scripts = await getLdJsonScripts(page, "/checklist/hospital-bag");
      const breadcrumbs = pickByType(scripts, "BreadcrumbList");
      expect(breadcrumbs).toHaveLength(1);
      const items = breadcrumbs[0].itemListElement as JsonLd[];
      expect(items.map((i) => i.name)).toEqual([
        "홈",
        "체크리스트",
        "출산가방 체크리스트",
      ]);
      expect(items.map((i) => i.item)).toEqual([
        `${BASE}/`,
        `${BASE}/checklist`,
        `${BASE}/checklist/hospital-bag`,
      ]);
    });

    test("/about: BreadcrumbList 2-level + 홈 > 만든 사람 뿌까뽀까", async ({ page }) => {
      // 무엇을: 정적 2-level 페이지의 매핑
      // 왜: 기존 about 페이지의 AboutJsonLd(@graph) 와 새 BreadcrumbList 가 공존하는 회귀 케이스.
      const scripts = await getLdJsonScripts(page, "/about");
      const breadcrumbs = pickByType(scripts, "BreadcrumbList");
      expect(breadcrumbs).toHaveLength(1);
      const items = breadcrumbs[0].itemListElement as JsonLd[];
      expect(items.map((i) => i.name)).toEqual(["홈", "만든 사람 뿌까뽀까"]);
    });
  });

  test.describe("Layout 주입 검증 (시나리오 4) — WebSite + Person 최소판", () => {
    test("/ 진입 시 WebSite JSON-LD 1개 — name+url+alternateName 3 필드만, SearchAction 부재", async ({
      page,
    }) => {
      // 무엇을: WebSite 가 정확 3 필드 (name + url + alternateName) 만, SearchAction/potentialAction 부재
      // 왜: 결정 2 — Sitelinks Search Box 2024-11-21 deprecated. cargo cult markup 영구화 방지.
      const scripts = await getLdJsonScripts(page, "/");
      const websites = pickByType(scripts, "WebSite");
      expect(websites).toHaveLength(1);
      const ws = websites[0];
      expect(ws.name).toBe("출산 준비 체크리스트");
      expect(ws.url).toBe(BASE);
      expect(ws.alternateName).toBe("뿌까뽀까 출산 준비");
      expect(ws.potentialAction).toBeUndefined();
      // SearchAction 필드는 어디에도 등장하지 않아야 함 (script 전체 raw 검사)
      const raw = JSON.stringify(scripts);
      expect(raw.includes("SearchAction")).toBe(false);
    });

    test("/ 진입 시 Person JSON-LD 1개 — name+url 2 필드만, sameAs/image/description 부재", async ({
      page,
    }) => {
      // 무엇을: Person 최소판 — name + url 만, sameAs/image/description/jobTitle 부재
      // 왜: 결정 1 옵션 A — sameAs 없는 Person 은 cargo cult. 부지불식간 추가 회귀 차단.
      const scripts = await getLdJsonScripts(page, "/");
      // about 페이지가 아닌 / 루트라 about/AboutJsonLd(@graph) 영향 없음
      const persons = pickByType(scripts, "Person");
      expect(persons).toHaveLength(1);
      const p = persons[0];
      expect(p.name).toBe("뿌까뽀까");
      expect(p.url).toBe(`${BASE}/about`);
      expect(p.sameAs).toBeUndefined();
      expect(p.image).toBeUndefined();
      expect(p.description).toBeUndefined();
      expect(p.jobTitle).toBeUndefined();
    });
  });

  test.describe("Layout 상속 검증 — article 페이지에 5종 JSON-LD 공존", () => {
    test(`/articles/${SAMPLE_ARTICLE_SLUG}: WebSite + Person + Article + FAQPage + BreadcrumbList 모두 존재`, async ({
      page,
    }) => {
      // 무엇을: layout 주입(WebSite/Person) + page 주입(Article/FAQPage/BreadcrumbList) 5종 공존
      // 왜: layout vs page 주입 분리가 article 페이지에서 충돌 없이 박혀야 함. 기존 seo-faq-jsonld 의 "Article+FAQPage 공존" 가드 보강.
      const scripts = await getLdJsonScripts(page, `/articles/${SAMPLE_ARTICLE_SLUG}`);
      expect(pickByType(scripts, "WebSite")).toHaveLength(1);
      expect(pickByType(scripts, "Person")).toHaveLength(1);
      expect(pickByType(scripts, "Article")).toHaveLength(1);
      expect(pickByType(scripts, "FAQPage")).toHaveLength(1);
      expect(pickByType(scripts, "BreadcrumbList")).toHaveLength(1);
    });
  });

  test.describe("Error / Validation (회귀 가드)", () => {
    test("fs-level: 13 indexable 페이지의 out/<route>.html 에 BreadcrumbList 1회 이상 등장", async () => {
      // 무엇을: next build 산출물(out/) 의 13 indexable html 에 "@type":"BreadcrumbList" 등장
      // 왜: 시나리오 3 (13 라우트 전수 일관성) 의 fs-level 가드. E2E 13 개 작성 대신 fs-grep 1개로 갈음.
      for (const route of INDEXABLE_ROUTES) {
        const htmlPath = routeToHtmlPath(route);
        const html = fs.readFileSync(htmlPath, "utf-8");
        const matches = html.match(/"@type":"BreadcrumbList"/g) ?? [];
        expect(
          matches.length,
          `${route}: BreadcrumbList JSON-LD missing in ${htmlPath}`,
        ).toBeGreaterThanOrEqual(1);
      }
    });

    test("fs-level: redirect 4 페이지에는 BreadcrumbList 미주입", async () => {
      // 무엇을: /info, /videos, /guides/* 의 out html 에 BreadcrumbList 0회
      // 왜: spec §3.must 5 — robots:noindex / server-redirect 페이지에 JSON-LD 박지 않음 (의미 없음).
      for (const route of REDIRECT_ROUTES) {
        const htmlPath = routeToHtmlPath(route);
        const html = fs.readFileSync(htmlPath, "utf-8");
        const matches = html.match(/"@type":"BreadcrumbList"/g) ?? [];
        expect(
          matches.length,
          `${route}: redirect page should NOT have BreadcrumbList`,
        ).toBe(0);
      }
    });

    test("fs-level: 루트 out/index.html 에 WebSite 1개 + Person 1개, SearchAction 0개", async () => {
      // 무엇을: 빌드 산출물 자체에 WebSite/Person 최소판 박혀 있고 SearchAction 0회
      // 왜: 페이지 방문 가드와 직교 — 빌드 산출물 회귀를 fs-level 로 직접 차단.
      const html = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf-8");
      const websiteMatches = html.match(/"@type":"WebSite"/g) ?? [];
      expect(websiteMatches.length).toBe(1);
      const personMatches = html.match(/"@type":"Person"/g) ?? [];
      expect(personMatches.length).toBe(1);
      expect(html.includes("SearchAction")).toBe(false);
      expect(html.includes("sameAs")).toBe(false);
    });
  });

  test.describe("권한 / 인증", () => {
    // N/A — output: "export" 정적 사이트, 백엔드 인증 없음.
    // JSON-LD 는 server-rendered HTML 에 박혀 있으며 비로그인 공개 접근.
    test.skip("정적 사이트 — 인증 분기 없음", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일 뷰포트에서도 BreadcrumbList + WebSite + Person 이 동일하게 주입된다", async ({
      page,
    }) => {
      // 무엇을: viewport 와 무관하게 server-rendered HTML 에 3종 JSON-LD 모두 존재
      // 왜: SEO 메타는 디바이스 의존하면 안 됨. 회귀 sanity 가드.
      const scripts = await getLdJsonScripts(page, "/checklist/hospital-bag");
      expect(pickByType(scripts, "WebSite")).toHaveLength(1);
      expect(pickByType(scripts, "Person")).toHaveLength(1);
      expect(pickByType(scripts, "BreadcrumbList")).toHaveLength(1);
    });
  });
});
