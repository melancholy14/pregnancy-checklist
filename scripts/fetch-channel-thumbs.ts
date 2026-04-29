/**
 * YouTube Data API v3 기반 채널 썸네일 자동 수집 스크립트
 *
 * 사용법:
 *   npx tsx scripts/fetch-channel-thumbs.ts          # 빈 thumbnail_url만 갱신
 *   npx tsx scripts/fetch-channel-thumbs.ts --force   # 전체 강제 갱신
 *
 * 환경변수:
 *   YOUTUBE_API_KEY — YouTube Data API v3 키 (.env.local에 설정)
 */

import fs from "node:fs";
import path from "node:path";

// .env.local 로드 (Next.js와 달리 tsx는 자동 로드하지 않음)
const envLocalPath = path.resolve(".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

const CHANNELS_PATH = path.resolve("src/data/channels.json");
const API_BASE = "https://www.googleapis.com/youtube/v3/channels";

type Channel = {
  id: string;
  youtube_channel_id: string;
  name: string;
  description: string;
  category: string;
  handle: string;
  thumbnail_url: string;
};

type YouTubeResponse = {
  items?: {
    id: string;
    snippet?: {
      thumbnails?: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }[];
  error?: { message: string };
};

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const force = process.argv.includes("--force");

  if (!apiKey) {
    console.error("❌ YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.");
    console.error("");
    console.error("   설정 방법:");
    console.error("   1. .env.local 파일에 YOUTUBE_API_KEY=your_key 추가");
    console.error(
      "   2. 또는 YOUTUBE_API_KEY=your_key npx tsx scripts/fetch-channel-thumbs.ts"
    );
    console.error("");
    console.error(
      "   API 키가 없으면 channels.json의 thumbnail_url을 수동으로 입력하세요."
    );
    process.exit(1);
  }

  const channels: Channel[] = JSON.parse(
    fs.readFileSync(CHANNELS_PATH, "utf8")
  );

  const targets = force
    ? channels
    : channels.filter((ch) => !ch.thumbnail_url);

  if (targets.length === 0) {
    console.log(
      "✅ 모든 채널에 thumbnail_url이 이미 존재합니다. (--force로 강제 갱신 가능)"
    );
    return;
  }

  console.log(`🔍 썸네일 수집 시작 (${targets.length}/${channels.length}개)`);
  if (force) console.log("   --force: 전체 강제 갱신 모드");
  console.log("");

  // 배치 호출 (최대 50개, 현재 17개이므로 1회)
  const ids = targets.map((ch) => ch.youtube_channel_id).join(",");
  const url = `${API_BASE}?part=snippet&id=${ids}&key=${apiKey}`;

  const res = await fetch(url);
  const data: YouTubeResponse = await res.json();

  if (data.error) {
    console.error(`❌ YouTube API 오류: ${data.error.message}`);
    process.exit(1);
  }

  if (!data.items || data.items.length === 0) {
    console.error("❌ API 응답에 채널 데이터가 없습니다.");
    process.exit(1);
  }

  // youtube_channel_id → thumbnail URL 매핑
  const thumbMap = new Map<string, string>();
  for (const item of data.items) {
    const thumbs = item.snippet?.thumbnails;
    const thumbUrl = thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url;
    if (thumbUrl) {
      thumbMap.set(item.id, thumbUrl);
    }
  }

  let updated = 0;
  for (const channel of channels) {
    const newUrl = thumbMap.get(channel.youtube_channel_id);
    if (!newUrl) continue;

    const isTarget = targets.some((t) => t.id === channel.id);
    if (!isTarget) continue;

    if (channel.thumbnail_url !== newUrl) {
      channel.thumbnail_url = newUrl;
      updated++;
      console.log(`  ✅ ${channel.name} — 갱신됨`);
    } else {
      console.log(`  ⏭️  ${channel.name} — 변경 없음`);
    }
  }

  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2) + "\n");

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `✅ 완료: ${updated}개 갱신, ${targets.length - updated}개 변경 없음`
  );
}

main().catch((err) => {
  console.error("❌ 예상치 못한 오류:", err instanceof Error ? err.message : err);
  process.exit(1);
});
