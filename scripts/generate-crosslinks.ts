/**
 * 콘텐츠 크로스링크 자동 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/generate-crosslinks.ts --dry-run   # 변경 사항만 출력 (파일 수정 없음)
 *   npx tsx scripts/generate-crosslinks.ts --apply     # 파일에 실제 반영
 *   npx tsx scripts/generate-crosslinks.ts --report    # 현재 크로스링크 통계 출력
 *
 * 보호되는 필드:
 *   *_manual: true 플래그가 sibling으로 있는 필드는 자동 매핑이 덮어쓰지 않습니다.
 *
 * 관리 대상 필드:
 *   - timeline_items.json[].linked_article_slugs
 *   - {hospital_bag,partner_prep,pregnancy_prep}_checklist.json meta.linked_article_slugs
 *   - src/content/articles/{slug}.md front matter linked_timeline_weeks
 */

import fs from "node:fs";
import path from "node:path";
import {
  CROSSLINK_THRESHOLD,
  CROSSLINK_TOP_N,
  ContentFeatures,
  inferUnifiedTagKeys,
  relevanceScore,
  tokenize,
  unifiedTagsForWeek,
} from "../src/lib/crosslink-utils";

// ──────────────────────────────────────────────────────────
// 경로
// ──────────────────────────────────────────────────────────

const ROOT = path.resolve(".");
const TIMELINE_PATH = path.resolve("src/data/timeline_items.json");
const ARTICLES_DIR = path.resolve("src/content/articles");
const CHECKLIST_FILES = [
  "src/data/hospital_bag_checklist.json",
  "src/data/partner_prep_checklist.json",
  "src/data/pregnancy_prep_checklist.json",
].map((p) => path.resolve(p));

// ──────────────────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────────────────

type RunMode = "dry-run" | "apply" | "report";
type RunOptions = { mode: RunMode; topN: number; threshold: number };

type TimelineItem = {
  id: string;
  week: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  linked_checklist_ids?: string[];
  linked_checklist_slugs?: string[];
  linked_article_slugs?: string[];
  linked_article_slugs_manual?: boolean;
  seo_slug?: string;
  isCustom?: boolean;
};

type ChecklistMeta = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  subcategories: { key: string; label: string }[];
  linked_timeline_weeks?: number[];
  linked_article_slugs?: string[];
  linked_article_slugs_manual?: boolean;
};

type ChecklistFile = {
  meta: ChecklistMeta;
  items: { id: string; title: string; note?: string }[];
};

type ArticleRecord = {
  slug: string;
  filePath: string;
  rawContent: string;
  frontMatterRaw: string;
  fmEndIndex: number;
  body: string;
  title: string;
  description: string;
  tags: string[];
  linkedTimelineWeeks?: number[];
  linkedTimelineWeeksManual: boolean;
};

type Loaded = {
  timeline: TimelineItem[];
  articles: ArticleRecord[];
  checklists: { filePath: string; data: ChecklistFile }[];
};

type Features = ContentFeatures;

// ──────────────────────────────────────────────────────────
// 인자 파싱
// ──────────────────────────────────────────────────────────

function parseArgs(argv: string[]): RunOptions | null {
  const flags = argv.slice(2);
  const modeKnown = new Set(["--dry-run", "--apply", "--report"]);
  let mode: RunMode | null = null;
  let topN = CROSSLINK_TOP_N;
  let threshold = CROSSLINK_THRESHOLD;

  for (const f of flags) {
    if (modeKnown.has(f)) {
      if (mode !== null) {
        console.error("❌ 모드 옵션은 하나만 지정할 수 있습니다.");
        return null;
      }
      if (f === "--dry-run") mode = "dry-run";
      else if (f === "--apply") mode = "apply";
      else mode = "report";
      continue;
    }
    const tuneMatch = f.match(/^--(threshold|top)=(.+)$/);
    if (tuneMatch) {
      const [, name, valueRaw] = tuneMatch;
      const value = Number(valueRaw);
      if (!Number.isFinite(value)) {
        console.error(`❌ --${name} 값이 숫자가 아닙니다: ${valueRaw}`);
        return null;
      }
      if (name === "threshold") {
        if (value < 0 || value > 1) {
          console.error(`❌ --threshold 는 0~1 사이여야 합니다 (입력: ${value}).`);
          return null;
        }
        threshold = value;
      } else {
        if (!Number.isInteger(value) || value < 1) {
          console.error(`❌ --top 은 1 이상 정수여야 합니다 (입력: ${value}).`);
          return null;
        }
        topN = value;
      }
      continue;
    }
    console.error(`❌ 알 수 없는 옵션: ${f}`);
    return null;
  }

  if (mode === null) return null;
  return { mode, topN, threshold };
}

