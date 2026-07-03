// 데이터(deck json) → 카드 HTML 조립기.
// 디자인은 styles.css가 담당. 여기선 구조만 만든다.

// 텍스트 안전 처리 + 미니 마크업:
//   \n      → 줄바꿈(<br>)
//   *강조*  → 형광펜 하이라이트(span.hl)  ※표지 h1 전용
function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function fmt(s = "", { hl = false } = {}) {
  let t = esc(s).replace(/\n/g, "<br />");
  if (hl) t = t.replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');
  return t;
}

const BRAND = "출산 준비 체크리스트";
const runhead = (brand = BRAND) =>
  `<div class="runhead"><span class="dot"></span>${esc(brand)}</div>`;

function cover(c) {
  return `<section class="card cover">
    ${runhead(c.brand)}
    ${c.kicker ? `<span class="kicker">${esc(c.kicker)}</span>` : ""}
    <h1>${fmt(c.title, { hl: true })}</h1>
    ${c.sub ? `<p class="sub">${fmt(c.sub)}</p>` : ""}
    <div class="swipe">${esc(c.swipe || "넘겨서 확인 →")}</div>
  </section>`;
}

function body(c, pageno) {
  const num = c.num ? `<span class="num">${esc(c.num)}</span> ` : "";
  const paras = (c.paras || []).map((p) => `<p>${fmt(p)}</p>`).join("\n");
  const callout = c.callout
    ? `<div class="callout ${c.callout.tone || "tip"}">
        ${c.callout.label ? `<span class="label">${esc(c.callout.label)}</span>` : ""}
        ${fmt(c.callout.text)}
      </div>`
    : "";
  const stat = c.stat
    ? `<div class="stat">${c.stat
        .map((s) => `<div class="box"><div class="big">${esc(s.big)}</div><div class="cap">${esc(s.cap)}</div></div>`)
        .join("")}</div>`
    : "";
  const page = pageno ? `<div class="pageno">${esc(pageno)}</div>` : "";
  return `<section class="card body">
    ${runhead(c.brand)}
    <h2>${num}${fmt(c.title)}</h2>
    ${paras}
    ${callout}
    ${stat}
    ${page}
  </section>`;
}

function cta(c) {
  return `<section class="card cta">
    <div class="mark">📋 ${esc(c.mark || BRAND)}</div>
    <h2>${fmt(c.title)}</h2>
    ${c.link ? `<div class="link">${esc(c.link)}</div>` : ""}
    ${c.handle ? `<div class="handle">${esc(c.handle)}</div>` : ""}
  </section>`;
}

// 카드 1장 렌더. pageno는 export.mjs가 본문 카드에 자동 주입.
export function renderCard(card, pageno) {
  if (card.type === "cover") return cover(card);
  if (card.type === "cta") return cta(card);
  return body(card, pageno);
}

// 카드 1장을 담은 완결 HTML 문서 (styles.css 인라인 주입 → 파일 의존 없이 스크린샷)
export function renderPage(cardHtml, css) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
<style>${css}\nbody{margin:0;background:#fff}</style>
</head><body>${cardHtml}</body></html>`;
}
