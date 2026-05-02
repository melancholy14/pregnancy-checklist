"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Search, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSearchStore } from "@/store/useSearchStore";
import { buildSearchIndex, createSearcher } from "@/lib/search";
import type { SearchItem, SearchItemType } from "@/lib/search";
import type { ArticleMeta } from "@/types/article";
import type { TimelineItem } from "@/types/timeline";
import type { VideoItem } from "@/types/video";
import timelineItems from "@/data/timeline_items.json";
import videos from "@/data/videos.json";

interface SearchModalProps {
  articles: ArticleMeta[];
}

const TYPE_CONFIG: Record<SearchItemType, { icon: typeof Calendar; label: string }> = {
  timeline: { icon: Calendar, label: "타임라인" },
  article: { icon: FileText, label: "정보글" },
  video: { icon: Video, label: "영상" },
};

export function SearchModal({ articles }: SearchModalProps) {
  const router = useRouter();
  const { isOpen, close } = useSearchStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const searcher = useMemo(() => {
    const index = buildSearchIndex(
      timelineItems as TimelineItem[],
      articles,
      videos as VideoItem[],
    );
    return createSearcher(index);
  }, [articles]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searcher.search(query).map((r) => r.item);
  }, [searcher, query]);

  const grouped = useMemo(() => {
    const map: Record<SearchItemType, SearchItem[]> = {
      timeline: [],
      article: [],
      video: [],
    };
    for (const item of results) {
      map[item.type].push(item);
    }
    return map;
  }, [results]);

  const handleSelect = useCallback(
    (url: string) => {
      close();
      setQuery("");
      // Next.js 16.2 App Router 버그: hash가 포함된 URL을 router.push로 같은 path 재방문 시
      // 이전 hash가 누적된다. hash가 있는 경우 풀 내비게이션으로 우회.
      if (url.includes("#")) {
        window.location.assign(url);
      } else {
        router.push(url);
      }
    },
    [close, router],
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(results[activeIndex].url);
      }
    },
    [results, activeIndex, handleSelect],
  );

  // 활성 항목이 보이도록 스크롤
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // 플랫 인덱스 계산용
  let flatIndex = 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>검색</DialogTitle>
          <DialogDescription>
            타임라인, 정보글, 영상을 검색하세요
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-12 items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="검색어를 입력하세요 (2자 이상)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto scroll-py-1"
          role="listbox"
        >
          {query.length < 2 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              검색어를 입력하세요
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            (["timeline", "article", "video"] as const).map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const { icon: Icon, label } = TYPE_CONFIG[type];
              return (
                <div key={type} className="overflow-hidden p-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Icon size={14} />
                    {label}
                  </div>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.url}
                        type="button"
                        data-index={idx}
                        role="option"
                        aria-selected={idx === activeIndex}
                        onClick={() => handleSelect(item.url)}
                        className={`w-full flex flex-col gap-0.5 min-w-0 rounded-sm px-2 py-2 text-left text-sm cursor-pointer transition-colors ${
                          idx === activeIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <span className="font-medium truncate">
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
