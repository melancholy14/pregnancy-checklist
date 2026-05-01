import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { VideoItem } from "@/types/video";
import { sendGAEvent } from "@/lib/analytics";

interface VideoCardCompactProps {
  video: VideoItem;
  channelName?: string;
}

export function VideoCardCompact({ video, channelName }: VideoCardCompactProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`;

  return (
    <a
      id={video.id}
      href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline block"
      aria-label={`${video.title} 유튜브에서 재생`}
      onClick={() =>
        sendGAEvent("content_click", { type: "video", title: video.title })
      }
    >
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-black/4">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative shrink-0 w-28 aspect-video rounded-xl overflow-hidden bg-muted">
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white/85 flex items-center justify-center shadow-sm">
                <Play
                  size={14}
                  fill="currentColor"
                  color="currentColor"
                  className="ml-0.5 text-foreground"
                />
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 leading-snug text-sm">{video.title}</h4>
            {channelName && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {channelName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
