#!/usr/bin/env python3
"""
videos.json / channels.json → vault atomic 노트 동기화 generator.

정책:
  - 신규 ID  : 새 노트 생성 (템플릿 본문 포함)
  - 기존 ID  : frontmatter의 generator-managed 키만 갱신, 사용자 본문/추가 키는 보존
  - 사라진 ID: 노트는 유지, frontmatter에 status=archived, archived_at=<오늘> 마킹
  - 부활 ID  : archived 마킹 제거 + 정상 갱신
  - 인덱스   : _index.md는 매번 완전 재생성 (사용자가 직접 편집하지 말 것)

사용:
    ./scripts/seed-vault-media-notes.py
    ./scripts/seed-vault-media-notes.py --dry-run
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml 필요. pip3 install pyyaml", file=sys.stderr)
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VAULT_ROOT = Path.home() / "Documents" / "pregnancy-checklist"
VIDEOS_DIR = VAULT_ROOT / "20-content" / "videos"
CHANNELS_DIR = VAULT_ROOT / "20-content" / "channels"

# generator가 관리하는 frontmatter 키. 그 외 키는 사용자가 추가한 것으로 간주, 보존.
VIDEO_MANAGED_KEYS = {
    "name", "description", "type", "status", "tags",
    "youtube_id", "url", "channel", "category", "categoryName",
    "subcategory", "subcategoryName",
    "archived_at", "last_synced",
}
CHANNEL_MANAGED_KEYS = {
    "name", "description", "type", "status", "tags",
    "youtube_channel_id", "handle", "thumbnail_url",
    "url", "category",
    "archived_at", "last_synced",
}

FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

VIDEO_BODY_TEMPLATE = """
## 핵심 메시지
-

## 인용한 vault 노트
- [[]]

## 메모
-
"""

CHANNEL_BODY_TEMPLATE = """
## 핵심 정보
-

## 대표 영상
- [[]]

## 인용한 vault 노트
- [[]]