function printUsage() {
  console.log("사용법:");
  console.log("  npx tsx scripts/generate-crosslinks.ts --dry-run   # 변경 미리보기");
  console.log("  npx tsx scripts/generate-crosslinks.ts --apply     # 파일에 반영");
  console.log("  npx tsx scripts/generate-crosslinks.ts --report    # 현재 통계");
  console.log("");
  console.log("튜닝 옵션 (dry-run/apply 에만 적용):");
  console.log(`  --threshold=<0~1>   # 매칭 점수 임계값 (기본 ${CROSSLINK_THRESHOLD})`);
  console.log(`  --top=<정수>        # 항목당 최대 링크 수 (기본 ${CROSSLINK_TOP_N})`);
}

// ──────────────────────────────────────────────────────────
// Front matter 파서/라이터 (의도적 최소 구현)
// ──────────────────────────────────────────────────────────

const FRONT_MATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

function parseFrontMatter(raw: string): {
  fmText: string;
  fmEndIndex: number;
  body: string;
  values: Record<string, unknown>;
} {
  const m = raw.match(FRONT_MATTER_RE);
  if (!m) {
    throw new Error("front matter 블록을 찾을 수 없습니다.");
  }
  const fmText = m[1];
  const fmEndIndex = m[0].length;
  const body = raw.slice(fmEndIndex);
  const values = parseSimpleYaml(fmText);
  return { fmText, fmEndIndex, body, values };
}

// 단순 YAML 파서 — 우리 front matter에서 쓰이는 패턴만 처리
//   key: "value"            (문자열, 따옴표 유무 모두)
//   key: [a, b, c]          (인라인 배열, 숫자/문자열)
//   key: true | false       (불리언)
//   key:                    (블록 시퀀스)
//     - item
function parseSimpleYaml(text: string): Record<string, unknown> {
  const lines = text.split("\n");
  const result: Record<string, unknown> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2];
    if (rest === "" || rest === undefined) {
      // 블록 시퀀스 또는 빈 값
      const arr: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
        const item = lines[j].replace(/^\s+-\s+/, "").trim();
        arr.push(stripQuotes(item));
        j++;
      }
      if (arr.length > 0) {
        result[key] = arr;
        i = j;
      } else {
        result[key] = "";
        i++;
      }
      continue;
    }
    const trimmed = rest.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1).trim();
      if (inner === "") {
        result[key] = [];
      } else {
        const parts = splitCsv(inner).map((p) => p.trim());
        const allNumbers = parts.every((p) => /^-?\d+(?:\.\d+)?$/.test(p));
        if (allNumbers) {
          result[key] = parts.map((p) => Number(p));
        } else {
          result[key] = parts.map((p) => stripQuotes(p));
        }
      }
    } else if (trimmed === "true" || trimmed === "false") {
      result[key] = trimmed === "true";
    } else {
      result[key] = stripQuotes(trimmed);
    }
    i++;
  }
  return result;
}

