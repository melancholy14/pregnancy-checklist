import { test, expect } from "@playwright/test";

const BASE = "https://pregnancy-checklist.com";

const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"];

const NOINDEX_PATHS = ["/info", "/videos", "/guides/hospital-bag", "/guides/weekly-prep"];

const ARTICLE_SLUGS = [
  "2026-parental-leave-guide",
  "babyfair-survival-guide",
  "early-pregnancy-fatigue-reasons",
  "early-pregnancy-tests",
  "mid-pregnancy-lifestyle-guide",
  "postpartum-care-center-guide",
  "pregnancy-exercise-starter-guide",
  "pregnancy-foods-to-avoid",
  "pregnancy-government-benefits-2026",
  "pregnancy-sleep-positions-guide",
  "pregnancy-supplements-by-week",
  "pregnancy-weight-management",
  "prenatal-education-guide",
  "prenatal-insurance-preparation-guide",
  "weekly-prenatal-checklist",
];

async function fetchText(baseURL: string, path: string): Promise<{ body: string; contentType: string; status: number }> {
  const res = await fetch(`${baseURL}${path}`);
  return {
    body: await res.text(),
    contentType: res.headers.get("content-type") ?? "",
    status: res.status,
  };
}

test.describe("llms-txt-policy", () => {
  test.describe("Happy Path", () => {
    test("/llms.txt 가 200 OK + text/plain 으로 서빙된다", async ({ baseURL }) => {
      // 무엇을: AI 크롤러가 /llms.txt 에 접근했을 때 응답이 200 + plain text 인지
      // 왜: spec §3.3 라이브 응답 조건. text/plain 아니면 크롤러가 HTML 로 오인.
      const res = await fetchText(baseURL!, "/llms.txt");
      expect(res.status).toBe(200);
      expect(res.contentType.toLowerCase()).toMatch(/^text\/plain/);
    });

    test("llms.txt 에 헤더·Articles·Checklists·Hubs·License 5 섹션이 모두 포함된다", async ({ baseURL }) => {
      // 무엇을: spec §2.must llms.txt 구성 4 그룹 헤더 + License 섹션 존재
      // 왜: 섹션 누락 시 크롤러가 어디까지 인용 허용인지 판단 못 함.
      const { body } = await fetchText(baseURL!, "/llms.txt");
      expect(body).toMatch(/^# 출산 준비 체크리스트/);
      expect(body).toContain("## Articles");
      expect(body).toContain("## Checklists");
      expect(body).toContain("## Hubs");
      expect(body).toContain("## License");
    });

    test("llms.txt 에 15개 아티클 절대 URL 이 모두 등재된다", async ({ baseURL }) => {
      // 무엇을: src/content/articles/*.md 의 15개 글 슬러그가 절대 URL 형태로 빠짐없이 포함
      // 왜: 글 추가/리네임 시 llms.txt 갱신 누락을 잡는 회귀 가드 (수동 작성 모드).
      const { body } = await fetchText(baseURL!, "/llms.txt");
      for (const slug of ARTICLE_SLUGS) {
        expect(body).toContain(`${BASE}/articles/${slug}`);
      }
    });

    test("llms.txt 에 체크리스트·허브 절대 URL 이 빠짐없이 등재된다", async ({ baseURL }) => {
      // 무엇을: spec §2.must Checklists 4개 + Hubs 5개 절대 URL 존재
      // 왜: BREADCRUMB_LABELS 와 llms.txt 의 사이트 IA 일관성 보장.
      const { body } = await fetchText(baseURL!, "/llms.txt");
      const required = [
        "/checklist",
        "/checklist/hospital-bag",
        "/checklist/partner-prep",
        "/checklist/pregnancy-prep",
        "/timeline",
        "/baby-fair",
        "/weight",
        "/about",
        "/articles",
      ];
      for (const path of required) {
        expect(body).toContain(`${BASE}${path}`);
      }
    });

    test("/robots.txt 에 기본 룰 + 5 AI 크롤러 Allow: / 블록이 모두 존재한다", async ({ baseURL }) => {
      // 무엇을: 기본 User-agent:* + GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot 5 블록 각각 Allow:/
      // 왜: spec §3.must AI 크롤러 명시 allow. 기본 룰이 사라지면 일반 크롤러 누락 위험.
      const { body, status } = await fetchText(baseURL!, "/robots.txt");
      expect(status).toBe(200);
      expect(body).toMatch(/User-Agent:\s*\*/i);
      for (const ua of AI_CRAWLERS) {
        const block = new RegExp(`User-Agent:\\s*${ua}\\s*\\n\\s*Allow:\\s*/`, "i");
        expect(body).toMatch(block);
      }
    });

    test("/robots.txt 의 Sitemap 라인이 유지된다", async ({ baseURL }) => {
      // 무엇을: 기존 sitemap 선언이 rules 배열 변경 후에도 보존되는지
      // 왜: spec §3.4 회귀 가드 — sitemap 라인 사라지면 검색엔진 sitemap 자동 발견 끊김.
      const { body } = await fetchText(baseURL!, "/robots.txt");
      expect(body).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    });
  });

  test.describe("Error / Validation (회귀 가드)", () => {
    test("llms.txt 에 NoIndex 4개 페이지가 등재되지 않는다", async ({ baseURL }) => {
      // 무엇을: /info, /videos, /guides/hospital-bag, /guides/weekly-prep 가 llms.txt 에 안 보이는지
      // 왜: spec §2.must NoIndex 제외 규칙. 색인 차단 페이지를 AI 인용 후보로 노출하면 정책 충돌.
      const { body } = await fetchText(baseURL!, "/llms.txt");
      for (const path of NOINDEX_PATHS) {
        expect(body).not.toContain(`${BASE}${path}`);
      }
    });

    test("/llms-full.txt 는 서빙되지 않는다", async ({ baseURL }) => {
      // 무엇을: 본문 통째 노출 파일이 의도적으로 부재 (404)
      // 왜: spec §2.won't — 콘텐츠 도용 위험 대비 인용 효과 불확실, 만들지 않음.
      const res = await fetch(`${baseURL}/llms-full.txt`);
      expect(res.status).toBe(404);
    });

    test("/robots.txt 어디에도 AI 크롤러 Disallow 라인이 없다", async ({ baseURL }) => {
      // 무엇을: 5개 AI 크롤러 user-agent 다음에 Disallow 가 붙어 차단되는 일이 없도록
      // 왜: spec §2.won't — 목표는 인용 받기. Disallow 추가 시 역효과.
      const { body } = await fetchText(baseURL!, "/robots.txt");
      for (const ua of AI_CRAWLERS) {
        const disallow = new RegExp(`User-Agent:\\s*${ua}[\\s\\S]*?Disallow:\\s*/`, "i");
        expect(body).not.toMatch(disallow);
      }
    });
  });
});
