import { describe, it, expect, vi } from 'vitest';
import {
  RateLimitError,
  InternalServerError,
  BadRequestError,
  AuthenticationError,
  APIConnectionTimeoutError,
} from 'openai';

import { withRetry } from '../retry.js';
import { isRetryableOpenAiError } from '../openai-prompt.js';

// sleep 을 즉시 resolve 로 주입해 실제 대기 없이 백오프 경로를 검증한다.
const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('첫 시도 성공 → 재시도 없이 그대로 반환', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const onRetry = vi.fn();
    const result = await withRetry(fn, { sleep: noSleep, onRetry });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('전 시도 실패 → maxAttempts 만큼 시도 후 마지막 에러 throw', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      withRetry(fn, { maxAttempts: 3, sleep: noSleep }),
    ).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('중간 시도에서 성공하면 그 값을 반환하고 남은 시도는 하지 않는다', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValue('recovered');
    const result = await withRetry(fn, { maxAttempts: 5, sleep: noSleep });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('shouldRetry=false 면 즉시 포기 (백오프 없이 1회로 끝)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent'));
    const sleep = vi.fn(noSleep);
    await expect(
      withRetry(fn, { maxAttempts: 3, shouldRetry: () => false, sleep }),
    ).rejects.toThrow('permanent');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('지수 백오프 — delayMs 가 base * 2^(n-1), maxDelayMs 로 상한', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const delays: number[] = [];
    await expect(
      withRetry(fn, {
        maxAttempts: 5,
        baseDelayMs: 1000,
        maxDelayMs: 4000,
        sleep: noSleep,
        onRetry: ({ delayMs }) => delays.push(delayMs),
      }),
    ).rejects.toThrow('x');
    // 4번의 재시도 대기: 1000, 2000, 4000(cap), 4000(cap). 마지막(5번째) 시도 후엔 대기 없음.
    expect(delays).toEqual([1000, 2000, 4000, 4000]);
  });

  it('마지막 시도 실패 후에는 onRetry/sleep 을 호출하지 않는다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    const sleep = vi.fn(noSleep);
    const onRetry = vi.fn();
    await expect(
      withRetry(fn, { maxAttempts: 2, sleep, onRetry }),
    ).rejects.toThrow('x');
    // 2회 시도 → 재시도 대기는 1번만.
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});

describe('isRetryableOpenAiError', () => {
  // APIError 서브클래스 생성자의 4번째 인자(headers)는 SDK 내부 Headers 타입이라 테스트에서
  // 정확히 재현할 필요가 없다 — status 프로퍼티만 판별에 쓰이므로 헤더는 빈 객체로 캐스팅.
  const noHeaders = new Headers() as unknown as ConstructorParameters<typeof RateLimitError>[3];

  it('timeout/connection (status 없음) → 재시도', () => {
    expect(isRetryableOpenAiError(new APIConnectionTimeoutError({ message: 'Request timed out.' }))).toBe(true);
  });

  it('429 rate limit → 재시도', () => {
    expect(isRetryableOpenAiError(new RateLimitError(429, undefined, 'rate', noHeaders))).toBe(true);
  });

  it('5xx 서버 오류 → 재시도', () => {
    expect(isRetryableOpenAiError(new InternalServerError(500, undefined, 'server', noHeaders))).toBe(true);
  });

  it('400 bad request → 재시도 안 함', () => {
    expect(isRetryableOpenAiError(new BadRequestError(400, undefined, 'bad', noHeaders))).toBe(false);
  });

  it('401 auth → 재시도 안 함', () => {
    expect(isRetryableOpenAiError(new AuthenticationError(401, undefined, 'auth', noHeaders))).toBe(false);
  });

  it('APIError 가 아닌 일반 네트워크 예외 → 재시도', () => {
    expect(isRetryableOpenAiError(new Error('ECONNRESET'))).toBe(true);
  });
});
