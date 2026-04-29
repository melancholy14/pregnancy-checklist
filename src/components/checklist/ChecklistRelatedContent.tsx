import Link from "next/link";
import { Calendar, FileText, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";

interface ChecklistRelatedContentProps {
  linkedArticles: ArticleMeta[];
  linkedTimelineWeeks: number[];
  linkedVideos: VideoItem[];
}

export function ChecklistRelatedContent({
  linkedArticles,
  linkedTimelineWeeks,
  linkedVideos,
}: ChecklistRelatedContentProps) {
  const hasAny = linkedArticles.length > 0 || linkedTimelineWeeks.length > 0 || linkedVideos.length > 0;
  if (!hasAny) return null;

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-4">
        <h2 className="text-sm font-medium mb-3">💡 관련 콘텐츠</h2>

        {linkedArticles.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">관련 글</span>
            </div>
            <div className="space-y-1">
              {linkedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="block text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
                >
                  {article.title} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {linkedTimelineWeeks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">관련 타임라인</span>
            </div>
            <div className="space-y-1">
              {linkedTimelineWeeks.map((week) => (
                <Link
                  key={week}
                  href={`/timeline#week-${week}`}
                  className="block text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
                >
                  {week}주차 보기 →
                </Link>
              ))}
            </div>
          </div>
        )}

        {linkedVideos.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Play size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">관련 영상</span>
            </div>
            <div className="space-y-1">
              {linkedVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos#${video.id}`}
                  className="block text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
                >
                  {video.title} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
