"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InfoCard } from "./InfoCard";
import type { ArticleMeta } from "@/types/article";
import type { ChannelItem, VideoItem } from "@/types/video";
import type { InfoItem, InfoTab } from "@/types/info";
import {
  articleMatchesUnifiedTag,
  getUsedUnifiedTags,
  UNIFIED_TAGS,
  videoMatchesUnifiedTag,
} from "@/lib/unified-tags";

interface InfoContainerProps {
  articles: ArticleMeta[];
  videos: VideoItem[];
  channels: ChannelItem[];
}

const TAB_LABELS: Record<InfoTab, string> = {
  all: "전체",
  articles: "블로그",
  videos: "영상",
};

const TAB_ORDER: InfoTab[] = ["all", "articles", "videos"];

function resolveInitialTab(value: string | null): InfoTab {
  if (value === "videos" || value === "articles") return value;
  return "all";
}

export function InfoContainer({
  articles,
  videos,
  channels,
}: InfoContainerProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<InfoTab>(() =>
    resolveInitialTab(searchParams.get("tab")),
  );
  const [selectedTagKey, setSelectedTagKey] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(resolveInitialTab(searchParams.get("tab")));
  }, [searchParams]);

  const channelNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ch of channels) map[ch.id] = ch.name;
    return map;
  }, [channels]);

  const usedTags = useMemo(
    () => getUsedUnifiedTags(articles, videos),
    [articles, videos],
  );

  const selectedTag = useMemo(
    () =>
      selectedTagKey
        ? (UNIFIED_TAGS.find((t) => t.key === selectedTagKey) ?? null)
        : null,
    [selectedTagKey],
  );

  const articleItems = useMemo<InfoItem[]>(() => {
    const filtered = selectedTag
      ? articles.filter((a) => articleMatchesUnifiedTag(a.tags, selectedTag))
      : articles;
    return filtered.map((a) => ({ type: "article", data: a }));
  }, [articles, selectedTag]);

  const videoItems = useMemo<InfoItem[]>(() => {
    const filtered = selectedTag
      ? videos.filter((v) => videoMatchesUnifiedTag(v.category, selectedTag))
      : videos;
    return filtered.map((v) => ({
      type: "video",
      data: v,
      channelName: channelNameById[v.channel_id],
    }));
  }, [videos, selectedTag, channelNameById]);

  const visibleItems = useMemo<InfoItem[]>(() => {
    if (activeTab === "articles") return articleItems;
    if (activeTab === "videos") return videoItems;
    return [...articleItems, ...videoItems];
  }, [activeTab, articleItems, videoItems]);

  useEffect(() => {
    if (activeTab === "articles") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-pastel-pink", "rounded-2xl");
      // 처리 후 hash를 제거해 필터·탭 변경 시 재발동 방지
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      highlightTimer = setTimeout(() => {
        el.classList.remove("ring-2", "ring-pastel-pink", "rounded-2xl");
      }, 2000);
    }, 300);
    return () => {
      clearTimeout(scrollTimer);
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, [activeTab]);

  return (
    <>
      <div
        className="flex justify-center gap-2 mb-6"
        role="tablist"
        aria-label="콘텐츠 타입"
      >
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              id={`info-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="info-panel"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
                activeTab === tab
                  ? "bg-pastel-pink/40 text-foreground border-pastel-pink/30"
                  : "bg-white text-muted-foreground border-black/4 hover:bg-muted"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {usedTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedTagKey(null)}
              aria-pressed={selectedTagKey === null}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                selectedTagKey === null
                  ? "bg-pastel-lavender/40 text-accent-purple border-pastel-lavender/30"
                  : "bg-white text-muted-foreground border-black/4 hover:bg-muted"
              }`}
            >
              전체
            </button>
            {usedTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => setSelectedTagKey(tag.key)}
                aria-pressed={selectedTagKey === tag.key}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                  selectedTagKey === tag.key
                    ? "bg-pastel-lavender/40 text-accent-purple border-pastel-lavender/30"
                    : "bg-white text-muted-foreground border-black/4 hover:bg-muted"
                }`}
              >
                #{tag.label}
              </button>
            ))}
          </div>
        )}

        <div
          id="info-panel"
          role="tabpanel"
          aria-labelledby={`info-tab-${activeTab}`}
        >
          {visibleItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-5xl mb-4">📭</div>
              <p>해당 조건의 콘텐츠가 없어요</p>
              <p className="text-sm mt-1">다른 태그나 탭을 선택해 보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <InfoCard
                  key={
                    item.type === "article"
                      ? `a-${item.data.slug}`
                      : `v-${item.data.id}`
                  }
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
    </>
  );
}
