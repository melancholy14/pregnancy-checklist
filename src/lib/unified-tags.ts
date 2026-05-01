import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";

export type UnifiedTag = {
  key: string;
  label: string;
  articleTags: string[];
  videoCategories: string[];
};

export const UNIFIED_TAGS: UnifiedTag[] = [
  {
    key: "pregnancy-early",
    label: "임신초기",
    articleTags: ["임신초기", "임신초기증상", "임신피로", "프로게스테론"],
    videoCategories: [],
  },
  {
    key: "pregnancy-mid",
    label: "임신중기",
    articleTags: ["임신중기"],
    videoCategories: [],
  },
  {
    key: "birth-prep",
    label: "출산준비",
    articleTags: ["출산준비"],
    videoCategories: ["birth_prep"],
  },
  {
    key: "nutrition",
    label: "영양",
    articleTags: ["영양", "임산부영양"],
    videoCategories: ["nutrition"],
  },
  {
    key: "exercise",
    label: "운동",
    articleTags: ["임산부운동"],
    videoCategories: ["exercise"],
  },
  {
    key: "checkup",
    label: "검사",
    articleTags: ["검사", "산전검사", "NIPT", "정밀초음파", "기형아검사"],
    videoCategories: ["prenatal_checkup"],
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
    videoCategories: ["pregnancy_health"],
  },
  {
    key: "newborn",
    label: "신생아",
    articleTags: ["신생아"],
    videoCategories: ["newborn_care"],
  },
  {
    key: "postpartum",
    label: "산후관리",
    articleTags: ["산후관리"],
    videoCategories: [],
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
    videoCategories: ["policy"],
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
    videoCategories: [],
  },
  {
    key: "weight",
    label: "체중관리",
    articleTags: ["체중관리"],
    videoCategories: [],
  },
  {
    key: "pregnancy-prep",
    label: "임신준비",
    articleTags: ["임신준비"],
    videoCategories: [],
  },
];

export function articleMatchesUnifiedTag(
  articleTags: string[],
  unifiedTag: UnifiedTag,
): boolean {
  return articleTags.some((t) => unifiedTag.articleTags.includes(t));
}

export function videoMatchesUnifiedTag(
  category: string,
  unifiedTag: UnifiedTag,
): boolean {
  return unifiedTag.videoCategories.includes(category);
}

export function getUsedUnifiedTags(
  articles: Pick<ArticleMeta, "tags">[],
  videos: Pick<VideoItem, "category">[],
): UnifiedTag[] {
  return UNIFIED_TAGS.filter((tag) => {
    const articleHit = articles.some((a) =>
      articleMatchesUnifiedTag(a.tags, tag),
    );
    const videoHit = videos.some((v) => videoMatchesUnifiedTag(v.category, tag));
    return articleHit || videoHit;
  });
}
