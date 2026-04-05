"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoCard } from "./VideoCard";
import { ChannelCard } from "./ChannelCard";
import type { VideoItem, ChannelItem } from "@/types/video";

const CATEGORY_MAP: Record<string, string> = {
  exercise: "임산부 운동",
  birth_prep: "출산 준비",
  newborn_care: "신생아 케어",
};

const categoryKeys = Object.keys(CATEGORY_MAP);

interface VideosContainerProps {
  items: VideoItem[];
  channels: ChannelItem[];
}

export function VideosContainer({ items, channels }: VideosContainerProps) {
  const [viewMode, setViewMode] = useState<"videos" | "channels">("videos");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");

  const channelMap = useMemo(() => {
    const map: Record<string, ChannelItem> = {};
    for (const ch of channels) {
      map[ch.id] = ch;
    }
    return map;
  }, [channels]);

  const subcategories = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? items
        : items.filter((v) => v.category === activeCategory);
    const map = new Map<string, string>();
    for (const v of filtered) {
      if (!map.has(v.subcategory)) {
        map.set(v.subcategory, v.subcategoryName);
      }
    }
    return Array.from(map.entries());
  }, [items, activeCategory]);

  const filteredVideos = useMemo(() => {
    let result = items;
    if (activeCategory !== "all") {
      result = result.filter((v) => v.category === activeCategory);
    }
    if (activeSubcategory !== "all") {
      result = result.filter((v) => v.subcategory === activeSubcategory);
    }
    return result;
  }, [items, activeCategory, activeSubcategory]);

  const filteredChannels = useMemo(() => {
    if (activeCategory === "all") return channels;
    return channels.filter((ch) => ch.category === activeCategory);
  }, [channels, activeCategory]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcategory("all");
  };

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-5xl mx-auto pt-8">
        <h1 className="mb-2 text-center">영상 콘텐츠</h1>
        <p className="text-center text-muted-foreground mb-6">
          임신과 육아에 도움되는 영상 모음
        </p>

        {isEmpty ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-5xl mb-4">🎬</div>
            <p>아직 등록된 영상이 없어요</p>
            <p className="text-sm mt-1">곧 유용한 영상이 추가될 예정입니다</p>
          </div>
        ) : (
          <>
            {/* View Toggle */}
            <div className="flex justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setViewMode("videos")}
                className={`px-5 py-2.5 rounded-xl border text-sm transition-all duration-200 ${
                  viewMode === "videos"
                    ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                    : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                }`}
              >
                영상
              </button>
              <button
                type="button"
                onClick={() => setViewMode("channels")}
                className={`px-5 py-2.5 rounded-xl border text-sm transition-all duration-200 ${
                  viewMode === "channels"
                    ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                    : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                }`}
              >
                채널
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              <button
                type="button"
                onClick={() => handleCategoryChange("all")}
                className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
                  activeCategory === "all"
                    ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                    : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                }`}
              >
                전체
              </button>
              {categoryKeys.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                      : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                  }`}
                >
                  {CATEGORY_MAP[cat]}
                </button>
              ))}
            </div>

            {/* Subcategory Filter (videos only) */}
            {viewMode === "videos" && subcategories.length > 1 && (
              <div className="flex justify-center gap-2 mb-8 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveSubcategory("all")}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                    activeSubcategory === "all"
                      ? "bg-[#E4D6F0]/40 text-[#6B5A80] border-[#E4D6F0]/30"
                      : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                  }`}
                >
                  전체
                </button>
                {subcategories.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSubcategory(key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                      activeSubcategory === key
                        ? "bg-[#E4D6F0]/40 text-[#6B5A80] border-[#E4D6F0]/30"
                        : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            {viewMode === "videos" ? (
              filteredVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>이 카테고리에 아직 영상이 없어요</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      channelName={channelMap[video.channel_id]?.name}
                    />
                  ))}
                </div>
              )
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>이 카테고리에 아직 채널이 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChannels.map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </>
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
