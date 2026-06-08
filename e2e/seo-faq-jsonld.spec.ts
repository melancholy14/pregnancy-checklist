import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * seo-faq-jsonld
 * spec: docs/features/faq-jsonld/spec.md
 * qa:   docs/features/faq-jsonld/qa.md
 * impl: docs/implementation/faq-jsonld-impl.md
 *
 * AEO 신호: 5개 backfill 글에 FAQPage JSON-LD 주입 (frontmatter `faq:` SSOT).
 * 회귀 가드:
 *   - Article JSON-LD 가 첫 번째 script[type=application/ld+json] 위치 유지 (seo-sitemap-article-jsonld.spec.ts 의 .first() 호환)
 *   - FAQ-less 글에는 FAQPage 미주입
 *   - fs-level: 5개 글 frontmatter faq 키 + 빌드 산출물 "@type":"FAQPage" 5건
 *   - FAQ 답변 안에 ⚠️ 와 ` → ` 패턴 부재 (blog-writer-persona.md 룰의 자동 강제)
 */

const REPO = path.resolve(__dirname, "..");
const ARTICLES_DIR = path.join(REPO, "src/content/articles");
const OUT_DIR = path.join(REPO, "out/articles");

const BACKFILL_SLUGS = [
  "early-pregnancy-tests",
  "early-pregnancy-fatigue-reasons",
  "2026-parental-leave-guide",
  "babyfair-survival-guide",
  "pregnancy-foods-to-avoid",
] as const;

const FAQLESS_SAMPLE_SLUG = "weekly-prenatal-checklist";

type FaqItem = { q: string; a: string };

function readFrontmatterFaq(slug: string): FaqItem[] {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  if (!Array.isArray(data.faq)) {
    throw new Error(`Article ${slug}: frontmatter faq is not an array`);
  }
  return data.faq as FaqItem[];
}

async function getLdJsonScripts(page: Page, slug: string): Promise<unknown[]> {
  await page.goto(`/articles/${slug}`);
  const handles = await page.locator('script[type="application/ld+json"]').all();
  const parsed: unknown[] = [];
  for (const h of handles) {
    const text = await h.textContent();
    if (!text) continue;
    parsed.push(JSON.parse(text));
  }
  return parsed;
}

function pickFaqPage(scripts: unknown[]): Record<string, unknown> | undefined {
  return scripts.find(
    (s): s is Record<string, unknown> =>
      !!s &&
      typeof s === "object" &&
      (s as Record<string, unknown>)["@type"] === "FAQPage",
  );
}

