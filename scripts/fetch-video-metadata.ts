/**
 * YouTube Data API v3 기반 영상 메타데이터 수집·검증 스크립트
 *
 * - title, channelTitle, publishedAt, duration을 API로 가져와 videos.json과 비교
 * - Shorts 판별 (duration ≤ 60초)
 * - --update 플래그 시 videos.json에 upload_date·is_short 필드 추가
 *
 * 사용법:
 *   npx tsx scripts/fetch-video-metadata.ts            # 검증 리포트만
 *   npx tsx scripts/fetch-video-metadata.ts --update   # videos.json 업데이트
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

const VIDEOS_PATH = path.resolve("src/data/videos.json");
const CHANNELS_PATH = path.resolve("src/data/channels.json");
const API_BASE = "https://www.googleapis.com/youtube/v3/videos";

type Video = {
  id: string;
  title: string;
  youtube_id: string;
  category: string;
  categoryName: string;
  subcategory: string;
  subcategoryName: string;
  description: string;
  channel_id: string;
  upload_date?: string;
  is_short?: boolean;
};

type Channel = {
  id: string;
  youtube_channel_id: string;
  name: string;
};

type ApiItem = {
  id: string;
  snippet?: {
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    title: string;
    description: string;
  };
  contentDetails?: {
    duration: string; // ISO 8601 PT#H#M#S
  };
};

type ApiResponse = {
  items?: ApiItem[];
  error?: { message: string };
};

function parseIsoDuration(iso: string): number {
  // PT1H2M30S → 3750
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  return h * 3600 + m * 60 + s;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m${s}s`;
}

async function fetchBatch(
  ids: string[],
  apiKey: string
): Promise<Map<string, ApiItem>> {
  const url = `${API_BASE}?part=snippet,contentDetails&id=${ids.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  const data: ApiResponse = await res.json();
  if (data.error) {
    throw new Error(`YouTube API: ${data.error.message}`);
  }
  const map = new Map<string, ApiItem>();
  for (const item of data.items ?? []) {
    map.set(item.id, item);
  }
  return map;
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const updateMode = process.argv.includes("--update");

  if (!apiKey) {
    console.error("❌ YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  const videos: Video[] = JSON.parse(fs.readFileSync(VIDEOS_PATH, "utf8"));
  const channels: Channel[] = JSON.parse(
    fs.readFileSync(CHANNELS_PATH, "utf8")
  );
  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const channelByYtId = new Map(
    channels.map((c) => [c.youtube_channel_id, c])
  );

  console.log(`🔍 영상 ${videos.length}개 메타데이터 수집 (YouTube Data API v3)\n`);

  // 50개씩 배치
  const BATCH_SIZE = 50;
  const allItems = new Map<string, ApiItem>();
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    const ids = batch.map((v) => v.youtube_id);
    const result = await fetchBatch(ids, apiKey);
    for (const [k, v] of result) allItems.set(k, v);
    process.stdout.write(
      `\r  진행: ${Math.min(i + BATCH_SIZE, videos.length)}/${videos.length}`
    );
  }
  console.log("\n");

  // 결과 분석
  const missing: Video[] = [];
  const titleMismatches: { v: Video; api: string }[] = [];
  const channelMismatches: {
    v: Video;
    expected: string;
    apiChannel: string;
  }[] = [];
  const shorts: { v: Video; durSec: number }[] = [];
  const allWithDate: { v: Video; date: string; durSec: number }[] = [];

  for (const v of videos) {
    const item = allItems.get(v.youtube_id);
    if (!item || !item.snippet || !item.contentDetails) {
      missing.push(v);
      continue;
    }

    const apiTitle = item.snippet.title;
    const apiChannelTitle = item.snippet.channelTitle;
    const apiChannelId = item.snippet.channelId;
    const publishedAt = item.snippet.publishedAt; // ISO 8601 datetime
    const durSec = parseIsoDuration(item.contentDetails.duration);
    const uploadDate = publishedAt.slice(0, 10); // YYYY-MM-DD

    allWithDate.push({ v, date: uploadDate, durSec });

    // 제목 비교 (공백 정규화)
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    if (norm(apiTitle) !== norm(v.title)) {
      titleMismatches.push({ v, api: apiTitle });
    }

    // 채널 매핑 검증: videos.json의 channel_id에 연결된 채널의
    // youtube_channel_id가 API의 channelId와 일치하는지 확인
    const expectedChannel = channelMap.get(v.channel_id);
    if (!expectedChannel) {
      channelMismatches.push({
        v,
        expected: `(없음: ${v.channel_id})`,
        apiChannel: `${apiChannelTitle} (${apiChannelId})`,
      });
    } else if (expectedChannel.youtube_channel_id !== apiChannelId) {
      const actualChannel = channelByYtId.get(apiChannelId);
      channelMismatches.push({
        v,
        expected: `${expectedChannel.name} (${expectedChannel.youtube_channel_id})`,
        apiChannel: `${apiChannelTitle} (${apiChannelId})${actualChannel ? ` → channel_id: ${actualChannel.id}` : ""}`,
      });
    }

    // Shorts 판별: duration ≤ 60초
    if (durSec > 0 && durSec <= 60) {
      shorts.push({ v, durSec });
    }
  }

  // 리포트 출력
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 검증 결과 요약`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  총 영상: ${videos.length}개`);
  console.log(`  API 응답: ${allWithDate.length}개`);
  console.log(`  미응답(삭제/비공개): ${missing.length}개`);
  console.log(`  제목 불일치: ${titleMismatches.length}개`);
  console.log(`  채널 매핑 불일치: ${channelMismatches.length}개`);
  console.log(`  Shorts (≤60초): ${shorts.length}개`);
  console.log("");

  if (missing.length > 0) {
    console.log(`❌ API 미응답 영상 (삭제/비공개 가능):`);
    for (const v of missing) {
      console.log(`  - ${v.id} (${v.youtube_id}): "${v.title}"`);
    }
    console.log("");
  }

  if (titleMismatches.length > 0) {
    console.log(`📝 제목 불일치:`);
    for (const { v, api } of titleMismatches) {
      console.log(`  - ${v.id}:`);
      console.log(`      등록: ${v.title}`);
      console.log(`      실제: ${api}`);
    }
    console.log("");
  }

  if (channelMismatches.length > 0) {
    console.log(`🔀 채널 매핑 불일치:`);
    for (const { v, expected, apiChannel } of channelMismatches) {
      console.log(`  - ${v.id} ("${v.title}"):`);
      console.log(`      등록 매핑: ${expected}`);
      console.log(`      실제 채널: ${apiChannel}`);
    }
    console.log("");
  }

  if (shorts.length > 0) {
    console.log(`🎬 Shorts 영상 (${shorts.length}개):`);
    for (const { v, durSec } of shorts) {
      const ch = channelMap.get(v.channel_id);
      console.log(
        `  - ${v.id} [${formatDuration(durSec)}] ${ch?.name ?? v.channel_id}: ${v.title}`
      );
    }
    console.log("");
  }

  // duration 분포 (참고용)
  const buckets = { "≤60s": 0, "60-180s": 0, "3-10m": 0, "10-30m": 0, ">30m": 0 };
  for (const { durSec } of allWithDate) {
    if (durSec <= 60) buckets["≤60s"]++;
    else if (durSec <= 180) buckets["60-180s"]++;
    else if (durSec <= 600) buckets["3-10m"]++;
    else if (durSec <= 1800) buckets["10-30m"]++;
    else buckets[">30m"]++;
  }
  console.log(`⏱  Duration 분포: ${JSON.stringify(buckets)}`);
  console.log("");

  // --update 모드: videos.json에 upload_date·is_short 추가 + title/channel_id 재매핑
  if (updateMode) {
    let dateUpdated = 0;
    let titleUpdated = 0;
    let channelUpdated = 0;
    const orphanChannels: { v: Video; apiChannelId: string; apiChannelTitle: string }[] = [];

    for (const v of videos) {
      const item = allItems.get(v.youtube_id);
      if (!item || !item.snippet || !item.contentDetails) continue;

      // upload_date / is_short
      const durSec = parseIsoDuration(item.contentDetails.duration);
      const uploadDate = item.snippet.publishedAt.slice(0, 10);
      const isShort = durSec > 0 && durSec <= 60;
      if (v.upload_date !== uploadDate || v.is_short !== isShort) {
        v.upload_date = uploadDate;
        v.is_short = isShort;
        dateUpdated++;
      }

      // title 재매핑 (실제 유튜브 제목으로)
      if (v.title !== item.snippet.title) {
        v.title = item.snippet.title;
        titleUpdated++;
      }

      // channel_id 재매핑
      const apiChannelId = item.snippet.channelId;
      const matchedChannel = channelByYtId.get(apiChannelId);
      if (matchedChannel && v.channel_id !== matchedChannel.id) {
        v.channel_id = matchedChannel.id;
        channelUpdated++;
      } else if (!matchedChannel) {
        orphanChannels.push({
          v,
          apiChannelId,
          apiChannelTitle: item.snippet.channelTitle,
        });
      }
    }

    fs.writeFileSync(VIDEOS_PATH, JSON.stringify(videos, null, 2) + "\n");
    console.log(`✅ videos.json 업데이트 완료`);
    console.log(`   - upload_date/is_short: ${dateUpdated}개`);
    console.log(`   - title: ${titleUpdated}개`);
    console.log(`   - channel_id 재매핑: ${channelUpdated}개`);

    if (orphanChannels.length > 0) {
      console.log(`\n⚠️  channels.json에 없는 채널 (channel_id 미수정): ${orphanChannels.length}개`);
      for (const { v, apiChannelId, apiChannelTitle } of orphanChannels) {
        console.log(`   - ${v.id}: ${apiChannelTitle} (${apiChannelId})`);
      }
    }
  } else {
    console.log(`💡 videos.json 업데이트하려면 --update 플래그 추가`);
  }
}

main().catch((err) => {
  console.error(
    "❌ 예상치 못한 오류:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
