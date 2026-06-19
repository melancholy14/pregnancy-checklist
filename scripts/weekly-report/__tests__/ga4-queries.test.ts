import { describe, it, expect } from 'vitest';
import { bandForDelta } from '../ga4-queries.js';

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
