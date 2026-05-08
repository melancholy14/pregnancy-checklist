import type { Element, ElementContent, Root, RootContent } from "hast";
import type { Plugin } from "unified";

const AI_MARKER = "(AI 생성 이미지)";
const AI_CHIP_LABEL = "Imagined with AI";
const AI_CAPTION_SUFFIX = " · AI 생성";

export interface RehypeArticleFigureOptions {
  /**
   * Throw on alt-missing or external-image. Build pipeline uses default (warn).
   */
  strict?: boolean;
}

export const rehypeArticleFigure: Plugin<[RehypeArticleFigureOptions?], Root> = (
  options = {},
) => {
  const strict = options.strict ?? false;

  function isWhitespaceText(node: ElementContent): boolean {
    return node.type === "text" && /^\s*$/.test(node.value);
  }

  function getStringProp(el: Element, name: string): string {
    const value = el.properties?.[name];
    return typeof value === "string" ? value : "";
  }

  function buildFigure(img: Element): Element {
    const alt = getStringProp(img, "alt");
    const src = getStringProp(img, "src");
    const caption = getStringProp(img, "title").trim();

    if (!alt) {
      const message = `[rehype-article-figure] image missing alt: ${src || "(no src)"}`;
      if (strict) throw new Error(message);
      console.warn(message);
    }

    if (/^https?:\/\//i.test(src)) {
      console.warn(
        `[rehype-article-figure] external image (운영자 SOP discourages): ${src}`,
      );
    }

    const isAI = alt.includes(AI_MARKER);

    const { title: _droppedTitle, ...imgPropsWithoutTitle } =
      img.properties ?? {};
    const cleanImg: Element = {
      ...img,
      properties: imgPropsWithoutTitle,
    };

    const mediaChildren: ElementContent[] = [cleanImg];
    if (isAI) {
      mediaChildren.push({
        type: "element",
        tagName: "span",
        properties: {
          className: ["article-figure__chip"],
          ariaHidden: "true",
        },
        children: [{ type: "text", value: AI_CHIP_LABEL }],
      });
    }

    const figureChildren: ElementContent[] = [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["article-figure__media"] },
        children: mediaChildren,
      },
    ];

    if (caption) {
      const captionText = isAI ? `${caption}${AI_CAPTION_SUFFIX}` : caption;
      figureChildren.push({
        type: "element",
        tagName: "figcaption",
        properties: { className: ["article-figure__caption"] },
        children: [{ type: "text", value: captionText }],
      });
    }

    return {
      type: "element",
      tagName: "figure",
      properties: { className: ["article-figure"] },
      children: figureChildren,
    };
  }

  function transformChildren(nodes: ElementContent[]): ElementContent[] {
    const result: ElementContent[] = [];

    for (const node of nodes) {
      if (node.type === "element" && node.tagName === "p") {
        const meaningful = node.children.filter(
          (child) => !isWhitespaceText(child as ElementContent),
        );
        if (
          meaningful.length === 1 &&
          meaningful[0].type === "element" &&
          (meaningful[0] as Element).tagName === "img"
        ) {
          result.push(buildFigure(meaningful[0] as Element));
          continue;
        }
      }

      if (node.type === "element") {
        result.push({
          ...node,
          children: transformChildren(node.children) as Element["children"],
        });
        continue;
      }

      result.push(node);
    }

    return result;
  }

  return (tree: Root) => {
    tree.children = transformChildren(
      tree.children as ElementContent[],
    ) as RootContent[];
  };
};

export default rehypeArticleFigure;
