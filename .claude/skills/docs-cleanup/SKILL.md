---
name: docs-cleanup
description: 1인 개발 프로젝트의 docs/ 폴더에 누적된 중복·legacy·컨벤션 위반을 분석하고 사용자 동의를 받아 정리하는 스킬. 인벤토리 → 중복 탐지(5패턴) → SoT 5축 컨벤션 검사 → 우선순위 리포트 → 동의받은 항목만 mv·rm·링크 일괄 갱신 → broken link 0 검증 순으로 진행합니다. 다음 상황에서 반드시 이 스킬을 사용하세요. '/docs-cleanup', 'docs 정리해줘', '문서 폴더 정리', 'docs 폴더 청소', '중복 문서 찾아줘', 'legacy md 정리', '빈 폴더 정리', '문서 컨벤션 검사', 'SoT 위반 찾아줘', 'phase 끝났으니 docs 정리', '분기 docs 점검', 'docs 인벤토리', '깨진 링크 찾아줘', '폴더 구조 정리해줘'. phase 종료 직후, 새 폴더 컨벤션 도입 후, 또는 분기별 정기 docs 점검 시점에 강하게 트리거됩니다. 본문 자동 압축이나 사용자 확인 없는 삭제는 하지 않으니 안전하게 호출하세요.
---

# docs-cleanup

`docs/` 폴더가 phase를 거치며 누적되면 같은 정보가 plan / step README / implementation / review / refactor 5곳에 흩어지고, legacy 명시 문서가 본문은 그대로 남고, 빈 폴더가 쌓이고, 종합 README가 본문까지 흡수해서 SoT 충돌을 만듭니다. 이 스킬은 그걸 주기적으로 정리합니다.

핵심 원칙은 두 가지입니다. **분석은 자동, 실행은 사용자 동의 후.** 그리고 **링크만 갱신하지 본문은 건드리지 않습니다** — phase plan의 본문은 archive 가치가 있고, 자동 압축은 그 가치를 파괴하기 때문입니다.

## 호출 시점

- phase 종료 직후 (산출물이 implementation·review·refactor에 안착하고, step README가 더 이상 SoT가 아닐 때)
- 새 폴더 컨벤션 도입 후 (예: `phase-X/plan.md` → `plan/phase-X.md` 평면화)
- 분기별 정기 점검
- 운영자가 "docs 어수선해" 같은 신호를 줄 때

## SoT 5축 컨벤션 (이 프로젝트)

이 스킬이 검사하는 기준은 다음 5축입니다. 위반은 리포트에 표시합니다.

| 폴더 | 페르소나 | 다루는 것 |
|---|---|---|
| `tech/` | 개발자 | 코드·아키텍처·구현/리뷰/리팩토링 산출물 |
| `marketing/` | 마케터 | 측정·운영·GA4·페르소나 |
| `design/` | 디자이너 | 디자인 시스템·UI/UX·페르소나 |
| `content/` | 콘텐츠 기획자 | 기획·백로그·페르소나 |
| `plan/` | 통합 | PRD + phase plan + 외부 도메인 스펙 (4축 횡단) |

- 각 축은 자기 시각만 다루고, 횡단되는 것(phase plan, 외부 스펙)은 `plan/`으로 모입니다.
- `tech/` 하위는 `implementation/`, `review/`, `refactor/` 분산형이 SoT입니다. 종합 README가 같은 정보를 들고 있으면 종합 README를 삭제합니다.
- 외부 도메인 스펙(크롤러·외부 데이터 파이프라인 등)은 `plan/specs/`. `tech/spec.md`(런타임 한 장 요약)와 분리합니다.
- phase plan은 `plan/phase-X.md` **단일 파일**. `phase-X/` 폴더 안에 `plan.md`만 들어있는 형식이면 단일 파일로 마이그레이션 대상입니다.

## 절차

### 1. 인벤토리

```bash
# 파일 트리
find docs -type f -name "*.md" | sort
# 폴더 트리 (깊이 포함)
find docs -type d | sort
# 빈 폴더
find docs -type d -empty
# 폴더별 .md 카운트
find docs -type d -exec sh -c 'echo "$(find "$1" -maxdepth 1 -name "*.md" | wc -l) $1"' _ {} \;
```

이 결과를 머릿속에 들고 다음 단계로 갑니다.

### 2. 중복 탐지 (5패턴)

각 패턴을 grep / 파일 비교로 찾고, 발견된 파일 리스트를 리포트에 모읍니다.

