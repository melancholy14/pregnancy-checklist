import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllArticles } from "@/lib/articles";
import videoData from "@/data/videos.json";
import channelData from "@/data/channels.json";
import type { ChannelItem, VideoItem } from "@/types/video";
import { InfoContainer } from "@/components/info/InfoContainer";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "정보 - 임신·출산 블로그와 영상 모음",
  description:
    "임신 초기 검사, 출산 준비물, 산후조리, 임산부 운동·영양 등 임신과 출산에 필요한 블로그 글과 검증된 영상을 한곳에서 탐색할 수 있어요.",
  alternates: {
    canonical: `${BASE_URL}/info`,
  },
  openGraph: {
    title: "정보 - 임신·출산 블로그와 영상 모음",
    description:
      "임신 초기 검사, 출산 준비물, 산후조리, 임산부 운동·영양 등 임신과 출산에 필요한 블로그 글과 검증된 영상을 한곳에서 탐색할 수 있어요.",
    url: `${BASE_URL}/info`,
    images: [OG_IMAGE],
  },
};

export default function InfoPage() {
  const articles = getAllArticles();
  const videos = videoData as VideoItem[];
  const channels = channelData as ChannelItem[];

  return (
    <Suspense
      fallback={<div className="min-h-screen pb-24 px-4 pt-8" aria-hidden />}
    >
      <InfoContainer
        articles={articles}
        videos={videos}
        channels={channels}
      />
    </Suspense>
  );
}
