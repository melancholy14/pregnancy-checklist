#!/bin/bash
set -u

# Lighthouse SEO 자동 검증 스크립트
# 사용법:
#   bash scripts/lighthouse-check.sh                  # out/ 을 http-server 로 자동 기동
#   bash scripts/lighthouse-check.sh http://...:3000  # 이미 떠있는 서버에 그대로 붙음
#
# 주의: `serve` 패키지는 Content-Disposition: inline; filename=... 헤더를 붙여
#       Chrome headless 가 다운로드 인터스티셜을 띄우므로 사용 금지. http-server 사용.

# 정적 export 결과물(out/) 은 /timeline → out/timeline.html 로 빌드되고
# http-server 는 extensionless 요청을 디렉토리(out/timeline/) 로 보내 404 가 됨.
# 실제 GitHub Pages 응답과 같은 페이지이므로 .html 로 검증.
PAGES=(
  "/index.html"
  "/timeline.html"
  "/baby-fair.html"
  "/weight.html"
  "/info.html"
  "/checklist.html"
  "/articles/early-pregnancy-tests.html"
)
THRESHOLD=90
PASS=true
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [ $# -ge 1 ]; then
  BASE_URL="$1"
else
  if [ ! -f "out/index.html" ]; then
    echo "❌ out/index.html 가 없습니다. 먼저 'npm run build' 또는 'npm run deploy' 수준의 빌드를 돌리세요."
    exit 1
  fi

  PORT=4321
  while lsof -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
  done

  echo "🌀 http-server out/ 기동 중 (port $PORT)…"
  npx --yes http-server out -p "$PORT" --silent >/dev/null 2>&1 &
  SERVER_PID=$!

  for _ in {1..20}; do
    if curl -sf "http://localhost:$PORT/" -o /dev/null; then
      break
    fi
    sleep 0.5
  done
  if ! curl -sf "http://localhost:$PORT/" -o /dev/null; then
    echo "❌ http-server 가 응답하지 않습니다."
    exit 1
  fi
  BASE_URL="http://localhost:$PORT"
fi

echo "🔍 Lighthouse SEO 검증 시작"
echo "   Base URL: $BASE_URL"
echo "   대상: ${#PAGES[@]}개 페이지"
echo "   기준: SEO ${THRESHOLD}+"
echo ""

for page in "${PAGES[@]}"; do
  url="${BASE_URL}${page}"
  tmp_json="$(mktemp -t lh-XXXXXX.json)"

  if ! npx lighthouse "$url" \
    --output=json \
    --output-path="$tmp_json" \
    --quiet \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --only-categories=seo,accessibility >/dev/null 2>&1; then
    echo "⚠️ ${page}  Lighthouse 실행 실패 — 건너뜀 (재현: npx lighthouse $url --chrome-flags=\"--headless --no-sandbox --disable-gpu\" --only-categories=seo,accessibility)"
    PASS=false
    rm -f "$tmp_json"
    continue
  fi

  if ! scores=$(node -e "
    const r=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
    if (r.runtimeError) { console.error(r.runtimeError.message); process.exit(2); }
    const seo=Math.floor((r.categories.seo?.score ?? 0)*100);
    const a11y=Math.floor((r.categories.accessibility?.score ?? 0)*100);
    console.log(seo + ' ' + a11y);
  " "$tmp_json" 2>&1); then
    echo "⚠️ ${page}  Lighthouse runtime error: $scores"
    PASS=false
    rm -f "$tmp_json"
    continue
  fi
  rm -f "$tmp_json"

  seo=$(echo "$scores" | cut -d' ' -f1)
  a11y=$(echo "$scores" | cut -d' ' -f2)

  if [ "$seo" -lt "$THRESHOLD" ]; then
    echo "❌ ${page}  SEO: ${seo}  A11y: ${a11y}"
    PASS=false
  else
    echo "✅ ${page}  SEO: ${seo}  A11y: ${a11y}"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PASS" = false ]; then
  echo "❌ FAIL: SEO ${THRESHOLD}점 미만 페이지 존재"
  exit 1
fi

echo "✅ PASS: 전체 ${#PAGES[@]}개 페이지 SEO ${THRESHOLD}+"
