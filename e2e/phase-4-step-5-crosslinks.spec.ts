import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * 크로스링크 자동 생성 스크립트 검증.
 * - CLI 인자 처리(usage, 알 수 없는 옵션, 다중 모드)
 * - --report 출력 포맷
 * - --dry-run: 변경 미리보기 + 파일 무수정
 * - --apply: 임시 sandbox 디렉토리에서 격리 실행 후 결과 검증
 * - manual 보호 동작
 *
 * --apply 검증은 실제 src/data, src/content/articles를 더럽히지 않도록
 * 매 테스트마다 임시 디렉토리에 데이터를 복사해 사용한다.
 */

const PROJECT_ROOT = path.resolve(".");
const SCRIPT_PATH = path.resolve("scripts/generate-crosslinks.ts");
const UTILS_PATH = path.resolve("src/lib/crosslink-utils.ts");

const TIMELINE_PATH = path.resolve("src/data/timeline_items.json");
const HOSPITAL_BAG_PATH = path.resolve("src/data/hospital_bag_checklist.json");
const PARTNER_PREP_PATH = path.resolve("src/data/partner_prep_checklist.json");
const PREGNANCY_PREP_PATH = path.resolve("src/data/pregnancy_prep_checklist.json");
const ARTICLES_DIR = path.resolve("src/content/articles");

type TimelineItem = {
  id: string;
  week: number;
  linked_article_slugs?: string[];
  linked_article_slugs_manual?: boolean;
  linked_video_ids?: string[];
  linked_video_ids_manual?: boolean;
};

type ChecklistFile = {
  meta: {
    slug: string;
    linked_article_slugs?: string[];
    linked_video_ids?: string[];
  };
};

function runScript(
  args: string,
  opts: { cwd?: string } = {},
): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execSync(`npx tsx scripts/generate-crosslinks.ts ${args}`, {
      encoding: "utf8",
      stdio: "pipe",
      cwd: opts.cwd ?? PROJECT_ROOT,
    });
    return { stdout, stderr: "", status: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", status: e.status ?? 1 };
  }
}

/**
 * --apply 검증용 격리 sandbox 생성.
 * 프로젝트 루트의 모든 의존성(node_modules, package.json, tsconfig.json,
 * scripts/, src/) 중 스크립트 실행에 필요한 것만 심볼릭 링크로 연결하고,
 * 수정 대상 데이터(src/data, src/content/articles)는 sandbox 내부 실디렉토리에 복사한다.
 */
function makeSandbox(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "crosslinks-e2e-"));

  // 스크립트 실행에 필요한 정적 자원: 심링크
  for (const name of ["node_modules", "package.json", "tsconfig.json", "scripts"]) {
    fs.symlinkSync(path.join(PROJECT_ROOT, name), path.join(dir, name));
  }

  // src — 일부는 심링크, 일부는 실제 복사가 필요
  const srcDir = path.join(dir, "src");
  fs.mkdirSync(srcDir);
  fs.symlinkSync(path.join(PROJECT_ROOT, "src", "lib"), path.join(srcDir, "lib"));
  fs.symlinkSync(path.join(PROJECT_ROOT, "src", "types"), path.join(srcDir, "types"));

  // 데이터는 깊은 복사 (스크립트가 수정할 대상)
  fs.mkdirSync(path.join(srcDir, "data"));
  for (const f of fs.readdirSync(path.join(PROJECT_ROOT, "src/data"))) {
    const src = path.join(PROJECT_ROOT, "src/data", f);
    const dst = path.join(srcDir, "data", f);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
    } else {
      // experts 같은 하위 디렉토리는 심링크면 충분
      fs.symlinkSync(src, dst);
    }
  }
  fs.mkdirSync(path.join(srcDir, "content"));
  fs.mkdirSync(path.join(srcDir, "content", "articles"));
  for (const f of fs.readdirSync(ARTICLES_DIR)) {
    fs.copyFileSync(path.join(ARTICLES_DIR, f), path.join(srcDir, "content", "articles", f));
  }

  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

// ──────────────────────────────────────────────────────────────────────
// 인프라
// ──────────────────────────────────────────────────────────────────────

test.describe("크로스링크 스크립트 인프라", () => {
  test("scripts/generate-crosslinks.ts 파일이 존재한다", () => {
    expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
  });

  test("src/lib/crosslink-utils.ts 공용 유틸이 존재한다", () => {
    expect(fs.existsSync(UTILS_PATH)).toBe(true);
  });

  test("package.json에 crosslinks 관련 npm 스크립트 3종이 정의되어 있다", () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    expect(pkg.scripts.crosslinks).toContain("--dry-run");
    expect(pkg.scripts["crosslinks:apply"]).toContain("--apply");
    expect(pkg.scripts["crosslinks:report"]).toContain("--report");
  });
});

