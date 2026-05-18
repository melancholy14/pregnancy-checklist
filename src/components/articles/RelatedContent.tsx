import Link from "next/link";
import { ChevronRight, ListChecks, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ChecklistMeta } from "@/types/checklist";
import type { VideoItem } from "@/types/video";

interface RelatedContentProps {
  checklists: ChecklistMeta[];
  videos: VideoItem[];
}

export function RelatedContent({ checklists, videos }: RelatedContentProps) {
  if (checklists.length === 0 && videos.length === 0) return null;

  return (
    <Card className="mt-6 rounded-2xl shadow-sm border border-black/4">
      <CardContent className="p-4">
        {checklists.length > 0 && (
          <div className={videos.length > 0 ? "mb-3" : ""}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ListChecks size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                관련 체크리스트
              </span>
            </div>
            <div className="space-y-1">
              {checklists.map((c) => (
                <Link
                  key={c.slug}
                  href={`/checklist/${c.slug}`}
                  className="flex items-center gap-1 text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
                >
                  <span className="flex-1 min-w-0">
                    {c.icon} {c.title}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Play size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                관련 영상
              </span>
            </div>
            <div className="space-y-1">
              {videos.map((v) => (
                <a
                  key={v.id}
                  href={`/info?tab=videos#${v.id}`}
                  className="flex items-center gap-1 text-sm text-accent-purple hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
                >
                  <span className="flex-1 min-w-0">{v.title}</span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
