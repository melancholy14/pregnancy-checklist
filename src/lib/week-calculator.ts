/**
 * 출산 예정일 기반 현재 임신 주차 계산
 * 공식: pregnancy_start = due_date - 280일 (40주)
 */
export function calcPregnancyWeek(dueDate: Date, today: Date = new Date()): number {
  const start = new Date(dueDate);
  start.setDate(start.getDate() - 280);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(40, Math.floor(diffDays / 7)));
}
