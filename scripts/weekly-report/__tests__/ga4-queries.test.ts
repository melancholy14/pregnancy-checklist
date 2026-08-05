import { describe, it, expect } from 'vitest';
import { bandForDelta, applyAudienceGuard } from '../ga4-queries.js';
import type { WeekOverWeekAnomaly } from '../types.js';

// qa.md §3.2 의 bandForDelta 매트릭스. 케이스 분류 우선:
// - Happy: 표준 prev=100 에서 ±5/10/20/30 밴드 분기.
// - Boundary: ±5/10/20/30 경계값 직전/직후 + null delta.
// - Invariant — 모집단 가드: previousCount < threshold 일 때 큰 delta 도 noise.
// - Invariant — 단조성: prev ≥ threshold 일 때 abs(delta) 가 커질수록 noise→hypothesis→action→incident.
// - Threshold 옵션: 임계값을 5 로 바꾸면 동작이 그 임계값 기준으로 단조 변경.

describe('bandForDelta', () => {
  describe('happy path — prev≥threshold 표준 매트릭스', () => {
    it.each([
      [0, 'noise'],
      [4.9, 'noise'],
      [5, 'noise'],
      [9.9, 'noise'],
      [10, 'hypothesis'],
      [15, 'hypothesis'],
      [19.9, 'hypothesis'],
      [20, 'action'],
      [25, 'action'],
      [29.9, 'action'],
      [30, 'incident'],
      [40, 'incident'],
      [-15, 'hypothesis'],
      [-25, 'action'],
      [-40, 'incident'],
    ] as const)('delta=%s, prev=100 → %s', (delta, expected) => {
      expect(bandForDelta(delta, { previousCount: 100 })).toBe(expected);
    });
  });

  describe('boundary — null delta', () => {
    // anomaly 쿼리는 prev>0 일 때만 delta 를 계산. prev=0 케이스는 deltaPercent=null 로 들어옴 →
    // 모집단 가드가 noise 로 차단해야 하므로 hypothesis 가 아닌 noise.
    it('delta=null, prev=0 → noise (모집단 0)', () => {
      expect(bandForDelta(null, { previousCount: 0 })).toBe('noise');
    });

    // prev ≥ threshold 인데 delta=null 이 들어오는 경로는 anomaly 로직상 불가능하지만
    // 함수 자체는 그 상황에서 hypothesis 를 반환해야 한다 (기존 contract 유지).
    it('delta=null, prev=100 → hypothesis (prev≥threshold 였다면 기존 동작 유지)', () => {
      expect(bandForDelta(null, { previousCount: 100 })).toBe('hypothesis');
    });
  });

  describe('invariant — 모집단 가드 (#6 핵심 분기)', () => {
    it.each([
      // prev<threshold 면 큰 delta 라도 noise.
      [200, 0, 'noise'],
      [200, 1, 'noise'],
      [200, 5, 'noise'],
      [200, 9, 'noise'],
      // threshold 경계 직전/직후 단조 변경 — prev=10 부터 정상 분기.
      [200, 10, 'incident'],
      [200, 11, 'incident'],
      [-100, 9, 'noise'],
      [-100, 10, 'incident'],
    ] as const)('delta=%s, prev=%s, threshold(default 10) → %s', (delta, prev, expected) => {
      expect(bandForDelta(delta, { previousCount: prev })).toBe(expected);
    });
  });

  describe('threshold 옵션 매트릭스 — config 1줄 변경 단조성', () => {
    it.each([
      // threshold=5 면 prev=4 까지 noise, prev=5 부터 정상 분기.
      [200, 4, 5, 'noise'],
      [200, 5, 5, 'incident'],
      [-15, 4, 5, 'noise'],
      [-15, 5, 5, 'hypothesis'],
      // threshold=20 으로 올리면 prev=15 도 noise.
      [200, 15, 20, 'noise'],
      [200, 20, 20, 'incident'],
    ] as const)('delta=%s, prev=%s, threshold=%s → %s', (delta, prev, threshold, expected) => {
      expect(bandForDelta(delta, { previousCount: prev, threshold })).toBe(expected);
    });
  });

  describe('invariant — band 순서 단조성 (prev≥threshold)', () => {
    // 동일 prev 에서 abs(delta) 가 커질수록 밴드는 noise→hypothesis→action→incident 순.
    const sequence: Array<{ delta: number; band: string }> = [
      { delta: 0, band: 'noise' },
      { delta: 9.9, band: 'noise' },
      { delta: 10, band: 'hypothesis' },
      { delta: 19.9, band: 'hypothesis' },
      { delta: 20, band: 'action' },
      { delta: 29.9, band: 'action' },
      { delta: 30, band: 'incident' },
      { delta: 100, band: 'incident' },
    ];
    const rank: Record<string, number> = {
      noise: 0,
      hypothesis: 1,
      action: 2,
      incident: 3,
    };

    it('abs(delta) 증가 → band rank 비감소 (음수도 대칭)', () => {
      for (let i = 1; i < sequence.length; i += 1) {
        const prev = sequence[i - 1];
        const cur = sequence[i];
        const prevBand = bandForDelta(prev.delta, { previousCount: 100 });
        const curBand = bandForDelta(cur.delta, { previousCount: 100 });
        expect(rank[curBand]).toBeGreaterThanOrEqual(rank[prevBand]);

        // 음수 대칭성 — 동일 abs 값에서 같은 band.
        expect(bandForDelta(-cur.delta, { previousCount: 100 })).toBe(curBand);
      }
    });
  });
});

