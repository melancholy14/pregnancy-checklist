import { describe, it, expect } from 'vitest';
import { getTodayKST, parseDateKST } from '../date-kst';

describe('getTodayKST', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayKST(new Date('2026-05-31T12:00:00+09:00'));
    expect(result).toBe('2026-05-31');
  });

  it('converts UTC time to KST date (UTC 16:00 -> next day in KST)', () => {
    const utcLate = new Date('2026-05-31T16:00:00Z');
    expect(getTodayKST(utcLate)).toBe('2026-06-01');
  });

  it('handles UTC early morning (still previous day in KST? no, KST is UTC+9)', () => {
    const utcMorning = new Date('2026-05-31T01:00:00Z');
    expect(getTodayKST(utcMorning)).toBe('2026-05-31');
  });
});

describe('parseDateKST', () => {
  it('parses to KST midnight, not UTC midnight', () => {
    const d = parseDateKST('2026-05-31');
    expect(d.toISOString()).toBe('2026-05-30T15:00:00.000Z');
  });

  it('round-trips with getTodayKST', () => {
    const d = parseDateKST('2026-08-13');
    expect(getTodayKST(d)).toBe('2026-08-13');
  });
});
