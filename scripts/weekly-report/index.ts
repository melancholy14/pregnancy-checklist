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

import { generateWeeklyReport } from "./claude-prompt.js";
import {
  collectGa4Result,
  createGa4Client,
  isoWeekLabel,
  lastCompletedIsoWeek,
  trendWeekLabels,
} from "./ga4-queries.js";
import { notifyMacOS, writeFailureLog, writeRawGa4, writeWeeklyReport } from "./writer.js";

import type { IsoWeek } from "./types.js";

const REQUIRED_ENV = ["GA4_PROPERTY_ID", "GA4_SA_KEY_PATH", "ANTHROPIC_API_KEY"] as const;

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
  if (!dryRun) requireEnv("ANTHROPIC_API_KEY");

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

  let claudeResult;
  try {
    claudeResult = await generateWeeklyReport(ga4Result, new Date().toISOString());
  } catch (error) {
    // Spec §4: Claude 실패여도 raw GA4 JSON은 _raw/에 남겨 수동 분석 가능해야 한다.
    const rawPath = writeRawGa4(isoWeek, ga4Result);
    process.stderr.write(`[weekly-report] Claude failed — raw GA4 saved to ${rawPath}\n`);
    handleFailure({ isoWeek, error, stage: "claude", propertyId });
    process.exit(1);
  }

  const { markdownPath } = writeWeeklyReport({
    isoWeek,
    claude: claudeResult,
    ga4: ga4Result,
  });

  process.stderr.write(
    `[weekly-report] usage input=${claudeResult.usage.inputTokens} output=${claudeResult.usage.outputTokens} cache_read=${claudeResult.usage.cacheReadInputTokens} cache_write=${claudeResult.usage.cacheCreationInputTokens} cost=$${claudeResult.usage.approxUsd}\n`,
  );

  if (!claudeResult.schemaValid) {
    process.stderr.write(
      `⚠️ Claude output failed schema check: ${claudeResult.schemaIssues.join(", ")}. Raw response attached to ${markdownPath}.\n`,
    );
    notifyMacOS(
      "Weekly report — schema mismatch",
      `${isoWeek}: review ${path.basename(markdownPath)}`,
    );
  } else {
    process.stderr.write(`[weekly-report] wrote ${markdownPath}\n`);
  }
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
