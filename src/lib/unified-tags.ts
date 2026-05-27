import type { ArticleMeta } from "@/types/article";

export type UnifiedTag = {
  key: string;
  label: string;
  articleTags: string[];
};

export const UNIFIED_TAGS: UnifiedTag[] = [
  {
    key: "pregnancy-early",
    label: "임신초기",
    articleTags: ["임신초기", "임신초기증상", "임신피로", "프로게스테론"],
  },
  {
    key: "pregnancy-mid",
    label: "임신중기",
    articleTags: ["임신중기"],
  },
  {
    key: "birth-prep",
    label: "출산준비",
    articleTags: ["출산준비"],
  },
  {
    key: "nutrition",
    label: "영양",
    articleTags: ["영양", "임산부영양"],
  },
  {
    key: "exercise",
    label: "운동",
    articleTags: ["임산부운동"],
  },
  {
    key: "checkup",
    label: "검사",
    articleTags: ["검사", "산전검사", "NIPT", "정밀초음파", "기형아검사"],
  },
  {
    key: "health",
    label: "건강",
    articleTags: [
      "임산부건강",
      "임산부빈혈",
      "임신성당뇨",
      "임신중독증",
      "건강",
    ],
  },
  {
    key: "newborn",
    label: "신생아",
    articleTags: ["신생아"],
  },
  {
    key: "postpartum",
    label: "산후관리",
    articleTags: ["산후관리"],
  },
  {
    key: "policy",
    label: "정책/제도",
    articleTags: [
      "정책",
      "제도",
      "정부지원",
      "국민행복카드",
      "부모급여",
      "첫만남이용권",
      "임신지원금",
    ],
  },
  {
    key: "insurance",
    label: "보험",
    articleTags: [
      "보험",
      "태아보험",
      "임신보험",
      "태아보험가입시기",
      "태아보험특약",
    ],
  },
  {
    key: "weight",
    label: "체중관리",
    articleTags: ["체중관리"],
  },
  {
    key: "pregnancy-prep",
    label: "임신준비",
    articleTags: ["임신준비"],
  },
];

export function articleMatchesUnifiedTag(
  articleTags: string[],
  unifiedTag: UnifiedTag,
): boolean {
  return articleTags.some((t) => unifiedTag.articleTags.includes(t));
}

export function getUsedUnifiedTags(
  articles: Pick<ArticleMeta, "tags">[],
): UnifiedTag[] {
  return UNIFIED_TAGS.filter((tag) =>
    articles.some((a) => articleMatchesUnifiedTag(a.tags, tag)),
  );
}