function splitCsv(s: string): string[] {
  // 따옴표를 인지해 콤마로 split
  const out: string[] = [];
  let buf = "";
  let inStr: string | null = null;
  for (const ch of s) {
    if (inStr) {
      buf += ch;
      if (ch === inStr) inStr = null;
    } else if (ch === '"' || ch === "'") {
      buf += ch;
      inStr = ch;
    } else if (ch === ",") {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function formatYamlInlineArray(values: (string | number)[]): string {
  if (values.length === 0) return "[]";
  if (typeof values[0] === "number") {
    return `[${values.join(", ")}]`;
  }
  return `[${values
    .map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(", ")}]`;
}

function setFrontMatterField(
  rawContent: string,
  key: string,
  values: (string | number)[] | null,
): string {
  const m = rawContent.match(FRONT_MATTER_RE);
  if (!m) {
    throw new Error("front matter 블록을 찾을 수 없습니다.");
  }
  const fmText = m[1];
  const body = rawContent.slice(m[0].length);

  const inlineRe = new RegExp(`^${key}:.*$`, "m");
  const blockRe = new RegExp(`^${key}:\\s*\\n(?:\\s+-\\s+.*\\n?)+`, "m");

  let newFm = fmText;

  if (values === null || values.length === 0) {
    // 필드 제거
    if (blockRe.test(newFm)) {
      newFm = newFm.replace(blockRe, "").replace(/\n+$/, "");
    } else if (inlineRe.test(newFm)) {
      newFm = newFm.replace(new RegExp(`^${key}:.*\\n?`, "m"), "").replace(/\n+$/, "");
    }
  } else {
    const newLine = `${key}: ${formatYamlInlineArray(values)}`;
    if (blockRe.test(newFm)) {
      newFm = newFm.replace(blockRe, `${newLine}\n`).replace(/\n+$/, "");
    } else if (inlineRe.test(newFm)) {
      newFm = newFm.replace(inlineRe, newLine);
    } else {
      newFm = `${newFm}\n${newLine}`;
    }
  }

  return `---\n${newFm}\n---\n${body}`;
}

// ──────────────────────────────────────────────────────────
// 로더
// ──────────────────────────────────────────────────────────

function loadAll(): Loaded {
  const timeline: TimelineItem[] = JSON.parse(fs.readFileSync(TIMELINE_PATH, "utf8"));

  const articleFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(ARTICLES_DIR, f));

  const articles: ArticleRecord[] = articleFiles.map((filePath) => {
    const rawContent = fs.readFileSync(filePath, "utf8");
    const fm = parseFrontMatter(rawContent);
    const slug = String(fm.values.slug ?? path.basename(filePath, ".md"));
    const title = String(fm.values.title ?? "");
    const description = String(fm.values.description ?? "");
    const tagsValue = fm.values.tags;
    const tags = Array.isArray(tagsValue) ? (tagsValue as unknown[]).map(String) : [];
    const ltw = fm.values.linked_timeline_weeks;
    const linkedTimelineWeeks = Array.isArray(ltw)
      ? (ltw as unknown[]).map((v) => Number(v)).filter((n) => !Number.isNaN(n))
      : undefined;
    return {
      slug,
      filePath,
      rawContent,
      frontMatterRaw: fm.fmText,
      fmEndIndex: fm.fmEndIndex,
      body: fm.body,
      title,
      description,
      tags,
      linkedTimelineWeeks,
      linkedTimelineWeeksManual: fm.values.linked_timeline_weeks_manual === true,
    };
  });

  const checklists = CHECKLIST_FILES.map((filePath) => {
    const data: ChecklistFile = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { filePath, data };
  });

  return { timeline, articles, checklists };
}

// ──────────────────────────────────────────────────────────
// 콘텐츠별 feature 계산
// ──────────────────────────────────────────────────────────

function timelineFeatures(item: TimelineItem): Features {
  const text = `${item.title} ${item.description ?? ""}`;
  const fromText = inferUnifiedTagKeys({ text });
  const fromWeek = unifiedTagsForWeek(item.week);
  return {
    unifiedTags: [...new Set([...fromText, ...fromWeek])],
    keywords: tokenize(text),
  };
}

function articleFeatures(article: ArticleRecord): Features {
  const text = `${article.title} ${article.description}`;
  return {
    unifiedTags: inferUnifiedTagKeys({ text, articleTags: article.tags }),
    keywords: tokenize(text),
  };
}

const CHECKLIST_BASE_TAGS: Record<string, string[]> = {
  "hospital-bag": ["birth-prep"],
  "partner-prep": ["birth-prep", "postpartum"],
  "pregnancy-prep": ["pregnancy-prep", "pregnancy-early"],
};

function checklistFeatures(checklist: ChecklistFile): Features {
  const meta = checklist.meta;
  const text = `${meta.title} ${meta.description} ${(checklist.items ?? [])
    .map((it) => `${it.title} ${it.note ?? ""}`)
    .join(" ")}`;
  const fromText = inferUnifiedTagKeys({ text });
  const base = CHECKLIST_BASE_TAGS[meta.slug] ?? [];
  return {
    unifiedTags: [...new Set([...fromText, ...base])],
    keywords: tokenize(`${meta.title} ${meta.description}`),
  };
}

// ──────────────────────────────────────────────────────────
// 매칭
// ──────────────────────────────────────────────────────────

function pickTopN<T>(
  scored: { item: T; score: number }[],
  topN: number = CROSSLINK_TOP_N,
  threshold: number = CROSSLINK_THRESHOLD,
): T[] {
  return scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.item);
}

/**
 * 단방향 매칭: 각 left 아이템에 대해 right 아이템과 점수 매기기 → top-N 추출 →
 * Map<leftKey, rightKey[]> 반환.
 */
function bipartiteMatch<L, R>(
  left: L[],
  right: R[],
  leftFeats: Map<string, Features>,
  rightFeats: Map<string, Features>,
  leftKey: (item: L) => string,
  rightKey: (item: R) => string,
  tuning: { topN: number; threshold: number },
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const l of left) {
    const lk = leftKey(l);
    const lF = leftFeats.get(lk)!;
    const scored = right.map((r) => ({
      item: r,
      score: relevanceScore(lF, rightFeats.get(rightKey(r))!),
    }));
    out.set(
      lk,
      pickTopN(scored, tuning.topN, tuning.threshold).map((r) => rightKey(r)),
    );
  }
  return out;
}

