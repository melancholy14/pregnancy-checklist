"use client";

import { Play } from "lucide-react";
import type { VideoItem } from "@/types/video";

interface RelatedVideosLinkProps {
  videos: VideoItem[];
}

// Next.js 16.2 App Router 버그: 같은 경로를 재방문할 때 이전 hash가 누적되므로
// cross-page hash 링크는 <a>로 강제 풀 내비게이션.
export function RelatedVideosLink({ videos }: RelatedVideosLinkProps) {
  if (videos.length === 0) return null;

  return (
    <div className="border-t border-black/4 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Play size={13} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">관련 영상</span>
      </div>
      <div className="space-y-1.5">
        {videos.map((video) => (
          <a
            key={video.id}
            href={`/videos#${video.id}`}
            className="block text-sm text-accent-purple hover:text-accent-purple-hover hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
          >
            {video.title} →
          </a>
        ))}
      </div>
    </div>
  );
}
