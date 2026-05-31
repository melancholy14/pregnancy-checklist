import { describe, it, expect } from 'vitest';
import {
  getChecklistByWeek,
  getUnassignedChecklist,
} from '../checklist-week-map';
import type { ChecklistItem } from '@/types/checklist';
import type { TimelineItem } from '@/types/timeline';

function makeItem(
  id: string,
  recommendedWeek: number,
  isCustom = false,
): ChecklistItem {
  return {
    id,
    title: id,
    category: 'hospital',
    categoryName: '병원',
    recommendedWeek,
    priority: 'medium',
    isCustom,
  };
}

function makeTimeline(
  id: string,
  week: number,
  linked?: string[],
): TimelineItem {
  return {
    id,
    week,
    title: id,
    description: '',
    type: 'prep',
    priority: 'medium',
    linked_checklist_ids: linked,
  };
}

describe('getChecklistByWeek', () => {
  it('maps items to recommendedWeek when no linked_checklist_ids', () => {
    const items = [makeItem('a', 10), makeItem('b', 20)];
    const map = getChecklistByWeek([], items, []);
    expect(map.get(10)).toEqual([items[0]]);
    expect(map.get(20)).toEqual([items[1]]);
  });

  it('skips items with recommendedWeek === 0', () => {
    const items = [makeItem('a', 0), makeItem('b', 10)];
    const map = getChecklistByWeek([], items, []);
    expect(map.has(0)).toBe(false);
    expect(map.get(10)).toEqual([items[1]]);
  });

  it('prioritizes linked_checklist_ids over recommendedWeek', () => {
    const item = makeItem('a', 10);
    const timeline = makeTimeline('t', 5, ['a']);
    const map = getChecklistByWeek([timeline], [item], []);
    expect(map.get(5)).toEqual([item]);
    expect(map.has(10)).toBe(false);
  });

  it('does not duplicate items already linked', () => {
    const item = makeItem('a', 10);
    const timeline = makeTimeline('t', 10, ['a']);
    const map = getChecklistByWeek([timeline], [item], []);
    expect(map.get(10)).toHaveLength(1);
  });

  it('merges custom items alongside base items', () => {
    const base = makeItem('a', 10);
    const custom = makeItem('c', 10, true);
    const map = getChecklistByWeek([], [base], [custom]);
    expect(map.get(10)).toEqual([base, custom]);
  });

  it('handles multiple timeline items linking to same week', () => {
    const items = [makeItem('a', 99), makeItem('b', 99)];
    const t1 = makeTimeline('t1', 5, ['a']);
    const t2 = makeTimeline('t2', 5, ['b']);
    const map = getChecklistByWeek([t1, t2], items, []);
    expect(map.get(5)).toEqual(items);
  });
});

describe('getUnassignedChecklist', () => {
  it('returns only custom items with recommendedWeek === 0', () => {
    const items = [
      makeItem('a', 0, true),
      makeItem('b', 10, true),
      makeItem('c', 0, true),
    ];
    const result = getUnassignedChecklist(items);
    expect(result.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('returns empty when all custom items have a week', () => {
    expect(getUnassignedChecklist([makeItem('a', 10, true)])).toEqual([]);
  });
});
