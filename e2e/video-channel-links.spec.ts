import { test, expect } from "@playwright/test";
import channels from "../src/data/channels.json";
import videos from "../src/data/videos.json";

test.describe("영상/채널 링크 클릭 검증", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/videos");
  });

  test.describe("영상 목록 링크", () => {
    test("모든 영상 카드가 올바른 YouTube 영상 링크를 가진다", async ({
      page,
    }) => {
      // 무엇을: 영상 뷰에서 모든 카드의 href 검증
      // 왜: 클릭 시 올바른 YouTube 영상으로 이동해야 함
      const videoLinks = page.locator('a[href*="youtube.com/watch"]');
      const count = await videoLinks.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const href = await videoLinks.nth(i).getAttribute("href");
        expect(href).toMatch(
          /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+$/
        );
        expect(await videoLinks.nth(i).getAttribute("target")).toBe("_blank");
      }
    });

    test("각 영상 카드가 data와 일치하는 YouTube ID를 포함한다", async ({
      page,
    }) => {
      // 무엇을: videos.json의 모든 영상이 페이지에 올바른 링크로 렌더링되는지
      // 왜: 데이터와 UI 간 정합성 보장
      for (const video of videos) {
        const expectedUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
        const link = page.locator(`a[href="${expectedUrl}"]`);
        await expect(link).toBeAttached();
      }
    });
  });

  test.describe("채널 목록 링크", () => {
    test.beforeEach(async ({ page }) => {
      // 채널 뷰로 전환
      await page.getByRole("button", { name: "채널" }).click();
    });

    test("모든 채널 카드가 YouTube 채널 링크를 가진다", async ({ page }) => {
      // 무엇을: 채널 뷰에서 모든 카드의 href 검증
      // 왜: 클릭 시 올바른 YouTube 채널로 이동해야 함
      const channelLinks = page.locator(
        'a[href*="youtube.com/channel/"]'
      );
      const count = await channelLinks.count();
      expect(count).toBe(channels.length);

      for (let i = 0; i < count; i++) {
        const href = await channelLinks.nth(i).getAttribute("href");
        expect(href).toMatch(/^https:\/\/www\.youtube\.com\/channel\/.+$/);
        expect(await channelLinks.nth(i).getAttribute("target")).toBe(
          "_blank"
        );
      }
    });

    test("각 채널 카드 클릭 시 채널명이 표시되고 링크가 정확하다", async ({
      page,
    }) => {
      // 무엇을: channels.json의 각 채널이 이름과 함께 올바른 링크로 렌더링되는지
      // 왜: 데이터와 UI 간 정합성 및 사용자 경험 보장
      for (const channel of channels) {
        const expectedUrl = `https://www.youtube.com/channel/${channel.youtube_channel_id}`;
        const link = page.locator(`a[href="${expectedUrl}"]`);
        await expect(link).toBeVisible();
        await expect(link.locator("h4", { hasText: channel.name })).toBeVisible();
      }
    });

    test("카테고리 필터별 채널이 정확히 표시된다", async ({ page }) => {
      // 무엇을: 각 카테고리 필터 클릭 시 해당 채널만 표시되는지
      // 왜: 필터링 후에도 링크가 올바르게 유지되어야 함
      const categories = [
        { key: "exercise", label: "임산부 운동" },
        { key: "birth_prep", label: "출산 준비" },
        { key: "newborn_care", label: "신생아 케어" },
      ];

      for (const cat of categories) {
        await page.getByRole("button", { name: cat.label }).click();
        const expected = channels.filter((ch) => ch.category === cat.key);
        const channelLinks = page.locator(
          'a[href*="youtube.com/channel/"]'
        );
        await expect(channelLinks).toHaveCount(expected.length);

        for (const ch of expected) {
          await expect(
            page.locator(
              `a[href="https://www.youtube.com/channel/${ch.youtube_channel_id}"]`
            )
          ).toBeVisible();
        }
      }
    });
  });
});