**패턴 A — 같은 산출물이 여러 위치에서 SoT 행세.** 예: `phase-X-step-Y/README.md`가 `tech/implementation/...-impl.md` + `tech/review/...-review.md` + `tech/refactor/...-refactor.md`와 같은 step을 다룸. 종합 README가 분산형 산출물을 단순 인덱싱만 하면 살리고, 본문까지 들고 있으면 삭제 후보.

```bash
# step 이름이 여러 위치에서 발견되는지
for step in $(ls docs/tech/implementation/ 2>/dev/null | sed 's/-impl\.md$//'); do
  echo "=== $step ==="
  find docs -name "*$step*"
done
```

**패턴 B — legacy 명시 문서.** 자기 본문에 "이 문서는 X로 갈음", "X로 통합", "deprecated", "more up to date version is at" 같은 자가 선언이 있음.

```bash
grep -rEi "(갈음|통합되었|이전됨|이 문서는 [^.]*에 흡수|deprecated|moved to|see instead)" docs/ --include="*.md"
```

**패턴 C — 빈 폴더.** `find docs -type d -empty`.

**패턴 D — 같은 컨벤션의 두 가지 표기 공존.** 가장 흔한 케이스: phase plan이 `plan/phase-X.md` 평면형과 `phase-X/plan.md` 폴더형으로 동시에 존재. 또는 step archive가 `tech/{impl,review,refactor}/` 분산형과 `phase-X-step-Y/README.md` 묶음형으로 공존.

```bash
# phase 폴더형 잔존 확인
find docs -type d -name "phase-*"
# step 묶음형 잔존 확인
find docs -type d -name "*-step-*"
```

**패턴 E — 인덱스 문서가 본문까지 누적해서 SoT 충돌.** `docs/README.md` 같은 인덱스가 phase 진행기록·완료 보고를 본문으로 들고 있으면 인덱스 책임을 넘긴 것. 인덱스만 남기고 본문은 해당 phase plan으로 흡수 후보.

```bash
# README가 phase 단어를 본문에 많이 가지고 있는지
grep -c "phase" docs/README.md docs/*/README.md 2>/dev/null
```

### 3. SoT 5축 컨벤션 검사

각 축이 자기 시각만 다루는지, 횡단 문서가 `plan/`에 가 있는지 확인합니다.

```bash
# tech/에 마케팅·디자인·콘텐츠 페르소나가 섞여있는지 (위반)
grep -lEi "(GA4|이벤트|conversion|디자인 토큰|콘텐츠 기획|백로그)" docs/tech/*.md

# marketing/에 코드/아키텍처가 섞여있는지 (위반)
grep -lEi "(useState|useEffect|Server Component|prisma|migration|스키마)" docs/marketing/*.md

# design/에 측정 지표나 코드가 섞여있는지 (위반)
grep -lEi "(GA4 이벤트|conversion rate|prisma|API endpoint)" docs/design/*.md

# 외부 도메인 스펙이 tech/에 잘못 들어가 있는지
ls docs/tech/specs* docs/tech/spec/ 2>/dev/null
```

위반 후보는 리포트에 "SoT 위반: <파일> (사유)" 형태로 적습니다.

### 4. 분석 리포트 출력 (즉시 실행 X)

다음 구조로 채팅에 출력합니다. 파일로 저장하지 않고 단발성입니다.

```markdown
# docs-cleanup 분석 리포트

## 인벤토리
- .md 파일: N개
- 폴더: M개 (깊이 최대 D)
- 빈 폴더: K개

## 중복 패턴

### 패턴 A — 종합 README가 분산형 SoT와 중복
- docs/phase-4-step-1-checklist-hub/README.md (impl/review/refactor가 tech/ 하위에 따로 있음)
- ...

### 패턴 B — legacy 명시 문서
- docs/infra/architecture.md ("tech/infra.md로 갈음" 선언)
- ...

### 패턴 C — 빈 폴더
- docs/specs/ (이동 후 잔존)
- ...

### 패턴 D — 컨벤션 두 가지 표기
- phase plan 폴더형 잔존: docs/phase-3/, docs/phase-4/
  → plan/phase-X.md 평면형이 SoT
- ...

### 패턴 E — 인덱스 SoT 충돌
- docs/README.md: phase 1/1.5/2 진행기록을 본문에 들고 있음

## SoT 5축 위반
- docs/tech/marketing-impact.md: 마케팅 페르소나가 tech/에 섞임 → marketing/으로 이동 후보

## 깨진 링크
- docs/plan/plan.md → ../phase-4/plan.md (대상 없음)
- ...

## 액션 리스트 (우선순위)

### P0 — 안전 삭제 (사용자 확인 후)
- [ ] 빈 폴더 5개 삭제
- [ ] legacy 명시 문서 3개 삭제 (본문은 SoT가 가리키는 곳에 이미 있음을 확인 완료)

### P1 — 컨벤션 재배치
- [ ] docs/specs/* → docs/plan/specs/ 이동 + 모든 참조 링크 갱신
- [ ] docs/phase-4/plan.md → docs/plan/phase-4.md 평면화 + 참조 갱신
- [ ] docs/{implementation,review,refactor}/ → docs/tech/ 하위로 이동 + 참조 갱신

### P2 — 표시 텍스트 정합성
- [ ] 갱신된 경로의 표시 텍스트(`docs/X/Y.md` 형태) 일괄 교체
- [ ] README 인덱스의 phase 진행기록 본문 → 인덱스 줄로 압축

진행하시겠어요? P0/P1/P2 단위로 동의 받겠습니다.
```

