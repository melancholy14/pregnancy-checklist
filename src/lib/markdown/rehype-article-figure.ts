import fs from "fs";
import path from "path";
import type { Element, ElementContent, Properties, Root, RootContent } from "hast";
import type { Plugin } from "unified";

const AI_MARKER = "(AI 생성 이미지)";
const AI_CHIP_LABEL = "Imagined with AI";
const AI_CAPTION_SUFFIX = " · AI 생성";
const ORIGINAL_CAPTION_SUFFIX = " · 원본 보기";
const ANCHOR_ARIA_LABEL = "원본 이미지 새 창에서 보기";

const PUBLIC_DIR = path.join(process.cwd(), "public");

type ImageDimensions = { width: number; height: number };

// PNG/JPEG 헤더에서 width/height 추출. image-size 라이브러리 대체 — runtime dependency 회피.
function readImageDimensions(src: string): ImageDimensions | undefined {
  if (/^https?:\/\//i.test(src)) return undefined;
  if (!src.startsWith("/")) return undefined;

  const filePath = path.normalize(path.join(PUBLIC_DIR, src));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    console.warn(`[rehype-article-figure] image path escape blocked: ${src}`);
    return undefined;
  }

  let buf: Buffer;
  try {
    buf = fs.readFileSync(filePath);
  } catch {
    console.warn(`[rehype-article-figure] image-size read failed: ${src}`);
    return undefined;
  }

  if (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 8 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          width: buf.readUInt16BE(i + 7),
          height: buf.readUInt16BE(i + 5),
        };
      }
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }

  console.warn(`[rehype-article-figure] unsupported image format: ${src}`);
  return undefined;
}

function createExternalLinkSvg(): Element {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
    },
    children: [
      {
        type: "element",
        tagName: "path",
        properties: { d: "M15 3h6v6" },
        children: [],
      },
      {
        type: "element",
        tagName: "path",
        properties: { d: "M10 14 21 3" },
        children: [],
      },
      {
        type: "element",
        tagName: "path",
        properties: {
          d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
        },
        children: [],
      },
    ],
  };
}

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
    const dimensions = readImageDimensions(src);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title: _droppedTitle, ...imgPropsWithoutTitle } =
      img.properties ?? {};
    const cleanImgProps: Properties = {
      ...imgPropsWithoutTitle,
      loading: "lazy",
    };
    if (dimensions) {
      cleanImgProps.width = dimensions.width;
      cleanImgProps.height = dimensions.height;
    }
    const cleanImg: Element = {
      ...img,
      properties: cleanImgProps,
    };

    const linkedImg: Element = {
      type: "element",
      tagName: "a",
      properties: {
        href: src,
        target: "_blank",
        rel: ["noopener", "noreferrer"],
        className: ["article-figure__link"],
        ariaLabel: ANCHOR_ARIA_LABEL,
      },
      children: [cleanImg],
    };

    const mediaChildren: ElementContent[] = [linkedImg];

    if (!caption) {
      mediaChildren.push({
        type: "element",
        tagName: "span",
        properties: {
          className: ["article-figure__external"],
          ariaHidden: "true",
        },
        children: [createExternalLinkSvg()],
      });
    }

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
      let captionText = caption;
      if (isAI) captionText += AI_CAPTION_SUFFIX;
      captionText += ORIGINAL_CAPTION_SUFFIX;
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
