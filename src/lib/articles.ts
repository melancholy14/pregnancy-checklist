import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { rehypeArticleFigure } from "@/lib/markdown/rehype-article-figure";
import type { ArticleMeta, Article, FaqItem } from "@/types/article";
import { BASE_URL } from "@/lib/constants";

const ARTICLES_DIR = path.join(process.cwd(), "src/content/articles");

export function countWords(markdown: string): number {
  const withoutCodeFences = markdown.replace(/```[\s\S]*?```/g, " ");
  const withoutInlineCode = withoutCodeFences.replace(/`[^`]*`/g, " ");
  const withoutImages = withoutInlineCode.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  const tokens = withoutImages.split(/\s+/).filter(Boolean);
  return tokens.length;
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "title"],
  },
};

const faqAnswerProcessor = remark()
  .use(remarkGfm, { singleTilde: false })
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify)
  .freeze();

function parseFaq(
  raw: unknown,
  slug: string,
): FaqItem[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) {
    throw new Error(
      `Article ${slug}: faq invalid — expected array, got ${typeof raw}`,
    );
  }
  if (raw.length === 0) return undefined;

  return raw.map((item, i) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(
        `Article ${slug}: faq[${i}] invalid — expected object with q and a, got ${item === null ? "null" : typeof item}`,
      );
    }
    const record = item as Record<string, unknown>;
    const q = record.q;
    const a = record.a;
    if (typeof q !== "string") {
      throw new Error(
        `Article ${slug}: faq[${i}].q invalid — expected non-empty string, got ${typeof q}`,
      );
    }
    if (q.trim().length === 0) {
      throw new Error(
        `Article ${slug}: faq[${i}].q invalid — empty string after trim`,
      );
    }
    if (typeof a !== "string") {
      throw new Error(
        `Article ${slug}: faq[${i}].a invalid — expected non-empty string, got ${typeof a}`,
      );
    }
    if (a.trim().length === 0) {
      throw new Error(
        `Article ${slug}: faq[${i}].a invalid — empty string after trim`,
      );
    }
    return { q, a };
  });
}

export function faqAnswerToPlainText(markdown: string): string {
  if (typeof markdown !== "string" || markdown.length === 0) return "";

  let text = markdown;
  text = text.replace(/`([^`]*)`/g, "$1");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, "$1$2");
  text = text.replace(/(^|[^_])_(?!\s)([^_\n]+?)_/g, "$1$2");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export function parseArticleMeta(data: Record<string, unknown>): ArticleMeta {
  const slug = String(data.slug ?? "");
  return {
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    slug,
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    linked_timeline_weeks: Array.isArray(data.linked_timeline_weeks)
      ? data.linked_timeline_weeks.map(Number)
      : undefined,
    authorNote: data.authorNote ? String(data.authorNote) : undefined,
    canonical: data.canonical
      ? String(data.canonical)
      : `${BASE_URL}/articles/${slug}`,
    faq: parseFaq(data.faq, slug),
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

  // ⚠️ blockquote를 disclaimer로 분리
  const lines = content.split("\n");
  const disclaimerLines: string[] = [];
  const contentLines: string[] = [];
  let inDisclaimer = false;

  for (const line of lines) {
    if (!inDisclaimer && line.startsWith("> ⚠️")) {
      inDisclaimer = true;
      disclaimerLines.push(line.replace(/^>\s*/, "").replace(/^⚠️\s*/, ""));
    } else if (inDisclaimer && line.startsWith(">")) {
      disclaimerLines.push(line.replace(/^>\s*/, ""));
    } else {
      if (inDisclaimer) inDisclaimer = false;
      contentLines.push(line);
    }
  }

  const disclaimer = disclaimerLines.length > 0
    ? disclaimerLines.join(" ")
    : undefined;

  const mainContent = contentLines.join("\n");

  // ## 참고 자료 헤딩으로 본문/참고자료를 분리해서 별도 렌더 (본문 → FAQ → 참고자료 순서)
  const referencesHeadingRe = /^##\s+참고\s*자료\s*$/;
  const mainLines = mainContent.split("\n");
  const referencesStart = mainLines.findIndex((l) => referencesHeadingRe.test(l));

  const bodyMarkdown =
    referencesStart === -1
      ? mainContent
      : mainLines.slice(0, referencesStart).join("\n");
  const referencesMarkdown =
    referencesStart === -1
      ? ""
      : mainLines.slice(referencesStart).join("\n");

  const articleProcessor = remark()
    .use(remarkGfm, { singleTilde: false })
    .use(remarkRehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeArticleFigure)
    .use(rehypeStringify)
    .freeze();

  const result = await articleProcessor.process(bodyMarkdown);
  const referencesHtml = referencesMarkdown
    ? (await articleProcessor.process(referencesMarkdown)).toString()
    : undefined;

  const meta = parseArticleMeta(data);

  let faqHtmlAnswers: string[] | undefined;
  if (meta.faq && meta.faq.length > 0) {
    faqHtmlAnswers = await Promise.all(
      meta.faq.map(async (item) => {
        const processed = await faqAnswerProcessor.process(item.a);
        return processed.toString();
      }),
    );
  }

  return {
    ...meta,
    content: result.toString(),
    references: referencesHtml,
    disclaimer,
    wordCount: countWords(mainContent),
    faqHtmlAnswers,
  };
}