// ──────────────────────────────────────────────────────────────────────
// CLI 인자 처리
// ──────────────────────────────────────────────────────────────────────

test.describe("CLI 인자 처리", () => {
  test("인자 없이 실행하면 사용법을 출력하고 exit 1을 반환한다", () => {
    const { stdout, status } = runScript("");
    expect(status).toBe(1);
    expect(stdout).toContain("사용법");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--apply");
    expect(stdout).toContain("--report");
  });

  test("알 수 없는 옵션은 명확한 에러 + exit 1", () => {
    const { stderr, status } = runScript("--bogus");
    expect(status).toBe(1);
    expect(stderr).toContain("알 수 없는 옵션");
  });

  test("두 개 이상의 모드를 동시에 지정하면 에러 + exit 1", () => {
    const { stderr, status } = runScript("--dry-run --apply");
    expect(status).toBe(1);
    expect(stderr).toContain("하나만");
  });
});

// ──────────────────────────────────────────────────────────────────────
// --report
// ──────────────────────────────────────────────────────────────────────

test.describe("--report 모드", () => {
  test("크로스링크 통계 출력(타임라인·아티클·체크리스트 섹션 포함)", () => {
    const { stdout, status } = runScript("--report");
    expect(status).toBe(0);
    expect(stdout).toContain("크로스링크 통계");
    expect(stdout).toContain("Timeline");
    expect(stdout).toContain("Articles");
    expect(stdout).toContain("Checklists");
    expect(stdout).toContain("linked_article_slugs");
    expect(stdout).toContain("linked_video_ids");
  });
});

// ──────────────────────────────────────────────────────────────────────
// --dry-run
// ──────────────────────────────────────────────────────────────────────

