import { Card, CardContent } from "@/components/ui/card";
import type { ChannelItem } from "@/types/video";
import { sendGAEvent } from "@/lib/analytics";

const CATEGORY_LABELS: Record<string, string> = {
  exercise: "임산부 운동",
  birth_prep: "출산 준비",
  newborn_care: "신생아 케어",
  pregnancy_health: "임신 건강 관리",
  prenatal_checkup: "산전 검사",
  nutrition: "임산부 영양",
  policy: "육아 정책",
};

interface ChannelCardProps {
  channel: ChannelItem;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <a
      href={`https://www.youtube.com/channel/${channel.youtube_channel_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline block"
      aria-label={`${channel.name} 유튜브 채널로 이동`}
      onClick={() => sendGAEvent("content_click", { type: "channel", title: channel.name })}
    >
      <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-black/4 hover:-translate-y-0.5">
        <CardContent className="p-4 flex items-center gap-4">
          <img
            src={channel.thumbnail_url}
            alt={channel.name}
            className="w-14 h-14 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-[15px] leading-snug truncate">{channel.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CATEGORY_LABELS[channel.category] ?? channel.category}
            </p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {channel.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
