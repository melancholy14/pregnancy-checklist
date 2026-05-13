/**
 * OpenAI fallback for the weekly report — gpt-4o.
 *
 * Used when Claude is unavailable: either ANTHROPIC_API_KEY is unset or the
 * Claude call throws (network / 5xx / auth). Output contract is identical
 * to claude-prompt.ts (§1.9.6 markdown schema), so callers can swap
 * providers without touching the writer or markdown consumers.
 *
 * Caching: gpt-4o ships automatic prefix caching for repeated prompts > 1024
 * tokens. There is no explicit cache_control header — the same SYSTEM_PROMPT
 * sent every week is eligible for the cached-input price tier when the
 * provider's cache happens to be warm.
 *
 * Cost: input $2.50/M, output $10/M, cached input $1.25/M (per OpenAI
 * 2025-Q3 pricing). Cache hit ratio is opaque, so we treat all input as
 * uncached for the $0.04/run target (matches Claude cache-miss assumption).
 */

import OpenAI from "openai";

import {
  MAX_OUTPUT_TOKENS,
  SYSTEM_PROMPT,
  buildUserMessage,
  unwrapFencedMarkdown,
  validateSchema,
} from "./prompt-shared.js";

import type { Ga4Result, LlmUsage, ReportResult } from "./types.js";

const MODEL = "gpt-4o";

// Per OpenAI pricing for gpt-4o ($/MTok): input 2.50 / output 10 / cached input 1.25
const PRICE_INPUT = 2.5 / 1_000_000;
const PRICE_OUTPUT = 10 / 1_000_000;
const PRICE_CACHED_INPUT = 1.25 / 1_000_000;

function computeUsageCost(usage: {
  prompt_tokens: number;
  completion_tokens: number;
  prompt_tokens_details?: { cached_tokens?: number | null } | null;
}): LlmUsage {
  const cachedInput = usage.prompt_tokens_details?.cached_tokens ?? 0;
  const freshInput = Math.max(0, usage.prompt_tokens - cachedInput);
  const approxUsd =
    freshInput * PRICE_INPUT +
    cachedInput * PRICE_CACHED_INPUT +
    usage.completion_tokens * PRICE_OUTPUT;
  return {
    provider: "openai",
    model: MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: cachedInput,
    approxUsd: Number(approxUsd.toFixed(4)),
  };
}

export async function generateWeeklyReportOpenAI(
  result: Ga4Result,
  generatedIso: string,
): Promise<ReportResult> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(result, generatedIso) },
    ],
  });

  const raw = (response.choices[0]?.message?.content ?? "").trim();
  const markdown = unwrapFencedMarkdown(raw);
  const schemaCheck = validateSchema(markdown, result.isoWeek);

  const usageRaw = response.usage;
  const usage: LlmUsage = usageRaw
    ? computeUsageCost(usageRaw)
    : {
        provider: "openai",
        model: MODEL,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        approxUsd: 0,
      };

  return {
    provider: "openai",
    markdown,
    schemaValid: schemaCheck.valid,
    schemaIssues: schemaCheck.issues,
    usage,
    raw,
  };
}
