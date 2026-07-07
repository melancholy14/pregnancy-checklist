// 데크(json)를 읽어 카드마다 1080×1350 PNG를 out/<slug>/NN.png 로 내보낸다.
//
// 사용법:
//   node tools/cardnews/export.mjs decks/hospital-bag.json
//   node tools/cardnews/export.mjs decks/hospital-bag.json --scale=1
//
// 흐름: json 읽기 → render.mjs로 카드 HTML 조립 → Playwright가 .card만 캡처
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { renderCard, renderPage } from "./render.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const deckArg = args.find((a) => !a.startsWith("--")) || "decks/hospital-bag.json";
const scale = Number((args.find((a) => a.startsWith("--scale=")) || "--scale=2").split("=")[1]);

const CW = 1080;
const CH = 1350;

const deckPath = resolve(HERE, deckArg);
const deck = JSON.parse(await readFile(deckPath, "utf8"));
const css = await readFile(resolve(HERE, "styles.css"), "utf8");
const slug = deck.slug || basename(deckArg).replace(/\.json$/, "");
const outDir = resolve(HERE, "out", slug);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: CW, height: CH },
  deviceScaleFactor: scale,
});

let n = 0;
for (const card of deck.cards) {
  n += 1;
  // 본문 카드에만 페이지 번호 자동 주입 (표지·CTA 제외)
  const pageno = card.type === "body" ? `${n} / ${deck.cards.length}` : null;
  const html = renderPage(renderCard(card, pageno), css);
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready); // 폰트 로드 대기 → 글자 밀림 방지
  const el = await page.$(".card");
  const file = resolve(outDir, String(n).padStart(2, "0") + ".png");
  await el.screenshot({ path: file });
  console.log("✓", file.replace(HERE + "/", ""));
}

await browser.close();

// 캐러셀 업로드 순서 + 인스타 캡션·해시태그 (복붙용)
const order = deck.cards
  .map((c, i) => `${String(i + 1).padStart(2, "0")}.png  [${c.type}]`)
  .join("\n");
const caption = deck.caption ? `\n\n=== 캡션 (복붙) ===\n${deck.caption}` : "";
const tags = deck.hashtags?.length ? `\n\n=== 해시태그 (복붙) ===\n${deck.hashtags.join(" ")}` : "";
await writeFile(resolve(outDir, "INDEX.txt"), `=== 업로드 순서 ===\n${order}${caption}${tags}\n`, "utf8");
console.log(`\n${n}장 완료 → tools/cardnews/out/${slug}/  (scale ${scale}x → ${CW * scale}×${CH * scale}px)`);
