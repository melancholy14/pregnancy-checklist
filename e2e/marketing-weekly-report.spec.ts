import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * marketing-weekly-report CLI 스크립트 검증.
 *
 * - GA4 / Claude 실 호출은 하지 않는다. 진입 직후 검증(env, SA mode, 경로)과
 *   실패 분기(_failed/ 로그·exit code·stderr)만 검사한다.
 * - 실패 로그를 쓰는 테스트는 HOME을 tmp 디렉토리로 격리해 실제 vault를 오염시키지 않는다.
 * - UI 반응형 카테고리는 CLI 스크립트에 적용 불가 — 환경 변동(작업 디렉토리·타임존)으로 대체했다.
 */

const SCRIPT_DIR = path.resolve("scripts/weekly-report");
const SCRIPT_ENTRY = path.join(SCRIPT_DIR, "index.ts");
const REQUIRED_FILES = ["index.ts", "ga4-queries.ts", "claude-prompt.ts", "writer.ts", "types.ts"];

type ExecError = { status: number | null; stderr: string; stdout: string };

function runScript(
  args: string,
  env: Record<string, string | undefined>,
): { stdout: string; stderr: string; status: number; home: string } {
  // 모든 실행은 tmp HOME에서 — main().catch가 _failed/ 로그를 쓰므로
  // HOME을 격리하지 않으면 실제 ~/Documents/pregnancy-checklist 가 오염된다.
  const home = env.HOME ?? fs.mkdtempSync(path.join(os.tmpdir(), "weekly-report-run-"));
  try {
    const stdout = execSync(`npx tsx scripts/weekly-report/index.ts ${args}`.trim(), {
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, ...env, HOME: home },
    });
    return { stdout, stderr: "", status: 0, home };
  } catch (err) {
    const e = err as ExecError;
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", status: e.status ?? 1, home };
  }
}