type ProposedLinks = {
  timelineToArticles: Map<string, string[]>;
  articleToTimelineWeeks: Map<string, number[]>;
  checklistToArticles: Map<string, string[]>;
};

function computeProposedLinks(
  loaded: Loaded,
  tuning: { topN: number; threshold: number },
): ProposedLinks {
  const tlFeatures = new Map(loaded.timeline.map((t) => [t.id, timelineFeatures(t)]));
  const articleFeats = new Map(loaded.articles.map((a) => [a.slug, articleFeatures(a)]));
  const checklistFeats = new Map(
    loaded.checklists.map((c) => [c.data.meta.slug, checklistFeatures(c.data)]),
  );

  // Timeline ↔ Article (양방향, 점수가 threshold 이상이면 양쪽 등록)
  const tlToArt = new Map<string, string[]>();
  const artToTlWeeks = new Map<string, number[]>();
  {
    const pairScores = new Map<string, { tlId: string; week: number; slug: string; score: number }[]>();
    for (const tl of loaded.timeline) {
      const tlF = tlFeatures.get(tl.id)!;
      const scored = loaded.articles.map((a) => ({
        item: a,
        score: relevanceScore(tlF, articleFeats.get(a.slug)!),
      }));
      const topArticles = pickTopN(scored, tuning.topN, tuning.threshold);
      tlToArt.set(tl.id, topArticles.map((a) => a.slug));
      for (const a of topArticles) {
        const arr = pairScores.get(a.slug) ?? [];
        arr.push({
          tlId: tl.id,
          week: tl.week,
          slug: a.slug,
          score: relevanceScore(tlF, articleFeats.get(a.slug)!),
        });
        pairScores.set(a.slug, arr);
      }
    }
    for (const a of loaded.articles) {
      const aF = articleFeats.get(a.slug)!;
      const scored = loaded.timeline.map((tl) => ({
        item: tl,
        score: relevanceScore(aF, tlFeatures.get(tl.id)!),
      }));
      const topTimelines = pickTopN(scored, tuning.topN, tuning.threshold);
      const fromArticleSide = topTimelines.map((tl) => tl.week);
      const fromTimelineSide = (pairScores.get(a.slug) ?? []).map((p) => p.week);
      const merged = [...new Set([...fromArticleSide, ...fromTimelineSide])].sort(
        (x, y) => x - y,
      );
      artToTlWeeks.set(a.slug, merged);
    }
    // Timeline 쪽도 article 쪽 top-N에 포함된 항목을 보장 — 양방향 대칭
    const timelineByWeek = new Map<number, TimelineItem[]>();
    for (const tl of loaded.timeline) {
      const arr = timelineByWeek.get(tl.week) ?? [];
      arr.push(tl);
      timelineByWeek.set(tl.week, arr);
    }
    for (const a of loaded.articles) {
      const weeks = artToTlWeeks.get(a.slug) ?? [];
      for (const week of weeks) {
        for (const tl of timelineByWeek.get(week) ?? []) {
          const list = tlToArt.get(tl.id) ?? [];
          if (!list.includes(a.slug)) {
            list.push(a.slug);
            tlToArt.set(tl.id, list);
          }
        }
      }
    }
  }

  const clToArt = bipartiteMatch(
    loaded.checklists.map((c) => c.data),
    loaded.articles,
    checklistFeats,
    articleFeats,
    (c) => c.meta.slug,
    (a) => a.slug,
    tuning,
  );

  return {
    timelineToArticles: tlToArt,
    articleToTimelineWeeks: artToTlWeeks,
    checklistToArticles: clToArt,
  };
}

