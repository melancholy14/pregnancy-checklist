import { test, expect } from "@playwright/test";

const BASE = "https://pregnancy-checklist.com";
const SAMPLE_SLUG = "weekly-prenatal-checklist";

async function fetchSitemap(baseURL: string): Promise<string> {
  const res = await fetch(`${baseURL}/sitemap.xml`);
  expect(res.ok).toBeTruthy();
  return res.text();
}

function extractLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

function extractUrlEntries(xml: string): Array<{ loc: string; lastmod: string }> {
  const urls: Array<{ loc: string; lastmod: string }> = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = m[1];
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
    urls.push({ loc, lastmod });
  }
  return urls;
}

async function getArticleJsonLd(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/articles/${slug}`);
  const handle = await page.locator('script[type="application/ld+json"]').first();
  const json = await handle.textContent();
  expect(json).toBeTruthy();
  return JSON.parse(json!);
}

test.describe("seo-sitemap-article-jsonld", () => {
  test.describe("Happy Path", () => {
    test("sitemap.xml에 3개 신규 라우트가 포함된다", async ({ baseURL }) => {
      // 무엇을: /info, /guides/hospital-bag, /guides/weekly-prep 가 sitemap에 모두 등재되는지
      // 왜: 색인 누락 → 노출 누락. 신규 페이지는 sitemap 등재가 색인 신호의 1차 의존선.
      const xml = await fetchSitemap(baseURL!);
      const locs = extractLocs(xml);
      expect(locs).toContain(`${BASE}/info`);
      expect(locs).toContain(`${BASE}/guides/hospital-bag`);
      expect(locs).toContain(`${BASE}/guides/weekly-prep`);
    });

    test("Article JSON-LD에 image·mainEntityOfPage·keywords·articleSection·wordCount 5필드가 모두 주입된다", async ({
      page,
    }) => {
      // 무엇을: PR-D 신규 5필드 일괄 존재 확인
      // 왜: Rich Results 카드 풍부화의 핵심. 한 필드라도 빠지면 의도한 SERP 표현 손실.
      const jsonLd = await getArticleJsonLd(page, SAMPLE_SLUG);
      expect(jsonLd["@type"]).toBe("Article");
      expect(jsonLd.image).toBe(`${BASE}/articles/${SAMPLE_SLUG}.webp`);
      expect(jsonLd.mainEntityOfPage).toEqual({
        "@type": "WebPage",
        "@id": `${BASE}/articles/${SAMPLE_SLUG}`,
      });
      expect(typeof jsonLd.keywords).toBe("string");
      expect(jsonLd.keywords.length).toBeGreaterThan(0);
      expect(typeof jsonLd.articleSection).toBe("string");
      expect(jsonLd.articleSection.length).toBeGreaterThan(0);
      expect(typeof jsonLd.wordCount).toBe("number");
      expect(jsonLd.wordCount).toBeGreaterThan(0);
    });

    test("articleSection은 frontmatter tags[0]을 그대로 사용한다", async ({ page }) => {
      // 무엇을: articleSection = tags 첫 번째 값, keywords = tags 전체 join
      // 왜: spec 결정 사항 — category 필드 신규 도입하지 않고 tags[0] 그대로 매핑.
      const jsonLd = await getArticleJsonLd(page, SAMPLE_SLUG);
      const tags = jsonLd.keywords.split(", ");
      expect(tags.length).toBeGreaterThan(0);
      expect(jsonLd.articleSection).toBe(tags[0]);
    });
  });

  test.describe("Error / Validation (회귀 가드)", () => {
    test("sitemap.xml에 /videos 가 포함되지 않는다", async ({ baseURL }) => {
      // 무엇을: meta-refresh 리다이렉트만 둔 /videos 라우트가 sitemap에서 제외되는지
      // 왜: spec 결정 — 정적 export 환경에서 redirect 불가, robots:noindex + sitemap 미등재 조합이 인바운드 보존 + 색인 차단의 최소 변경 해법.
      const xml = await fetchSitemap(baseURL!);
      const locs = extractLocs(xml);
      expect(locs).not.toContain(`${BASE}/videos`);
    });

    test("한 빌드 안에서 모든 정적 라우트의 lastmod 값이 동일하다 (BUILD_TIME 상수)", async ({
      baseURL,
    }) => {
      // 무엇을: BUILD_TIME 모듈 상수가 새로 추가된 3개 포함 모든 정적 라우트에 일관 적용
      // 왜: 정적 라우트 lastmod가 빌드마다 들쭉날쭉이면 검색엔진의 신선도 신호 신뢰도 하락. spec 결정의 핵심 invariant.
      const xml = await fetchSitemap(baseURL!);
      const entries = extractUrlEntries(xml);
      const staticEntries = entries.filter((e) => !e.loc.includes("/articles/"));
      const lastmods = new Set(staticEntries.map((e) => e.lastmod));
      expect(lastmods.size).toBe(1);
    });

    test("sitemap.xml의 article lastmod 는 정적 라우트 lastmod 와 분리되어 있다", async ({
      baseURL,
    }) => {
      // 무엇을: article 매핑은 a.updated ?? a.date 그대로 유지 (BUILD_TIME 적용 X)
      // 왜: 문서가 안 바뀐 글의 lastmod 가 빌드마다 흔들리는 노이즈 제거.
      const xml = await fetchSitemap(baseURL!);
      const entries = extractUrlEntries(xml);
      const articleEntries = entries.filter((e) => e.loc.includes("/articles/") && !e.loc.endsWith("/articles"));
      expect(articleEntries.length).toBeGreaterThan(0);
      // article lastmod 는 frontmatter 기반 ISO date. 모두 동일하면 BUILD_TIME 으로 잘못 통합된 것.
      const articleLastmods = new Set(articleEntries.map((e) => e.lastmod));
      expect(articleLastmods.size).toBeGreaterThan(1);
    });

    test("wordCount 는 코드 블록·이미지를 제외한 본문 단어 수 (양수 정수)", async ({ page }) => {
      // 무엇을: wordCount 가 양수 정수이고 비현실적으로 작은 값이 아닌지
      // 왜: countWords 회귀 가드. 코드 블록만 있는 깡통 글이거나 함수 버그로 0 나오면 즉시 알람.
      const jsonLd = await getArticleJsonLd(page, SAMPLE_SLUG);
      expect(Number.isInteger(jsonLd.wordCount)).toBe(true);
      expect(jsonLd.wordCount).toBeGreaterThan(100);
    });
  });

  test.describe("권한 / 인증", () => {
    // N/A — output: "export" 정적 사이트, 백엔드 인증 없음.
    // sitemap.xml 과 article 페이지 모두 비로그인 공개 접근. 권한 분기 자체가 존재하지 않음.
    test.skip("정적 사이트 — 인증 분기 없음", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일 뷰포트에서도 Article JSON-LD가 동일하게 주입된다", async ({ page }) => {
      // 무엇을: JSON-LD 가 viewport 와 무관하게 server-rendered HTML 에 존재하는지
      // 왜: SEO 메타는 사용자 디바이스에 의존하면 안 됨. 회귀 sanity 가드.
      const jsonLd = await getArticleJsonLd(page, SAMPLE_SLUG);
      expect(jsonLd["@type"]).toBe("Article");
      expect(jsonLd.image).toContain(".webp");
      expect(jsonLd.wordCount).toBeGreaterThan(0);
    });
  });
});
