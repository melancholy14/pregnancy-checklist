import type { Metadata } from "next";
import videos from "@/data/videos.json";
import channels from "@/data/channels.json";
import type { VideoItem, ChannelItem } from "@/types/video";
import { VideosContainer } from "@/components/videos/VideosContainer";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "임산부 추천 영상 모음 - 출산 준비 체크리스트",
  description: "임산부 운동, 출산 준비, 신생아 케어 관련 추천 영상을 모아봤습니다.",
  alternates: {
    canonical: `${BASE_URL}/videos`,
  },
  openGraph: {
    title: "임산부 추천 영상 모음",
    description: "임산부 운동, 출산 준비, 신생아 케어 관련 추천 영상을 모아봤습니다.",
    url: `${BASE_URL}/videos`,
  },
};

export default function VideosPage() {
  return (
    <VideosContainer
      items={videos as VideoItem[]}
      channels={channels as ChannelItem[]}
    />
  );
}
