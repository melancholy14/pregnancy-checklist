import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";
import type { ArticleMeta, Article } from "@/types/article";

const ARTICLES_DIR = path.join(process.cwd(), "src/content/articles");

function parseArticleMeta(data: Record<string, unknown>): ArticleMeta {
  return {
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    slug: String(data.slug ?? ""),
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    linked_timeline_weeks: Array.isArray(data.linked_timeline_weeks)
      ? data.linked_timeline_weeks.map(Number)
      : undefined,
  };
}

export function getAllArticles(): ArticleMeta[] {
  const files = fs.readdirSync(ARTICLES_DIR);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf-8");
      const { data } = matter(raw);
      return parseArticleMeta(data);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllTags(articles: ArticleMeta[]): string[] {
  const tagSet = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const result = await remark().use(remarkGfm).use(html).process(content);

  return {
    ...parseArticleMeta(data),
    content: result.toString(),
  };
}
