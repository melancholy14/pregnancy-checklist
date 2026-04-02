"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { VideoCard } from "./VideoCard";
import type { VideoItem } from "@/types/video";

const CATEGORY_MAP: Record<string, string> = {
  exercise: "임산부 운동",
  birth_prep: "출산 준비",
  newborn_care: "신생아 케어",
};

const categoryKeys = Object.keys(CATEGORY_MAP);

interface VideosContainerProps {
  items: VideoItem[];
}

export function VideosContainer({ items }: VideosContainerProps) {
  const [activeCategory, setActiveCategory] = useState(categoryKeys[0]);

  const videosByCategory = useMemo(() => {
    const map: Record<string, VideoItem[]> = {};
    for (const key of categoryKeys) {
      map[key] = items.filter((v) => v.category === key);
    }
    return map;
  }, [items]);

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-5xl mx-auto pt-8">
        <h1 className="mb-2 text-center">영상 콘텐츠</h1>
        <p className="text-center text-muted-foreground mb-8">
          임신과 육아에 도움되는 영상 모음
        </p>

        {isEmpty ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-5xl mb-4">🎬</div>
            <p>아직 등록된 영상이 없어요</p>
            <p className="text-sm mt-1">곧 유용한 영상이 추가될 예정입니다</p>
          </div>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex justify-center gap-2 mb-8 flex-wrap bg-transparent h-auto p-0 w-full">
              {categoryKeys.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-5 py-2.5 rounded-xl border border-black/4 bg-white text-[#9CA0A4] hover:bg-muted data-[state=active]:bg-[#FFD4DE]/40 data-[state=active]:text-[#3D4447] data-[state=active]:border-[#FFD4DE]/30 h-auto flex-none transition-all duration-200"
                >
                  {CATEGORY_MAP[category]}
                </TabsTrigger>
              ))}
            </TabsList>

            {categoryKeys.map((category) => (
              <TabsContent key={category} value={category}>
                {videosByCategory[category].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>이 카테고리에 아직 영상이 없어요</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {videosByCategory[category].map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Info Card */}
        <Card className="mt-12 rounded-2xl shadow-md border border-black/4 bg-linear-to-r from-[#D0EDE2]/40 to-[#FFE0CC]/40">
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
