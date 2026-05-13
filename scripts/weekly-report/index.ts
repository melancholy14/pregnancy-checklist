#!/usr/bin/env tsx
/**
 * Weekly report entrypoint — `npm run report:weekly`.
 *
 * Pipeline:
 *   1. Load env (.env.local) and required vars (GA4_PROPERTY_ID, GA4_SA_KEY_PATH, ANTHROPIC_API_KEY)
 *   2. Verify SA JSON file mode is 0o600 (warn-only per spec §1.9.5)
 *   3. Run GA4 Data API queries for last completed ISO week + previous week
 *   4. Call Claude (claude-sonnet-4-6 + prompt caching) → markdown report
 *   5. Write report + raw JSON to Obsidian vault
 *   6. On failure: write _failed/ log + macOS notification
 *
 * Flags:
 *   --dry-run    Skip Claude API call; print GA4 result JSON to stdout.
 *                Use this to confirm cohortSpec availability before the first
 *                real run (spec §1.9.4 D1 follow-up).
 */

import fs from "node:fs";
import path from "node:path";

import { generateWeeklyReportClaude } from "./claude-prompt.js";
import {
  collectGa4Result,
  createGa4Client,
  isoWeekLabel,
  lastCompletedIsoWeek,
  trendWeekLabels,
} from "./ga4-queries.js";
import { generateWeeklyReportOpenAI } from "./openai-prompt.js";
import { notifyMacOS, writeFailureLog, writeRawGa4, writeWeeklyReport } from "./writer.js";

import type { Ga4Result, IsoWeek, ReportResult } from "./types.js";