test.describe("seo-faq-jsonld", () => {
  test.describe("Happy Path (5개 backfill 글)", () => {
    for (const slug of BACKFILL_SLUGS) {
      test(`${slug}: FAQPage JSON-LD 가 정확히 1개 주입되고 mainEntity 길이가 frontmatter faq 길이와 일치한다`, async ({
        page,
      }) => {
        // 무엇을: 글 페이지 진입 시 ld+json 스크립트 중 "@type":"FAQPage" 가 1개만 존재하고
        //        mainEntity 배열 길이가 frontmatter `faq:` 길이와 일치하는지
        // 왜: SSOT 보장 — frontmatter 변경이 곧 JSON-LD 변경. 어긋나면 SERP·AI 인용 신뢰도 하락.
        const scripts = await getLdJsonScripts(page, slug);
        const faqPages = scripts.filter(
          (s) =>
            !!s &&
            typeof s === "object" &&
            (s as Record<string, unknown>)["@type"] === "FAQPage",
        );
        expect(faqPages).toHaveLength(1);

        const faqPage = faqPages[0] as Record<string, unknown>;
        const mainEntity = faqPage.mainEntity as unknown[];
        expect(Array.isArray(mainEntity)).toBe(true);

        const expected = readFrontmatterFaq(slug);
        expect(mainEntity.length).toBe(expected.length);

        const firstQuestion = mainEntity[0] as Record<string, unknown>;
        expect(firstQuestion["@type"]).toBe("Question");
        expect(firstQuestion.name).toBe(expected[0].q);

        const accepted = firstQuestion.acceptedAnswer as Record<string, unknown>;
        expect(accepted["@type"]).toBe("Answer");
        expect(typeof accepted.text).toBe("string");
        const text = accepted.text as string;
        expect(/<[^>]+>/.test(text)).toBe(false);
        expect(/\[[^\]]+\]\([^)]*\)/.test(text)).toBe(false);
      });
    }

    test("샘플 글의 본문 FAQ 섹션과 JSON-LD mainEntity[0].name 이 1:1 일치한다 (SSOT)", async ({
      page,
    }) => {
      // 무엇을: 본문 렌더 h3 텍스트 == JSON-LD mainEntity[0].name (1쌍 sample)
      // 왜: 본문 ↔ JSON-LD SSOT 가드 — 운영자가 frontmatter 만 갱신해도 양쪽 일치 보장.
      const slug = BACKFILL_SLUGS[0];
      const scripts = await getLdJsonScripts(page, slug);
      const faqPage = pickFaqPage(scripts);
      expect(faqPage).toBeTruthy();
      const firstQ = (faqPage!.mainEntity as Record<string, unknown>[])[0];
      const expectedQ = firstQ.name as string;

      const section = page.getByRole("region", { name: "자주 묻는 질문" });
      await expect(section).toBeVisible();
      await expect(section.getByRole("heading", { level: 3 }).first()).toHaveText(
        expectedQ,
      );
    });
  });

  test.describe("Error / Validation (회귀 가드)", () => {
    test(`FAQ-less 글 (${FAQLESS_SAMPLE_SLUG}) 에는 FAQPage JSON-LD 가 주입되지 않는다`, async ({
      page,
    }) => {
      // 무엇을: frontmatter `faq:` 가 없는 글은 FAQPage script 부재
      // 왜: 조건부 주입 분기 회귀 가드. 잘못 누락된 FAQPage 가 빈 mainEntity 로 나가면 SERP 페널티.
      const scripts = await getLdJsonScripts(page, FAQLESS_SAMPLE_SLUG);
      const faqPages = scripts.filter(
        (s) =>
          !!s &&
          typeof s === "object" &&
          (s as Record<string, unknown>)["@type"] === "FAQPage",
      );
      expect(faqPages).toHaveLength(0);
    });

    test("5개 글 모두 첫 번째 ld+json script 는 Article 타입 유지 (주입 순서 가드)", async ({
      page,
    }) => {
      // 무엇을: page.tsx 가 ArticleJsonLd 를 먼저 렌더해 .first() 가 Article 을 가리키는지
      // 왜: seo-sitemap-article-jsonld.spec.ts:29 의 .first() 동작 호환. 순서가 뒤집히면 회귀.
      for (const slug of BACKFILL_SLUGS) {
        const scripts = await getLdJsonScripts(page, slug);
        expect(scripts.length).toBeGreaterThanOrEqual(2);
        const first = scripts[0] as Record<string, unknown>;
        expect(first["@type"]).toBe("Article");
      }
    });

    test("fs-level: 5개 backfill 글 파일에 frontmatter faq 키가 존재한다", async () => {
      // 무엇을: 글 파일에서 직접 gray-matter 파싱했을 때 faq 가 비어있지 않은 배열인지
      // 왜: 향후 운영자가 실수로 frontmatter faq 를 지워도 fs-level 가드가 회귀 즉시 캐치.
      for (const slug of BACKFILL_SLUGS) {
        const faq = readFrontmatterFaq(slug);
        expect(faq.length).toBeGreaterThan(0);
        for (let i = 0; i < faq.length; i++) {
          expect(faq[i].q.trim().length).toBeGreaterThan(0);
          expect(faq[i].a.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test("fs-level: out/articles/<slug>.html 산출물에 \"@type\":\"FAQPage\" 가 5건 존재한다", async () => {
      // 무엇을: 빌드 후 정적 HTML 산출물에 5개 글 모두 FAQPage JSON-LD 가 박혀 있는지
      // 왜: 페이지 방문 가드와 직교 — 빌드 산출물 자체의 회귀를 fs-level 로 직접 차단.
      for (const slug of BACKFILL_SLUGS) {
        const html = fs.readFileSync(
          path.join(OUT_DIR, `${slug}.html`),
          "utf-8",
        );
        const faqPageMatches = html.match(/"@type":"FAQPage"/g) ?? [];
        expect(faqPageMatches.length).toBe(1);
        const questionMatches = html.match(/"@type":"Question"/g) ?? [];
        expect(questionMatches.length).toBeGreaterThanOrEqual(1);
      }
    });

    test("fs-level: 5개 글 FAQ 답변에 ⚠️ 문자가 사용되지 않는다 (disclaimer 오인 추출 방지)", async () => {
      // 무엇을: frontmatter faq[*].a 에 ⚠️ 부재
      // 왜: MEMORY feedback_warning_emoji_rule — 본문/FAQ 박스의 ⚠️ 는 disclaimer 로 오인 추출됨.
      for (const slug of BACKFILL_SLUGS) {
        const faq = readFrontmatterFaq(slug);
        for (let i = 0; i < faq.length; i++) {
          expect(
            faq[i].a.includes("⚠️"),
            `${slug} faq[${i}].a contains ⚠️`,
          ).toBe(false);
        }
      }
    });

    test("fs-level: 5개 글 FAQ 답변에 ` → ` 외부 링크 화살표 패턴이 없다", async () => {
      // 무엇을: frontmatter faq[*].a 에 ` → ` (공백+화살표+공백) 패턴 부재
      // 왜: design-bundle-o-external-link.spec.ts 정책 확장 — 외부 출처는 마크다운 링크 또는 평문.
      for (const slug of BACKFILL_SLUGS) {
        const faq = readFrontmatterFaq(slug);
        for (let i = 0; i < faq.length; i++) {
          expect(
            faq[i].a.includes(" → "),
            `${slug} faq[${i}].a contains ' → ' arrow`,
          ).toBe(false);
        }
      }
    });
  });

  test.describe("권한 / 인증", () => {
    // N/A — output: "export" 정적 사이트, 백엔드 인증 없음.
    // FAQ JSON-LD 는 글 페이지의 server-rendered HTML 에 박혀 있으며 비로그인 공개 접근.
    test.skip("정적 사이트 — 인증 분기 없음", () => {});
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일 뷰포트에서도 FAQPage JSON-LD 가 동일하게 주입된다", async ({
      page,
    }) => {
      // 무엇을: viewport 와 무관하게 server-rendered HTML 에 FAQPage 존재
      // 왜: SEO/AEO 메타는 디바이스 의존하면 안 됨. 회귀 sanity 가드.
      const slug = BACKFILL_SLUGS[0];
      const scripts = await getLdJsonScripts(page, slug);
      const faqPage = pickFaqPage(scripts);
      expect(faqPage).toBeTruthy();
      const mainEntity = faqPage!.mainEntity as unknown[];
      expect(mainEntity.length).toBeGreaterThan(0);
    });
  });
});