## 메모
-
"""


def parse_note(path):
    """노트 파일을 (frontmatter_dict, body_str)로 파싱. 없으면 (None, None)."""
    if not path.exists():
        return None, None
    text = path.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    if not m:
        return {}, text
    fm = yaml.safe_load(m.group(1)) or {}
    body = text[m.end():]
    return fm, body


def write_note(path, fm, body, dry_run):
    if dry_run:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    fm_text = yaml.safe_dump(
        fm, allow_unicode=True, sort_keys=False, default_flow_style=False
    ).rstrip()
    path.write_text(f"---\n{fm_text}\n---\n{body}", encoding="utf-8")


def merge_fm(existing, new_managed, managed_keys):
    """기존 frontmatter의 managed 키만 새 값으로 덮어쓰고 나머지는 보존.
    managed_keys 외 키가 사라졌어도 그대로 둠 (사용자 추가 키 보호)."""
    out = dict(existing)
    for k, v in new_managed.items():
        out[k] = v
    return out


def video_fm(v):
    yt = v.get("youtube_id", "")
    channel_id = v.get("channel_id")
    return {
        "name": v.get("title", ""),
        "description": (v.get("description") or "")[:200],
        "type": "video",
        "status": "n/a",
        "tags": [
            "type/video",
            f"topic/{v.get('category','misc')}",
        ],
        "youtube_id": yt,
        "url": f"https://www.youtube.com/watch?v={yt}" if yt else "",
        "channel": f"[[20-content/channels/{channel_id}]]" if channel_id else "",
        "category": v.get("category", ""),
        "categoryName": v.get("categoryName", ""),
        "subcategory": v.get("subcategory", ""),
        "subcategoryName": v.get("subcategoryName", ""),
        "last_synced": datetime.date.today().isoformat(),
    }


def channel_fm(c):
    yt_ch = c.get("youtube_channel_id", "")
    return {
        "name": c.get("name", ""),
        "description": (c.get("description") or "")[:200],
        "type": "channel",
        "status": "n/a",
        "tags": [
            "type/channel",
            f"topic/{c.get('category','misc')}",
        ],
        "youtube_channel_id": yt_ch,
        "handle": c.get("handle", ""),
        "thumbnail_url": c.get("thumbnail_url", ""),
        "url": f"https://www.youtube.com/channel/{yt_ch}" if yt_ch else "",
        "category": c.get("category", ""),
        "last_synced": datetime.date.today().isoformat(),
    }


def sync_items(items, dir_path, fm_builder, body_template, managed_keys, id_key, dry_run):
    dir_path.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    existing_files = {p.stem: p for p in dir_path.glob("*.md") if not p.stem.startswith("_")}
    json_ids = set()
    created = updated = archived = revived = 0

    for item in items:
        item_id = item[id_key]
        json_ids.add(item_id)
        path = dir_path / f"{item_id}.md"
        new_fm = fm_builder(item)
        existing_fm, existing_body = parse_note(path)

        if existing_fm is None:
            write_note(path, new_fm, body_template, dry_run)
            created += 1
        else:
            was_archived = existing_fm.get("status") == "archived"
            existing_fm.pop("archived_at", None)
            merged = merge_fm(existing_fm, new_fm, managed_keys)
            write_note(path, merged, existing_body if existing_body else body_template, dry_run)
            if was_archived:
                revived += 1
            else:
                updated += 1

    # JSON에서 사라진 ID는 archived 마킹
    for stem, path in existing_files.items():
        if stem in json_ids:
            continue
        existing_fm, existing_body = parse_note(path)
        if existing_fm is None:
            continue
        if existing_fm.get("status") == "archived":
            continue
        existing_fm["status"] = "archived"
        existing_fm["archived_at"] = today
        # tags의 status/* 도 정리
        tags = existing_fm.get("tags", []) or []
        tags = [t for t in tags if not (isinstance(t, str) and t.startswith("status/"))]
        tags.append("status/archived")
        existing_fm["tags"] = tags
        write_note(path, existing_fm, existing_body or "", dry_run)
        archived += 1

    return created, updated, archived, revived


def write_videos_index(videos, channel_id_to_name, dry_run):
    today = datetime.date.today().isoformat()
    rows = [
        f"| [[20-content/videos/{v['id']}\\|{v['id']}]] | {v.get('title','')} | {v.get('categoryName','')} | {channel_id_to_name.get(v.get('channel_id'),'—')} |"
        for v in sorted(videos, key=lambda x: x["id"])
    ]
    fm = {
        "name": "동영상 인덱스",
        "description": f"src/data/videos.json 기준 전체 영상 목록 ({len(videos)}개). generator가 매번 재생성.",
        "type": "moc",
        "status": "n/a",
        "tags": ["type/moc", "topic/videos"],
        "last_synced": today,
    }
    body = (
        "\n> ⚠️ 이 파일은 generator가 매번 재생성합니다. 직접 편집하지 마세요.\n\n"
        "## 전체 영상\n\n"
        "| ID | 제목 | 카테고리 | 채널 |\n"
        "|------|------|------|------|\n"
        + "\n".join(rows) + "\n"
    )
    write_note(VIDEOS_DIR / "_index.md", fm, body, dry_run)


def write_channels_index(channels, videos_by_channel, dry_run):
    today = datetime.date.today().isoformat()
    rows = [
        f"| [[20-content/channels/{c['id']}\\|{c['id']}]] | {c.get('name','')} | {c.get('category','')} | {len(videos_by_channel.get(c['id'], []))} |"
        for c in sorted(channels, key=lambda x: x["id"])
    ]
    fm = {
        "name": "채널 인덱스",
        "description": f"src/data/channels.json 기준 전체 채널 목록 ({len(channels)}개). generator가 매번 재생성.",
        "type": "moc",
        "status": "n/a",
        "tags": ["type/moc", "topic/channels"],
        "last_synced": today,
    }
    body = (
        "\n> ⚠️ 이 파일은 generator가 매번 재생성합니다. 직접 편집하지 마세요.\n\n"
        "## 전체 채널\n\n"
        "| ID | 채널명 | 카테고리 | # 영상 |\n"
        "|------|------|------|---:|\n"
        + "\n".join(rows) + "\n"
    )
    write_note(CHANNELS_DIR / "_index.md", fm, body, dry_run)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not VAULT_ROOT.exists():
        print(f"ERROR: vault 없음: {VAULT_ROOT}", file=sys.stderr)
        sys.exit(1)

    videos_path = PROJECT_ROOT / "src/data/videos.json"
    channels_path = PROJECT_ROOT / "src/data/channels.json"
    videos = json.loads(videos_path.read_text(encoding="utf-8"))
    channels = json.loads(channels_path.read_text(encoding="utf-8"))

    if args.dry_run:
        print("[dry-run] 실제 파일은 수정하지 않습니다.\n")

    channel_id_to_name = {c["id"]: c.get("name", "") for c in channels}

    print(f"→ videos sync ({len(videos)} items in JSON)")
    c, u, a, r = sync_items(
        videos, VIDEOS_DIR, video_fm, VIDEO_BODY_TEMPLATE,
        VIDEO_MANAGED_KEYS, "id", args.dry_run,
    )
    print(f"  created={c}, updated={u}, archived={a}, revived={r}")

    print(f"→ channels sync ({len(channels)} items in JSON)")
    c, u, a, r = sync_items(
        channels, CHANNELS_DIR, channel_fm, CHANNEL_BODY_TEMPLATE,
        CHANNEL_MANAGED_KEYS, "id", args.dry_run,
    )
    print(f"  created={c}, updated={u}, archived={a}, revived={r}")

    videos_by_channel = {}
    for v in videos:
        videos_by_channel.setdefault(v.get("channel_id"), []).append(v)
    write_videos_index(videos, channel_id_to_name, args.dry_run)
    write_channels_index(channels, videos_by_channel, args.dry_run)
    print("→ indexes regenerated: _index.md (videos, channels)")

    print(
        "\n✓ 완료. 다음 실행 시 신규=생성 / 변경=frontmatter 갱신(본문 보존) / "
        "삭제=archived 마킹입니다."
    )


if __name__ == "__main__":
    main()