function makeTmpHome(): { home: string; cleanup: () => void } {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "weekly-report-home-"));
  return {
    home,
    cleanup: () => {
      if (fs.existsSync(home)) fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

function writeFakeSaKey(home: string, mode: number): string {
  const dir = path.join(home, ".config/pregnancy-checklist");
  fs.mkdirSync(dir, { recursive: true });
  const keyPath = path.join(dir, "ga4-sa.json");
  fs.writeFileSync(keyPath, JSON.stringify({ type: "service_account", project_id: "fake" }), {
    mode,
  });
  // writeFileSync mode is not always honored on some FS — force chmod.
  fs.chmodSync(keyPath, mode);
  return keyPath;
}

test.describe("Happy Path — 인프라 / 배포 산출물", () => {
  test("scripts/weekly-report 5개 파일이 모두 존재한다", () => {
    // 무엇을: spec.md must 항목 — 묶음 L의 5개 파일 골격
    // 왜: 이 골격이 깨지면 launchd 등록(묶음 M)이 시작될 수 없음
    for (const name of REQUIRED_FILES) {
      expect(fs.existsSync(path.join(SCRIPT_DIR, name))).toBe(true);
    }
  });

  test("package.json에 report:weekly + dry-run 스크립트가 등록되어 있다", () => {
    // 무엇을: spec must 항목의 npm 스크립트 라우트
    // 왜: 운영자가 외울 명령은 단 두 개. 둘 다 존재해야 실수 없이 호출 가능
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    expect(pkg.scripts["report:weekly"]).toBe("npx tsx scripts/weekly-report/index.ts");
    expect(pkg.scripts["report:weekly:dry-run"]).toBe(
      "npx tsx scripts/weekly-report/index.ts --dry-run",
    );
  });

  test("devDependencies에 @google-analytics/data, @anthropic-ai/sdk, openai 3종 SDK 명시", () => {
    // 무엇을: plan §1.9.7 L1 + Claude→OpenAI fallback 라운드
    // 왜: 누락 시 런타임 모듈 미발견. 빌드 단계가 잡지 못하는 영역이라 정적으로 확인
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    expect(pkg.devDependencies["@google-analytics/data"]).toBeTruthy();
    expect(pkg.devDependencies["@anthropic-ai/sdk"]).toBeTruthy();
    expect(pkg.devDependencies["openai"]).toBeTruthy();
  });

  test(".env.example에 GA4 + LLM env 4종 정의 (Claude + OpenAI)", () => {
    // 무엇을: spec §3 보안 — 환경변수 경유 원칙 + fallback 라운드의 OPENAI_API_KEY 추가
    // 왜: 운영자가 .env.local 만들 때 누락 없이 채워야 첫 실행과 fallback이 모두 통함
    const envExample = fs.readFileSync(path.resolve(".env.example"), "utf8");
    expect(envExample).toContain("GA4_PROPERTY_ID");
    expect(envExample).toContain("GA4_SA_KEY_PATH");
    expect(envExample).toContain("ANTHROPIC_API_KEY");
    expect(envExample).toContain("OPENAI_API_KEY");
  });

  test("vault 60-analytics/README.md 가 운영 안내·스키마 정의를 포함", () => {
    // 무엇을: spec must — vault 디렉토리 구조 + 지표 정의 README
    // 왜: 1인 운영자가 6개월 뒤 리포트를 다시 읽을 때 이 README 한 장이 단서
    // CI 머신에는 운영자 Obsidian vault가 존재하지 않으므로 로컬에서만 검증한다.
    const readmePath = path.join(
      os.homedir(),
      "Documents/pregnancy-checklist/60-analytics/README.md",
    );
    test.skip(!fs.existsSync(readmePath), "vault README는 운영자 로컬에만 존재 (CI skip)");
    const body = fs.readFileSync(readmePath, "utf8");
    expect(body).toContain("Pattern C");
    expect(body).toContain("§1.9.6");
    expect(body).toContain("report:weekly:dry-run");
  });

  test("스크립트 진입 파일이 GA4 + Claude + OpenAI SDK를 직접 가져온다", () => {
    // 무엇을: spec §3 — Pattern C는 SDK를 직접 호출. fallback도 동일하게 SDK 경유
    // 왜: HTTP fetch 등으로 우회 구현되면 보안·캐싱·usage 회계 가정이 깨짐. 정적 grep으로 잠금
    const ga4 = fs.readFileSync(path.join(SCRIPT_DIR, "ga4-queries.ts"), "utf8");
    const claude = fs.readFileSync(path.join(SCRIPT_DIR, "claude-prompt.ts"), "utf8");
    const openai = fs.readFileSync(path.join(SCRIPT_DIR, "openai-prompt.ts"), "utf8");
    expect(ga4).toContain('from "@google-analytics/data"');
    expect(claude).toContain('from "@anthropic-ai/sdk"');
    expect(claude).toContain('claude-sonnet-4-6');
    expect(claude).toContain('cache_control');
    expect(openai).toContain('from "openai"');
    expect(openai).toContain('"gpt-4o"');
  });
});

test.describe("Error / Validation — env 검증", () => {
  test("GA4_PROPERTY_ID 미설정 시 stderr에 안내 + 비정상 종료", () => {
    // 무엇을: spec §3 보안 — 절대경로/키 하드코딩 금지, 모두 env 경유
    // 왜: 누락된 채로 운영 진입하면 GA4 토큰 0 호출. 즉시 차단해야 함
    const { stderr, status } = runScript("", {
      GA4_PROPERTY_ID: "",
      GA4_SA_KEY_PATH: "/tmp/nonexistent",
      ANTHROPIC_API_KEY: "test",
    });
    expect(status).not.toBe(0);
    expect(stderr).toContain("GA4_PROPERTY_ID");
  });

  test("GA4_SA_KEY_PATH 미설정 시 stderr에 안내 + 비정상 종료", () => {
    // 무엇을: 동일 § 보안. SA 키 없이는 GA4 인증 불가
    // 왜: 빈 경로로 진입하면 즉시 차단하지 않을 경우 라이브러리 내부 stack trace로 진단 어려움
    const { stderr, status } = runScript("", {
      GA4_PROPERTY_ID: "123456",
      GA4_SA_KEY_PATH: "",
      ANTHROPIC_API_KEY: "test",
    });
    expect(status).not.toBe(0);
    expect(stderr).toContain("GA4_SA_KEY_PATH");
  });

  test("실 모드에서 Claude·OpenAI 키가 모두 없으면 비정상 종료", () => {
    // 무엇을: fallback 라운드 — 둘 다 비면 LLM 호출이 불가능
    // 왜: 한 쪽만 있어도 통과시키는 게 fallback의 핵심. 둘 다 없을 때만 즉시 차단
    const { stderr, status } = runScript("", {
      GA4_PROPERTY_ID: "123456",
      GA4_SA_KEY_PATH: "/tmp/nonexistent",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
    });
    expect(status).not.toBe(0);
    expect(stderr).toContain("ANTHROPIC_API_KEY");
    expect(stderr).toContain("OPENAI_API_KEY");
  });

  test("ANTHROPIC_API_KEY 없이 OPENAI_API_KEY만 있으면 env 단계를 통과한다 (OpenAI fallback)", () => {
    // 무엇을: fallback 라운드 — Claude 키 부재 시 OpenAI로 자동 전환
    // 왜: 본 라운드 가치의 핵심. 한 쪽이 비어도 다른 쪽으로 리포트가 끝까지 생성되어야 함
    const { stderr } = runScript("", {
      GA4_PROPERTY_ID: "123456",
      GA4_SA_KEY_PATH: "/tmp/nonexistent",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "test",
    });
    // env 검증은 통과해야 한다. 실패는 GA4_SA_KEY_PATH 단계로 이동.
    expect(stderr).not.toMatch(/Required env vars.*ANTHROPIC_API_KEY.*OPENAI_API_KEY/);
    expect(stderr).toContain("GA4_SA_KEY_PATH");
  });

  test("--dry-run 모드는 두 LLM 키가 모두 없어도 env 단계를 통과한다", () => {
    // 무엇을: review.md 항목 2 옵션 C — dry-run으로 cohortSpec 사실 확인
    // 왜: 첫 라운드 의사결정 비용을 줄이려면 LLM 키 없이도 GA4만 시도 가능해야 함
    const { stderr } = runScript("--dry-run", {
      GA4_PROPERTY_ID: "123456",
      GA4_SA_KEY_PATH: "/tmp/nonexistent",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
    });
    expect(stderr).not.toContain('"ANTHROPIC_API_KEY"');
    expect(stderr).not.toContain('"OPENAI_API_KEY"');
    expect(stderr).toContain("GA4_SA_KEY_PATH");
  });
});

test.describe("권한 / SA JSON 모드 검증", () => {
  test("SA JSON mode != 0600 일 때 stderr 경고를 출력한다 (hard block 아님)", () => {
    // 무엇을: spec §4 엣지 케이스 — mode 비정상은 경고만, 실행은 계속
    // 왜: 운영자가 즉시 chmod 할 수 있도록 신호를 보내되, 매주 자동 실행이 멈추면 안 됨
    const { home, cleanup } = makeTmpHome();
    try {
      const saPath = writeFakeSaKey(home, 0o644);
      const { stderr } = runScript("--dry-run", {
        HOME: home,
        GA4_PROPERTY_ID: "123456",
        GA4_SA_KEY_PATH: saPath,
        ANTHROPIC_API_KEY: "",
      });
      expect(stderr).toContain("permissions are 644");
      expect(stderr).toContain("chmod 600");
    } finally {
      cleanup();
    }
  });

  test("SA JSON mode = 0600 일 때 권한 경고가 출력되지 않는다", () => {
    // 무엇을: 정상 권한이면 silent. 노이즈 방지
    // 왜: 잘못된 경고로 운영자가 매주 노이즈에 둔감해지면 진짜 경고도 무시하게 됨
    const { home, cleanup } = makeTmpHome();
    try {
      const saPath = writeFakeSaKey(home, 0o600);
      const { stderr } = runScript("--dry-run", {
        HOME: home,
        GA4_PROPERTY_ID: "123456",
        GA4_SA_KEY_PATH: saPath,
        ANTHROPIC_API_KEY: "",
      });
      expect(stderr).not.toContain("permissions are");
      expect(stderr).not.toContain("chmod 600");
    } finally {
      cleanup();
    }
  });

  test("SA JSON 경로가 없으면 _failed/ 로그가 생성되고 stderr에 경로가 안내된다", () => {
    // 무엇을: spec §4 — vault 디렉토리 부재여도 mkdir로 자동 생성 (실패 로그는 항상 남김)
    // 왜: 조용한 실패를 막는 안전망. macOS 알림 트리거 경로와 동일
    const { home, cleanup } = makeTmpHome();
    try {
      const { stderr, status } = runScript("", {
        HOME: home,
        GA4_PROPERTY_ID: "123456",
        GA4_SA_KEY_PATH: path.join(home, "does-not-exist.json"),
        ANTHROPIC_API_KEY: "test",
      });
      expect(status).not.toBe(0);
      const failedDir = path.join(home, "Documents/pregnancy-checklist/60-analytics/weekly/_failed");
      expect(fs.existsSync(failedDir)).toBe(true);
      const failedFiles = fs.readdirSync(failedDir).filter((f) => f.endsWith(".log"));
      expect(failedFiles.length).toBeGreaterThan(0);
      const log = fs.readFileSync(path.join(failedDir, failedFiles[0]), "utf8");
      expect(log).toContain("GA4_SA_KEY_PATH does not exist");
      expect(stderr).toMatch(/log:.*_failed.*\.log/);
    } finally {
      cleanup();
    }
  });
});

test.describe("환경 변동 — CLI 특성상 UI 반응형 N/A", () => {
  // UI 반응형 카테고리는 CLI 스크립트에 적용 불가. cwd · 타임존 등 환경 변동에서
  // 출력 경로/주차 계산이 깨지지 않는지로 대체한다.

  test("실패 로그가 ISO 주차 라벨(YYYY-Www) 형식의 파일명을 따른다", () => {
    // 무엇을: spec §1.9.6 — 출력 명명 규칙
    // 왜: launchd 후속 라운드에서 동일 패턴으로 파일 정렬·롤업이 가능해야 함
    const { home, cleanup } = makeTmpHome();
    try {
      runScript("", {
        HOME: home,
        GA4_PROPERTY_ID: "123456",
        GA4_SA_KEY_PATH: path.join(home, "missing.json"),
        ANTHROPIC_API_KEY: "test",
      });
      const failedDir = path.join(home, "Documents/pregnancy-checklist/60-analytics/weekly/_failed");
      const files = fs.readdirSync(failedDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/^\d{4}-W\d{2}\.log$/);
    } finally {
      cleanup();
    }
  });

  test("스크립트가 cwd 기준으로 .env.local 을 로드한다 (launchd WorkingDirectory 가정)", () => {
    // 무엇을: 묶음 M에서 launchd가 WorkingDirectory를 프로젝트 루트로 잡아준다는 가정
    // 왜: 만약 절대경로로 .env.local을 찾도록 짜이면 launchd 환경에서 키를 읽지 못함
    const source = fs.readFileSync(SCRIPT_ENTRY, "utf8");
    expect(source).toContain('path.resolve(".env.local")');
  });
});
