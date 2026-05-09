export type NoteType = "legal" | "default";

const LEGAL_PATTERNS: RegExp[] = [
  /\[법령\]/,
  /「[^」]+」/,
  /〈[^〉]+〉/,
  /[가-힣]{2,}법\s*제\s*\d+\s*조/,
];

/**
 * 노트 텍스트를 분류한다.
 * - "legal": 법령 인용 패턴이 발견된 경우
 *   1) [법령] 접두 토큰
 *   2) 「...」 또는 〈...〉 인용 부호
 *   3) "○○법 제N조" 한국어 법령 명칭 패턴
 * - "default": 그 외 일반 노트
 *
 * 텍스트 어디에서든 패턴이 1회 이상 매칭되면 "legal" 로 분류한다.
 * phase-5 에서 `note_type` 필드 도입 시, 같은 함수가 필드 우선 + 패턴 폴백 형태로 확장된다.
 */
export function classifyNote(text: string | undefined | null): NoteType {
  if (!text) return "default";
  for (const pattern of LEGAL_PATTERNS) {
    if (pattern.test(text)) return "legal";
  }
  return "default";
}