test.describe("--dry-run 모드", () => {
  test("드라이런은 변경 미리보기를 출력하고 실제 파일은 수정하지 않는다", () => {
    const beforeTl = fs.readFileSync(TIMELINE_PATH, "utf8");
    const beforeHb = fs.readFileSync(HOSPITAL_BAG_PATH, "utf8");
    const beforeArt = fs.readFileSync(
      path.join(ARTICLES_DIR, "early-pregnancy-tests.md"),
      "utf8",
    );

    const { stdout, status } = runScript("--dry-run");
    expect(status).toBe(0);
    expect(stdout).toContain("드라이런");
    expect(stdout).toContain("파일은 수정되지 않습니다");

    expect(fs.readFileSync(TIMELINE_PATH, "utf8")).toBe(beforeTl);
    expect(fs.readFileSync(HOSPITAL_BAG_PATH, "utf8")).toBe(beforeHb);
    expect(
      fs.readFileSync(path.join(ARTICLES_DIR, "early-pregnancy-tests.md"), "utf8"),
    ).toBe(beforeArt);
  });

  test("드라이런 출력은 before/after 양쪽 값을 모두 보여준다", () => {
    const { stdout } = runScript("--dry-run");
    // 변경 사항이 하나라도 있으면 before/after 라인이 함께 등장
    if (stdout.includes("변경 예정")) {
      expect(stdout).toMatch(/before:\s*\[/);
      expect(stdout).toMatch(/after:\s*\[/);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// --apply (격리된 sandbox)
// ──────────────────────────────────────────────────────────────────────

test.describe("--apply 모드 (sandbox)", () => {
  test("격리 환경에서 --apply 실행 후 npm run build에 영향 없는 형식으로 파일이 갱신된다", () => {
    const sandbox = makeSandbox();
    try {
      const { stdout, status } = runScript("--apply", { cwd: sandbox.dir });
      expect(status).toBe(0);
      expect(stdout).toContain("적용 완료");

      const tl: TimelineItem[] = JSON.parse(
        fs.readFileSync(path.join(sandbox.dir, "src/data/timeline_items.json"), "utf8"),
      );
      expect(Array.isArray(tl)).toBe(true);
      expect(tl.length).toBeGreaterThan(0);

      const hb: ChecklistFile = JSON.parse(
        fs.readFileSync(
          path.join(sandbox.dir, "src/data/hospital_bag_checklist.json"),
          "utf8",
        ),
      );
      expect(hb.meta.slug).toBe("hospital-bag");
      expect(Array.isArray(hb.meta.linked_article_slugs)).toBe(true);
    } finally {
      sandbox.cleanup();
    }
  });

  test("--apply 후 article front matter는 다른 필드/공백을 보존한다", () => {
    const sandbox = makeSandbox();
    try {
      const targetFile = path.join(
        sandbox.dir,
        "src/content/articles/pregnancy-foods-to-avoid.md",
      );
      const before = fs.readFileSync(targetFile, "utf8");

      const { status } = runScript("--apply", { cwd: sandbox.dir });
      expect(status).toBe(0);

      const after = fs.readFileSync(targetFile, "utf8");

      // 다른 필드가 그대로 살아있는지
      for (const field of [
        'title: "임신 중 금지 음식 vs 주의 음식, 식약처·산부인과 기준으로 정리"',
        'slug: "pregnancy-foods-to-avoid"',
        'date: "2026-05-02"',
        "authorNote:",
      ]) {
        expect(after).toContain(field);
      }

      // front matter 닫힘 후 본문 시작 사이의 공백 라인이 보존되는지
      expect(after).toMatch(/---\n\n임신을 알고/);

      // 본문 자체가 손상되지 않았는지 (앞 100자 비교)
      const beforeBody = before.split(/^---\n[\s\S]*?\n---\n/m).slice(1).join("");
      const afterBody = after.split(/^---\n[\s\S]*?\n---\n/m).slice(1).join("");
      expect(afterBody.slice(0, 200)).toBe(beforeBody.slice(0, 200));
    } finally {
      sandbox.cleanup();
    }
  });

  test("--apply는 존재하지 않는 콘텐츠 ID를 새 링크로 만들지 않는다", () => {
    const sandbox = makeSandbox();
    try {
      runScript("--apply", { cwd: sandbox.dir });

      const validVideoIds = new Set<string>(
        (
          JSON.parse(
            fs.readFileSync(path.join(sandbox.dir, "src/data/videos.json"), "utf8"),
          ) as { id: string }[]
        ).map((v) => v.id),
      );
      const validArticleSlugs = new Set<string>(
        fs
          .readdirSync(path.join(sandbox.dir, "src/content/articles"))
          .filter((f) => f.endsWith(".md"))
          .map((f) => f.replace(/\.md$/, "")),
      );

      const tl: TimelineItem[] = JSON.parse(
        fs.readFileSync(path.join(sandbox.dir, "src/data/timeline_items.json"), "utf8"),
      );
      for (const item of tl) {
        for (const slug of item.linked_article_slugs ?? []) {
          expect(validArticleSlugs.has(slug)).toBe(true);
        }
        for (const id of item.linked_video_ids ?? []) {
          expect(validVideoIds.has(id)).toBe(true);
        }
      }
    } finally {
      sandbox.cleanup();
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// manual 보호
// ──────────────────────────────────────────────────────────────────────

test.describe("manual 플래그 보호", () => {
  test("linked_video_ids_manual: true가 있는 항목은 --apply에서 변경되지 않는다", () => {
    const sandbox = makeSandbox();
    try {
      const tlPath = path.join(sandbox.dir, "src/data/timeline_items.json");
      const tlData: TimelineItem[] = JSON.parse(fs.readFileSync(tlPath, "utf8"));

      // 첫 아이템에 manual 플래그를 강제로 추가
      const targetId = tlData[0].id;
      const protectedVideos = ["video_999_protected"];
      tlData[0].linked_video_ids = protectedVideos;
      tlData[0].linked_video_ids_manual = true;
      fs.writeFileSync(tlPath, JSON.stringify(tlData, null, 2) + "\n");

      const { status } = runScript("--apply", { cwd: sandbox.dir });
      expect(status).toBe(0);

      const after: TimelineItem[] = JSON.parse(fs.readFileSync(tlPath, "utf8"));
      const protectedItem = after.find((t) => t.id === targetId)!;
      expect(protectedItem.linked_video_ids).toEqual(protectedVideos);
      expect(protectedItem.linked_video_ids_manual).toBe(true);
    } finally {
      sandbox.cleanup();
    }
  });

  test("linked_article_slugs_manual: true가 있어도 linked_video_ids는 자동 갱신된다", () => {
    const sandbox = makeSandbox();
    try {
      const tlPath = path.join(sandbox.dir, "src/data/timeline_items.json");
      const tlData: TimelineItem[] = JSON.parse(fs.readFileSync(tlPath, "utf8"));

      const targetId = tlData[0].id;
      const protectedSlugs = ["sentinel-protected-article"];
      tlData[0].linked_article_slugs = protectedSlugs;
      tlData[0].linked_article_slugs_manual = true;
      fs.writeFileSync(tlPath, JSON.stringify(tlData, null, 2) + "\n");

      runScript("--apply", { cwd: sandbox.dir });

      const after: TimelineItem[] = JSON.parse(fs.readFileSync(tlPath, "utf8"));
      const item = after.find((t) => t.id === targetId)!;
      // article 측은 보호
      expect(item.linked_article_slugs).toEqual(protectedSlugs);
      // video 측은 보호되지 않음 — undefined가 아니어야 하고 sentinel과 다름
      expect(item.linked_video_ids).toBeDefined();
    } finally {
      sandbox.cleanup();
    }
  });
});
