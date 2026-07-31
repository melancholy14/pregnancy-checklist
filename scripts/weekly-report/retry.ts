/**
 * Provider-agnostic retry with exponential backoff.
 *
 * Why this exists: the weekly report runs from launchd at Mon 09:00, often right
 * after the laptop wakes when the network stack isn't ready yet. The OpenAI SDK's
 * default per-request timeout is 10분이라, 한 번 걸리면 재시도까지 겹쳐 40분+ 매달린 뒤
 * 죽는다 (W26·W27·W29 실패 = 전부 "Request timed out"). 여기서는 요청당 짧은 timeout으로
 * 빠르게 실패시키고, 짧은 지수 백오프로 몇 번 재시도해 wake 직후 네트워크 dead-zone을 넘긴다.
 *
 * 재시도 판단은 호출자가 shouldRetry 로 주입한다 (openai-prompt.ts 는 timeout·connection·
 * 429·5xx 만 재시도하고 4xx auth/bad-request 는 즉시 포기). sleep 은 테스트에서 주입 가능.
 */

export type RetryInfo = {
  attempt: number; // 방금 실패한 시도 번호 (1-based)
  delayMs: number; // 다음 시도까지 대기할 시간
  error: unknown;
};

export type RetryOptions = {
  maxAttempts?: number; // 최초 시도 포함 총 횟수 (default 3)
  baseDelayMs?: number; // 첫 백오프 (default 5000)
  maxDelayMs?: number; // 백오프 상한 (default 60000)
  shouldRetry?: (error: unknown) => boolean; // false 면 즉시 throw (default: 항상 재시도)
  onRetry?: (info: RetryInfo) => void; // 재시도 직전 훅 (로깅용)
  sleep?: (ms: number) => Promise<void>; // 테스트 주입용
};

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fn 을 최대 maxAttempts 번 시도한다. 각 실패마다 shouldRetry 로 재시도 가능 여부를 묻고,
 * 가능하면 min(maxDelayMs, baseDelayMs * 2^(attempt-1)) 만큼 대기 후 재시도한다.
 * 모든 시도가 실패하면 마지막 에러를 그대로 throw (호출부 폴백 로직이 소비).
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 5000;
  const maxDelayMs = opts.maxDelayMs ?? 60000;
  const shouldRetry = opts.shouldRetry ?? (() => true);
  const sleep = opts.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const isLast = attempt >= maxAttempts;
      if (isLast || !shouldRetry(error)) break;
      const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      opts.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
  throw lastError;
}
