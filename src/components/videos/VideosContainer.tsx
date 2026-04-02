"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { VideoCard } from "./VideoCard";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  youtubeId: string;
}

// TODO: Phase 1 — 하드코딩된 영상 데이터를 src/data/videos.json으로 이전
// YouTube Data API v3의 search.list 엔드포인트를 사용하여
// 특정 태그(임산부 운동, 출산 준비, 신생아 케어) 기반으로 영상 목록을 가져올 예정
const videoCategories: Record<string, Video[]> = {
  "임산부 운동": [
    {
      id: "1",
      title: "임산부 요가 - 20분 루틴",
      thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
      duration: "20:15",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "2",
      title: "임신 중기 스트레칭",
      thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
      duration: "15:30",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "3",
      title: "골반 운동 따라하기",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
      duration: "12:45",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "4",
      title: "임산부 케겔 운동",
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
      duration: "10:20",
      youtubeId: "dQw4w9WgXcQ",
    },
  ],
  "출산 준비": [
    {
      id: "5",
      title: "자연분만 출산과정 완벽 정리",
      thumbnail: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80",
      duration: "25:10",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "6",
      title: "출산 호흡법 따라하기",
      thumbnail: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80",
      duration: "18:30",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "7",
      title: "출산 가방 꾸리기 체크리스트",
      thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80",
      duration: "22:15",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "8",
      title: "제왕절개 수술 과정 안내",
      thumbnail: "https://images.unsplash.com/photo-1579154392429-0e6b4e850ad2?w=400&q=80",
      duration: "16:40",
      youtubeId: "dQw4w9WgXcQ",
    },
  ],
  "신생아 케어": [
    {
      id: "9",
      title: "신생아 목욕 시키는 법",
      thumbnail: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80",
      duration: "14:25",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "10",
      title: "모유 수유 자세와 방법",
      thumbnail: "https://images.unsplash.com/photo-1555252332-17b20da8f6c6?w=400&q=80",
      duration: "19:50",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "11",
      title: "트림 시키는 법",
      thumbnail: "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&q=80",
      duration: "8:30",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "12",
      title: "아기 재우기 꿀팁",
      thumbnail: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&q=80",
      duration: "21:15",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "13",
      title: "기저귀 갈기 A to Z",
      thumbnail: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80",
      duration: "11:10",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "14",
      title: "신생아 배앓이 대처법",
      thumbnail: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&q=80",
      duration: "17:35",
      youtubeId: "dQw4w9WgXcQ",
    },
  ],
};

const categoryKeys = Object.keys(videoCategories);

export function VideosContainer() {
  const [activeCategory, setActiveCategory] = useState(categoryKeys[0]);

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-5xl mx-auto pt-8">
        <h1 className="mb-2 text-center">영상 콘텐츠</h1>
        <p className="text-center text-muted-foreground mb-8">
          임신과 육아에 도움되는 영상 모음
        </p>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex justify-center gap-2 mb-8 flex-wrap bg-transparent h-auto p-0 w-full">
            {categoryKeys.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-5 py-2.5 rounded-xl border border-black/4 bg-white text-[#7C8084] hover:bg-muted data-[state=active]:bg-[#F0C8D2]/40 data-[state=active]:text-[#2D3436] data-[state=active]:border-[#F0C8D2]/30 h-auto flex-none transition-all duration-200"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categoryKeys.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videoCategories[category].map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Info Card */}
        <Card className="mt-12 rounded-2xl shadow-md border border-black/4 bg-linear-to-r from-[#C0DCD0]/40 to-[#ECD2BE]/40">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              실제 영상 재생은 YouTube로 연결됩니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