// 오디언스 가드 — previousCount(이벤트 수) 가드가 못 잡는 고빈도 이벤트 오탐 차단.
// W28(실사용자 2, 직전 3 · page_view 153 vs 31 = +393% incident)·W30(실사용자 1,
// 직전 1 · page_view 3 vs 19 = -84% incident) 회귀 케이스를 실데이터로 고정한다.
describe('applyAudienceGuard', () => {
  // page_view 는 previousCount(31/19) ≥ 10 이라 bandForDelta 를 통과해 incident 로 계산된다.
  const w28: WeekOverWeekAnomaly = {
    comparable: true,
    rows: [
      { eventName: 'page_view', currentCount: 153, previousCount: 31, deltaPercent: 393.5, band: 'incident' },
      { eventName: 'axis_enter', currentCount: 87, previousCount: 18, deltaPercent: 383.3, band: 'incident' },
      { eventName: 'article_read_complete', currentCount: 2, previousCount: 1, deltaPercent: 100, band: 'noise' },
    ],
  };

  it('직전주 실사용자 < floor → 전 행 noise 강등 + audienceFloored=true (W28 회귀)', () => {
    const guarded = applyAudienceGuard(w28, 3); // 직전주 실사용자 3명
    expect(guarded.audienceFloored).toBe(true);
    expect(guarded.rows.every((r) => r.band === 'noise')).toBe(true);
    // deltaPercent·count 등 원본 수치는 보존 — 밴드만 바뀐다.
    expect(guarded.rows[0].deltaPercent).toBe(393.5);
    expect(guarded.rows[0].currentCount).toBe(153);
  });

  it('실사용자 1명(운영자 dogfooding)도 동일하게 강등 (W30 회귀)', () => {
    const w30: WeekOverWeekAnomaly = {
      comparable: true,
      rows: [
        { eventName: 'page_view', currentCount: 3, previousCount: 19, deltaPercent: -84.2, band: 'incident' },
        { eventName: 'axis_enter', currentCount: 2, previousCount: 10, deltaPercent: -80, band: 'incident' },
      ],
    };
    const guarded = applyAudienceGuard(w30, 1);
    expect(guarded.audienceFloored).toBe(true);
    expect(guarded.rows.every((r) => r.band === 'noise')).toBe(true);
  });

  it('직전주 실사용자 ≥ floor → 강등 없이 원본 그대로 통과 (post-launch)', () => {
    const guarded = applyAudienceGuard(w28, 50);
    expect(guarded.audienceFloored).toBeUndefined();
    expect(guarded.rows[0].band).toBe('incident');
    expect(guarded).toBe(w28); // 참조 동일 — 불필요한 복제 없음
  });

  it('경계값 — floor 직전(9)은 강등, floor(10)은 통과', () => {
    expect(applyAudienceGuard(w28, 9).audienceFloored).toBe(true);
    expect(applyAudienceGuard(w28, 10).audienceFloored).toBeUndefined();
  });

  it('threshold 옵션 — config 1줄로 임계값 조정 가능', () => {
    // threshold=5 로 낮추면 직전주 실사용자 6명은 통과.
    expect(applyAudienceGuard(w28, 6, 5).audienceFloored).toBeUndefined();
    expect(applyAudienceGuard(w28, 4, 5).audienceFloored).toBe(true);
  });
});
