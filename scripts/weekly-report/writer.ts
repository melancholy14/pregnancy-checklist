/**
 * File output for the weekly report — Obsidian vault `60-analytics/weekly/`.
 *
 * - Main output: `60-analytics/weekly/YYYY-Www.md`
 * - Raw GA4 backup (first 8 weeks per §1.9.8): `weekly/_raw/YYYY-Www.json`
 * - Failure log: `weekly/_failed/YYYY-Www.log`
 * - Schema mismatch: appends raw Claude response below a sentinel.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import type {
  ClaudeReportResult,
  Ga4Result,
  IsoWeek,
} from "./types.js";

const VAULT_ROOT = path.join(homedir(), "Documents/pregnancy-checklist/60-analytics");
const WEEKLY_DIR = path.join(VAULT_ROOT, "weekly");
const RAW_DIR = path.join(WEEKLY_DIR, "_raw");
const FAILED_DIR = path.join(WEEKLY_DIR, "_failed");

const SCHEMA_MISMATCH_SENTINEL = "\n\n---\n\n## ⚠️ Schema mismatch — raw response below\n";

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function vaultPaths(isoWeek: IsoWeek): {
  markdown: string;
  raw: string;
  failed: string;
} {
  return {
    markdown: path.join(WEEKLY_DIR, `${isoWeek}.md`),
    raw: path.join(RAW_DIR, `${isoWeek}.json`),
    failed: path.join(FAILED_DIR, `${isoWeek}.log`),
  };
}

export function writeRawGa4(isoWeek: IsoWeek, ga4: Ga4Result): string {
  ensureDir(RAW_DIR);
  const { raw } = vaultPaths(isoWeek);
  writeFileSync(raw, JSON.stringify(ga4, null, 2), "utf8");
  return raw;
}

export function writeWeeklyReport(params: {
  isoWeek: IsoWeek;
  claude: ClaudeReportResult;
  ga4: Ga4Result;
}): { markdownPath: string; rawPath: string } {
  const { isoWeek, claude, ga4 } = params;
  ensureDir(WEEKLY_DIR);

  const paths = vaultPaths(isoWeek);
  const rawPath = writeRawGa4(isoWeek, ga4);

  let body = claude.markdown;
  if (!claude.schemaValid) {
    body += SCHEMA_MISMATCH_SENTINEL;
    body += `\nissues: ${JSON.stringify(claude.schemaIssues)}\n\n\`\`\`\n${claude.raw}\n\`\`\`\n`;
  }
  writeFileSync(paths.markdown, body, "utf8");

  return { markdownPath: paths.markdown, rawPath };
}

export function writeFailureLog(params: {
  isoWeek: IsoWeek;
  error: unknown;
  context: Record<string, unknown>;
}): string {
  ensureDir(FAILED_DIR);
  const { isoWeek, error, context } = params;
  const paths = vaultPaths(isoWeek);
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
  const log = [
    `# Weekly report failure — ${isoWeek}`,
    `timestamp: ${new Date().toISOString()}`,
    `context: ${JSON.stringify(context, null, 2)}`,
    ``,
    `error:`,
    message,
  ].join("\n");
  writeFileSync(paths.failed, log, "utf8");
  return paths.failed;
}

export function notifyMacOS(title: string, message: string): void {
  // osascript is best-effort; the failure log file is the source of truth.
  const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`;
  spawnSync("osascript", ["-e", script], { stdio: "ignore" });
}
