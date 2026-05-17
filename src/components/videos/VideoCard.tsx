import Image from "next/image";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { VideoItem } from "@/types/video";
import { sendGAEvent } from "@/lib/analytics";

interface VideoCardProps {
  video: VideoItem;
  channelName?: string;
}

export function VideoCard({ video, channelName }: VideoCardProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`;

  return (
    <a
      id={video.id}
      href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline"
      // TODO(bundle-O): rel="noopener noreferrer" 표준 정합 — design-bundle-O wiring 라운드
      onClick={() => {
        // legacy keep (4주 grace) — cleanup 라운드에서 제거.
        sendGAEvent("content_click", { type: "video", title: video.title });
        sendGAEvent("external_link_click", {
          domain: "youtube.com",
          context: "video",
          video_id: video.id,
          channel_id: video.channel_id,
        });
      }}
    >
      <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-black/4 group hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors duration-300">
            <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Play size={24} fill="currentColor" color="currentColor" className="ml-0.5 text-foreground" />
            </div>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4">
          <h4 className="line-clamp-2 leading-snug text-[15px]">{video.title}</h4>
          {channelName && (
            <p className="mt-1 text-xs text-muted-foreground">{channelName}</p>
          )}
          {video.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{video.description}</p>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
