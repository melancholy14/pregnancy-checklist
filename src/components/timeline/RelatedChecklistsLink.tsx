"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";

const CHECKLIST_META: Record<string, { title: string; icon: string }> = {
  "hospital-bag": { title: "출산가방 체크리스트", icon: "🧳" },
  "partner-prep": { title: "남편/파트너 준비 체크리스트", icon: "👨‍👩‍👧" },
  "pregnancy-prep": { title: "임신 준비 체크리스트", icon: "🌱" },
};

interface RelatedChecklistsLinkProps {
  slugs: string[];
}

export function RelatedChecklistsLink({ slugs }: RelatedChecklistsLinkProps) {
  const valid = slugs.filter((s) => CHECKLIST_META[s]);
  if (valid.length === 0) return null;

  return (
    <div className="border-t border-black/4 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <ListChecks size={13} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">관련 체크리스트</span>
      </div>
      <div className="space-y-1.5">
        {valid.map((slug) => {
          const meta = CHECKLIST_META[slug];
          return (
            <Link
              key={slug}
              href={`/checklist/${slug}`}
              className="block text-sm text-accent-purple hover:text-accent-purple-hover hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
            >
              <span aria-hidden="true">{meta.icon}</span> {meta.title} →
            </Link>
          );
        })}
      </div>
    </div>
  );
}
