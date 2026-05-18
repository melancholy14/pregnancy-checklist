const KST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getTodayKST(date: Date = new Date()): string {
  return KST_FORMATTER.format(date);
}

/**
 * `YYYY-MM-DD` 문자열을 KST 자정으로 파싱한다.
 * 기본 `new Date("YYYY-MM-DD")`는 UTC 자정으로 파싱되어 KST 자정 비교 시 9시간 오프셋이 발생한다.
 */
export function parseDateKST(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00+09:00`);
}