const REQUIRED_ENV = [
  "GA4_PROPERTY_ID",
  "GA4_SA_KEY_PATH",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

function loadEnvLocal(): void {
  const envLocalPath = path.resolve(".env.local");
  if (!fs.existsSync(envLocalPath)) return;
  for (const line of fs.readFileSync(envLocalPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

function requireEnv(name: (typeof REQUIRED_ENV)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required env var "${name}" is not set. See .env.example and spec §1.9.5.`);
  }
  return value;
}

function verifySaKeyMode(saPath: string): void {
  const resolved = saPath.startsWith("~")
    ? path.join(process.env.HOME ?? "", saPath.slice(1))
    : saPath;
  if (!fs.existsSync(resolved)) {
    throw new Error(`GA4_SA_KEY_PATH does not exist: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  const mode = stat.mode & 0o777;
  if (mode !== 0o600) {
    // Spec §1.9.5: warn only, do not hard-block.
    process.stderr.write(
      `⚠️ GA4 SA key permissions are ${mode.toString(8)} — expected 600. Run: chmod 600 "${resolved}"\n`,
    );
  }
  // BetaAnalyticsDataClient resolves credentials from GOOGLE_APPLICATION_CREDENTIALS.
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
}

function parseArgs(argv: string[]): { dryRun: boolean } {
  return { dryRun: argv.includes("--dry-run") };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const { dryRun } = parseArgs(process.argv.slice(2));

  const propertyId = requireEnv("GA4_PROPERTY_ID");
  const saKeyPath = requireEnv("GA4_SA_KEY_PATH");

  // Claude 우선, OpenAI fallback. 실 모드에서는 둘 중 적어도 하나는 있어야 한다.
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
  if (!dryRun && !hasClaudeKey && !hasOpenAiKey) {
    throw new Error(
      `Required env vars: at least one of "ANTHROPIC_API_KEY" or "OPENAI_API_KEY" must be set. See .env.example and spec §1.9.5.`,
    );
  }

  verifySaKeyMode(saKeyPath);

  const now = new Date();
  const { range, previous, isoWeek } = lastCompletedIsoWeek(now);
  const trendWeeks = trendWeekLabels(new Date(range.startDate));

  process.stderr.write(
    `[weekly-report] property=${propertyId} week=${isoWeek} range=${range.startDate}→${range.endDate} dry-run=${dryRun}\n`,
  );

  let ga4Result;
  try {
    const client = createGa4Client();
    ga4Result = await collectGa4Result({
      client,
      propertyId,
      range,
      previous,
      isoWeek,
      trendWeeks,
    });
  } catch (error) {
    handleFailure({ isoWeek, error, stage: "ga4", propertyId });
    process.exit(1);
  }

  if (dryRun) {
    process.stdout.write(JSON.stringify(ga4Result, null, 2));
    process.stderr.write(`\n[weekly-report] dry-run complete (cohort approach=${ga4Result.cohort.approach})\n`);
    return;
  }

  const report = await runWithFallback({
    ga4Result,
    isoWeek,
    propertyId,
    hasClaudeKey,
    hasOpenAiKey,
  });
  if (!report) process.exit(1);

  const { markdownPath } = writeWeeklyReport({
    isoWeek,
    claude: report,
    ga4: ga4Result,
  });

  const u = report.usage;
  process.stderr.write(
    `[weekly-report] provider=${report.provider} model=${u.model} input=${u.inputTokens} output=${u.outputTokens} cache_read=${u.cacheReadInputTokens} cache_write=${u.cacheCreationInputTokens} cost=$${u.approxUsd}\n`,
  );

  if (!report.schemaValid) {
    process.stderr.write(
      `⚠️ ${report.provider} output failed schema check: ${report.schemaIssues.join(", ")}. Raw response attached to ${markdownPath}.\n`,
    );
    notifyMacOS(
      "Weekly report — schema mismatch",
      `${isoWeek} (${report.provider}): review ${path.basename(markdownPath)}`,
    );
  } else {
    process.stderr.write(`[weekly-report] wrote ${markdownPath}\n`);
  }
}

async function runWithFallback(params: {
  ga4Result: Ga4Result;
  isoWeek: IsoWeek;
  propertyId: string;
  hasClaudeKey: boolean;
  hasOpenAiKey: boolean;
}): Promise<ReportResult | null> {
  const { ga4Result, isoWeek, propertyId, hasClaudeKey, hasOpenAiKey } = params;
  const generatedIso = new Date().toISOString();
  const errors: { provider: string; message: string }[] = [];

  if (hasClaudeKey) {
    try {
      return await generateWeeklyReportClaude(ga4Result, generatedIso);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ provider: "claude", message });
      process.stderr.write(`[weekly-report] Claude failed: ${message} — falling back to OpenAI\n`);
    }
  } else {
    process.stderr.write(`[weekly-report] ANTHROPIC_API_KEY 미설정 — OpenAI fallback 사용\n`);
  }

  if (hasOpenAiKey) {
    try {
      return await generateWeeklyReportOpenAI(ga4Result, generatedIso);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ provider: "openai", message });
    }
  } else if (errors.length > 0) {
    errors.push({ provider: "openai", message: "OPENAI_API_KEY 미설정 — fallback 불가" });
  }

  // 모든 provider 실패 — raw GA4 JSON은 보존하고 _failed/ 로그 작성.
  const rawPath = writeRawGa4(isoWeek, ga4Result);
  process.stderr.write(`[weekly-report] all providers failed — raw GA4 saved to ${rawPath}\n`);
  const aggregate = new Error(
    `All LLM providers failed: ${errors.map((e) => `${e.provider}=${e.message}`).join("; ")}`,
  );
  handleFailure({ isoWeek, error: aggregate, stage: "claude", propertyId });
  return null;
}

function handleFailure(params: {
  isoWeek: IsoWeek;
  error: unknown;
  stage: "ga4" | "claude";
  propertyId: string;
}): void {
  const { isoWeek, error, stage, propertyId } = params;
  const failedPath = writeFailureLog({
    isoWeek,
    error,
    context: { stage, propertyId, runAt: new Date().toISOString() },
  });
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`❌ [weekly-report] ${stage} stage failed: ${message}\n   log: ${failedPath}\n`);
  notifyMacOS("Weekly report failed", `${isoWeek} (${stage}) — see ${path.basename(failedPath)}`);
}

main().catch((error) => {
  const isoWeek = isoWeekLabel(new Date());
  handleFailure({ isoWeek, error, stage: "ga4", propertyId: process.env.GA4_PROPERTY_ID ?? "?" });
  process.exit(1);
});