// ──────────────────────────────────────────────────────────
// Diff 계산 + 적용
// ──────────────────────────────────────────────────────────

type StringDiff = { kind: "string"; before: string[]; after: string[] };
type NumberDiff = { kind: "number"; before: number[]; after: number[] };
type FieldDiff = StringDiff | NumberDiff;

type FileChange = {
  filePath: string;
  label: string;
  changes: {
    targetId: string;
    itemLabel: string;
    field: string;
    diff: FieldDiff;
    protected?: boolean;
  }[];
};

function arrayEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function existingArticleSlugs(loaded: Loaded): Set<string> {
  return new Set(loaded.articles.map((a) => a.slug));
}

function existingTimelineWeeks(loaded: Loaded): Set<number> {
  return new Set(loaded.timeline.map((t) => t.week));
}

function dedupSorted<T extends string | number>(arr: T[]): T[] {
  return [...new Set(arr)].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

function computeChanges(
  loaded: Loaded,
  proposed: ProposedLinks,
): {
  timelineChange: FileChange;
  checklistChanges: FileChange[];
  articleChanges: FileChange[];
} {
  const validArticles = existingArticleSlugs(loaded);
  const validWeeks = existingTimelineWeeks(loaded);

  // Timeline
  const tlChanges: FileChange["changes"] = [];
  for (const tl of loaded.timeline) {
    const itemLabel = `[week ${tl.week}] ${tl.id}`;

    // linked_article_slugs
    if (!tl.linked_article_slugs_manual) {
      const before = tl.linked_article_slugs ?? [];
      const proposedSlugs = (proposed.timelineToArticles.get(tl.id) ?? []).filter(
        (s) => validArticles.has(s),
      );
      const after = dedupSorted(proposedSlugs);
      if (!arrayEquals(before, after)) {
        tlChanges.push({
          targetId: tl.id,
          itemLabel,
          field: "linked_article_slugs",
          diff: { kind: "string", before, after },
        });
      }
    }
  }
  const timelineChange: FileChange = {
    filePath: TIMELINE_PATH,
    label: "src/data/timeline_items.json",
    changes: tlChanges,
  };

  // Checklists
  const checklistChanges: FileChange[] = loaded.checklists.map((cl) => {
    const itemLabel = `meta (${cl.data.meta.slug})`;
    const changes: FileChange["changes"] = [];
    const meta = cl.data.meta;

    if (!meta.linked_article_slugs_manual) {
      const before = meta.linked_article_slugs ?? [];
      const proposedSlugs = (proposed.checklistToArticles.get(meta.slug) ?? []).filter(
        (s) => validArticles.has(s),
      );
      const after = dedupSorted(proposedSlugs);
      if (!arrayEquals(before, after)) {
        changes.push({
          targetId: meta.slug,
          itemLabel,
          field: "linked_article_slugs",
          diff: { kind: "string", before, after },
        });
      }
    }
    return {
      filePath: cl.filePath,
      label: path.relative(ROOT, cl.filePath),
      changes,
    };
  });

  // Articles
  const articleChanges: FileChange[] = loaded.articles.map((a) => {
    const itemLabel = a.slug;
    const changes: FileChange["changes"] = [];

    if (!a.linkedTimelineWeeksManual) {
      const before = a.linkedTimelineWeeks ?? [];
      const proposedWeeks = (proposed.articleToTimelineWeeks.get(a.slug) ?? []).filter(
        (w) => validWeeks.has(w),
      );
      const after = dedupSorted(proposedWeeks);
      if (!arrayEquals(before, after)) {
        changes.push({
          targetId: a.slug,
          itemLabel,
          field: "linked_timeline_weeks",
          diff: { kind: "number", before, after },
        });
      }
    }
    return {
      filePath: a.filePath,
      label: path.relative(ROOT, a.filePath),
      changes,
    };
  });

  return { timelineChange, checklistChanges, articleChanges };
}

function applyChanges(
  loaded: Loaded,
  result: ReturnType<typeof computeChanges>,
): { filesWritten: number } {
  let filesWritten = 0;

  // Timeline
  if (result.timelineChange.changes.length > 0) {
    const data = loaded.timeline;
    const byId = new Map(data.map((t) => [t.id, t]));
    for (const change of result.timelineChange.changes) {
      const item = byId.get(change.targetId);
      if (!item) continue;
      if (change.field === "linked_article_slugs") {
        item.linked_article_slugs = change.diff.after as string[];
      }
    }
    fs.writeFileSync(TIMELINE_PATH, JSON.stringify(data, null, 2) + "\n");
    filesWritten++;
  }

  // Checklists
  for (const cl of result.checklistChanges) {
    if (cl.changes.length === 0) continue;
    const checklist = loaded.checklists.find((c) => c.filePath === cl.filePath);
    if (!checklist) continue;
    const meta = checklist.data.meta;
    for (const change of cl.changes) {
      if (change.field === "linked_article_slugs") {
        meta.linked_article_slugs = change.diff.after as string[];
      }
    }
    fs.writeFileSync(cl.filePath, JSON.stringify(checklist.data, null, 2) + "\n");
    filesWritten++;
  }

  // Articles
  for (const ar of result.articleChanges) {
    if (ar.changes.length === 0) continue;
    const article = loaded.articles.find((a) => a.filePath === ar.filePath);
    if (!article) continue;
    let raw = article.rawContent;
    for (const change of ar.changes) {
      const after = change.diff.after as (string | number)[];
      raw = setFrontMatterField(raw, change.field, after);
    }
    fs.writeFileSync(ar.filePath, raw);
    filesWritten++;
  }

  return { filesWritten };
}

// ──────────────────────────────────────────────────────────
// 출력 포맷터
// ──────────────────────────────────────────────────────────

function fmtArr(diff: FieldDiff): string {
  if (diff.kind === "number") {
    return `[${diff.after.join(", ")}]`;
  }
  return `[${diff.after.map((s) => `"${s}"`).join(", ")}]`;
}

function fmtBefore(diff: FieldDiff): string {
  if (diff.kind === "number") {
    return `[${diff.before.join(", ")}]`;
  }
  return `[${diff.before.map((s) => `"${s}"`).join(", ")}]`;
}

function printChanges(result: ReturnType<typeof computeChanges>) {
  let totalChanges = 0;

  const printFile = (fc: FileChange) => {
    if (fc.changes.length === 0) return;
    console.log(`\n📊 ${fc.label} — ${fc.changes.length}개 변경 예정`);
    for (const change of fc.changes) {
      totalChanges++;
      console.log(`  ${change.itemLabel}`);
      console.log(`    ${change.field}:`);
      console.log(`      before: ${fmtBefore(change.diff)}`);
      console.log(`      after:  ${fmtArr(change.diff)}`);
    }
  };

  printFile(result.timelineChange);
  for (const cl of result.checklistChanges) printFile(cl);
  for (const ar of result.articleChanges) printFile(ar);

  if (totalChanges === 0) {
    console.log("\n✅ 변경 사항 없음 — 모든 크로스링크가 최신 상태입니다.");
  } else {
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📋 총 ${totalChanges}개 변경 예정`);
  }
}

function printReport(loaded: Loaded) {
  console.log("\n📊 크로스링크 통계\n");

  // Timeline
  const tlArtCounts = loaded.timeline.map((t) => (t.linked_article_slugs ?? []).length);
  console.log(`Timeline (${loaded.timeline.length}개 아이템)`);
  console.log(`  linked_article_slugs: ${statline(tlArtCounts)}`);

  // Articles
  const artTlCounts = loaded.articles.map((a) => (a.linkedTimelineWeeks ?? []).length);
  console.log(`\nArticles (${loaded.articles.length}개 아이템)`);
  console.log(`  linked_timeline_weeks: ${statline(artTlCounts)}`);

  // Checklists
  console.log(`\nChecklists (${loaded.checklists.length}개 파일)`);
  for (const cl of loaded.checklists) {
    const meta = cl.data.meta;
    const arts = meta.linked_article_slugs ?? [];
    const tlw = meta.linked_timeline_weeks ?? [];
    console.log(`  ${meta.slug}`);
    console.log(`    linked_article_slugs:  ${arts.length}개`);
    console.log(`    linked_timeline_weeks: ${tlw.length}개 (수동 관리)`);
  }

  // Manual flag 보호 항목 (D-Mn11: 분포)
  printManualProtections(loaded);
}

function statline(counts: number[]): string {
  if (counts.length === 0) return "—";
  const total = counts.reduce((a, b) => a + b, 0);
  const avg = (total / counts.length).toFixed(1);
  const nonzero = counts.filter((c) => c > 0).length;
  const coverage = ((nonzero / counts.length) * 100).toFixed(0);
  return `평균 ${avg}개, 커버리지 ${coverage}% (${nonzero}/${counts.length})`;
}

type ManualProtection = {
  scope: "timeline" | "checklist" | "article";
  label: string;
  field: string;
};

function collectManualProtections(loaded: Loaded): ManualProtection[] {
  const rows: ManualProtection[] = [];
  for (const tl of loaded.timeline) {
    if (tl.linked_article_slugs_manual) {
      rows.push({
        scope: "timeline",
        label: `[week ${tl.week}] ${tl.id}`,
        field: "linked_article_slugs",
      });
    }
  }
  for (const cl of loaded.checklists) {
    if (cl.data.meta.linked_article_slugs_manual) {
      rows.push({
        scope: "checklist",
        label: cl.data.meta.slug,
        field: "linked_article_slugs",
      });
    }
  }
  for (const a of loaded.articles) {
    if (a.linkedTimelineWeeksManual) {
      rows.push({
        scope: "article",
        label: a.slug,
        field: "linked_timeline_weeks",
      });
    }
  }
  return rows;
}

function printManualProtections(loaded: Loaded) {
  const rows = collectManualProtections(loaded);
  if (rows.length === 0) return;
  console.log(`\n🔒 manual 보호로 자동 매핑 skip — ${rows.length}개`);
  const byScope = new Map<ManualProtection["scope"], ManualProtection[]>();
  for (const r of rows) {
    const arr = byScope.get(r.scope) ?? [];
    arr.push(r);
    byScope.set(r.scope, arr);
  }
  const order: ManualProtection["scope"][] = ["timeline", "checklist", "article"];
  for (const scope of order) {
    const list = byScope.get(scope);
    if (!list || list.length === 0) continue;
    console.log(`  ${scope} (${list.length})`);
    for (const r of list) {
      console.log(`    🔒 ${r.label} — ${r.field}`);
    }
  }
}

// ──────────────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);
  if (!opts) {
    printUsage();
    process.exit(1);
  }
  const { mode, topN, threshold } = opts;

  const loaded = loadAll();

  if (mode === "report") {
    printReport(loaded);
    return;
  }

  const proposed = computeProposedLinks(loaded, { topN, threshold });
  const result = computeChanges(loaded, proposed);

  if (mode === "dry-run") {
    console.log(
      `🔍 드라이런 — 파일은 수정되지 않습니다. (threshold=${threshold}, top=${topN})`,
    );
    printChanges(result);
    printManualProtections(loaded);
    return;
  }

  // apply
  printChanges(result);
  const totalChanges =
    result.timelineChange.changes.length +
    result.checklistChanges.reduce((sum, c) => sum + c.changes.length, 0) +
    result.articleChanges.reduce((sum, c) => sum + c.changes.length, 0);
  if (totalChanges === 0) return;

  const { filesWritten } = applyChanges(loaded, result);
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ 적용 완료: ${filesWritten}개 파일 수정됨`);
}

try {
  main();
} catch (err) {
  console.error("❌ 오류:", err instanceof Error ? err.message : err);
  process.exit(1);
}
