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

import OpenAI, { APIError } from "openai";

import {
  MAX_OUTPUT_TOKENS,
  SYSTEM_PROMPT,
  buildUserMessage,
  unwrapFencedMarkdown,
  validateSchema,
} from "./prompt-shared.js";
import { withRetry } from "./retry.js";

import type { Ga4Result, LlmUsage, ReportResult } from "./types.js";

const MODEL = "gpt-4o";

// 요청당 timeout. SDK 기본값 10분은 wake 직후 dead-zone에서 한 attempt가 통째로 매달리게
// 만든다 (W26·W27·W29 = 40분+ hang 후 사망). 60초로 줄여 빠르게 실패시키고 재시도로 넘긴다.
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 5_000;

// 재시도 가치가 있는 오류만 재시도한다. connection/timeout(status 없음)·429(rate limit)·
// 5xx(서버 오류)는 재시도로 회복 가능. 400/401/403 같은 4xx 는 재시도해도 동일 실패이므로
// 즉시 포기해 백오프 시간을 낭비하지 않는다.
export function isRetryableOpenAiError(error: unknown): boolean {
  if (error instanceof APIError) {
    const status = error.status;
    if (typeof status !== "number") return true; // connection/timeout — status 없음
    if (status === 429) return true;
    return status >= 500;
  }
  // APIError 가 아닌 네트워크 예외(ECONNRESET 등)도 재시도 대상.
  return true;
}

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
  // maxRetries: 0 — SDK 내부 재시도를 끄고 withRetry 가 재시도를 단독으로 소유한다
  // (이중 재시도로 대기 시간이 곱절 나는 것을 방지, 로깅·백오프를 우리가 통제).
  const client = new OpenAI({ timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });

  const response = await withRetry(
    (attempt) => {
      if (attempt > 1) {
        process.stderr.write(`[weekly-report] OpenAI 재시도 ${attempt}/${MAX_ATTEMPTS}\n`);
      }
      return client.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(result, generatedIso) },
        ],
      });
    },
    {
      maxAttempts: MAX_ATTEMPTS,
      baseDelayMs: BASE_BACKOFF_MS,
      shouldRetry: isRetryableOpenAiError,
      onRetry: ({ attempt, delayMs, error }) => {
        const msg = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `[weekly-report] OpenAI attempt ${attempt} 실패: ${msg} — ${delayMs}ms 후 재시도\n`,
        );
      },
    },
  );

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
