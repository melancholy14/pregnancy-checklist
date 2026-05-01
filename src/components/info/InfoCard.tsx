import { ArticleCard } from "@/components/articles/ArticleCard";
import { VideoCardCompact } from "@/components/videos/VideoCardCompact";
import type { InfoItem } from "@/types/info";

interface InfoCardProps {
  item: InfoItem;
}

export function InfoCard({ item }: InfoCardProps) {
  if (item.type === "article") {
    return <ArticleCard article={item.data} />;
  }
  return <VideoCardCompact video={item.data} channelName={item.channelName} />;
}
