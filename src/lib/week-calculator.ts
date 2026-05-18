/**
 * 출산 예정일 기반 현재 임신 주차 계산
 * 공식: pregnancy_start = due_date - 280일 (40주)
 *
 * `clamp` 옵션 false면 [-N, +N] 범위의 raw 값을 반환 — 검증·범위 밖 거부에 사용.
 */
export function calcPregnancyWeek(
  dueDate: Date,
  today: Date = new Date(),
  options: { clamp?: boolean } = {}
): number {
  const { clamp = true } = options;
  const start = new Date(dueDate);
  start.setDate(start.getDate() - 280);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  const weeks = Math.floor(diffDays / 7);
  return clamp ? Math.max(1, Math.min(40, weeks)) : weeks;
}
