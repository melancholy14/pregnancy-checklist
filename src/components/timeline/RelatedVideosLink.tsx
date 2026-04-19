"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { VideoItem } from "@/types/video";

interface RelatedVideosLinkProps {
  videos: VideoItem[];
}

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
          <Link
            key={video.id}
            href={`/videos#${video.id}`}
            className="block text-sm text-accent-purple hover:text-accent-purple-hover hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
          >
            {video.title} →
          </Link>
        ))}
      </div>
    </div>
  );
}
