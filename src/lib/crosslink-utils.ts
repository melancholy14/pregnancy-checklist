import { UNIFIED_TAGS } from "./unified-tags";

const KOREAN_STOPWORDS: Set<string> = new Set([
  "임신",
  "출산",
  "임산부",
  "산모",
  "태아",
  "아기",
  "엄마",
  "엄마들",
  "준비",
  "정리",
  "확인",
  "추천",
  "시기",
  "방법",
  "위해",
  "위한",
  "같은",
  "정도",
  "경우",
  "그리고",
  "또한",
  "관련",
  "체크",
  "체크리스트",
  "총정리",
  "안내",
  "기준",
  "도움",
  "필수",
  "주의",
  "주차",
  "2026",
  "2026년",
]);

const ENGLISH_STOPWORDS: Set<string> = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "this",
  "that",
  "your",
  "you",
  "vs",
]);

const KOREAN_TOKEN_MIN_LEN = 2;
const ENGLISH_TOKEN_MIN_LEN = 3;

export function tokenize(text: string): string[] {
  const tokens = text.toLowerCase().match(/[가-힯]+|[a-z][a-z0-9]*/g) ?? [];
  const out = new Set<string>();
  for (const tok of tokens) {
    const isHangul = /[가-힯]/.test(tok);
    const minLen = isHangul ? KOREAN_TOKEN_MIN_LEN : ENGLISH_TOKEN_MIN_LEN;
    if (tok.length < minLen) continue;
    if (isHangul ? KOREAN_STOPWORDS.has(tok) : ENGLISH_STOPWORDS.has(tok)) continue;
    out.add(tok);
  }
  return [...out];
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersect = 0;
  for (const v of setA) {
    if (setB.has(v)) intersect++;
  }
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

type UnifiedTagSource = {
  text?: string;
  articleTags?: string[];
  videoCategory?: string;
};

export function inferUnifiedTagKeys(source: UnifiedTagSource): string[] {
  const keys = new Set<string>();
  const text = source.text ?? "";

  for (const ut of UNIFIED_TAGS) {
    if (text && ut.articleTags.some((at) => text.includes(at))) {
      keys.add(ut.key);
      continue;
    }
    if (
      source.articleTags &&
      source.articleTags.some((t) => ut.articleTags.includes(t))
    ) {
      keys.add(ut.key);
      continue;
    }
    if (source.videoCategory && ut.videoCategories.includes(source.videoCategory)) {
      keys.add(ut.key);
    }
  }

  return [...keys];
}

export function unifiedTagsForWeek(week: number): string[] {
  if (week <= 0) return [];
  if (week <= 13) return ["pregnancy-early"];
  if (week <= 27) return ["pregnancy-mid"];
  return ["birth-prep"];
}

export type ContentFeatures = {
  unifiedTags: string[];
  keywords: string[];
};

export function relevanceScore(
  a: ContentFeatures,
  b: ContentFeatures,
  weights: { tag?: number; keyword?: number } = {},
): number {
  const tagW = weights.tag ?? 0.6;
  const keywordW = weights.keyword ?? 0.4;
  return (
    jaccardSimilarity(a.unifiedTags, b.unifiedTags) * tagW +
    jaccardSimilarity(a.keywords, b.keywords) * keywordW
  );
}

export const CROSSLINK_THRESHOLD = 0.2;
export const CROSSLINK_TOP_N = 5;
