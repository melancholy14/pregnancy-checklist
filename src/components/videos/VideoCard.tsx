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
    <Card className="rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border-0 group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={28} fill="#4A4A4A" color="#4A4A4A" className="ml-1" />
          </div>
        </div>
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-lg text-white text-xs">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-4">
        <h4 className="line-clamp-2 leading-snug">{video.title}</h4>
      </CardContent>
    </Card>
  );
}
