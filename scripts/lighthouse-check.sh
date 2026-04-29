#!/bin/bash

# Lighthouse SEO 자동 검증 스크립트
# 사용법: bash scripts/lighthouse-check.sh [BASE_URL]
# 기본값: http://localhost:3000

PAGES=(
  "/"
  "/timeline"
  "/baby-fair"
  "/weight"
  "/videos"
  "/articles"
  "/articles/hospital-bag"
)
BASE_URL="${1:-http://localhost:3000}"
THRESHOLD=90
PASS=true

echo "🔍 Lighthouse SEO 검증 시작"
echo "   Base URL: $BASE_URL"
echo "   대상: ${#PAGES[@]}개 페이지"
echo "   기준: SEO ${THRESHOLD}+"
echo ""

for page in "${PAGES[@]}"; do
  url="${BASE_URL}${page}"

  if ! result=$(npx lighthouse "$url" \
    --output=json \
    --quiet \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --only-categories=seo,accessibility 2>/dev/null); then
    echo "⚠️ ${page}  Lighthouse 실행 실패 — 건너뜀"
    PASS=false
    continue
  fi

  scores=$(node -e "
    const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const seo=Math.floor(r.categories.seo.score*100);
    const a11y=Math.floor(r.categories.accessibility.score*100);
    console.log(seo + ' ' + a11y);
  " <<< "$result" 2>/dev/null) || { echo "⚠️ ${page}  JSON 파싱 실패 — 건너뜀"; PASS=false; continue; }

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
