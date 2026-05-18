import { ArticleCard } from "@/components/articles/ArticleCard";
import { VideoCardCompact } from "@/components/videos/VideoCardCompact";
import { sendGAEvent } from "@/lib/analytics";
import type { InfoItem } from "@/types/info";

interface InfoCardProps {
  item: InfoItem;
}

export function InfoCard({ item }: InfoCardProps) {
  if (item.type === "article") {
    const slug = item.data.slug;
    return (
      <ArticleCard
        article={item.data}
        onAnalyticsClick={() =>
          sendGAEvent("cta_click", {
            cta_id: "view_article",
            location: "info_hub",
            destination: `/articles/${slug}`,
          })
        }
      />
    );
  }
  return <VideoCardCompact video={item.data} channelName={item.channelName} />;
}
