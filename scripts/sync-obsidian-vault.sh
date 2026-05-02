#!/usr/bin/env bash
# 프로젝트 산출물 → Obsidian vault 단방향 미러.
#
# vault    : ~/Documents/pregnancy-checklist
# project  : 이 스크립트가 있는 저장소 루트
#
# Usage:
#   ./scripts/sync-obsidian-vault.sh            # 실제 동기화
#   ./scripts/sync-obsidian-vault.sh --dry-run  # 변경만 미리보기

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT_ROOT="${HOME}/Documents/pregnancy-checklist"

IS_DRY_RUN=0
RSYNC_OPTS=(--exclude='.DS_Store')
if [[ "${1:-}" == "--dry-run" ]]; then
  IS_DRY_RUN=1
  RSYNC_OPTS+=(--dry-run)
  echo "[dry-run] 실제 복사하지 않고 변경 사항만 출력합니다."
  echo
fi

if [[ ! -d "${VAULT_ROOT}" ]]; then
  echo "ERROR: vault 폴더 없음: ${VAULT_ROOT}" >&2
  echo "       Obsidian vault를 먼저 생성하세요." >&2
  exit 1
fi

# 미러 대상 폴더가 vault 안에 없으면 만들어 둠 (--delete 안전 가드)
mkdir -p \
  "${VAULT_ROOT}/10-project/docs" \
  "${VAULT_ROOT}/10-project/design" \
  "${VAULT_ROOT}/20-content/articles/_mirror" \
  "${VAULT_ROOT}/20-content/drafts/_mirror" \
  "${VAULT_ROOT}/30-domain/_data"

RSYNC_BASE=(rsync -av --delete "${RSYNC_OPTS[@]}")

echo "→ docs/ → 10-project/docs/  (.md 만)"
"${RSYNC_BASE[@]}" \
  --include='*/' \
  --include='*.md' \
  --exclude='*' \
  "${PROJECT_ROOT}/docs/" \
  "${VAULT_ROOT}/10-project/docs/"

echo
echo "→ DESIGN.md → 10-project/design/design-system.md"
if [[ -f "${PROJECT_ROOT}/DESIGN.md" ]]; then
  if [[ "${IS_DRY_RUN}" -eq 0 ]]; then
    cp "${PROJECT_ROOT}/DESIGN.md" "${VAULT_ROOT}/10-project/design/design-system.md"
  else
    echo "  (dry-run) cp DESIGN.md"
  fi
fi

echo
echo "→ AGENTS.md → 10-project/agents.md"
if [[ -f "${PROJECT_ROOT}/AGENTS.md" ]]; then
  if [[ "${IS_DRY_RUN}" -eq 0 ]]; then
    cp "${PROJECT_ROOT}/AGENTS.md" "${VAULT_ROOT}/10-project/agents.md"
  else
    echo "  (dry-run) cp AGENTS.md"
  fi
fi

echo
echo "→ src/content/articles/ → 20-content/articles/_mirror/"
"${RSYNC_BASE[@]}" \
  --include='*.md' \
  --exclude='*' \
  "${PROJECT_ROOT}/src/content/articles/" \
  "${VAULT_ROOT}/20-content/articles/_mirror/"

echo
echo "→ src/content/draft/ → 20-content/drafts/_mirror/"
"${RSYNC_BASE[@]}" \
  --include='*.md' \
  --exclude='*' \
  "${PROJECT_ROOT}/src/content/draft/" \
  "${VAULT_ROOT}/20-content/drafts/_mirror/"

echo
echo "→ src/data/ → 30-domain/_data/  (json/yaml 모두)"
"${RSYNC_BASE[@]}" \
  "${PROJECT_ROOT}/src/data/" \
  "${VAULT_ROOT}/30-domain/_data/"

echo
echo "✓ 미러 완료."
echo "  주의: '_mirror/', '10-project/docs/', '30-domain/_data/' 안의 파일은"
echo "       다음 sync에서 덮어씌워집니다. 메모는 별도 노트로 만들고 [[wikilink]]로 연결하세요."
