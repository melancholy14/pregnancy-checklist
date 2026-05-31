import { describe, it, expect } from 'vitest';
import { classifyNote } from '../note-classifier';

describe('classifyNote', () => {
  it('returns "default" for null/undefined/empty', () => {
    expect(classifyNote(null)).toBe('default');
    expect(classifyNote(undefined)).toBe('default');
    expect(classifyNote('')).toBe('default');
  });

  it('classifies "[법령]" prefix as legal', () => {
    expect(classifyNote('[법령] 근로기준법 제74조')).toBe('legal');
  });

  it('classifies 「...」 citation as legal', () => {
    expect(classifyNote('「근로기준법」에 따르면')).toBe('legal');
  });

  it('classifies 〈...〉 citation as legal', () => {
    expect(classifyNote('〈출산휴가 안내〉 참고')).toBe('legal');
  });

  it('classifies "○○법 제N조" pattern as legal', () => {
    expect(classifyNote('근로기준법 제74조에 의거하여')).toBe('legal');
  });

  it('returns "default" for regular notes', () => {
    expect(classifyNote('병원에 미리 전화하기')).toBe('default');
    expect(classifyNote('Just a generic note')).toBe('default');
  });

  it('classifies as legal if any pattern matches anywhere in text', () => {
    expect(classifyNote('산모는 「근로기준법」을 확인해야 합니다')).toBe('legal');
  });
});
