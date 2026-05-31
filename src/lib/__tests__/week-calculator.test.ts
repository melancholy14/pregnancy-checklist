import { describe, it, expect } from 'vitest';
import { calcPregnancyWeek } from '../week-calculator';

describe('calcPregnancyWeek', () => {
  const due = new Date('2026-08-13T00:00:00Z');

  it('returns 1 on the day pregnancy starts (due - 280d)', () => {
    const start = new Date(due);
    start.setDate(start.getDate() - 280);
    expect(calcPregnancyWeek(due, start)).toBe(1);
  });

  it('returns 40 on the due date', () => {
    expect(calcPregnancyWeek(due, due)).toBe(40);
  });

  it('clamps below 1 when today is before pregnancy start', () => {
    const before = new Date(due);
    before.setDate(before.getDate() - 300);
    expect(calcPregnancyWeek(due, before)).toBe(1);
  });

  it('clamps above 40 when today is past due date', () => {
    const past = new Date(due);
    past.setDate(past.getDate() + 60);
    expect(calcPregnancyWeek(due, past)).toBe(40);
  });

  it('returns raw negative value when clamp=false', () => {
    const before = new Date(due);
    before.setDate(before.getDate() - 300);
    expect(calcPregnancyWeek(due, before, { clamp: false })).toBeLessThan(0);
  });

  it('returns raw >40 when clamp=false and past due date', () => {
    const past = new Date(due);
    past.setDate(past.getDate() + 60);
    expect(calcPregnancyWeek(due, past, { clamp: false })).toBeGreaterThan(40);
  });

  it('increments week every 7 days (raw mode)', () => {
    const start = new Date(due);
    start.setDate(start.getDate() - 280);
    const day14 = new Date(start);
    day14.setDate(day14.getDate() + 14);
    expect(calcPregnancyWeek(due, day14, { clamp: false })).toBe(2);
  });

  it('clamped week stays at 1 for the first 13 days (week 1 spans clamp floor)', () => {
    const start = new Date(due);
    start.setDate(start.getDate() - 280);
    const day7 = new Date(start);
    day7.setDate(day7.getDate() + 7);
    expect(calcPregnancyWeek(due, day7)).toBe(1);
  });
});
