import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllArticles } from "@/lib/articles";
import videoData from "@/data/videos.json";
import channelData from "@/data/channels.json";
import type { ChannelItem, VideoItem } from "@/types/video";
import { InfoContainer } from "@/components/info/InfoContainer";
import { PageDescription } from "@/components/common/PageDescription";
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
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8">
        <h1 className="mb-2 text-center">📚 정보</h1>
        <PageDescription>
          임신·출산에 필요한 블로그 글과 영상을 한곳에 모았어요. 관심 주제 태그로
          필터링하고, 블로그/영상 탭에서 원하는 형식만 골라 볼 수 있어요. 글은
          경험 기반으로 정리했고, 영상은 검증된 채널에서 큐레이션했습니다.
        </PageDescription>
        <Suspense fallback={<div aria-hidden />}>
          <InfoContainer
            articles={articles}
            videos={videos}
            channels={channels}
          />
        </Suspense>
      </div>
    </div>
  );
}
