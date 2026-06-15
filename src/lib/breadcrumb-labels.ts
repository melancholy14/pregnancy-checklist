import { BASE_URL } from "@/lib/constants";

export type BreadcrumbItem = {
  position: number;
  name: string;
  item: string;
};

export type ArticleMeta = {
  title: string;
  slug: string;
};

export const BREADCRUMB_LABELS: Record<string, string> = {
  "/": "홈",
  "/timeline": "임신 주차별 타임라인",
  "/checklist": "체크리스트",
  "/checklist/hospital-bag": "출산가방 체크리스트",
  "/checklist/partner-prep": "남편/파트너 준비 체크리스트",
  "/checklist/pregnancy-prep": "임신 준비 체크리스트",
  "/baby-fair": "베이비페어",
  "/articles": "정보 & 가이드",
  "/weight": "체중",
  "/about": "만든 사람 뿌까뽀까",
  "/contact": "의견 보내기",
  "/privacy": "개인정보처리방침",
  "/terms": "서비스 이용약관",
};

function toAbsoluteUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

function homeItem(): BreadcrumbItem {
  return { position: 1, name: BREADCRUMB_LABELS["/"], item: toAbsoluteUrl("/") };
}

export function getBreadcrumbForPath(
  pathname: string,
  articleMeta?: ArticleMeta,
): BreadcrumbItem[] {
  if (pathname === "/") {
    return [homeItem()];
  }

  if (pathname.startsWith("/articles/")) {
    if (!articleMeta) return [];
    return [
      homeItem(),
      {
        position: 2,
        name: BREADCRUMB_LABELS["/articles"],
        item: toAbsoluteUrl("/articles"),
      },
      {
        position: 3,
        name: articleMeta.title,
        item: toAbsoluteUrl(`/articles/${articleMeta.slug}`),
      },
    ];
  }

  const exactLabel = BREADCRUMB_LABELS[pathname];
  if (!exactLabel) return [];

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [homeItem()];
  let accumulated = "";
  for (let i = 0; i < segments.length; i += 1) {
    accumulated += `/${segments[i]}`;
    const label = BREADCRUMB_LABELS[accumulated];
    if (!label) return [];
    items.push({
      position: items.length + 1,
      name: label,
      item: toAbsoluteUrl(accumulated),
    });
  }

  return items;
}