### 5. 사용자 동의 받은 항목만 실행

P0 → P1 → P2 순서로 진행합니다. 각 단계마다 운영자 OK를 받고 다음으로 갑니다.

**파일/폴더 이동·삭제**

```bash
# 이동
git mv docs/specs docs/plan/specs
# 삭제 (legacy 명시·빈 폴더만)
rmdir docs/empty-folder
git rm docs/legacy-doc.md
```

`git mv` / `git rm`을 우선 써서 git이 rename을 추적하게 합니다.

**링크 일괄 갱신**

상대경로 링크와 표시 텍스트(절대 경로 `docs/X/Y.md`)를 모두 바꿉니다. 깊이별로 `../` 갯수가 달라지므로 주의합니다.

```bash
# 패턴 1: 상대경로 링크
# docs/foo/bar.md 안의 ../specs/x.md → ../plan/specs/x.md
# 깊이별로 sed 패턴이 다르므로 파일별 grep으로 먼저 확인
grep -rn "specs/" docs/ --include="*.md"

# 패턴 2: 표시 텍스트 (절대 경로 docs/...)
grep -rn "docs/specs/" docs/ --include="*.md"
sed -i '' 's|docs/specs/|docs/plan/specs/|g' $(grep -rl "docs/specs/" docs/ --include="*.md")

# 갱신 후 stale 패턴 0 확인
grep -rn "docs/specs/" docs/ --include="*.md"  # 결과 없어야 함
```

**갱신 후 재 grep으로 stale 0 확인.** 빠지면 다음 단계 검증에서 broken link로 잡히지만, 여기서 막는 게 깔끔합니다.

**본문 텍스트 갱신 (4영역)**

링크 url만 갱신하면 사람이 본문을 읽을 때 옛 구조를 설명하는 산문이 그대로 남아 SoT 거짓말이 됩니다. mv/rm을 한 항목마다 다음 4영역을 추가로 스캔·갱신합니다.

