/**
 * YouTube oEmbed API 기반 영상 상태 일괄 검증 스크립트
 *
 * - API 키 불필요 (oEmbed는 공개 API)
 * - 각 영상의 공개/삭제/비공개 상태 확인
 * - 채널 정보(author_name, author_url) 역추적
 *
 * 사용법:
 *   npx tsx scripts/verify-videos.ts
 */

import fs from "node:fs";
import path from "node:path";

const VIDEOS_PATH = path.resolve("src/data/videos.json");
const CHANNELS_PATH = path.resolve("src/data/channels.json");

type Video = {
  id: string;
  title: string;
  youtube_id: string;
  category: string;
  categoryName: string;
  channel_id: string;
};

type Channel = {
  id: string;
  youtube_channel_id: string;
  name: string;
  handle: string;
  thumbnail_url: string;
};

type OEmbedResponse = {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
};

type VerifyResult = {
  video: Video;
  status: "ok" | "unavailable" | "error";
  oembed?: OEmbedResponse;
  error?: string;
};

async function checkVideo(video: Video): Promise<VerifyResult> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.youtube_id}&format=json`;

  try {
    const res = await fetch(url);
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return { video, status: "unavailable" };
    }
    if (!res.ok) {
      return { video, status: "error", error: `HTTP ${res.status}` };
    }
    const data: OEmbedResponse = await res.json();
    return { video, status: "ok", oembed: data };
  } catch (err) {
    return {
      video,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  const videos: Video[] = JSON.parse(fs.readFileSync(VIDEOS_PATH, "utf8"));
  const channels: Channel[] = JSON.parse(
    fs.readFileSync(CHANNELS_PATH, "utf8")
  );

  console.log(`🔍 영상 ${videos.length}개 검증 시작 (oEmbed API)\n`);

  // 동시 요청 제한 (5개씩 배치)
  const BATCH_SIZE = 5;
  const results: VerifyResult[] = [];

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(checkVideo));
    results.push(...batchResults);

    // 진행률 표시
    const done = Math.min(i + BATCH_SIZE, videos.length);
    process.stdout.write(`\r  진행: ${done}/${videos.length}`);
  }
  console.log("\n");

  // 결과 분류
  const ok = results.filter((r) => r.status === "ok");
  const unavailable = results.filter((r) => r.status === "unavailable");
  const errors = results.filter((r) => r.status === "error");

  // 정상 영상
  console.log(`✅ 정상: ${ok.length}개`);

  // 삭제/비공개 영상
  if (unavailable.length > 0) {
    console.log(`\n❌ 삭제/비공개: ${unavailable.length}개`);
    for (const r of unavailable) {
      const ch = channels.find((c) => c.id === r.video.channel_id);
      console.log(
        `  - ${r.video.id} (${r.video.youtube_id}): "${r.video.title}" [${ch?.name ?? r.video.channel_id}]`
      );
    }
  }

  // 에러
  if (errors.length > 0) {
    console.log(`\n⚠️  에러: ${errors.length}개`);
    for (const r of errors) {
      console.log(`  - ${r.video.id}: ${r.error}`);
    }
  }

  // 채널 정보 보강: youtube_channel_id가 빈 채널의 영상에서 author_url 추출
  const emptyIdChannels = channels.filter((ch) => !ch.youtube_channel_id);
  if (emptyIdChannels.length > 0) {
    console.log(`\n📋 youtube_channel_id 미설정 채널 정보:`);
    for (const ch of emptyIdChannels) {
      const videoResult = ok.find(
        (r) => r.video.channel_id === ch.id && r.oembed
      );
      if (videoResult?.oembed) {
        console.log(`  - ${ch.id} (${ch.name}):`);
        console.log(`    author_name: ${videoResult.oembed.author_name}`);
        console.log(`    author_url:  ${videoResult.oembed.author_url}`);
      } else {
        console.log(`  - ${ch.id} (${ch.name}): 참조 영상 없거나 확인 불가`);
      }
    }
  }

  // 제목 불일치 검출 (oEmbed 제목 vs 등록 제목)
  const titleMismatches = ok.filter(
    (r) =>
      r.oembed &&
      r.oembed.title !== r.video.title &&
      // 너무 사소한 차이는 무시 (공백, 특수문자)
      r.oembed.title.replace(/\s+/g, " ").trim() !==
        r.video.title.replace(/\s+/g, " ").trim()
  );
  if (titleMismatches.length > 0) {
    console.log(`\n📝 제목 불일치: ${titleMismatches.length}개`);
    for (const r of titleMismatches) {
      console.log(`  - ${r.video.id}:`);
      console.log(`    등록: ${r.video.title}`);
      console.log(`    실제: ${r.oembed!.title}`);
    }
  }

  // 요약
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`총 ${videos.length}개 | ✅ ${ok.length} | ❌ ${unavailable.length} | ⚠️  ${errors.length}`);

  if (unavailable.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    "❌ 예상치 못한 오류:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
