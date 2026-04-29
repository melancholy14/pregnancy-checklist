import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * 채널 썸네일 수집 스크립트 검증.
 * YouTube API 호출이 필요한 테스트는 제외하고,
 * 스크립트 인프라 + 에러 핸들링 + 데이터 무결성을 검증한다.
 */

const SCRIPT_PATH = path.resolve("scripts/fetch-channel-thumbs.ts");
const CHANNELS_PATH = path.resolve("src/data/channels.json");

type Channel = {
  id: string;
  youtube_channel_id: string;
  name: string;
  thumbnail_url: string;
};

test.describe("채널 썸네일 수집 스크립트 인프라", () => {
  test("fetch-channel-thumbs.ts 파일이 존재한다", () => {
    expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
  });

  test("package.json에 fetch-channel-thumbs 스크립트가 정의되어 있다", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve("package.json"), "utf8")
    );
    expect(pkg.scripts["fetch-channel-thumbs"]).toBeTruthy();
  });

  test(".env.example에 YOUTUBE_API_KEY 항목이 있다", () => {
    const envExample = fs.readFileSync(
      path.resolve(".env.example"),
      "utf8"
    );
    expect(envExample).toContain("YOUTUBE_API_KEY");
  });
});

test.describe("API 키 미설정 시 에러 핸들링", () => {
  test("YOUTUBE_API_KEY 없이 실행하면 exit 1을 반환한다", () => {
    try {
      execSync("YOUTUBE_API_KEY= npx tsx scripts/fetch-channel-thumbs.ts", {
        encoding: "utf8",
        stdio: "pipe",
      });
      // 여기 도달하면 실패 (exit 0이면 안 됨)
      expect(true).toBe(false);
    } catch (err: unknown) {
      const error = err as { status: number; stderr: string };
      expect(error.status).toBe(1);
      expect(error.stderr).toContain("YOUTUBE_API_KEY");
    }
  });

  test("에러 메시지에 수동 입력 안내가 포함된다", () => {
    try {
      execSync("YOUTUBE_API_KEY= npx tsx scripts/fetch-channel-thumbs.ts", {
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (err: unknown) {
      const error = err as { stderr: string };
      expect(error.stderr).toContain("수동으로 입력");
    }
  });
});

test.describe("--force 없이 실행 시 기존 URL 보존", () => {
  test("모든 채널에 thumbnail_url이 있으면 스킵 메시지를 출력한다", () => {
    const output = execSync(
      "YOUTUBE_API_KEY=dummy npx tsx scripts/fetch-channel-thumbs.ts",
      { encoding: "utf8", stdio: "pipe" }
    );
    expect(output).toContain("이미 존재합니다");
    expect(output).toContain("--force");
  });
});

test.describe("channels.json 데이터 무결성", () => {
  let channels: Channel[];

  test.beforeAll(() => {
    channels = JSON.parse(fs.readFileSync(CHANNELS_PATH, "utf8"));
  });

  test("모든 채널에 youtube_channel_id가 존재한다", () => {
    for (const ch of channels) {
      expect(ch.youtube_channel_id).toBeTruthy();
    }
  });

  test("모든 채널에 thumbnail_url이 존재한다", () => {
    for (const ch of channels) {
      expect(ch.thumbnail_url).toBeTruthy();
      expect(ch.thumbnail_url).toMatch(/^https:\/\//);
    }
  });

  test("youtube_channel_id가 중복되지 않는다", () => {
    const ids = channels.map((ch) => ch.youtube_channel_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
