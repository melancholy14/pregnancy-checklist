import videos from "@/data/videos.json";
import type { VideoItem } from "@/types/video";
import { VideosContainer } from "@/components/videos/VideosContainer";

export default function VideosPage() {
  return <VideosContainer items={videos as VideoItem[]} />;
}
