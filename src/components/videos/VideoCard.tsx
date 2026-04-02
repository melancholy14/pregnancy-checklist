import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  youtubeId: string;
}

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-black/4 group hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors duration-300">
          <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <Play size={24} fill="#2D3436" color="#2D3436" className="ml-0.5" />
          </div>
        </div>
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-white text-xs font-medium tabular-nums">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-4">
        <h4 className="line-clamp-2 leading-snug text-[15px]">{video.title}</h4>
      </CardContent>
    </Card>
  );
}
