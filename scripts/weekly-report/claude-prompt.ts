/**
 * Claude API call for the weekly report.
 *
 * Caching strategy (spec §1.9.4 D4):
 *   - System prompt is stable (§1.7 scenarios + §1.9.6 schema) and marked
 *     with `cache_control: { type: "ephemeral" }`. Note: ephemeral cache
 *     expires ~5 minutes after last use, so consecutive weekly runs do NOT
 *     hit the cache. Cost target $0.04/run therefore assumes the cache-miss
 *     path. Cache hits only happen if the script is re-run within minutes
 *     (e.g. dry-run followed by real run during a single operator session).
 *   - User prompt carries this week's aggregated GA4 numbers + the last 4
 *     ISO-week labels for trend context. Changes every run — never cached.
 *
 * Output contract: Claude must return markdown matching §1.9.6 (TL;DR +
 * 6 sections). `validateSchema` (from prompt-shared) checks structure
 * post-hoc; on mismatch `writer.ts` attaches the raw response below a
 * sentinel for debugging.
 */

import Anthropic from "@anthropic-ai/sdk";

import {
  MAX_OUTPUT_TOKENS,
  SYSTEM_PROMPT,
  buildUserMessage,
  unwrapFencedMarkdown,
  validateSchema,
} from "./prompt-shared.js";

import type { Ga4Result, LlmUsage, ReportResult } from "./types.js";

const MODEL = "claude-sonnet-4-6";

// Per Anthropic pricing for Sonnet 4.6 ($/MTok): input 3 / output 15 / cache-write 3.75 / cache-read 0.30
const PRICE_INPUT = 3 / 1_000_000;
const PRICE_OUTPUT = 15 / 1_000_000;
const PRICE_CACHE_WRITE = 3.75 / 1_000_000;
const PRICE_CACHE_READ = 0.3 / 1_000_000;

function computeUsageCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}): LlmUsage {
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const approxUsd =
    usage.input_tokens * PRICE_INPUT +
    usage.output_tokens * PRICE_OUTPUT +
    cacheWrite * PRICE_CACHE_WRITE +
    cacheRead * PRICE_CACHE_READ;
  return {
    provider: "claude",
    model: MODEL,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: cacheWrite,
    cacheReadInputTokens: cacheRead,
    approxUsd: Number(approxUsd.toFixed(4)),
  };
}

export async function generateWeeklyReportClaude(
  result: Ga4Result,
  generatedIso: string,
): Promise<ReportResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserMessage(result, generatedIso),
      },
    ],
  });

  const raw = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();

  const markdown = unwrapFencedMarkdown(raw);
  const schemaCheck = validateSchema(markdown, result.isoWeek);
  const usage = computeUsageCost(response.usage);

  return {
    provider: "claude",
    markdown,
    schemaValid: schemaCheck.valid,
    schemaIssues: schemaCheck.issues,
    usage,
    raw,
  };
}

// Back-compat alias for the previous default export name.
export const generateWeeklyReport = generateWeeklyReportClaude;