*영역 1 — 폴더 트리 다이어그램.* `tech/folder.md`·`README.md` 같은 파일에 ` ```text ` 블록으로 `docs/` 트리가 그려져 있는 경우. 폴더가 옮겨지거나 사라졌으면 다이어그램도 같이 바뀌어야 합니다.

```bash
# 트리 다이어그램이 있는 후보 파일
grep -rln "^docs/" docs/ --include="*.md"
grep -rlnE "^[│├└]" docs/ --include="*.md"
# 후보 파일을 열어 실제 find docs -type d 결과와 대조
find docs -type d | sort
```

*영역 2 — 운영 룰 안내 문구.* "코드 리뷰 결과는 `docs/review/<feature>-review.md`에 기록" 같은 절차 문장. 폴더 위치가 바뀌면 절차 문장도 바뀌어야 합니다. 본문에 절대경로 `docs/X/` 텍스트(링크 안이 아닌 산문 안)가 등장하면 후보입니다.

```bash
# 본문 산문 안의 docs/X/ 절대경로 (백틱 코드 인라인 포함)
grep -rnE '`docs/[^`]+`' docs/ --include="*.md"
grep -rnE 'docs/[a-zA-Z][a-zA-Z0-9_/-]*\.md' docs/ --include="*.md"
```

*영역 3 — legacy 폐기 선언 문장.* "과거 `docs/X/`는 …" / "X로 갈음" / "X와 어긋남" 패턴. legacy 폴더를 실제로 삭제했다면 선언 문장 자체를 다시 써야 합니다. sed로 경로만 치환하면 자기 자신을 가리키는 우스꽝스러운 텍스트("과거 docs/tech/infra.md는 … 이 문서(=docs/tech/infra.md)가 현재 진실")가 생기므로 sed 금지, 운영자에게 재작성 제안.

```bash
grep -rnE "(과거|legacy|기존|이전).{0,40}(docs/[^[:space:]\`)]+).{0,40}(갈음|어긋|폐기|흡수|진실)" docs/ --include="*.md"
```

매치되면 다음 둘 중 하나로 운영자에게 제안합니다.
- 옛 경로가 더 이상 존재하지 않으면 → "legacy `docs/X/`는 YYYY-MM-DD 정리 시 삭제, 본 문서로 갈음" 한 줄로 압축
- 옛 경로가 새 위치로 이동했으면 → "과거 `docs/old/X.md`는 `docs/new/X.md`로 이동, 본 문서가 현재 진실"

*영역 4 — 산출물 위치 표 (페르소나 문서).* `tech/persona.md` §3.2 같은 곳에 "GA4 측정 모델 → `docs/phase-4.5/plan.md` §1" 식의 표·리스트. 페르소나 문서 안의 절대경로는 거의 항상 산출물 위치 안내라 일괄 검사 대상입니다.

```bash
# 페르소나 문서 안의 docs/X/Y.md 절대경로
grep -nE 'docs/[a-zA-Z][a-zA-Z0-9_/-]*\.md' docs/*/persona.md docs/persona.md 2>/dev/null
```

각 영역의 갱신 후보는 운영자에게 한 번 보여주고 OK 받은 뒤 적용합니다. 영역 1·3은 sed 일괄치환이 위험하므로 손으로 다시 씁니다. 영역 2·4는 단순 경로 치환이라 sed로 가능합니다.

### 6. 검증

**broken link 0 확인.** 모든 .md의 `[text](path)` 링크를 파일 시스템에서 resolve합니다. 외부 참조(`.claude/`, repo root 파일 `AGENTS.md`·`CLAUDE.md`·`DESIGN.md`, `http(s)://`)는 제외합니다.

```bash
# 모든 마크다운 링크 추출 + resolve 시도
python3 - <<'PY'
import re, os
from pathlib import Path

root = Path("docs")
broken = []
for md in root.rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    for m in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', text):
        target = m.group(2).split('#')[0]
        if not target or target.startswith(('http://', 'https://', 'mailto:')):
            continue
        if target.startswith(('.claude/', '/')) or target in ('AGENTS.md', 'CLAUDE.md', 'DESIGN.md'):
            continue
        resolved = (md.parent / target).resolve()
        if not resolved.exists():
            broken.append(f"{md}: {target}")
for b in broken:
    print(b)
print(f"\nbroken: {len(broken)}")
PY
```

**깊이별 상대경로 정확성.** 같은 파일이 옮겨가면 `../`이 한 칸 줄거나 늘어납니다. broken link 결과로 잡히면 그 자리에서 수정합니다.

**전후 카운트 비교.** 정리 전/후 파일·폴더 수를 보고합니다.

```bash
echo "after: $(find docs -name '*.md' | wc -l) md, $(find docs -type d | wc -l) folders"
```

**폴더 트리 다이어그램 vs 실제 파일 시스템 diff.** `tech/folder.md` 등에 그려진 트리가 실제 `find docs -type d` 결과와 일치하는지 확인합니다.

```bash
# 실제 트리
find docs -type d | sort | sed 's|^docs|docs|'
# tech/folder.md 안의 트리 블록 추출 (수동 비교)
awk '/^```text/,/^```/' docs/tech/folder.md
```

폴더 한 개라도 빠지거나 옛 폴더가 남아있으면 SoT 거짓말입니다. 그 자리에서 다이어그램을 다시 씁니다.

**자기 자신을 가리키는 legacy 선언 패턴 자동 탐지.** sed가 잘못 치환해서 "과거 X는 … 이 문서가 현재 진실" 문장의 X가 현재 문서 자기 자신을 가리키는 경우를 찾습니다.

```bash
python3 - <<'PY'
import re
from pathlib import Path

pat = re.compile(r"(?:과거|legacy|기존|이전)\s*[`']?(docs/[^\s`')]+)[`']?[^.\n]{0,80}?(?:갈음|어긋|진실|흡수|폐기)")
for md in Path("docs").rglob("*.md"):
    rel = str(md)
    text = md.read_text(encoding="utf-8")
    for m in pat.finditer(text):
        ref = m.group(1).rstrip('.,;:`')
        if ref == rel or ref.endswith("/" + md.name):
            print(f"SELF-REFERENCE: {rel}: {m.group(0)[:120]}")
PY
```

매치되면 그 문장은 의미가 깨진 상태입니다. 운영자에게 보여주고 다시 씁니다.

### 7. Obsidian vault 미러

cleanup commit 직후 단방향 미러를 한 번 돌립니다. `scripts/sync-obsidian-vault.sh`는 `rsync -av --delete`라 docs/에서 삭제·이동된 것이 vault `10-project/docs/`에도 그대로 반영됩니다.

```bash
# 먼저 dry-run으로 vault 변경 미리보기 (큰 정리는 한 번 보고 실행 권장)
./scripts/sync-obsidian-vault.sh --dry-run

# 이상 없으면 실제 미러
./scripts/sync-obsidian-vault.sh
```

vault의 `_mirror/` 안 파일이나 `10-project/docs/`는 다음 sync에서 덮어씌워지므로 운영자가 그 안에 직접 메모를 적어두지 않았다는 전제로 안전합니다(이 프로젝트의 작업 컨벤션). 메모는 별도 노트에 `[[wikilink]]`로 연결됩니다.

## 절대 하지 말 것

- **사용자 확인 없는 파일 삭제.** P0 빈 폴더와 자가 선언된 legacy 문서만 예외이며, 그조차도 리포트에서 한 번 보여주고 OK 받습니다.
- **본문 내용 자동 압축·삭제.** 링크와 표시 텍스트만 갱신합니다. phase plan 본문은 archive 가치가 있어 SoT가 다른 곳을 가리키더라도 본문은 보존합니다.
- **외부 메모리(`.claude/`)나 repo root 파일(`AGENTS.md`·`CLAUDE.md`·`DESIGN.md`)을 docs/ 안으로 이동.** 이들은 docs/ 바깥이 SoT입니다.
- **phase plan 본문을 README나 다른 곳에 흡수.** 인덱스 한 줄로 가리키기만 합니다.

## 내부 룰 (베이크인)

- **종합 README vs 분산형 산출물 충돌 시:** step별 산출물의 SoT는 `tech/{implementation,review,refactor}/` 분산형. 종합 README가 같은 정보를 들고 있으면 **종합 README 삭제**.
- **phase plan 형식:** `plan/phase-X.md` 단일 파일. `phase-X/` 폴더 + `plan.md` 형식 발견 시 단일 파일로 마이그레이션.
- **외부 도메인 스펙:** `plan/specs/`. `tech/spec.md`(런타임 한 장 요약)와 분리.
- **legacy 명시 문서 처리:** 자기 본문에 "X로 갈음" 선언이 있으면 SoT가 가리키는 곳에 본문이 실제로 있는지 확인한 뒤 흡수·삭제.
- **링크는 url만 보지 말고 표시 텍스트(`[docs/X/Y.md](...)`의 첫 `[...]`)와 본문 텍스트(폴더 트리·운영 룰·legacy 폐기 선언·산출물 위치 표)도 같이 갱신.** 링크만 고치면 사람이 본문 읽을 때 옛 구조 설명이 남아있어 SoT 거짓말이 됩니다.

## 산출물

1. **분석 리포트** — 채팅에 단발성 출력 (위 4단계 구조). 파일로 저장하지 않습니다.
2. **commit 메시지 초안** — 정리 실행 후 한국어 + `DOCS:` prefix.

```
DOCS: docs/ 폴더 5축 컨벤션 정리

- 빈 폴더 N개 삭제
- legacy 문서 M개 SoT로 흡수 후 삭제
- specs → plan/specs, implementation/review/refactor → tech/ 하위 이동
- 모든 ../X/ 상대경로 일괄 갱신, broken link 0 확인
- 결과: P개 .md → Q개, R개 폴더 → 5축 + 하위 S개

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 참고: 직전 정리 결과 (2026-05-05)

이 스킬이 박혀있는 컨벤션은 다음 정리에서 도출됐습니다.

- 60+ → 51 .md, 폴더 18개 → 5축(`tech`·`marketing`·`design`·`content`·`plan`) + 하위 4개로 정리.
- `docs/README.md`는 인덱스만 남기고 Phase 1·1.5·2 진행기록 본문 제거.
- legacy `infra/`, 빈 폴더 5개, 종합 README 6개, 중복 step plan 2개 삭제.
- `specs/` → `plan/specs/`, `implementation/`·`review/`·`refactor/` → `tech/` 하위로 이동.
- 모든 `../X/` 상대경로 sed 일괄 갱신, broken link 0 확인.

다음 정리 때 비슷한 모양이 다시 쌓여있으면 같은 룰로 잡아냅니다.
